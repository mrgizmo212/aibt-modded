'use client';

import { AlertTriangle, Scale, RefreshCw, TrendingDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMockStore } from '@/lib/MockStoreContext';
import { useToast } from '@/components/ui/toast';

interface AnalysisCardProps {
  onRunSelect: (runId: number | null) => void;
  onContextChange: (context: 'dashboard' | 'model' | 'run' | 'admin') => void;
}

export default function AnalysisCard({ onRunSelect, onContextChange }: AnalysisCardProps) {
  const { applyRules } = useMockStore();
  const { showToast } = useToast();

  const handleViewTradeLog = () => {
    onRunSelect(12);
    onContextChange('run');
  };

  const handleApplyRules = () => {
    const rules = [
      'Stop-Loss at -5%',
      'Profit Target at +10%',
      'Min Hold Time: 30min'
    ];
    applyRules(12, rules);
    showToast('Applied 3 rules to Run #12', 'success');
  };

  const handleApplySingleRule = (rule: string) => {
    applyRules(12, [rule]);
    showToast(`Applied rule: ${rule}`, 'success');
  };

  return (
    <div 
      className="rounded-xl overflow-hidden"
      style={{ background: '#1a1a1a', border: '1px solid #262626' }}
    >
      {/* Header */}
      <div 
        className="p-4 flex items-center gap-3"
        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
      >
        <TrendingDown size={20} style={{ color: '#ef4444' }} />
        <div className="flex-1">
          <h3 className="text-base font-semibold" style={{ color: '#ffffff' }}>Run #12 Analysis</h3>
          <p className="text-xs mt-1" style={{ color: '#a3a3a3' }}>❌ -5.2% • 23 trades • 6.5 hours</p>
        </div>
      </div>

      {/* Issues List */}
      <div className="p-4 space-y-4">
        {/* Issue 1 - High Severity */}
        <div 
          className="p-4 rounded-lg"
          style={{ background: '#0a0a0a', border: '1px solid #262626' }}
        >
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold" style={{ color: '#ffffff' }}>
                  No Stop-Loss Protection
                </h4>
                <Badge 
                  className="px-2 py-0.5 text-xs"
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                >
                  Biggest Impact
                </Badge>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#a3a3a3' }}>
                Your biggest loss was -$215 on TSLA (trade #7 at 11:15am). The AI held this position down -8.6% before selling.
              </p>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => handleApplySingleRule('Stop-Loss at -5%')}
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
            <Plus size={16} className="mr-2" />
            Add Stop-Loss at -5%
          </Button>
        </div>

        {/* Issue 2 - Medium Severity */}
        <div 
          className="p-4 rounded-lg"
          style={{ background: '#0a0a0a', border: '1px solid #262626' }}
        >
          <div className="flex items-start gap-3 mb-3">
            <Scale size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-1" style={{ color: '#ffffff' }}>
                Poor Win/Loss Ratio
              </h4>
              <div className="flex items-center gap-4 mb-2">
                <div>
                  <span className="text-xs" style={{ color: '#a3a3a3' }}>Avg Win: </span>
                  <span className="text-xs font-semibold" style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>$45</span>
                </div>
                <div>
                  <span className="text-xs" style={{ color: '#a3a3a3' }}>Avg Loss: </span>
                  <span className="text-xs font-semibold" style={{ color: '#ef4444', fontFamily: 'var(--font-mono)' }}>$87</span>
                </div>
                <div>
                  <span className="text-xs" style={{ color: '#a3a3a3' }}>Ratio: </span>
                  <span className="text-xs font-semibold" style={{ color: '#ef4444', fontFamily: 'var(--font-mono)' }}>1:1.9</span>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#a3a3a3' }}>
                Winners averaged $45 but losers averaged $87. You need winners 2x bigger than losers to profit.
              </p>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => handleApplySingleRule('Profit Target at +10%')}
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
            <Plus size={16} className="mr-2" />
            Add Profit Target at +10%
          </Button>
        </div>

        {/* Issue 3 - Low Severity */}
        <div 
          className="p-4 rounded-lg"
          style={{ background: '#0a0a0a', border: '1px solid #262626' }}
        >
          <div className="flex items-start gap-3 mb-3">
            <RefreshCw size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-1" style={{ color: '#ffffff' }}>
                Overtrading
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: '#a3a3a3' }}>
                23 trades in 6.5 hours = 1 trade every 17 minutes. Many were whipsaw entries/exits.
              </p>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => handleApplySingleRule('Min Hold Time: 30min')}
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
            <Plus size={16} className="mr-2" />
            Add Min Hold Time: 30min
          </Button>
        </div>
      </div>

      {/* Impact Summary */}
      <div 
        className="mx-4 mb-4 p-3 rounded-lg"
        style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}
      >
        <p className="text-sm" style={{ color: '#3b82f6' }}>
          💡 With these 3 rules, this run would have changed from -5.2% loss to +2.1% gain
        </p>
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 flex gap-3">
        <Button
          className="flex-1"
          onClick={handleApplyRules}
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
          Apply All 3 Rules
        </Button>
        <Button
          variant="ghost"
          className="flex-1"
          onClick={handleViewTradeLog}
          style={{ color: '#a3a3a3' }}
        >
          View Trade Log
        </Button>
      </div>
    </div>
  );
}
