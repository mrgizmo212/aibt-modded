/**
 * API Client for AI-Trader Backend
 * 
 * All API calls to the FastAPI backend
 * Handles authentication, models, trading, and admin operations
 */

import type { 
  Model, 
  Position, 
  LatestPosition, 
  TradingStatus,
  AdminStats 
} from '@/types/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

/**
 * Create headers with auth token
 */
function getHeaders(): HeadersInit {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  }
}

/**
 * Handle API errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      message: 'An error occurred' 
    }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }
  return response.json()
}

// ============================================================================
// AUTH API
// ============================================================================

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return handleResponse<{ access_token: string; user: any }>(response)
}

export async function signup(email: string, password: string, name: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })
  return handleResponse<{ access_token: string; user: any }>(response)
}

export async function getCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: getHeaders(),
  })
  return handleResponse<any>(response)
}

export async function logout() {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: getHeaders(),
  })
  return handleResponse<{ message: string }>(response)
}

// ============================================================================
// MODELS API
// ============================================================================

export async function fetchMyModels() {
  const response = await fetch(`${API_BASE_URL}/api/models`, {
    headers: getHeaders(),
  })
  return handleResponse<{ models: Model[] }>(response)
}

export async function createModel(data: {
  name: string
  description?: string
  initial_cash: number
  allowed_tickers?: string[]
  default_ai_model?: string
  model_parameters?: Record<string, any>
  custom_rules?: string
  custom_instructions?: string
}) {
  const response = await fetch(`${API_BASE_URL}/api/models`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<Model>(response)
}

export async function updateModel(modelId: number, data: {
  name?: string
  description?: string
  allowed_tickers?: string[]
  default_ai_model?: string
  model_parameters?: Record<string, any>
  custom_rules?: string
  custom_instructions?: string
}) {
  const response = await fetch(`${API_BASE_URL}/api/models/${modelId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<Model>(response)
}

export async function getModelConfig(modelId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/model-config?model_id=${encodeURIComponent(modelId)}`)
    return handleResponse<{
      model_id: string
      model_type: string
      default_parameters: Record<string, any>
      template: any
      supports_temperature: boolean
      supports_verbosity: boolean
      supports_reasoning_effort: boolean
    }>(response)
  } catch (error) {
    // Return fallback config if endpoint fails
    console.warn('Model config endpoint not available, using fallback')
    return {
      model_id: modelId,
      model_type: 'standard',
      default_parameters: {
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.9
      },
      template: {
        name: 'Standard Model',
        supports_temperature: true,
        supports_verbosity: false,
        supports_reasoning_effort: false,
        recommended: {
          temperature: 0.7,
          max_tokens: 4000,
          top_p: 0.9
        }
      },
      supports_temperature: true,
      supports_verbosity: false,
      supports_reasoning_effort: false
    }
  }
}

export async function deleteModel(modelId: number) {
  const response = await fetch(`${API_BASE_URL}/api/models/${modelId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  return handleResponse<{ message: string }>(response)
}

// ============================================================================
// POSITIONS API
// ============================================================================

export async function fetchModelPositions(modelId: number) {
  const response = await fetch(`${API_BASE_URL}/api/models/${modelId}/positions`, {
    headers: getHeaders(),
  })
  return handleResponse<{ 
    model_id: number
    model_name: string
    positions: Position[]
    total_records: number
  }>(response)
}

export async function fetchModelLatestPosition(modelId: number) {
  const response = await fetch(`${API_BASE_URL}/api/models/${modelId}/positions/latest`, {
    headers: getHeaders(),
  })
  return handleResponse<{
    model_id: number
    model_name: string
    date: string
    positions: Record<string, number>
    cash: number
    total_value: number
  }>(response)
}

export async function fetchModelLogs(modelId: number, date?: string) {
  const url = date 
    ? `${API_BASE_URL}/api/models/${modelId}/logs?date=${date}`
    : `${API_BASE_URL}/api/models/${modelId}/logs`
  
  const response = await fetch(url, {
    headers: getHeaders(),
  })
  return handleResponse<{
    model_id: number
    model_name: string
    date: string
    logs: any[]
    total_entries: number
  }>(response)
}

export async function fetchModelPerformance(modelId: number) {
  const response = await fetch(`${API_BASE_URL}/api/models/${modelId}/performance`, {
    headers: getHeaders(),
  })
  return handleResponse<{
    model_id: number
    model_name: string
    start_date: string
    end_date: string
    metrics: {
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
    portfolio_values: Record<string, number>
  }>(response)
}

// ============================================================================
// TRADING API
// ============================================================================

export async function fetchTradingStatus(modelId: number) {
  const response = await fetch(`${API_BASE_URL}/api/trading/status/${modelId}`, {
    headers: getHeaders(),
  })
  return handleResponse<TradingStatus>(response)
}

export async function fetchAllTradingStatus() {
  const response = await fetch(`${API_BASE_URL}/api/trading/status`, {
    headers: getHeaders(),
  })
  return handleResponse<{ statuses: TradingStatus[] }>(response)
}

export async function startTrading(
  modelId: number,
  baseModel: string,
  startDate: string,
  endDate: string
) {
  const response = await fetch(`${API_BASE_URL}/api/trading/start/${modelId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      base_model: baseModel,
      start_date: startDate,
      end_date: endDate,
    }),
  })
  return handleResponse<{ message: string; status: string }>(response)
}

export async function stopTrading(modelId: number) {
  const response = await fetch(`${API_BASE_URL}/api/trading/stop/${modelId}`, {
    method: 'POST',
    headers: getHeaders(),
  })
  return handleResponse<{ message: string; status: string }>(response)
}

export async function startIntradayTrading(
  modelId: number,
  symbol: string,
  date: string,
  session: 'pre' | 'regular' | 'after',
  baseModel: string
) {
  const response = await fetch(`${API_BASE_URL}/api/trading/start-intraday/${modelId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      symbol,
      date,
      session,
      base_model: baseModel,
    }),
  })
  return handleResponse<{
    status: string
    minutes_processed?: number
    trades_executed?: number
    final_position?: any
    error?: string
  }>(response)
}

// ============================================================================
// ADMIN API
// ============================================================================

export async function fetchAdminStats() {
  const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
    headers: getHeaders(),
  })
  return handleResponse<AdminStats>(response)
}

// Alias for compatibility
export const fetchSystemStats = fetchAdminStats

export async function fetchAllUsers() {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    headers: getHeaders(),
  })
  return handleResponse<{ users: any[] }>(response)
}

export async function fetchAllModels() {
  const response = await fetch(`${API_BASE_URL}/api/admin/models`, {
    headers: getHeaders(),
  })
  return handleResponse<{ models: Model[]; total_models: number }>(response)
}

export async function fetchLeaderboard() {
  const response = await fetch(`${API_BASE_URL}/api/admin/leaderboard`, {
    headers: getHeaders(),
  })
  return handleResponse<{
    leaderboard: Array<{
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
    }>
    total_models: number
  }>(response)
}

// Alias for compatibility
export const fetchAdminLeaderboard = fetchLeaderboard

// ============================================================================
// GLOBAL SETTINGS API (Admin Only)
// ============================================================================

export async function fetchGlobalSettings() {
  const response = await fetch(`${API_BASE_URL}/api/admin/global-settings`, {
    headers: getHeaders(),
  })
  return handleResponse<{
    settings: Record<string, any>
    total: number
  }>(response)
}

export async function fetchGlobalSetting(settingKey: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/global-settings/${settingKey}`, {
    headers: getHeaders(),
  })
  return handleResponse<{
    setting_key: string
    setting_value: any
  }>(response)
}

export async function updateGlobalSetting(settingKey: string, settingValue: any, description?: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/global-settings/${settingKey}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({
      setting_value: settingValue,
      description: description || ''
    }),
  })
  return handleResponse<{
    message: string
    setting_key: string
  }>(response)
}

// ============================================================================
// MCP SERVICES MANAGEMENT
// ============================================================================

// MCP Services Management (stubs - endpoints may not exist yet)
export async function fetchMCPStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/mcp/status`, {
      headers: getHeaders(),
    })
    return handleResponse<any>(response)
  } catch (error) {
    // Return empty status if endpoint doesn't exist
    return { services: {}, status: 'unknown' }
  }
}

export async function startMCPServices() {
  const response = await fetch(`${API_BASE_URL}/api/admin/mcp/start`, {
    method: 'POST',
    headers: getHeaders(),
  })
  return handleResponse<{ message: string }>(response)
}

export async function stopMCPServices() {
  const response = await fetch(`${API_BASE_URL}/api/admin/mcp/stop`, {
    method: 'POST',
    headers: getHeaders(),
  })
  return handleResponse<{ message: string }>(response)
}

export async function updateUserRole(userId: string, role: 'admin' | 'user') {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ role }),
  })
  return handleResponse<{ message: string; user: any }>(response)
}

// ============================================================================
// STOCK PRICES
// ============================================================================

export async function fetchStockPrices(symbols?: string[]) {
  const params = symbols ? `?symbols=${symbols.join(',')}` : ''
  const response = await fetch(`${API_BASE_URL}/api/stock-prices${params}`, {
    headers: getHeaders(),
  })
  return handleResponse<{
    prices: Array<{
      id: number
      symbol: string
      date: string
      open: number
      high: number
      low: number
      close: number
      volume: number
      created_at: string
    }>
    total_records: number
  }>(response)
}

// ============================================================================
// AVAILABLE AI MODELS
// ============================================================================

export async function fetchAvailableModels() {
  const response = await fetch(`${API_BASE_URL}/api/available-models`)
  return handleResponse<{
    models: Array<{
      id: string
      name: string
      provider: string
      context_length?: number
      pricing?: any
    }>
    total: number
    source: 'openrouter' | 'fallback'
    cached: boolean
  }>(response)
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function healthCheck() {
  const response = await fetch(`${API_BASE_URL}/api/health`)
  return handleResponse<{
    status: string
    database: string
    redis: string
    mcp_services: Record<string, string>
  }>(response)
}

// ============================================================================
// STREAMING API (Server-Sent Events)
// ============================================================================

export function subscribeTradingEvents(
  modelId: number,
  onEvent: (event: any) => void,
  onError?: (error: Error) => void
) {
  const token = getAuthToken()
  const url = `${API_BASE_URL}/api/trading/stream/${modelId}?token=${token}`
  
  const eventSource = new EventSource(url)
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onEvent(data)
    } catch (error) {
      console.error('Error parsing SSE event:', error)
    }
  }
  
  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error)
    if (onError) {
      onError(new Error('Connection lost'))
    }
    eventSource.close()
  }
  
  // Return cleanup function
  return () => {
    eventSource.close()
  }
}

// ============================================================================
// RUN MANAGEMENT API (NEW - Blueprint Implementation)
// ============================================================================

export async function fetchModelRuns(modelId: number) {
  const response = await fetch(`${API_BASE_URL}/api/models/${modelId}/runs`, {
    headers: getHeaders(),
  })
  return handleResponse<{
    runs: Array<{
      id: number
      model_id: number
      run_number: number
      started_at: string
      ended_at?: string
      status: 'running' | 'completed' | 'stopped' | 'failed'
      trading_mode: 'daily' | 'intraday'
      strategy_snapshot: Record<string, any>
      total_trades: number
      final_return?: number
      final_portfolio_value?: number
      max_drawdown_during_run?: number
    }>
  }>(response)
}

export async function fetchRunDetails(modelId: number, runId: number) {
  const response = await fetch(`${API_BASE_URL}/api/models/${modelId}/runs/${runId}`, {
    headers: getHeaders(),
  })
  return handleResponse<{
    id: number
    model_id: number
    run_number: number
    started_at: string
    ended_at?: string
    status: string
    trading_mode: string
    strategy_snapshot: Record<string, any>
    total_trades: number
    final_return?: number
    final_portfolio_value?: number
    positions: Position[]
    reasoning: Array<{
      id: number
      reasoning_type: string
      content: string
      timestamp: string
      context_json?: Record<string, any>
    }>
  }>(response)
}

// ============================================================================
// CHAT API (System Agent - NEW)
// ============================================================================

export async function sendChatMessage(
  modelId: number,
  runId: number,
  message: string
) {
  const response = await fetch(`${API_BASE_URL}/api/models/${modelId}/runs/${runId}/chat`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message }),
  })
  return handleResponse<{
    response: string
    suggested_rules?: Array<Record<string, any>>
  }>(response)
}

export async function fetchChatHistory(modelId: number, runId: number) {
  const response = await fetch(`${API_BASE_URL}/api/models/${modelId}/runs/${runId}/chat-history`, {
    headers: getHeaders(),
  })
  return handleResponse<{
    messages: Array<{
      role: 'user' | 'assistant' | 'system'
      content: string
      timestamp: string
    }>
  }>(response)
}

