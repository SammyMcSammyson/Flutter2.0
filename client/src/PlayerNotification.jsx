import React from 'react';

export default function PlayerNotification({ currentPlayer, mySocketId }) {
  if (!currentPlayer) return <div>Waiting for players...</div>;

  const isMyTurn = mySocketId === currentPlayer;
  return (
    <div>
      {isMyTurn
        ? 'Your turn!'
        : `Waiting for player ${currentPlayer.slice(0, 5)}...`}
    </div>
  );
}
