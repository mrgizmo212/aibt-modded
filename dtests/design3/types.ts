import React from 'react';

export type ModelStatus = 'running' | 'stopped';
export type ContextType = 'dashboard' | 'model' | 'run' | 'model_live';

export interface User {
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar: string;
}

export interface Model {
  id: number;
  name: string;
  status: ModelStatus;
  portfolio: number;
  return: number;
  run: number;
  strategy: string;
  sparklineData: number[];
  instructions?: string;
}

export interface Position {
  symbol: string;
  shares?: number;
  avg_price?: number;
  current_price?: number;
  pnl?: number;
  pnl_pct?: number;
  value: number;
}

export type EmbeddedComponentType = 'stats_grid' | 'model_cards' | 'trading_form' | 'analysis_card' | 'create_model_form' | 'edit_model_form';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  timestamp: string;
  text?: string;
  isTyping?: boolean;
  component?: {
    type: EmbeddedComponentType;
    props: any;
  };
  suggestedActions?: string[];
}