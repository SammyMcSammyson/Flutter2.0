import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import readline from 'readline';

import { COLORS, MAX_PLAYERS, TURN_DURATION } from './game/gameConstants.js';

import { initGameState, initPlayerData } from './game/gameState.js';

import {
  rollDiceForPlayer,
  moveTraveller,
  buyShare,
  sellShare,
  checkForWinner,
  resetGame,
} from './game/gameLogic.js';

import { TurnManager } from './game/turnManager.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// --- Game state ---
let gameState = initGameState();
let players = [];

// --- Turn manager ---
const turnManager = new TurnManager(players, TURN_DURATION, rollDice);

// --- Dice handling ---
function rollDice(socketId) {
  if (!players.includes(socketId)) return;

  const { numberDie, colourDie, roll } = rollDiceForPlayer();
  moveTraveller(gameState, colourDie, roll, io);

  gameState.turnsTaken++;
  io.emit('diceRolled', { roll, colourDie, numberDie });
  io.emit('stateUpdate', gameState);

  checkForWinner(gameState, io);
}

// --- Player management ---
function kickPlayer(socketId, reason = 'You have been kicked.') {
  const socket = io.sockets.sockets.get(socketId);
  if (!socket) return;

  socket.emit('kick', { message: reason });
  socket.disconnect(true);

  players = players.filter((p) => p !== socketId);
  delete gameState.playersData[socketId];
  if (turnManager.currentTurnIndex >= players.length)
    turnManager.currentTurnIndex = 0;

  io.emit('stateUpdate', gameState);
  turnManager.startTurn(io);

  console.log(`Player ${socketId} kicked`);
}

function kickAllPlayers(reason = 'Server reset: all players removed.') {
  [...players].forEach((id) => kickPlayer(id, reason));
}

// --- Socket.IO events ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  if (players.length < MAX_PLAYERS && !players.includes(socket.id)) {
    players.push(socket.id);
  }

  if (!gameState.playersData[socket.id]) {
    gameState.playersData[socket.id] = initPlayerData(socket.id);
  }

  socket.emit('stateUpdate', gameState);
  turnManager.startTurn(io);

  // Dice roll
  socket.on('rollDice', () => {
    if (socket.id !== players[turnManager.currentTurnIndex]) return;
    clearTimeout(turnManager.turnTimeout);
    rollDice(socket.id);
  });

  // Buy/Sell shares
  socket.on('buyShare', (trackColor) => {
    const playerData = gameState.playersData[socket.id];
    const success = buyShare(gameState, playerData, trackColor);

    io.emit('stateUpdate', gameState);
    socket.emit('shareActionResult', { trackColor, success, type: 'buy' });
  });

  socket.on('sellShare', (trackColor) => {
    const playerData = gameState.playersData[socket.id];
    const success = sellShare(gameState, playerData, trackColor);

    io.emit('stateUpdate', gameState);
    socket.emit('shareActionResult', { trackColor, success, type: 'sell' });
  });

  // Reset game
  socket.on('resetGame', () => kickAllPlayers('Game reset by host'));

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    players = players.filter((p) => p !== socket.id);
    delete gameState.playersData[socket.id];
    if (turnManager.currentTurnIndex >= players.length)
      turnManager.currentTurnIndex = 0;

    io.emit('stateUpdate', gameState);
    turnManager.startTurn(io);
  });
});

// --- Terminal commands ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
console.log('Server ready. Commands: list, kick <id>, kickall');

rl.on('line', (input) => {
  const [command, arg] = input.split(' ');
  if (command === 'list') console.log('Connected players:', players);
  if (command === 'kick') kickPlayer(arg);
  if (command === 'kickall') kickAllPlayers();
});

// --- Start server ---
httpServer.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
