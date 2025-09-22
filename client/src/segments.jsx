import React from 'react';

export default function Segment({
  col,
  value,
  isParent,
  isTraveller,
  isArrow,
}) {
  return (
    <div className='segment'>
      {col.color === 'beige' ? (
        <span className='segment-number'>
          {isArrow ? (
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
          ) : (
            value
          )}
        </span>
      ) : (
        <>
          {!isArrow && col.hasDot && <div className='dot'></div>}
          {isParent && <div className='peg parent'>P</div>}
          {isTraveller && <div className='peg traveller'>T</div>}
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
        </>
      )}
    </div>
  );
}
