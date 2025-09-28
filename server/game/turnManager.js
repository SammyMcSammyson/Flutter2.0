export class TurnManager {
  constructor(players, TURN_DURATION, rollDiceFn) {
    this.players = players;
    this.TURN_DURATION = TURN_DURATION;
    this.rollDiceFn = rollDiceFn;
    this.currentTurnIndex = 0;
    this.turnTimeout = null;
  }

  startTurn(io) {
    if (!this.players.length) return;
    const currentPlayer = this.players[this.currentTurnIndex];

    io.emit('turnUpdate', { currentPlayer, turnDuration: this.TURN_DURATION });

    clearTimeout(this.turnTimeout);
    this.turnTimeout = setTimeout(() => {
      console.log(`Time up for ${currentPlayer}, auto-rolling dice`);
      this.rollDiceFn(currentPlayer);
      this.nextPlayer(io);
    }, this.TURN_DURATION * 1000);
  }

  nextPlayer(io) {
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
    this.startTurn(io);
  }
}
