/**
 * TypeScript Type Definitions
 * Matches backend API response structures
 */

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

export interface User {
  id: string
  email: string
  created_at: string
  whitelisted: boolean
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

// ============================================================================
// MODELS
// ============================================================================

export interface Model {
  id: number
  user_id: string
  name: string
  default_ai_model: string
  system_prompt?: string
  temperature: number
  max_tokens: number
  trading_mode: 'paper' | 'live'
  starting_capital: number
  max_position_size: number
  max_daily_loss: number
  allowed_symbols: string[]
  created_at: string
  updated_at: string
}

export interface CreateModelRequest {
  name: string
  default_ai_model: string
  system_prompt?: string
  temperature?: number
  max_tokens?: number
  trading_mode?: 'paper' | 'live'
  starting_capital?: number
  max_position_size?: number
  max_daily_loss?: number
  allowed_symbols?: string[]
}

export interface UpdateModelRequest extends Partial<CreateModelRequest> {}

// ============================================================================
// TRADING
// ============================================================================

export interface TradingStatus {
  model_id: number
  is_running: boolean
  current_run_id?: number
  started_at?: string
  mode?: 'paper' | 'intraday' | 'live'
}

export interface Position {
  symbol: string
  quantity: number
  avg_price: number
  current_price: number
  market_value: number
  unrealized_pl: number
  unrealized_pl_percent: number
  cost_basis: number
}

export interface Trade {
  id: string
  model_id: number
  run_id: number
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  timestamp: string
  status: 'pending' | 'filled' | 'rejected'
  reasoning?: string
}

// ============================================================================
// RUNS & PERFORMANCE
// ============================================================================

export interface Run {
  id: number
  model_id: number
  started_at: string
  ended_at?: string
  status: 'running' | 'stopped' | 'completed' | 'error'
  mode: 'paper' | 'intraday' | 'live'
  starting_capital: number
  ending_capital?: number
  total_trades: number
  winning_trades: number
  losing_trades: number
  total_return?: number
  total_return_percent?: number
  max_drawdown?: number
  sharpe_ratio?: number
  error_message?: string
}

export interface PerformanceMetrics {
  model_id: number
  portfolio_value: number
  cash_balance: number
  total_return: number
  total_return_percent: number
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  average_win: number
  average_loss: number
  profit_factor: number
  sharpe_ratio: number
  max_drawdown: number
  max_drawdown_percent: number
}

// ============================================================================
// LOGS & REASONING
// ============================================================================

export interface Log {
  id: string
  model_id: number
  run_id: number
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  reasoning?: string
  context?: Record<string, any>
}

// ============================================================================
// CHAT & SYSTEM AGENT
// ============================================================================

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  tool_calls?: any[]
  reasoning?: string
}

export interface ChatSession {
  model_id: number
  run_id: number
  messages: ChatMessage[]
}

export interface SendChatRequest {
  message: string
}

// ============================================================================
// ADMIN
// ============================================================================

export interface AdminStats {
  total_users: number
  total_models: number
  total_runs: number
  total_trades: number
  active_models: number
  system_health: 'healthy' | 'degraded' | 'down'
  mcp_services: MCPServiceStatus[]
}

export interface MCPServiceStatus {
  name: string
  status: 'connected' | 'disconnected' | 'error'
  last_ping?: string
  error_message?: string
}

export interface LeaderboardEntry {
  user_id: string
  email: string
  total_return: number
  total_return_percent: number
  sharpe_ratio: number
  total_trades: number
  win_rate: number
  rank: number
}

// ============================================================================
// SYSTEM
// ============================================================================

export interface StockPrice {
  symbol: string
  price: number
  change: number
  change_percent: number
  timestamp: string
}

export interface AIModel {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'xai'
  max_tokens: number
  supports_streaming: boolean
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  uptime: number
  version: string
  database: 'connected' | 'disconnected'
  mcp_services: number
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiError {
  message: string
  code?: string
  details?: any
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}

