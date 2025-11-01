import React from 'react';
import { TrendingUpIcon } from '../icons';

interface StatProps {
  label: string;
  value: string;
  change?: string;
  changeColor?: string;
  subtext?: string;
  trend?: string;
}

const StatCard: React.FC<StatProps> = ({ label, value, change, changeColor, subtext, trend }) => (
  <div className="bg-surface border border-border/50 p-4 rounded-lg">
    <p className="text-sm text-text-secondary mb-1">{label}</p>
    <p className="text-2xl font-bold font-mono text-text-primary">{value}</p>
    {change && (
      <div className="flex items-center gap-2 mt-1">
        <span className={`font-mono text-sm ${changeColor || 'text-success'}`}>{change}</span>
      </div>
    )}
     {subtext && (
      <p className="text-xs text-text-tertiary mt-1">{subtext}</p>
    )}
    {trend && (
      <p className="text-xs text-text-secondary mt-1">{trend}</p>
    )}
  </div>
);

const StatsGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
      <StatCard label="Total Portfolio" value="$73,245" change="+$2,400 / +3.4%" changeColor="text-success" />
      <StatCard label="Active Models" value="3" subtext="of 7 total" />
      <StatCard label="Today's P/L" value="+$1,245" change="+1.7%" changeColor="text-success" />
      <StatCard label="Win Rate" value="62%" trend="↑ from 58%" />
    </div>
  );
};

export default StatsGrid;
