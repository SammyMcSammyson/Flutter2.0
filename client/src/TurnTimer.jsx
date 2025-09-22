import React, { useEffect, useState } from 'react';

export default function TurnTimer({ currentPlayer, mySocketId, turnDuration }) {
  const [timeLeft, setTimeLeft] = useState(turnDuration || 60);

  useEffect(() => {
    setTimeLeft(turnDuration || 60);
    if (!currentPlayer) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentPlayer, turnDuration]);

  return (
    <div style={{ margin: '10px 0', fontWeight: 'bold' }}>
      {currentPlayer === mySocketId
        ? `Your turn! Time left: ${timeLeft}s`
        : `Waiting for other player... Time left: ${timeLeft}s`}
    </div>
  );
}
