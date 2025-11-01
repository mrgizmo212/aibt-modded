'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Bot } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from '@/components/ChatMessage';
import { mockModels } from '@/lib/mockData';

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

interface ChatInterfaceProps {
  selectedModelId: number | null;
  onContextChange: (context: 'dashboard' | 'model' | 'run' | 'admin') => void;
  onRunSelect: (runId: number | null) => void;
  onSelectModel?: (modelId: number) => void;
}

export default function ChatInterface({ selectedModelId, onContextChange, onRunSelect, onSelectModel }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      text: "Good morning! Here are your trading models:",
      timestamp: '09:30 AM',
      embeddedComponent: {
        type: 'model_cards',
        props: {}
      },
      suggestedActions: ['Create new model', 'Analyze performance', 'Show portfolio summary']
    },
    {
      id: '2',
      type: 'user',
      text: 'Show me my models',
      timestamp: '09:31 AM'
    },
    {
      id: '3',
      type: 'ai',
      text: 'Here are your 7 trading models:',
      timestamp: '09:31 AM',
      embeddedComponent: {
        type: 'model_cards',
        props: {}
      }
    },
    {
      id: '4',
      type: 'user',
      text: 'Start trading on Claude',
      timestamp: '09:32 AM'
    },
    {
      id: '5',
      type: 'ai',
      text: 'Ready to start trading on Claude Day Trader! Please configure:',
      timestamp: '09:32 AM',
      embeddedComponent: {
        type: 'form',
        props: {}
      }
    },
    {
      id: '6',
      type: 'user',
      text: 'Why did Run #12 lose money?',
      timestamp: '09:33 AM'
    },
    {
      id: '7',
      type: 'ai',
      text: 'Let me analyze Run #12 for you...',
      timestamp: '09:33 AM',
      embeddedComponent: {
        type: 'thinking',
        props: {}
      }
    },
    {
      id: '8',
      type: 'ai',
      text: 'I found 3 main issues with Run #12:',
      timestamp: '09:33 AM',
      embeddedComponent: {
        type: 'analysis',
        props: {}
      }
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsAiTyping(true);

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: 'I understand your request. Let me help you with that.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsAiTyping(false);
    }, 1000);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleSuggestedAction = (action: string) => {
    setInputValue(action);
    handleSend();
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#121212' }}>
      {/* Header */}
      <div className="p-6 border-b" style={{ borderColor: '#262626' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>AI Assistant</h2>
            <p className="text-xs mt-1" style={{ color: '#a3a3a3' }}>Ask me anything about your trading</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearChat}
            className="hover:bg-opacity-50"
            style={{ color: '#a3a3a3' }}
            aria-label="Clear chat"
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6"
        style={{ height: 'calc(100vh - 180px)' }}
      >
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message}
            onContextChange={onContextChange}
            onRunSelect={onRunSelect}
            onSuggestedAction={handleSuggestedAction}
            onSelectModel={onSelectModel}
          />
        ))}
        
        {isAiTyping && (
          <div className="flex items-start gap-3 mb-6">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#3b82f6' }}
            >
              <Bot size={18} style={{ color: '#ffffff' }} />
            </div>
            <div 
              className="px-4 py-3 rounded-xl"
              style={{ background: '#1a1a1a', border: '1px solid #262626' }}
            >
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#a3a3a3', animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#a3a3a3', animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#a3a3a3', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div 
        className="p-4 border-t"
        style={{ background: '#0a0a0a', borderColor: '#262626' }}
      >
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1"
            style={{
              background: '#1a1a1a',
              border: '1px solid #262626',
              color: '#ffffff'
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isAiTyping}
            style={{
              background: inputValue.trim() && !isAiTyping ? '#3b82f6' : '#262626',
              color: '#ffffff'
            }}
            aria-label="Send message"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
