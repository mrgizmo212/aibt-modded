'use client';

import { Bot } from 'lucide-react';
import StatsGrid from '@/components/embedded/StatsGrid';
import ModelCardsGrid from '@/components/embedded/ModelCardsGrid';
import TradingForm from '@/components/embedded/TradingForm';
import AnalysisCard from '@/components/embedded/AnalysisCard';
import ThinkingIndicator from '@/components/embedded/ThinkingIndicator';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: string;
  embeddedComponent?: {
    type: 'stats_grid' | 'model_cards' | 'form' | 'analysis' | 'table' | 'chart' | 'thinking';
    props?: any;
  };
  suggestedActions?: string[];
}

interface ChatMessageProps {
  message: Message;
  onContextChange: (context: 'dashboard' | 'model' | 'run' | 'admin') => void;
  onRunSelect: (runId: number | null) => void;
  onSuggestedAction: (action: string) => void;
  onSelectModel?: (modelId: number) => void;
}

export default function ChatMessage({ message, onContextChange, onRunSelect, onSuggestedAction, onSelectModel }: ChatMessageProps) {
  if (message.type === 'user') {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[90%]">
          <div 
            className="px-4 py-3 rounded-xl"
            style={{ background: '#3b82f6' }}
          >
            <p className="text-sm leading-relaxed" style={{ color: '#ffffff' }}>
              {message.text}
            </p>
            <p className="text-xs mt-2 opacity-70" style={{ color: '#ffffff' }}>
              {message.timestamp}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 mb-6">
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: '#3b82f6' }}
      >
        <Bot size={18} style={{ color: '#ffffff' }} />
      </div>
      <div className="flex-1 max-w-[90%]">
        <div 
          className="px-4 py-3 rounded-xl"
          style={{ background: '#1a1a1a', border: '1px solid #262626' }}
        >
          <p className="text-sm leading-relaxed" style={{ color: '#ffffff' }}>
            {message.text}
          </p>
          
          {message.embeddedComponent && (
            <div className="mt-4">
              {message.embeddedComponent.type === 'stats_grid' && (
                <StatsGrid />
              )}
              {message.embeddedComponent.type === 'model_cards' && (
                <ModelCardsGrid onContextChange={onContextChange} onSelectModel={onSelectModel} />
              )}
              {message.embeddedComponent.type === 'form' && (
                <TradingForm onContextChange={onContextChange} onRunSelect={onRunSelect} />
              )}
              {message.embeddedComponent.type === 'analysis' && (
                <AnalysisCard onRunSelect={onRunSelect} onContextChange={onContextChange} />
              )}
              {message.embeddedComponent.type === 'thinking' && (
                <ThinkingIndicator />
              )}
            </div>
          )}
          
          {message.suggestedActions && message.suggestedActions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {message.suggestedActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestedAction(action)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: '#1a1a1a',
                    border: '1px solid #262626',
                    color: '#a3a3a3'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#262626';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1a1a1a';
                    e.currentTarget.style.color = '#a3a3a3';
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          )}
          
          <p className="text-xs mt-2" style={{ color: '#737373' }}>
            {message.timestamp}
          </p>
        </div>
      </div>
    </div>
  );
}
