// Board.jsx
import React from 'react';
import Column from './colomn';
import { COLUMN_SEGMENTS } from './constants';

export default function Board({ columns, parentPegs, travellerPegs }) {
  return (
    <div className='board'>
      {columns.map((col) => (
        <Column
          key={col.color}
          col={col}
          colIndex={columns.indexOf(col)}
          values={COLUMN_SEGMENTS[col.color]}
          parentPegs={parentPegs}
          travellerPegs={travellerPegs}
        />
      ))}
    </div>
  );
}
