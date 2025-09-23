import React from 'react';
import './segment.css';

export default function Segment({
  col,
  value,
  isParent,
  isTraveller,
  isArrow,
}) {
  return (
    <div className='segment'>
      {isArrow && <div className='arrow'>SLUMP</div>}
      {/*!isArrow && col.hasDot && <div className='dot'></div>*/}
      {isParent && <div className='peg parent'>P</div>}
      {isTraveller && <div className='peg traveller'>T</div>}
      {col.color === 'beige' && !isArrow && (
        <span className='segment-number'>{value}</span>
      )}
    </div>
  );
}
