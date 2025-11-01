import React, { useState, useRef, useEffect, useContext } from 'react';
import ChatMessage from './ChatMessage';
import { Trash2Icon, SendIcon } from './icons';
import { AppContext } from '../App';

const ChatInterface: React.FC = () => {
    const { messages, sendMessage, isAiTyping, clearChat } = useContext(AppContext);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, isAiTyping]);

    const handleSend = () => {
        if (input.trim() && !isAiTyping) {
            sendMessage(input.trim());
            setInput('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };
    
    const handleSuggestedAction = (text: string) => {
        sendMessage(text);
    };

    return (
        <div className="flex flex-col h-full bg-surface">
            <header className="hidden lg:flex items-center justify-between p-4 border-b border-border h-[60px] flex-shrink-0">
                <div>
                    <h2 className="text-lg font-semibold text-text-primary">AI Assistant</h2>
                    <p className="text-sm text-text-secondary">Ask me anything about your trading</p>
                </div>
                <button 
                    onClick={clearChat}
                    className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-md hover:bg-surface-elevated"
                    aria-label="Clear conversation"
                >
                    <Trash2Icon className="w-5 h-5" />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
                {messages.map((msg) => (
                    <ChatMessage 
                      key={msg.id} 
                      message={msg}
                      onSuggestedAction={handleSuggestedAction}
                    />
                ))}
                {isAiTyping && <ChatMessage key="typing" message={{ id: 'typing', type: 'ai', isTyping: true, timestamp: '' }} />}
                <div ref={messagesEndRef} />
            </div>

            <div className="sticky bottom-0 bg-background border-t border-border p-4 md:p-6">
                <div className="relative">
                    <input
                        id="chat-input"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything..."
                        disabled={isAiTyping}
                        className="w-full bg-surface-elevated border border-border rounded-md py-3 pl-4 pr-12 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-info focus:border-transparent transition-shadow"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isAiTyping}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md bg-info text-white hover:bg-blue-500 disabled:bg-surface-elevated disabled:text-text-disabled transition-colors"
                        aria-label="Send message"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;