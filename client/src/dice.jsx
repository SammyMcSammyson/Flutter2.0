import React from 'react';

export default function Dice({ handleRoll, roll }) {
  return (
    <div>
      <button onClick={handleRoll}>Roll Dice</button>
      {roll && roll.numberDie && (
        <p>
          Number Die: {roll.numberDie} <br />
          Color Die: {roll.colourDie}
        </p>
      )}
    </div>
  );
}
