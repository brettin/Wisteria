import React from 'react';

interface HallmarkBarProps {
  pct: number; // value between 0 and 100
}

const HallmarkBar: React.FC<HallmarkBarProps> = ({ pct }) => (
  <div className="hallmark-bar" style={{ '--pct': `${pct}%` } as React.CSSProperties}>
    <div className="hallmark-fill" />
  </div>
);

export default HallmarkBar; 