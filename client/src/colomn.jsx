import React from 'react';
import Segment from './segments';

export default function Column({
  col,
  colIndex,
  values,
  parentPegs,
  travellerPegs,
}) {
  const travellerValue = travellerPegs[col.color] || 0;
  const parentValue = parentPegs[col.color] || 0;

  // Find closest segment for traveller peg
  const closestTravellerSegment = values.reduce((prev, curr) => {
    return Math.abs(curr - travellerValue) < Math.abs(prev - travellerValue)
      ? curr
      : prev;
  }, values[0]);

  return (
    <div
      className='column'
      style={{ backgroundColor: col.color, position: 'relative' }}
    >
      {values.map((val, i) => (
        <Segment
          key={`${col.color}-${i}`}
          col={col}
          value={val}
          // Only show pegs if NOT column 4 (index 3)
          isParent={colIndex !== 3 && parentValue === val}
          isTraveller={colIndex !== 3 && val === closestTravellerSegment}
          isArrow={colIndex === 3 && val === '↓'}
        />
      ))}
    </div>
  );
}
