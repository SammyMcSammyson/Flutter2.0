import React from 'react';
import './DiceResultsBox.css';

export default function DiceResultBox({ roll }) {
  if (!roll) return null;

  return (
    <div className='dice-result-box'>
      <strong>Dice Roll:</strong> {roll.numberDie} —{' '}
      <span style={{ color: roll.colourDie }}>{roll.colourDie}</span>
    </div>
  );
}
