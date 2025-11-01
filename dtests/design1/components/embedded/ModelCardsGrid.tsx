'use client';

import { Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMockStore } from '@/lib/MockStoreContext';
import { useToast } from '@/components/ui/toast';
import Sparkline from '@/components/Sparkline';

interface ModelCardsGridProps {
  onContextChange: (context: 'dashboard' | 'model' | 'run' | 'admin') => void;
  onSelectModel?: (modelId: number) => void;
}

export default function ModelCardsGrid({ onContextChange, onSelectModel }: ModelCardsGridProps) {
  const { models, startModel, stopModel } = useMockStore();
  const { showToast } = useToast();
  const displayModels = models.slice(0, 3);

  const handleStartStop = (modelId: number) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;
    
    if (model.status === 'running') {
      stopModel(modelId);
      showToast(`${model.name} stopped`, 'success');
    } else {
      startModel(modelId);
      showToast(`${model.name} started`, 'success');
    }
  };

  const handleDetails = (modelId: number) => {
    if (onSelectModel) {
      onSelectModel(modelId);
    }
    onContextChange('model');
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {displayModels.map((model) => (
        <div
          key={model.id}
          className="p-5 rounded-xl transition-all"
          style={{
            background: '#1a1a1a',
            border: '1px solid #262626'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#404040';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#262626';
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain size={20} style={{ color: '#3b82f6' }} />
              <h3 className="text-base font-semibold" style={{ color: '#ffffff' }}>
                {model.name}
              </h3>
            </div>
            <Badge
              className="px-3 py-1 rounded-lg"
              style={{
                background: model.status === 'running' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(82, 82, 82, 0.1)',
                color: model.status === 'running' ? '#10b981' : '#a3a3a3',
                border: `1px solid ${model.status === 'running' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(82, 82, 82, 0.2)'}`
              }}
            >
              {model.status === 'running' && (
                <span
                  className="inline-block w-2 h-2 rounded-full mr-2"
                  style={{
                    background: '#10b981',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}
                />
              )}
              {model.status === 'running' ? 'Running' : 'Stopped'}
            </Badge>
          </div>

          {/* Metrics */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold" style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                ${model.portfolio.toLocaleString()}
              </span>
              <span
                className="text-base font-semibold"
                style={{ color: model.return >= 0 ? '#10b981' : '#ef4444' }}
              >
                {model.return >= 0 ? '+' : ''}{model.return}%
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: '#737373' }}>
              Run #{model.run} • {model.status === 'running' ? '3 hours' : 'Yesterday'}
            </p>
          </div>

          {/* Sparkline */}
          <div className="mb-4">
            <Sparkline data={model.sparklineData} color={model.return >= 0 ? '#10b981' : '#ef4444'} />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {model.status === 'running' ? (
              <Button
                className="flex-1"
                onClick={() => handleStartStop(model.id)}
                style={{
                  background: '#ef4444',
                  color: '#ffffff'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                }}
              >
                Stop
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={() => handleStartStop(model.id)}
                style={{
                  background: '#10b981',
                  color: '#ffffff'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#10b981';
                }}
              >
                Start
              </Button>
            )}
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => handleDetails(model.id)}
              style={{
                background: 'transparent',
                color: '#ffffff',
                border: '1px solid #262626'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1a1a1a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Details
            </Button>
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}
