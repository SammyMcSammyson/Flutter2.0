import { COLORS, MAX_SHARES_PER_TRACK } from './gameConstants.js';

export function initGameState() {
  const state = {
    parentPegs: {},
    travellerPegs: {},
    sharesLeft: {},
    dividendsPaid: {},
    playersData: {},
    turnsTaken: 0,
    roundEnded: false,
  };

  COLORS.forEach((color) => {
    state.parentPegs[color] = 100;
    state.travellerPegs[color] = 100;
    state.sharesLeft[color] = MAX_SHARES_PER_TRACK;
    state.dividendsPaid[color] = [];
  });

  return state;
}

export function initPlayerData(playerId) {
  const ownedShares = Object.fromEntries(COLORS.map((c) => [c, 0]));
  return { id: playerId, coins: 300, ownedShares };
}
