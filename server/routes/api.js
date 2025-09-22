import express from 'express';
const router = express.Router();

router.get('/roll', (req, res) => {
  const numberDie = Math.floor(Math.random() * 6) + 1;
  const colours = ['red', 'white', 'purple', 'blue', 'green', 'yellow'];
  const colourDie = colours[Math.floor(Math.random() * colours.length)];
  res.json({ numberDie, colourDie });
});

export default router;
