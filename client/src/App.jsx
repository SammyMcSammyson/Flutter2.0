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

  // End-of-round popup
  const [showEndOfRound, setShowEndOfRound] = useState(false);

  useEffect(() => {
    const onConnect = () => {
      console.log('[CLIENT] Connected with ID:', socket.id);
      setMySocketId(socket.id);
    };
    socket.onAny((event, ...args) => {
      console.log('[CLIENT] Heard event:', event, args);
    });

    socket.on('connect', onConnect);

    socket.on('diceRolled', setRoll);

    socket.on('stateUpdate', (state) => {
      setParentPegs(state.parentPegs);
      setTravellerPegs(state.travellerPegs);
      if (state.playersData) setPlayersData(state.playersData);
      if (state.sharesLeft) setSharesLeft(state.sharesLeft);
    });

    socket.on('turnUpdate', (data) => {
      setCurrentPlayer(data.currentPlayer);
    });

    socket.on('endOfRound', (data) => {
      console.log('hi');
      console.log('[CLIENT] Raw endOfRound data:', data);
      console.log('[CLIENT] TravellerPegs from payload:', data.travellerPegs);

      setTravellerPegs(data.travellerPegs);
      setShowEndOfRound(true);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('diceRolled');
      socket.off('stateUpdate');
      socket.off('turnUpdate');
      socket.off('endOfRound');
      socket.offAny();
    };
  }, []);

  const handleRoll = () => {
    if (mySocketId === currentPlayer) {
      socket.emit('rollDice');
    }
  };

  const handleReset = () => {
    socket.emit('resetGame');
  };

  const handleBuyShare = (track) => {
    if (mySocketId === currentPlayer) {
      socket.emit('buyShare', track);
    }
  };

  const handleSellShare = (track) => {
    if (mySocketId === currentPlayer) {
      socket.emit('sellShare', track);
    }
  };

  const isMyTurn = mySocketId === currentPlayer;

  const handleClosePopup = () => {
    setShowEndOfRound(false);
  };

  console.log('Rendering popup, show=', showEndOfRound);

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
      <EndOfRoundPopup
        show={showEndOfRound}
        parentPegs={parentPegs}
        onClose={handleClosePopup}
        travellerPegs={travellerPegs}
      />
    </div>
  );
}
