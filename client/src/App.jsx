import React, { useState, useEffect } from 'react';
import Board from './Board';
import Dice from './dice';
import DiceResultBox from './DiceResultsBox';
import EndOfRoundPopup from './EndOfRoundPopup';
import socket from './socket';
import { TRACK_COLUMNS } from './constants';
import TurnTimer from './TurnTimer';
import PlayerNotification from './PlayerNotification';
import './App.css';

export default function App() {
  const [roll, setRoll] = useState(null);
  const [parentPegs, setParentPegs] = useState({});
  const [travellerPegs, setTravellerPegs] = useState({});
  const [mySocketId, setMySocketId] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);

  useEffect(() => {
    socket.on('connect', () => setMySocketId(socket.id));
    socket.on('diceRolled', setRoll);
    socket.on('stateUpdate', (state) => {
      setParentPegs(state.parentPegs);
      setTravellerPegs(state.travellerPegs);
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

  const isMyTurn = mySocketId === currentPlayer;

  return (
    <div className='app'>
      <h1>Traveller Tracks</h1>
      <Dice handleRoll={handleRoll} roll={roll} disabled={!isMyTurn} />
      <div className='dice-result-container'>
        <DiceResultBox roll={roll} />
      </div>
      <TurnTimer currentPlayer={currentPlayer} mySocketId={mySocketId} />
      <PlayerNotification
        currentPlayer={currentPlayer}
        mySocketId={mySocketId}
      />
      <button onClick={handleReset} className='reset-button'>
        Reset Game
      </button>
      <Board
        columns={TRACK_COLUMNS}
        parentPegs={parentPegs}
        travellerPegs={travellerPegs}
      />
      <EndOfRoundPopup />
    </div>
  );
}
