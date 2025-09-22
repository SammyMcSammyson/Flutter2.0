// constants.js
export const TRACK_COLUMNS = [
  { color: 'yellow', hasDot: true },
  { color: 'red', hasDot: true },
  { color: 'blue', hasDot: true },
  { color: 'beige', hasDot: false },
  { color: 'green', hasDot: true },
  { color: 'purple', hasDot: true },
  { color: 'white', hasDot: true },
];

// Default segments for most columns
const DEFAULT_SEGMENTS = Array.from({ length: 28 }, (_, i) => i * 10);

// Custom segments mapping
export const COLUMN_SEGMENTS = {
  yellow: DEFAULT_SEGMENTS,
  red: DEFAULT_SEGMENTS,
  blue: DEFAULT_SEGMENTS,
  beige: [
    0,
    10,
    20,
    30,
    40,
    50,
    60,
    70,
    80,
    90,
    100,
    110,
    120,
    130,
    140,
    150,
    160,
    '↓',
    170,
    180,
    190,
    200,
    '↓',
    '5%',
    '10% payout',
    '10% payout',
    '↓',
    '20%',
  ],
  green: DEFAULT_SEGMENTS,
  purple: DEFAULT_SEGMENTS,
  white: DEFAULT_SEGMENTS,
};
