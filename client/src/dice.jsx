import React from 'react';

export default function Dice({ handleRoll }) {
  return (
    <div>
      <button onClick={handleRoll}>Roll Dice</button>
    </div>
  );
}
