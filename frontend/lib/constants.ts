/**
 * Constants used across the application
 */

// Available AI models for trading (October 2025 - Curated List)
export const AVAILABLE_MODELS = [
  // Anthropic
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'Anthropic' },
  
  // Google
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
  
  // xAI
  { id: 'x-ai/grok-4-fast', name: 'Grok 4 Fast', provider: 'xAI' },
  
  // DeepSeek
  { id: 'deepseek/deepseek-chat-v3.1', name: 'DeepSeek Chat V3.1', provider: 'DeepSeek' },
  
  // OpenAI - Main Models
  { id: 'openai/gpt-5', name: 'GPT-5', provider: 'OpenAI' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI' },
  { id: 'openai/gpt-5-codex', name: 'GPT-5 Codex', provider: 'OpenAI' },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI' },
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'OpenAI' },
  
  // OpenAI - Reasoning Models
  { id: 'openai/o3', name: 'o3 (Reasoning)', provider: 'OpenAI' },
  { id: 'openai/o3-mini', name: 'o3-mini (Reasoning)', provider: 'OpenAI' },
  
  // OpenAI - Open Source Models
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'OpenAI' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', provider: 'OpenAI' },
  
  // Minimax
  { id: 'minimax/minimax-m2', name: 'MiniMax M2', provider: 'MiniMax' },
  
  // Zhipu AI
  { id: 'z-ai/glm-4.6', name: 'GLM-4.6', provider: 'Zhipu AI' },
  
  // Qwen
  { id: 'qwen/qwen3-max', name: 'Qwen 3 Max', provider: 'Qwen' },
] as const

// Trading sessions for intraday trading
export const TRADING_SESSIONS = [
  { id: 'pre', name: 'Pre-Market (4:00-9:30 AM)', minutes: 329 },
  { id: 'regular', name: 'Regular Hours (9:30 AM-4:00 PM)', minutes: 390 },
  { id: 'after', name: 'After-Hours (4:00-8:00 PM)', minutes: 239 },
] as const

// Default initial cash amounts
export const DEFAULT_CASH_OPTIONS = [
  1000,
  5000,
  10000,
  25000,
  50000,
  75000,
  100000,
  250000,
  500000,
  1000000,
] as const

// Trading status colors
export const STATUS_COLORS = {
  idle: 'gray',
  running: 'blue',
  completed: 'green',
  error: 'red',
  paused: 'yellow',
} as const

// Event types for trading feed
export const EVENT_TYPES = {
  session_start: 'Session Started',
  thinking: 'AI Analyzing',
  tool_use: 'Using Tools',
  ai_response: 'AI Decision',
  trade: 'Trade Executed',
  session_complete: 'Session Complete',
  error: 'Error',
} as const

// Date format for display
export const DATE_FORMAT = 'yyyy-MM-dd'
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss'

// API retry configuration
export const API_RETRY_ATTEMPTS = 3
export const API_RETRY_DELAY = 1000 // milliseconds

// Trading configuration limits
export const MIN_INITIAL_CASH = 1000
export const MAX_INITIAL_CASH = 10000000
export const DEFAULT_INITIAL_CASH = 10000

// Pagination
export const POSITIONS_PER_PAGE = 50
export const MODELS_PER_PAGE = 20

// WebSocket reconnect settings
export const WS_RECONNECT_DELAY = 3000
export const WS_MAX_RECONNECT_ATTEMPTS = 5

