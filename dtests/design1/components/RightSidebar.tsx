'use client';

import { Activity, Server, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { mockActivities, mockPositions } from '@/lib/mockData';

interface RightSidebarProps {
  context: 'dashboard' | 'model' | 'run' | 'admin';
  selectedModelId: number | null;
  selectedRunId: number | null;
}

export default function RightSidebar({ context, selectedModelId, selectedRunId }: RightSidebarProps) {
  return (
    <div 
      className="w-full h-full overflow-y-auto border-l"
      style={{ background: '#1a1a1a', borderColor: '#262626' }}
    >
      {/* Dashboard Context */}
      {context === 'dashboard' && (
        <div className="p-6">
          {/* Recent Activity */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity size={18} style={{ color: '#ffffff' }} />
              <h3 className="text-base font-semibold" style={{ color: '#ffffff' }}>Recent Activity</h3>
            </div>
            <div className="space-y-3">
              {mockActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  {activity.type === 'buy' && <TrendingUp size={16} style={{ color: '#10b981' }} />}
                  {activity.type === 'sell' && <TrendingDown size={16} style={{ color: '#ef4444' }} />}
                  {activity.type === 'complete' && <CheckCircle size={16} style={{ color: '#10b981' }} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: '#ffffff' }}>{activity.text}</p>
                    <p className="text-xs mt-1" style={{ color: '#737373' }}>{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Model Context */}
      {context === 'model' && (
        <div className="p-6">
          {/* Live Updates */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold" style={{ color: '#ffffff' }}>Live Updates</h3>
              <Badge 
                className="px-2 py-1 text-xs"
                style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}
              >
                Streaming
              </Badge>
            </div>
            <div 
              className="p-3 rounded-lg space-y-2 text-xs"
              style={{ background: '#0a0a0a', border: '1px solid #262626', fontFamily: 'var(--font-mono)' }}
            >
              <div style={{ color: '#a3a3a3' }}>
                <span style={{ color: '#737373' }}>14:45:23</span> Analyzing market conditions...
              </div>
              <div style={{ color: '#10b981' }}>
                <span style={{ color: '#737373' }}>14:45:25</span> ✓ BUY signal detected for AAPL
              </div>
              <div style={{ color: '#ffffff' }}>
                <span style={{ color: '#737373' }}>14:45:27</span> Executing: BUY 10 AAPL @ $180.50
              </div>
            </div>
          </div>

          {/* Current Positions */}
          <div>
            <h3 className="text-base font-semibold mb-4" style={{ color: '#ffffff' }}>Current Positions</h3>
            <div className="space-y-2">
              {mockPositions.map((position) => (
                <div 
                  key={position.symbol}
                  className="flex items-center justify-between py-2 px-3 rounded-lg"
                  style={{ background: '#0a0a0a' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold" style={{ color: '#ffffff' }}>{position.symbol}</span>
                    <span className="text-xs" style={{ color: '#a3a3a3', fontFamily: 'var(--font-mono)' }}>{position.shares}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm" style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                      ${(position.shares * position.currentPrice).toFixed(0)}
                    </div>
                    <div 
                      className="text-xs font-semibold"
                      style={{ color: position.pnl >= 0 ? '#10b981' : '#ef4444', fontFamily: 'var(--font-mono)' }}
                    >
                      {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
              <div 
                className="flex items-center justify-between py-2 px-3 rounded-lg border-t"
                style={{ background: 'rgba(26, 26, 26, 0.5)', borderColor: '#262626' }}
              >
                <span className="text-sm font-semibold" style={{ color: '#ffffff' }}>Cash</span>
                <span className="text-sm font-bold" style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                  $3,245
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Run Context */}
      {context === 'run' && (
        <div className="p-6">
          {/* Run Stats */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4" style={{ color: '#ffffff' }}>Run #12 Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs mb-1" style={{ color: '#a3a3a3' }}>Final Return</p>
                <p className="text-xl font-bold" style={{ color: '#ef4444', fontFamily: 'var(--font-mono)' }}>-5.2%</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#a3a3a3' }}>Total Trades</p>
                <p className="text-xl font-bold" style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>23</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#a3a3a3' }}>Win Rate</p>
                <p className="text-xl font-bold" style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>35%</p>
                <p className="text-xs mt-1" style={{ color: '#ef4444' }}>↓ Below average</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#a3a3a3' }}>Duration</p>
                <p className="text-xl font-bold" style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>6.5 hours</p>
              </div>
            </div>
          </div>

          {/* Trade Timeline */}
          <div>
            <h3 className="text-base font-semibold mb-4" style={{ color: '#ffffff' }}>Trade Timeline</h3>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ background: '#10b981' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#10b981' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
              <span className="ml-2 text-xs" style={{ color: '#a3a3a3' }}>← Losses started here</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
