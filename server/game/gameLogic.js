import { COLORS } from './gameConstants.js';

// 💰 Pay dividends for a track if its traveller qualifies
export function payDividends(gameState, colour) {
  const travellerPos = gameState.travellerPegs[colour] || 0;
  let payout = 0;

  if (travellerPos >= 270) payout = 20;
  else if (travellerPos >= 240 && travellerPos < 270) payout = 10;
  else if (travellerPos >= 230 && travellerPos < 240) payout = 5;

  if (payout === 0) return;

  Object.values(gameState.playersData).forEach((player) => {
    const sharesOwned = player.ownedShares[colour] || 0;
    if (sharesOwned > 0) {
      player.coins += sharesOwned * payout;
      console.log(
        `[payDividends] Paid ${sharesOwned * payout} to ${
          player.id
        } for ${colour}`
      );
    }
  });
}

// 🎲 Roll dice for a player
function rollDice(socketId, io) {
  if (!players.includes(socketId)) return;

  const { numberDie, colourDie, roll } = rollDiceForPlayer();

  // Move traveller and trigger end-of-round popup if needed
  moveTraveller(gameState, colourDie, roll, io);

  // Emit dice result and updated state
  io.emit('diceRolled', { numberDie, colourDie, roll });
  io.emit('stateUpdate', gameState);

  // Move to the next player
  nextPlayer();
}

export function rollDiceForPlayer() {
  const numberDie = Math.floor(Math.random() * 6) + 1; // 1–6
  const colourDie = COLORS[Math.floor(Math.random() * COLORS.length)]; // random colour
  const roll = numberDie * 10; // traveller movement
  return { numberDie, colourDie, roll };
}
export function moveTraveller(gameState, colour, rollAmount, io) {
  if (!COLORS.includes(colour)) return;

  // Initialize state if missing
  if (!gameState.travellerPegs) gameState.travellerPegs = {};
  if (!gameState.parentPegs) gameState.parentPegs = {};
  if (!gameState.dividendsPaid) gameState.dividendsPaid = {};

  let traveller = gameState.travellerPegs[colour] || 0;
  traveller += rollAmount;
  gameState.travellerPegs[colour] = traveller;

  // Apply downward penalties
  if ([170, 220, 260].includes(traveller)) {
    traveller = Math.max(0, traveller - 60);
    gameState.travellerPegs[colour] = traveller;
  }

  // 🔔 End-of-round logic
  if (traveller >= 270 && !gameState.roundEnded) {
    console.log(
      `[moveTraveller] ${colour} hit 270+ (traveller=${traveller}) and [SERVER] Emitting endOfRound`,
      gameState.travellerPegs
    );
    console.log('[SERVER] Emitting endOfRound with:', {
      travellerPegs: gameState.travellerPegs,
      parentPegs: gameState.parentPegs,
    });

    // 2️⃣ Set round-ended flag to prevent multiple emits
    gameState.roundEnded = true;

    // 1️⃣ Emit popup to clients immediately using travellerPegs
    if (io) {
      io.emit('endOfRound', {
        travellerPegs: gameState.travellerPegs,
        parentPegs: gameState.parentPegs,
      });
    }

    // 3️⃣ Pay dividends & adjust parent pegs
    COLORS.forEach((c) => {
      const t = gameState.travellerPegs[c] || 0;
      if (t >= 230) payDividends(gameState, c);
    });

    COLORS.forEach((c) => {
      let p = gameState.parentPegs[c] || 0;
      const t = gameState.travellerPegs[c] || 0;
      if (t >= 270) p = Math.min(p + 20, 270);
      else if (t >= 240 && t < 270) p = Math.min(p + 10, 270);
      else if (t >= 220 && t < 240) p = p;
      else if (t <= 210) p = Math.max(p - 10, 0);
      gameState.parentPegs[c] = p;
    });

    // Reset all traveller pegs to parent pegs
    COLORS.forEach(
      (c) => (gameState.travellerPegs[c] = gameState.parentPegs[c])
    );

    // Reset dividend flags
    COLORS.forEach((c) => (gameState.dividendsPaid[c] = false));

    // ✅ Reset roundEnded flag so next round can trigger again
    gameState.roundEnded = false;
  }
}

// Wrapper for syncing/capping pegs
export function updateParentPegsIfNeeded(gameState) {
  COLORS.forEach((c) => moveTraveller(gameState, c, 0));
}

// 🛒 Buy a share
export function buyShare(gameState, playerData, trackColor) {
  if (!COLORS.includes(trackColor)) return false;

  const sharePrice = Math.ceil(gameState.parentPegs[trackColor] || 0);
  if (playerData.coins < sharePrice + 5) return false;
  if ((gameState.sharesLeft[trackColor] || 0) <= 0) return false;

  playerData.coins -= sharePrice + 5;
  playerData.ownedShares[trackColor] += 1;
  gameState.sharesLeft[trackColor] -= 1;

  console.log(
    `[buyShare] ${playerData.id} bought 1 share of ${trackColor} for ${
      sharePrice + 5
    }`
  );
  return true;
}

// 💵 Sell a share
export function sellShare(gameState, playerData, trackColor) {
  if (!COLORS.includes(trackColor)) return false;
  if ((playerData.ownedShares[trackColor] || 0) <= 0) return false;

  const sharePrice = Math.ceil(gameState.parentPegs[trackColor] || 0);
  playerData.coins += sharePrice;
  playerData.ownedShares[trackColor] -= 1;
  gameState.sharesLeft[trackColor] += 1;

  console.log(
    `[sellShare] ${playerData.id} sold 1 share of ${trackColor} for ${sharePrice}`
  );
  return true;
}

// 👤 Initialize a new player
export function initPlayerData(playerId) {
  const ownedShares = {};
  COLORS.forEach((color) => (ownedShares[color] = 0));

  return {
    id: playerId,
    coins: 300,
    ownedShares,
  };
}
