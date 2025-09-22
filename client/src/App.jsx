import React, { useState, useEffect } from 'react';
import Dice from './dice';
import socket from './socket';
import './App.css';

const TRACK_COLUMNS = [
  { color: 'yellow', hasDot: true },
  { color: 'red', hasDot: true },
  { color: 'blue', hasDot: true },
  { color: 'beige', hasDot: false },
  { color: 'green', hasDot: true },
  { color: 'purple', hasDot: true },
  { color: 'white', hasDot: true },
];

const SEGMENTS = Array.from({ length: 20 }, (_, i) => (i + 1) * 10);

export default function App() {
  const [roll, setRoll] = useState(null);
  const [parentPegs, setParentPegs] = useState({});
  const [travellerPegs, setTravellerPegs] = useState({});

  useEffect(() => {
    // Listen for dice roll
    socket.on('diceRolled', (data) => {
      setRoll(data);
      console.log('Dice rolled:', data);
    });

    // Listen for state update
    socket.on('stateUpdate', (state) => {
      setParentPegs(state.parentPegs);
      setTravellerPegs(state.travellerPegs);
      console.log('Game state updated:', state);
    });

    return () => {
      socket.off('diceRolled');
      socket.off('stateUpdate');
    };
  }, []);

  const handleRoll = () => {
    console.log('Emitting rollDice');
    socket.emit('rollDice');
  };

  return (
    <div className='app'>
      <h1>Traveller Tracks</h1>
      <Dice handleRoll={handleRoll} roll={roll} />

      <div className='board'>
        {TRACK_COLUMNS.map((col) => (
          <div
            key={col.color}
            className='column'
            style={{ backgroundColor: col.color }}
          >
            {SEGMENTS.map((seg) => {
              const isParent = parentPegs[col.color] === seg;
              const isTraveller = travellerPegs[col.color] === seg;

              return (
                <div key={seg} className='segment'>
                  {col.hasDot && <div className='dot'></div>}
                  {col.color === 'beige' && (
                    <span className='segment-number'>{seg}</span>
                  )}

                  {col.color !== 'beige' && (
                    <>
                      {isParent && <div className='peg parent'>P</div>}
                      {isTraveller && <div className='peg traveller'>T</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
