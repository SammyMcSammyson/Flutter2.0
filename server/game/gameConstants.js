export const COLORS = ['yellow', 'red', 'blue', 'green', 'purple', 'white'];
export const MAX_PLAYERS = 6;
export const TURN_DURATION = 60; // seconds
export const MAX_SHARES_PER_TRACK = 5;

// Initialize game state
export function initGameState() {
  const parentPegs = {};
  const travellerPegs = {};
  const sharesLeft = {};
  COLORS.forEach((color) => {
    parentPegs[color] = 100;
    travellerPegs[color] = 100;
    sharesLeft[color] = MAX_SHARES_PER_TRACK;
  });

  return {
    parentPegs,
    travellerPegs,
    turnsTaken: 0,
    sharesLeft,
    playersData: {},
  };
}

// Initialize individual player data
export function initPlayerData(playerId) {
  const ownedShares = {};
  COLORS.forEach((color) => (ownedShares[color] = 0));

  return {
    id: playerId,
    coins: 300,
    ownedShares,
  };
}
