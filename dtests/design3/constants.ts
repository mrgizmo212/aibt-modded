import React from 'react';
import { User, Model, Position, Message } from './types';

export const MOCK_USER: User = {
  name: 'Adam',
  email: 'adam@truetradinggroup.com',
  role: 'admin',
  avatar: 'https://ui-avatars.com/api/?name=Adam&background=3b82f6&color=fff&size=40'
};

export const MOCK_MODELS: Model[] = [
  // Running models first for better initial display
  { id: 1, name: "GPT-5 Momentum", status: "running", portfolio: 10234, return: 2.3, run: 5, strategy: "Momentum", sparklineData: [10000,10050,10100,10080,10150,10200,10234] },
  { id: 3, name: "Gemini Long Term", status: "running", portfolio: 11500, return: 15.0, run: 8, strategy: "Long Term", sparklineData: [10000,10200,10500,10800,11000,11300,11500] },
  { id: 5, name: "GPT-4o Conservative", status: "running", portfolio: 10120, return: 1.2, run: 2, strategy: "Conservative", sparklineData: [10000,10020,10050,10030,10080,10100,10120] },
  // Stopped models
  { id: 2, name: "Claude Day Trader", status: "stopped", portfolio: 9876, return: -1.2, run: 12, strategy: "Day Trading", sparklineData: [10000,9950,9900,9850,9900,9880,9876] },
  { id: 4, name: "DeepSeek Scalper", status: "stopped", portfolio: 9950, return: -0.5, run: 3, strategy: "Scalping", sparklineData: [10000,9980,9960,9920,9950,9940,9950] },
  { id: 6, name: "Qwen Swing", status: "stopped", portfolio: 10300, return: 3.0, run: 7, strategy: "Swing Trading", sparklineData: [10000,10050,10150,10200,10250,10220,10300] },
  { id: 7, name: "Mixtral Options", status: "stopped", portfolio: 9700, return: -3.0, run: 4, strategy: "Options", sparklineData: [10000,9900,9850,9800,9750,9720,9700] },
];

export const MOCK_POSITIONS_BY_MODEL: { [key: number]: { positions: Position[], cash: number } } = {
  1: {
    positions: [
        { symbol: "AAPL", shares: 10, value: 1852, pnl: 47.00 },
        { symbol: "MSFT", shares: 5, value: 1742.5, pnl: -7.50 },
        { symbol: "NVDA", shares: 8, value: 3720, pnl: 118.00 },
    ],
    cash: 3245.50
  },
  3: {
    positions: [
        { symbol: "GOOG", shares: 15, value: 2250, pnl: 150.00 },
        { symbol: "AMZN", shares: 10, value: 1300, pnl: 50.00 },
    ],
    cash: 7950
  },
  5: {
    positions: [
      { symbol: "META", shares: 20, value: 3000, pnl: -100.00 },
    ],
    cash: 7120
  }
};


const getTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

export const INITIAL_MESSAGES: Message[] = [
    {
        id: '1',
        type: 'ai',
        timestamp: getTimestamp(),
        text: "Good morning! You have 3 models currently running. Here's a quick overview:",
        component: { type: 'model_cards', props: { modelCount: 3 } },
        suggestedActions: ["Show my models", "Create new model", "Analyze performance"]
    },
];

export const AI_RESPONSES: { [key: string]: Omit<Message, 'id' | 'timestamp'> } = {
    'show my models': {
        type: 'ai',
        text: 'Here is a leaderboard of your 7 trading models:',
        component: { type: 'model_cards', props: { modelCount: 7 } },
    },
    'analyze performance': {
        type: 'ai',
        text: "Here is your overall portfolio performance summary:",
        component: { type: 'stats_grid', props: {} }
    },
    'start trading on claude': {
        type: 'ai',
        text: 'Ready to start trading on Claude Day Trader! Please configure:',
        component: { type: 'trading_form', props: {} },
    },
    'why did run #12 lose money?': {
        type: 'ai',
        text: 'I found 3 main issues with Run #12:',
        component: { type: 'analysis_card', props: {} },
    },
    'create new model': {
        type: 'ai',
        text: "Let's create a new trading model. Please provide the details below:",
        component: { type: 'create_model_form', props: {} },
    },
    'default': {
        type: 'ai',
        text: "Sorry, I didn't understand that. You can try asking me to 'show my models' or 'analyze performance'."
    }
}