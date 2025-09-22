let turnTimeout = null;

export function startTurn(
  io,
  players,
  currentTurnIndex,
  TURN_DURATION,
  rollDice,
  nextPlayer
) {
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

export function nextPlayer(players, currentTurnIndex) {
  return (currentTurnIndex + 1) % players.length;
}
