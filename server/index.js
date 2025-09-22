import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import {
  COLORS,
  MAX_PLAYERS,
  TURN_DURATION,
  initPlayerData,
  MAX_SHARES_PER_TRACK,
} from './game/gameConstants.js';

import {
  rollDiceForPlayer,
  moveTraveller,
  buyShare,
  sellShare,
} from './game/gameLogic.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// --- Initialize game state ---
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
function rollDice(socketId) {
  if (!players.includes(socketId)) return;

  const { numberDie, colourDie, roll } = rollDiceForPlayer();

  // Use unified game logic for movement + dividends
  moveTraveller(gameState, colourDie, roll);

  gameState.turnsTaken++;
  io.emit('diceRolled', { roll, colourDie, numberDie });
  io.emit('stateUpdate', gameState);
}

// --- Socket.IO Events ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Add player
  if (players.length < MAX_PLAYERS && !players.includes(socket.id)) {
    players.push(socket.id);
  }

  // Initialize player data
  if (!gameState.playersData[socket.id]) {
    gameState.playersData[socket.id] = initPlayerData(socket.id);
  }

  // Send current state
  socket.emit('stateUpdate', gameState);
  startTurn();

  // --- Dice ---
  socket.on('rollDice', () => {
    if (socket.id !== players[currentTurnIndex]) return;
    clearTimeout(turnTimeout);
    rollDice(socket.id);
    nextPlayer();
  });

  // --- Buy Share ---
  socket.on('buyShare', (trackColor) => {
    const playerData = gameState.playersData[socket.id];
    const success = buyShare(gameState, playerData, trackColor);
    io.emit('stateUpdate', gameState);
    socket.emit('shareActionResult', { trackColor, success, type: 'buy' });
  });

  // --- Sell Share ---
  socket.on('sellShare', (trackColor) => {
    const playerData = gameState.playersData[socket.id];
    const success = sellShare(gameState, playerData, trackColor);
    io.emit('stateUpdate', gameState);
    socket.emit('shareActionResult', { trackColor, success, type: 'sell' });
  });

  // --- Reset Game ---
  socket.on('resetGame', () => {
    COLORS.forEach((color) => {
      gameState.parentPegs[color] = 100;
      gameState.travellerPegs[color] = 100;
      gameState.sharesLeft[color] = MAX_SHARES_PER_TRACK;
      gameState.dividendsPaid[color] = false;
    });

    players.forEach((id) => {
      gameState.playersData[id] = initPlayerData(id);
    });

    gameState.turnsTaken = 0;
    currentTurnIndex = 0;
    io.emit('stateUpdate', gameState);
    startTurn();
  });

  // --- Disconnect ---
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    players = players.filter((p) => p !== socket.id);
    delete gameState.playersData[socket.id];
    if (currentTurnIndex >= players.length) currentTurnIndex = 0;
    startTurn();
  });
});

httpServer.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
