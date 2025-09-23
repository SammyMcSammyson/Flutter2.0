import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import readline from 'readline';

import {
  COLORS,
  MAX_PLAYERS,
  TURN_DURATION,
  initPlayerData,
  MAX_SHARES_PER_TRACK,
} from './game/gameConstants.js';

console.log('COLORS:', COLORS);

import {
  rollDiceForPlayer,
  moveTraveller,
  buyShare,
  sellShare,
} from './game/gameLogic.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// --- Game state ---
let gameState = {
  parentPegs: {},
  travellerPegs: {},
  playersData: {},
  sharesLeft: {},
  dividendsPaid: {},
  turnsTaken: 0,
};

// Initialize tracks
COLORS.forEach((color) => {
  gameState.parentPegs[color] = 100;
  gameState.travellerPegs[color] = 100;
  gameState.sharesLeft[color] = MAX_SHARES_PER_TRACK;
  gameState.dividendsPaid[color] = false;
});

console.log('Initializing parentPegs:', gameState.parentPegs);

let players = [];
let currentTurnIndex = 0;
let turnTimeout = null;

// --- Turn Handling ---
function startTurn() {
  if (!players.length) return;
  const currentPlayer = players[currentTurnIndex];
  io.emit('turnUpdate', { currentPlayer, turnDuration: TURN_DURATION });

  clearTimeout(turnTimeout);
  turnTimeout = setTimeout(() => {
    console.log(`Time up for ${currentPlayer}, auto-rolling dice`);
    rollDice(currentPlayer);
    nextPlayer();
  }, TURN_DURATION * 1000);
}

function nextPlayer() {
  if (!players.length) return;
  currentTurnIndex = (currentTurnIndex + 1) % players.length;
  startTurn();
}

// --- Dice Handling ---
function rollDice(socketId, io) {
  if (!players.includes(socketId)) return;

  const { numberDie, colourDie, roll } = rollDiceForPlayer();
  moveTraveller(gameState, colourDie, roll, io);

  gameState.turnsTaken++;
  io.emit('diceRolled', { roll, colourDie, numberDie });
  io.emit('stateUpdate', gameState);
}

// --- Kick a single player ---
function kickPlayer(socketId, reason = 'You have been kicked.') {
  const socket = io.sockets.sockets.get(socketId);
  if (!socket) return;

  socket.emit('kick', { message: reason });
  socket.disconnect(true);

  // Remove player and clean state
  players = players.filter((p) => p !== socketId);
  delete gameState.playersData[socketId];
  if (currentTurnIndex >= players.length) currentTurnIndex = 0;

  io.emit('stateUpdate', gameState); // broadcast updated state
  startTurn();

  console.log(`Player ${socketId} kicked`);
}

// --- Kick all players ---
function kickAllPlayers(reason = 'Server reset: all players removed.') {
  [...players].forEach((id) => kickPlayer(id, reason));
}

// --- Socket.IO Events ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Add player if there's room
  if (players.length < MAX_PLAYERS && !players.includes(socket.id)) {
    players.push(socket.id);
  }

  // Initialize player data
  if (!gameState.playersData[socket.id]) {
    gameState.playersData[socket.id] = initPlayerData(socket.id);
  }

  // Send full game state to the new player
  socket.emit('stateUpdate', gameState);
  startTurn();

  // Dice roll
  socket.on('rollDice', () => {
    if (socket.id !== players[currentTurnIndex]) return;
    clearTimeout(turnTimeout);

    // Pass `io` so moveTraveller can emit end-of-round popup
    rollDice(socket.id, io);
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

  console.log('Sending stateUpdate to client:', gameState.parentPegs);
  socket.emit('stateUpdate', gameState);

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    players = players.filter((p) => p !== socket.id);
    delete gameState.playersData[socket.id];
    if (currentTurnIndex >= players.length) currentTurnIndex = 0;

    io.emit('stateUpdate', gameState); // broadcast update
    startTurn();
  });
});

// --- Terminal Commands ---
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

// --- Start Server ---
httpServer.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
