'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select } from '@/components/ui/select';
import { useMockStore } from '@/lib/MockStoreContext';
import { useToast } from '@/components/ui/toast';

interface TradingFormProps {
  onContextChange: (context: 'dashboard' | 'model' | 'run' | 'admin') => void;
  onRunSelect?: (runId: number) => void;
}

export default function TradingForm({ onContextChange, onRunSelect }: TradingFormProps) {
  const [tradingMode, setTradingMode] = useState('intraday');
  const [symbol, setSymbol] = useState('AAPL');
  const [session, setSession] = useState('regular');
  const { createRun } = useMockStore();
  const { showToast } = useToast();

  const handleStartTrading = () => {
    const runId = createRun(1, symbol, tradingMode, session); // Using model ID 1 (Claude Day Trader)
    
    showToast(`Started trading ${symbol} in ${tradingMode} mode`, 'success');
    
    if (onRunSelect) {
      onRunSelect(runId);
    }
    onContextChange('run');
  };

  return (
    <div 
      className="p-6 rounded-xl"
      style={{ background: '#1a1a1a', border: '1px solid #262626' }}
    >
      <h3 className="text-lg font-semibold mb-6" style={{ color: '#ffffff' }}>
        Start Trading - Claude Day Trader
      </h3>

      {/* Trading Mode */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3" style={{ color: '#ffffff' }}>
          Trading Mode
        </label>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="tradingMode"
              value="intraday"
              checked={tradingMode === 'intraday'}
              onChange={(e) => setTradingMode(e.target.value)}
              className="mt-1"
              style={{ accentColor: '#3b82f6' }}
            />
            <div>
              <div className="text-sm font-medium" style={{ color: '#ffffff' }}>Intraday</div>
              <div className="text-xs" style={{ color: '#a3a3a3' }}>Today's market - live trading</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="tradingMode"
              value="daily"
              checked={tradingMode === 'daily'}
              onChange={(e) => setTradingMode(e.target.value)}
              className="mt-1"
              style={{ accentColor: '#3b82f6' }}
            />
            <div>
              <div className="text-sm font-medium" style={{ color: '#ffffff' }}>Daily</div>
              <div className="text-xs" style={{ color: '#a3a3a3' }}>Historical backtest</div>
            </div>
          </label>
        </div>
      </div>

      {/* Symbol */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2" style={{ color: '#ffffff' }}>
          Symbol
        </label>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full px-4 py-2 rounded-lg"
          style={{
            background: '#0a0a0a',
            border: '1px solid #262626',
            color: '#ffffff'
          }}
        >
          <option value="AAPL">AAPL</option>
          <option value="MSFT">MSFT</option>
          <option value="NVDA">NVDA</option>
          <option value="TSLA">TSLA</option>
        </select>
      </div>

      {/* Session */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2" style={{ color: '#ffffff' }}>
          Session
        </label>
        <div className="flex gap-2">
          {['Regular', 'Pre-Market', 'After-Hours'].map((s) => (
            <button
              key={s}
              onClick={() => setSession(s.toLowerCase().replace('-', ''))}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: session === s.toLowerCase().replace('-', '') ? '#3b82f6' : 'transparent',
                border: '1px solid #262626',
                color: session === s.toLowerCase().replace('-', '') ? '#ffffff' : '#a3a3a3'
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div 
        className="p-4 rounded-lg mb-6 flex items-start gap-3"
        style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}
      >
        <Info size={18} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 2 }} />
        <p className="text-sm" style={{ color: '#3b82f6' }}>
          This will create Run #13 using Claude 4.5 Sonnet
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="ghost"
          className="flex-1"
          style={{ color: '#a3a3a3' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleStartTrading}
          className="flex-1"
          style={{
            background: '#3b82f6',
            color: '#ffffff'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#3b82f6';
          }}
        >
          Start Trading →
        </Button>
      </div>
    </div>
  );
}
