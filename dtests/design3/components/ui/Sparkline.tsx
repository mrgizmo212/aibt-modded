import React from 'react';

interface SparklineProps {
  data: number[];
  color: string;
  className?: string;
}

const Sparkline: React.FC<SparklineProps> = ({ data, color, className }) => {
  if (!data || data.length < 2) return null;

  const width = 100;
  const height = 40;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const pathD = `M ${points}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;
  
  const uniqueId = `sparkline-gradient-${Math.random().toString(36).substring(7)}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-label={`Sparkline chart showing a trend. Data points: ${data.join(', ')}`}
    >
      <defs>
        <linearGradient id={uniqueId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${uniqueId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
};

export default Sparkline;
