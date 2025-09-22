import React from 'react';
export default function Segment({
  col,
  value,
  isParent,
  isTraveller,
  isArrow,
}) {
  return (
    <div className='segment' style={{ position: 'relative', height: '20px' }}>
      {/* Arrow for beige column */}
      {isArrow && (
        <div
          style={{
            color: '#000',
            fontSize: '20px',
            fontWeight: 'bold',
            lineHeight: 1,
            textAlign: 'center',
            width: '100%',
          }}
        >
          ↓
        </div>
      )}

      {/* Dot for other columns */}
      {!isArrow && col.hasDot && <div className='dot'></div>}

      {/* Parent peg */}
      {isParent && <div className='peg parent'>P</div>}

      {/* Traveller peg */}
      {isTraveller && <div className='peg traveller'>T</div>}

      {/* Segment value for beige */}
      {col.color === 'beige' && !isArrow && (
        <span className='segment-number'>{value}</span>
      )}
    </div>
  );
}
