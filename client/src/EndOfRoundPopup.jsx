import React from 'react';
import '/home/sammysammyson/Tech Educators/Projects/Flutter 2.0/client/src/EndOfRoundPopup.css';
export default function EndOfRoundPopup({ show, parentPegs, onClose }) {
  if (!show) return null;

  return (
    <div className='popup-overlay'>
      <div className='popup-content'>
        <h2>End of Round!</h2>
        <p>Traveller peg reached 200. Parent pegs updated:</p>
        <ul>
          {Object.entries(parentPegs).map(([color, value]) => (
            <li key={color}>
              <strong>{color}:</strong> {value}
            </li>
          ))}
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
