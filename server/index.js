import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import {
  COLORS,
  MAX_PLAYERS,
  TURN_DURATION,
  initGameState,
} from '../server/game/gameConstants.js';
import {
  rollDiceForPlayer,
  updateParentPegsIfNeeded,
} from '../server/game/gameLogic.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// --- Game state ---
let gameState = initGameState();
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
  currentTurnIndex = (currentTurnIndex + 1) % players.length;
  startTurn();
}

// --- Dice Handling ---
function rollDice(socketId) {
  if (!players.includes(socketId)) return;

  const { numberDie, colourDie, roll } = rollDiceForPlayer();
  gameState.travellerPegs[colourDie] += roll;

  if ([170, 210, 260].includes(gameState.travellerPegs[colourDie])) {
    gameState.travellerPegs[colourDie] = Math.max(
      0,
      gameState.travellerPegs[colourDie] - 60
    );
  }

  // Update parent pegs only when a traveller hits 270
  if (gameState.travellerPegs[colourDie] === 270) {
    updateParentPegsIfNeeded(gameState);
  }

  gameState.turnsTaken++;
  io.emit('diceRolled', { roll, colourDie, numberDie });
  io.emit('stateUpdate', gameState);
}

// --- Socket Events ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  if (players.length < MAX_PLAYERS && !players.includes(socket.id))
    players.push(socket.id);

  socket.emit('stateUpdate', gameState);
  startTurn();

  socket.on('rollDice', () => {
    if (socket.id !== players[currentTurnIndex]) return;
    clearTimeout(turnTimeout);
    rollDice(socket.id);
    nextPlayer();
  });

  socket.on('resetGame', () => {
    gameState = initGameState();
    currentTurnIndex = 0;
    io.emit('stateUpdate', gameState);
    startTurn();
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    players = players.filter((p) => p !== socket.id);
    if (currentTurnIndex >= players.length) currentTurnIndex = 0;
    startTurn();
  });
});

httpServer.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
