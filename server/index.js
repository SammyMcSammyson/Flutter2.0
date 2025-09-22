import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// REST API routes
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.get('/api/roll', (req, res) => {
  const numberDie = Math.floor(Math.random() * 6) + 1;
  const colours = ['red', 'white', 'purple', 'blue', 'green', 'yellow'];
  const colourDie = colours[Math.floor(Math.random() * colours.length)];
  res.json({ numberDie, colourDie });
});

// Wrap Express in HTTP server
const httpServer = createServer(app);
// Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Game state
const COLORS = ['yellow', 'red', 'blue', 'green', 'purple', 'white'];
let gameState = {
  parentPegs: {},
  travellerPegs: {},
  turnsTaken: 0,
};

// Initialize pegs at 100
COLORS.forEach((color) => {
  gameState.parentPegs[color] = 100;
  gameState.travellerPegs[color] = 100;
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send initial state
  socket.emit('stateUpdate', gameState);

  // Handle dice roll
  socket.on('rollDice', () => {
    // Roll dice on server
    const numberDie = Math.floor(Math.random() * 6);
    const colourDie = COLORS[Math.floor(Math.random() * COLORS.length)];
    const roll = numberDie * 10;

    console.log(`Dice rolled: ${numberDie} (${colourDie}) => ${roll}`);

    // Move traveller peg for that color
    gameState.travellerPegs[colourDie] += roll;
    if (gameState.travellerPegs[colourDie] > 200)
      gameState.travellerPegs[colourDie] = 200;

    gameState.turnsTaken++;

    // Every 10 turns, move parent peg and reset traveller for that color
    if (gameState.turnsTaken % 10 === 0) {
      const diff =
        gameState.travellerPegs[colourDie] - gameState.parentPegs[colourDie];
      gameState.parentPegs[colourDie] += diff;
      if (gameState.parentPegs[colourDie] > 200)
        gameState.parentPegs[colourDie] = 200;

      gameState.travellerPegs[colourDie] = gameState.parentPegs[colourDie];
      console.log(
        `After 10 turns → Parent Peg (${colourDie}): ${gameState.parentPegs[colourDie]}, Traveller Peg reset to: ${gameState.travellerPegs[colourDie]}`
      );
    }

    // Broadcast to all clients
    io.emit('diceRolled', { roll, colourDie });
    io.emit('stateUpdate', gameState);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
