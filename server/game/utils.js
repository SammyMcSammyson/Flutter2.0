export function calculateTotalAssets(player, parentPegs) {
  const sharesValue = Object.entries(player.ownedShares || {}).reduce(
    (total, [track, count]) => total + count * (parentPegs[track] || 0),
    0
  );
  return (player.coins || 0) + sharesValue;
}
