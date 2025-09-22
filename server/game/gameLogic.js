import { COLORS } from './gameConstants.js';

export function rollDiceForPlayer() {
  const numberDie = Math.floor(Math.random() * 6) + 1;
  const colourDie = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { numberDie, colourDie, roll: numberDie * 10 };
}

export function updateParentPegsIfNeeded(gameState) {
  COLORS.forEach((color) => {
    const traveller = gameState.travellerPegs[color];
    let parent = gameState.parentPegs[color];

    if (traveller >= 270) parent = Math.min(parent + 20, 270);
    else if (traveller >= 220 && traveller < 270)
      parent = Math.min(parent + 10, 270);
    else if (traveller >= 170 && traveller < 220) parent = parent; // stays same
    else if (traveller <= 160) parent = Math.max(parent - 10, 0);

    gameState.parentPegs[color] = parent;
    gameState.travellerPegs[color] = parent;
  });
}
