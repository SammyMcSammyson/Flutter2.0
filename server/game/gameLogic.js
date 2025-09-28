import { COLORS } from './gameConstants.js';
import { calculateTotalAssets } from './utils.js';
import { initGameState, initPlayerData } from './gameState.js';

export function resetGame(gameState) {
  const oldPlayers = Object.keys(gameState.playersData);

  // Reset the main game state
  const newGameState = initGameState();

  // Re-initialize player data for existing players
  oldPlayers.forEach((playerId) => {
    newGameState.playersData[playerId] = initPlayerData(playerId);
  });

  // Copy back to the original gameState object
  Object.keys(gameState).forEach((key) => delete gameState[key]);
  Object.assign(gameState, newGameState);
}

// Check for winner
export function checkForWinner(gameState, io) {
  const winners = Object.values(gameState.playersData).filter(
    (player) => calculateTotalAssets(player, gameState.parentPegs) >= 600
  );

  if (!winners.length) return;

  console.log(
    '[SERVER] Winner detected!',
    winners.map((w) => w.id)
  );

  if (io) {
    io.emit('gameOver', {
      winners: winners.map((w) => ({
        id: w.id,
        totalAssets: calculateTotalAssets(w, gameState.parentPegs),
      })),
      parentPegs: gameState.parentPegs,
      travellerPegs: gameState.travellerPegs,
    });
  }
  gameState.roundEnded = true;
  resetGame(gameState);
}

// Pay dividends if traveller qualifies
export function payDividends(gameState, colour) {
  const travellerPos = gameState.travellerPegs[colour] || 0;
  let payout = 0;

  if (travellerPos >= 270) payout = 20;
  else if (travellerPos >= 240) payout = 10;
  else if (travellerPos >= 230) payout = 5;

  if (!payout) return;

  if (!Array.isArray(gameState.dividendsPaid[colour])) {
    gameState.dividendsPaid[colour] = [];
  }

  Object.values(gameState.playersData).forEach((player) => {
    const sharesOwned = player.ownedShares[colour] || 0;
    if (!sharesOwned) return;

    const totalPayout = sharesOwned * payout;
    player.coins += totalPayout;

    gameState.dividendsPaid[colour].push({
      playerId: player.id,
      shares: sharesOwned,
      payout: totalPayout,
    });

    console.log(
      `[payDividends] Paid ${totalPayout} to ${player.id} for ${colour}`
    );
  });
}

// Roll dice for a player
export function rollDiceForPlayer() {
  const numberDie = Math.floor(Math.random() * 6) + 1; // 1–6
  const colourDie = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { numberDie, colourDie, roll: numberDie * 10 };
}

// Move traveller and handle end-of-round
export function moveTraveller(gameState, colour, rollAmount, io) {
  if (!COLORS.includes(colour)) return;

  if (!gameState.travellerPegs) gameState.travellerPegs = {};
  if (!gameState.parentPegs) gameState.parentPegs = {};
  if (!gameState.dividendsPaid) gameState.dividendsPaid = {};

  let traveller = (gameState.travellerPegs[colour] || 0) + rollAmount;
  gameState.travellerPegs[colour] = traveller;

  if ([170, 220, 260].includes(traveller)) {
    traveller = Math.max(0, traveller - 60);
    gameState.travellerPegs[colour] = traveller;
  }

  if (traveller >= 270 && !gameState.roundEnded) {
    gameState.roundEnded = true;

    COLORS.forEach((c) => {
      if ((gameState.travellerPegs[c] || 0) >= 230) payDividends(gameState, c);
    });

    if (io) {
      io.emit('endOfRound', {
        travellerPegs: gameState.travellerPegs,
        parentPegs: gameState.parentPegs,
        dividendsPaid: gameState.dividendsPaid,
      });
    }

    // Update parent pegs
    COLORS.forEach((c) => {
      const t = gameState.travellerPegs[c] || 0;
      let p = gameState.parentPegs[c] || 0;

      if (t >= 270) p = Math.min(p + 20, 270);
      else if (t >= 240) p = Math.min(p + 10, 270);
      else if (t <= 210) p = Math.max(p - 10, 0);

      gameState.parentPegs[c] = p;
      gameState.travellerPegs[c] = p; // reset traveller to parent
      gameState.dividendsPaid[c] = [];
    });

    gameState.roundEnded = false;
  }
}

// Buy/Sell Shares
export function buyShare(gameState, playerData, trackColor) {
  if (!COLORS.includes(trackColor)) return false;

  const sharePrice = Math.ceil(gameState.parentPegs[trackColor] || 0);
  if (playerData.coins < sharePrice + 5) return false;
  if ((gameState.sharesLeft[trackColor] || 0) <= 0) return false;

  playerData.coins -= sharePrice + 5;
  playerData.ownedShares[trackColor] += 1;
  gameState.sharesLeft[trackColor] -= 1;
  return true;
}

export function sellShare(gameState, playerData, trackColor) {
  if (!COLORS.includes(trackColor)) return false;
  if ((playerData.ownedShares[trackColor] || 0) <= 0) return false;

  const sharePrice = Math.ceil(gameState.parentPegs[trackColor] || 0);
  playerData.coins += sharePrice;
  playerData.ownedShares[trackColor] -= 1;
  gameState.sharesLeft[trackColor] += 1;
  return true;
}
