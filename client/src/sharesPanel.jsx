import React from 'react';

export default function SharesPanel({
  mySocketId,
  currentPlayer,
  playersData = {}, // default to empty object
  sharesLeft = {}, // default to empty object
  onBuyShare,
  onSellShare,
}) {
  const isMyTurn = mySocketId === currentPlayer;

  return (
    <div className='shares-panel'>
      <h2>Shares Information</h2>

      {/* Global shares left */}
      <div className='global-shares'>
        <h3>Global Shares Left</h3>
        <div className='track-list'>
          {Object.entries(sharesLeft || {}).map(([track, count]) => (
            <div key={track} className='track'>
              <strong>{track}</strong>: {count ?? 0}
            </div>
          ))}
        </div>
      </div>

      {/* Player coins and shares */}
      <div className='players-info'>
        <h3>Players</h3>
        {Object.entries(playersData || {}).map(([id, data]) => {
          const playerShares = data.ownedShares || {};
          const coins = data.coins ?? 0;

          return (
            <div
              key={id}
              className={`player-card ${id === mySocketId ? 'my-player' : ''}`}
            >
              <strong>{id === mySocketId ? 'You' : `Player ${id}`}</strong>
              <div>Coins: {coins}</div>
              <div className='shares'>
                {Object.entries(playerShares).map(([track, count]) => (
                  <span key={track} className='player-share'>
                    {track}: {count ?? 0}{' '}
                  </span>
                ))}
              </div>

              {/* Buy/Sell buttons only for current player */}
              {isMyTurn && id === mySocketId && (
                <div className='actions'>
                  {Object.keys(sharesLeft || {}).map((track) => (
                    <div key={track} className='track-actions'>
                      <button
                        onClick={() => onBuyShare(track)}
                        disabled={coins <= 0 || (sharesLeft[track] ?? 0) <= 0}
                      >
                        Buy {track}
                      </button>
                      <button
                        onClick={() => onSellShare(track)}
                        disabled={(playerShares[track] ?? 0) <= 0}
                      >
                        Sell {track}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
