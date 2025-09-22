export const COLORS = ['yellow', 'red', 'blue', 'green', 'purple', 'white'];
export const MAX_PLAYERS = 6;
export const TURN_DURATION = 60; // seconds

export function initGameState() {
  const state = { parentPegs: {}, travellerPegs: {}, turnsTaken: 0 };
  COLORS.forEach((c) => {
    state.parentPegs[c] = 100;
    state.travellerPegs[c] = 100;
  });
  return state;
}
