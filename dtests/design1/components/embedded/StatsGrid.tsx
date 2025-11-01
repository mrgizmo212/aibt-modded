'use client';

import { mockModels } from '@/lib/mockData';

export default function StatsGrid() {
  const activeModels = mockModels.filter(m => m.status === 'running').length;
  const totalPortfolio = 73245;
  const portfolioChange = 2400;
  const portfolioChangePercent = 3.4;
  const todayPL = 1245;
  const todayPLPercent = 1.7;
  const winRate = 62;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div 
        className="p-5 rounded-xl"
        style={{ background: '#1a1a1a', border: '1px solid #262626' }}
      >
        <p className="text-xs mb-2" style={{ color: '#a3a3a3' }}>Total Portfolio</p>
        <p className="text-2xl font-bold mb-2" style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
          ${totalPortfolio.toLocaleString()}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            +${portfolioChange.toLocaleString()}
          </span>
          <span className="text-sm font-semibold" style={{ color: '#10b981' }}>
            +{portfolioChangePercent}%
          </span>
        </div>
      </div>

      <div 
        className="p-5 rounded-xl"
        style={{ background: '#1a1a1a', border: '1px solid #262626' }}
      >
        <p className="text-xs mb-2" style={{ color: '#a3a3a3' }}>Active Models</p>
        <p className="text-2xl font-bold mb-2" style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
          {activeModels}
        </p>
        <p className="text-xs" style={{ color: '#a3a3a3' }}>
          of {mockModels.length} total
        </p>
      </div>

      <div 
        className="p-5 rounded-xl"
        style={{ background: '#1a1a1a', border: '1px solid #262626' }}
      >
        <p className="text-xs mb-2" style={{ color: '#a3a3a3' }}>Today's P/L</p>
        <p className="text-2xl font-bold mb-2" style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
          +${todayPL.toLocaleString()}
        </p>
        <span className="text-sm font-semibold" style={{ color: '#10b981' }}>
          +{todayPLPercent}%
        </span>
      </div>

      <div 
        className="p-5 rounded-xl"
        style={{ background: '#1a1a1a', border: '1px solid #262626' }}
      >
        <p className="text-xs mb-2" style={{ color: '#a3a3a3' }}>Win Rate</p>
        <p className="text-2xl font-bold mb-2" style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
          {winRate}%
        </p>
        <p className="text-xs" style={{ color: '#a3a3a3' }}>
          ↑ from 58%
        </p>
      </div>
    </div>
  );
}
