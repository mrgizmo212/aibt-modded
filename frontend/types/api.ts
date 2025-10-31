// Complete TypeScript types matching backend API

// Auth Types
export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: {
    id: string
    email: string
    role: 'admin' | 'user'
  }
}

// User Types
export interface User {
  id: string
  email: string
  role: 'admin' | 'user'
  display_name?: string
  avatar_url?: string
  created_at: string
}

// Model Types
export interface Model {
  id: number
  user_id: string
  name: string
  signature: string
  description?: string
  is_active: boolean
  initial_cash?: number
  allowed_tickers?: string[]
  default_ai_model?: string
  model_parameters?: Record<string, unknown>
  custom_rules?: string
  custom_instructions?: string
  created_at: string
  updated_at?: string
}

export interface ModelCreateRequest {
  name: string
  description?: string
  initial_cash?: number
  allowed_tickers?: string[]
  default_ai_model?: string
  model_parameters?: Record<string, unknown>
  custom_rules?: string
  custom_instructions?: string
}

export interface IntradayTradingRequest {
  base_model: string
  symbol: string
  date: string
  session: 'pre' | 'regular' | 'after'
}

// Position Types
export interface Position {
  id: number
  model_id: number
  date: string
  action_id: number
  action_type?: 'buy' | 'sell' | 'no_trade'
  symbol?: string
  amount?: number
  positions: Record<string, number>
  cash: number
  created_at: string
}

export interface LatestPosition {
  model_id: number
  model_name: string
  date: string
  positions: Record<string, number>
  cash: number
  stocks_value: number
  total_value: number
}

// Log Types
export interface LogEntry {
  id: number
  model_id: number
  date: string
  timestamp: string
  signature: string
  messages: unknown
  created_at: string
}

// Performance Types
export interface PerformanceMetrics {
  sharpe_ratio: number
  max_drawdown: number
  max_drawdown_start?: string
  max_drawdown_end?: string
  cumulative_return: number
  annualized_return: number
  volatility: number
  win_rate: number
  profit_loss_ratio: number
  total_trading_days: number
  initial_value: number
  final_value: number
}

// Trading Status Types
export interface TradingStatus {
  model_id: number
  status: 'not_running' | 'initializing' | 'running' | 'completed' | 'stopped' | 'failed'
  started_at?: string
  stopped_at?: string
  error?: string
  user_id?: string
  signature?: string
  basemodel?: string
  start_date?: string
  end_date?: string
}

// Admin Types
export interface AdminStats {
  total_users: number
  total_models: number
  total_positions: number
  total_logs: number
  active_models: number
  admin_count: number
  user_count: number
}

// Alias for compatibility with backend naming
export type SystemStats = AdminStats

export interface LeaderboardEntry {
  rank: number
  model_id: number
  model_name: string
  user_id: string
  user_email: string
  cumulative_return: number
  sharpe_ratio: number
  max_drawdown: number
  final_value: number
  trading_days: number
}

// Model Configuration Types
export interface ModelConfig {
  model_id: string
  model_type: string
  default_parameters: Record<string, unknown>
  template: ModelTemplate
  supports_temperature: boolean
  supports_verbosity: boolean
  supports_reasoning_effort: boolean
}

export interface ModelTemplate {
  name: string
  supports_temperature: boolean
  supports_verbosity: boolean
  supports_reasoning_effort: boolean
  recommended: Record<string, unknown>
}

// Global Settings Types
export interface GlobalSetting {
  setting_key: string
  setting_value: unknown
  description?: string
}

// MCP Status Type
export interface MCPStatus {
  services: Record<string, string>
  status: string
}

// Intraday Trading Response
export interface IntradayTradingResponse {
  status: string
  minutes_processed?: number
  trades_executed?: number
  final_position?: Record<string, number>
  error?: string
}

// Trading Events (SSE)
export interface TradingEvent {
  type: string
  model_id: number
  timestamp: string
  data: unknown
}

// Model Pricing
export interface ModelPricing {
  prompt?: number
  completion?: number
  currency?: string
}

