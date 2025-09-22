import React from 'react';
import Segment from './segments';
export default function Column({
  col,
  colIndex,
  values,
  parentPegs,
  travellerPegs,
}) {
  return (
    <div className='column' style={{ backgroundColor: col.color }}>
      {values.map((val, i) => (
        <Segment
          key={`${col.color}-${i}`}
          col={col}
          value={val}
          isParent={parentPegs[col.color] === val}
          isTraveller={travellerPegs[col.color] === val}
          isArrow={colIndex === 3 && val === '↓'}
        />
      ))}
    </div>
  );
}
