import React from 'react';
import { Message, EmbeddedComponentType } from '../types';
import { BotIcon } from './icons';
import StatsGrid from './embedded/StatsGrid';
import ModelCards from './embedded/ModelCards';
import TradingForm from './embedded/TradingForm';
import AnalysisCard from './embedded/AnalysisCard';
import CreateModelForm from './embedded/CreateModelForm';
import EditModelForm from './embedded/EditModelForm';

interface ChatMessageProps {
  message: Message;
  onSuggestedAction?: (text: string) => void;
}

const COMPONENT_MAP: Record<EmbeddedComponentType, React.FC<any>> = {
  stats_grid: StatsGrid,
  model_cards: ModelCards,
  trading_form: TradingForm,
  analysis_card: AnalysisCard,
  create_model_form: CreateModelForm,
  edit_model_form: EditModelForm,
};

const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-1">
    <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce1"></div>
    <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce2"></div>
    <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce3"></div>
  </div>
);

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSuggestedAction }) => {
  if (message.type === 'user') {
    return (
      <div className="flex justify-end animate-message-in">
        <div className="max-w-[90%]">
          <div className="bg-info text-white rounded-lg rounded-br-none py-2 px-4">
            <p className="text-sm leading-relaxed">{message.text}</p>
          </div>
          <p className="text-right text-xs text-text-tertiary mt-1">{message.timestamp}</p>
        </div>
      </div>
    );
  }

  const EmbeddedComponent = message.component ? COMPONENT_MAP[message.component.type] : null;

  // AI Message
  return (
    <div className="flex items-start gap-3 animate-message-in">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-info flex items-center justify-center">
        <BotIcon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 max-w-[90%]">
        <div className="bg-surface-elevated border border-border rounded-lg rounded-bl-none p-4 space-y-4">
          {message.isTyping ? <TypingIndicator /> : (
            <>
              {message.text && <p className="text-sm text-text-primary leading-relaxed">{message.text}</p>}
              {EmbeddedComponent && <EmbeddedComponent {...message.component.props} />}
              {message.suggestedActions && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {message.suggestedActions.map((action, i) => (
                    <button 
                      key={i} 
                      onClick={() => onSuggestedAction?.(action)}
                      className="px-3 py-1 text-sm bg-surface text-text-secondary border border-border rounded-full hover:bg-border hover:text-text-primary transition-colors">
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        {!message.isTyping && <p className="text-xs text-text-tertiary mt-1">{message.timestamp}</p>}
      </div>
    </div>
  );
};

export default ChatMessage;