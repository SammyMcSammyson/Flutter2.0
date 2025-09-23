import React, { useState, useEffect } from 'react';
import Board from './Board';
import Dice from './dice';
import DiceResultBox from './DiceResultsBox';
import EndOfRoundPopup from './EndOfRoundPopup';
import socket from './socket';
import { TRACK_COLUMNS } from './constants';
import TurnTimer from './TurnTimer';
import PlayerNotification from './PlayerNotification';
import SharesPanel from './sharesPanel';
import './App.css';
export default function App() {
  const [roll, setRoll] = useState(null);
  const [parentPegs, setParentPegs] = useState({});
  const [travellerPegs, setTravellerPegs] = useState({});
  const [mySocketId, setMySocketId] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);

  // Shares-related state
  const [playersData, setPlayersData] = useState({});
  const [sharesLeft, setSharesLeft] = useState({});

  useEffect(() => {
    socket.on('connect', () => setMySocketId(socket.id));

    socket.on('diceRolled', setRoll);

    socket.on('stateUpdate', (state) => {
      console.log('stateUpdate received, parentPegs:', state.parentPegs); // debug

      setParentPegs(state.parentPegs);
      console.log('stateUpdate received, parentPegs:', state.parentPegs); // debug

      setTravellerPegs(state.travellerPegs);
      if (state.playersData) setPlayersData(state.playersData);
      if (state.sharesLeft) setSharesLeft(state.sharesLeft);
      console.log('=== STATE UPDATE RECEIVED ===');
      console.log('parentPegs:', state.parentPegs);
      console.log('playersData:', state.playersData);
      console.log('sharesLeft:', state.sharesLeft);
    });

    socket.on('turnUpdate', (data) => setCurrentPlayer(data.currentPlayer));

    return () => {
      socket.off('connect');
      socket.off('diceRolled');
      socket.off('stateUpdate');
      socket.off('turnUpdate');
    };
  }, []);

  const handleRoll = () => {
    if (mySocketId === currentPlayer) socket.emit('rollDice');
  };

  const handleReset = () => socket.emit('resetGame');

  const handleBuyShare = (track) => {
    if (mySocketId === currentPlayer) socket.emit('buyShare', track);
  };

  const handleSellShare = (track) => {
    if (mySocketId === currentPlayer) socket.emit('sellShare', track);
  };

  const isMyTurn = mySocketId === currentPlayer;

  return (
    <div className='app'>
      <h1 className='title'>Traveller Tracks</h1>

      <div className='game-container'>
        {/* Left side */}
        <div className='sidebar'>
          <Dice handleRoll={handleRoll} roll={roll} disabled={!isMyTurn} />

          <div className='dice-result-container'>
            <DiceResultBox roll={roll} />
          </div>

          <TurnTimer currentPlayer={currentPlayer} mySocketId={mySocketId} />
          <PlayerNotification
            currentPlayer={currentPlayer}
            mySocketId={mySocketId}
          />

          <SharesPanel
            mySocketId={mySocketId}
            currentPlayer={currentPlayer}
            playersData={playersData}
            sharesLeft={sharesLeft}
            onBuyShare={handleBuyShare}
            onSellShare={handleSellShare}
            parentPegs={parentPegs}
          />

          <button onClick={handleReset} className='reset-button'>
            Reset Game
          </button>
        </div>

        {/* Right side */}
        <div className='board-container'>
          <Board
            columns={TRACK_COLUMNS}
            parentPegs={parentPegs}
            travellerPegs={travellerPegs}
          />
        </div>
      </div>

      <EndOfRoundPopup />
    </div>
  );
}
