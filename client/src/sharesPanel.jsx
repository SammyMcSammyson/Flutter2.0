import React, { useState } from 'react';
import './sharesPanel.css';

export default function SharesPanel({
  mySocketId,
  currentPlayer,
  playersData = {},
  sharesLeft = {},
  onBuyShare,
  onSellShare,
  connectedPlayers = [],
  parentPegs = {}, // peg positions passed from App
}) {
  const isMyTurn = mySocketId === currentPlayer;
  const [showExchangePopup, setShowExchangePopup] = useState(false);

  // My player data
  const myPlayerData = playersData[mySocketId] || {};
  const playerShares = myPlayerData.ownedShares || {};
  const coins = myPlayerData.coins ?? 0;

  // Live calculation of shares value and total assets
  const mySharesValue = Object.entries(playerShares).reduce(
    (total, [track, count]) => {
      const valuePerShare = parentPegs[track] ?? 0;
      console.log('parentPegs keys:', Object.keys(parentPegs));

      console.log(`Track: ${track}, parentPegs[track]:`, parentPegs[track]);

      return total + count * valuePerShare;
    },
    0
  );
  const myTotalAssets = coins + mySharesValue;

  return (
    <div className='shares-panel'>
      <h2>Shares Information</h2>

      {/* Always visible player wealth */}
      <div className='my-wealth'>
        <p>
          <strong>Coins:</strong> {coins}
        </p>
        <p>
          <strong>Shares Value:</strong> {mySharesValue}
        </p>
        <p>
          <strong>Total Assets:</strong> {myTotalAssets}
        </p>
      </div>

      {/* Stock Exchange Button */}
      <button className='shop-btn' onClick={() => setShowExchangePopup(true)}>
        Stock Exchange
      </button>

      {/* Stock Exchange Popup */}
      {showExchangePopup && (
        <div className='global-popup'>
          <div className='popup-content'>
            <h3>Stock Exchange</h3>

            {/* Shares List */}
            {Object.keys(sharesLeft).map((track) => {
              const available = sharesLeft[track] ?? 0;
              const owned = playerShares[track] ?? 0;
              const price = parentPegs[track] ?? 0;
              console.log(
                `Track: ${track}, Available: ${available}, Owned: ${owned}, Price: ${price}`
              );

              return (
                <div key={track} className='track-actions'>
                  <div className='track-info'>
                    <div>{track}</div>
                    <div>
                      {available} available @ {price} each
                    </div>
                  </div>
                  <button
                    className='buy-sell-btn'
                    onClick={() => onBuyShare(track)}
                    disabled={!isMyTurn || coins <= 0 || available <= 0}
                  >
                    Buy
                  </button>
                  <button
                    className='buy-sell-btn'
                    onClick={() => onSellShare(track)}
                    disabled={!isMyTurn || owned <= 0}
                  >
                    Sell
                  </button>
                </div>
              );
            })}

            {/* Close button */}
            <button
              className='close-popup-btn'
              onClick={() => setShowExchangePopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Players Info */}
      <div className='players-info'>
        {connectedPlayers.map((id) => {
          const data = playersData[id] || {};
          const shares = data.ownedShares || {};
          const coins = data.coins ?? 0;

          const sharesValue = Object.entries(shares).reduce(
            (total, [track, count]) => {
              const valuePerShare = parentPegs[track] ?? 0;
              return total + count * valuePerShare;
            },
            0
          );
          const totalAssets = coins + sharesValue;

          return (
            <div
              key={id}
              className={`player-card ${id === mySocketId ? 'my-player' : ''}`}
            >
              <strong>{id === mySocketId ? 'You' : `Player ${id}`}</strong>
              <div>Coins: {coins}</div>
              <div>Shares Value: {sharesValue}</div>
              <div>Total Assets: {totalAssets}</div>
              <div className='shares'>
                {Object.entries(shares).map(([track, count]) => (
                  <span key={track} className='player-share'>
                    {track}: {count ?? 0}{' '}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
