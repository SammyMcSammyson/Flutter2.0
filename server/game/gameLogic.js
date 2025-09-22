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
export function rollDiceForPlayer() {
  const numberDie = Math.floor(Math.random() * 6) + 1;
  const colourDie = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { numberDie, colourDie, roll: numberDie * 10 };
}

// 🚶 Move a traveller, handle penalties, dividends, parent peg adjustments, and reset flags
export function moveTraveller(gameState, colour, rollAmount) {
  if (!COLORS.includes(colour)) return;

  // Initialize state if missing
  if (!gameState.travellerPegs) gameState.travellerPegs = {};
  if (!gameState.parentPegs) gameState.parentPegs = {};
  if (!gameState.dividendsPaid) gameState.dividendsPaid = {};

  let traveller = gameState.travellerPegs[colour] || 0;
  let parent = gameState.parentPegs[colour] || 0;

  console.log(
    `[moveTraveller] START colour=${colour}, roll=${rollAmount}, traveller=${traveller}, parent=${parent}`
  );
  // Move traveller forward
  traveller += rollAmount;

  // Immediately write to game state
  gameState.travellerPegs[colour] = traveller;

  // Apply downward penalties
  if ([170, 220, 260].includes(traveller)) {
    traveller = Math.max(0, traveller - 60);
    gameState.travellerPegs[colour] = traveller; // update after penalty
  }

  // 🔔 If traveller hits 270+ and triggers global update
  if (traveller >= 270) {
    console.log(
      `[moveTraveller] ${colour} hit 270+, triggering dividends & parent adjustment`
    );

    // 1️⃣ Pay dividends for all qualifying tracks
    COLORS.forEach((c) => {
      const t = gameState.travellerPegs[c] || 0;
      if (t >= 230) payDividends(gameState, c);
    });

    // 2️⃣ Adjust each parent peg independently based on new rules
    COLORS.forEach((c) => {
      let p = gameState.parentPegs[c] || 0;
      const t = gameState.travellerPegs[c] || 0;

      if (t >= 270) p = Math.min(p + 20, 270); // top peg -> +2
      else if (t >= 240 && t < 270) p = Math.min(p + 10, 270); // 240–269 -> +1
      else if (t >= 220 && t < 240) p = p; // 220–239 -> no change
      else if (t <= 210) p = Math.max(p - 10, 0); // 210 or below -> -1

      gameState.parentPegs[c] = p;
      console.log(
        `[moveTraveller] Parent peg for ${c} adjusted to ${p} (traveller=${t})`
      );
    });

    // 3️⃣ Reset all traveller pegs to their parent pegs
    COLORS.forEach((c) => {
      gameState.travellerPegs[c] = gameState.parentPegs[c];
      console.log(
        `[moveTraveller] Traveller ${c} reset to parent=${gameState.parentPegs[c]}`
      );
    });

    // 4️⃣ Reset all dividend flags for next round
    COLORS.forEach((c) => (gameState.dividendsPaid[c] = false));
    console.log(`[moveTraveller] Dividend flags reset`);
  } else {
    // Only save this traveller if 270+ logic didn't run
    gameState.travellerPegs[colour] = traveller;
  }

  console.log(
    `[moveTraveller] END colour=${colour}, traveller=${gameState.travellerPegs[colour]}`
  );
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
