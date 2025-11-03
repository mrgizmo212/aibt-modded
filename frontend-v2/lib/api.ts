/**
 * API Client for AI Trading Platform
 * This replaces mock-functions.ts with real backend API calls
 */

import { getAuthHeaders } from './auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

/**
 * Generic API fetch wrapper with authentication
 */
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`
  console.log('[API] Fetching:', url, 'method:', options.method || 'GET')
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
    })
    
    console.log('[API] Response received:', response.status, response.statusText)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      console.error('[API] Error response:', error)
      throw new Error(error.message || `API Error: ${response.status}`)
    }

    const data = await response.json()
    console.log('[API] Response data:', data)
    return data
  } catch (error) {
    console.error('[API] Fetch failed:', error)
    throw error
  }
}

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

export async function getCurrentUser() {
  return apiFetch('/api/auth/me')
}

export async function login(email: string, password: string) {
  console.log('[API] login() called - sending request to backend')
  const result = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  console.log('[API] login() response:', result)
  return result
}

export async function signup(email: string, password: string) {
  return apiFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function logout() {
  return apiFetch('/api/auth/logout', {
    method: 'POST',
  })
}

// ============================================================================
// MODEL MANAGEMENT
// ============================================================================

export async function getModels() {
  const response = await apiFetch('/api/models')
  // Backend returns { models: [...], total_models: N }
  return response.models || response
}

export async function getModelById(id: number) {
  // Backend doesn't have GET /api/models/:id endpoint
  // Get all models and filter by ID
  const response = await apiFetch('/api/models')
  const models = response.models || response
  const model = models.find((m: any) => m.id === id)
  
  if (!model) {
    throw new Error(`Model ${id} not found`)
  }
  
  return model
}

export async function createModel(data: {
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
}) {
  return apiFetch('/api/models', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateModel(id: number, data: Partial<{
  name: string
  default_ai_model: string
  system_prompt: string
  temperature: number
  max_tokens: number
  trading_mode: 'paper' | 'live'
  starting_capital: number
  max_position_size: number
  max_daily_loss: number
  allowed_symbols: string[]
}>) {
  return apiFetch(`/api/models/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteModel(id: number) {
  return apiFetch(`/api/models/${id}`, {
    method: 'DELETE',
  })
}

export async function getModelConfig(modelId: string) {
  try {
    const response = await fetch(`${API_BASE}/api/model-config?model_id=${encodeURIComponent(modelId)}`)
    if (!response.ok) {
      throw new Error('Failed to fetch model config')
    }
    return response.json()
  } catch (error) {
    console.warn('Model config endpoint not available, using fallback')
    // Return fallback config if endpoint fails
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

// ============================================================================
// TRADING OPERATIONS
// ============================================================================

// Paper Trading: Explicit parameters like original frontend
export async function startTrading(
  modelId: number,
  baseModel: string,
  startDate: string,
  endDate: string
) {
  return apiFetch(`/api/trading/start/${modelId}`, {
    method: 'POST',
    body: JSON.stringify({
      base_model: baseModel,
      start_date: startDate,
      end_date: endDate
    }),
  })
}

// Intraday Trading: Explicit parameters like original frontend  
export async function startIntradayTrading(
  modelId: number,
  symbol: string,
  date: string,
  session: 'pre' | 'regular' | 'after',
  baseModel: string
) {
  return apiFetch(`/api/trading/start-intraday/${modelId}`, {
    method: 'POST',
    body: JSON.stringify({
      symbol,
      date,
      session,
      base_model: baseModel
    }),
  })
}

export async function stopTrading(modelId: number) {
  return apiFetch(`/api/trading/stop/${modelId}`, {
    method: 'POST',
  })
}

export async function getTaskStatus(taskId: string) {
  return apiFetch(`/api/trading/task-status/${taskId}`)
}

export async function getTradingStatus(modelId?: number) {
  const endpoint = modelId 
    ? `/api/trading/status/${modelId}`
    : '/api/trading/status'
  
  const response = await apiFetch(endpoint)
  
  // Handle single model status
  if (modelId) {
    return response
  }
  
  // Handle all models status - backend returns { running_agents: {...}, total_running: N }
  if (response.running_agents) {
    // Convert object to array
    return Object.entries(response.running_agents).map(([id, info]: [string, any]) => ({
      model_id: parseInt(id),
      is_running: true,
      ...info
    }))
  }
  
  // Fallback for unexpected format
  return Array.isArray(response) ? response : []
}

export async function getActiveRuns() {
  return apiFetch('/api/trading/status')
}

// ============================================================================
// RUNS & ANALYSIS
// ============================================================================

export async function getRuns(modelId: number) {
  const response = await apiFetch(`/api/models/${modelId}/runs`)
  console.log('[API] getRuns response:', response)
  // Backend returns { runs: [...], total: N }
  return response.runs || response
}

export async function getRunDetails(modelId: number, runId: number) {
  return apiFetch(`/api/models/${modelId}/runs/${runId}`)
}

export async function deleteRun(modelId: number, runId: number) {
  return apiFetch(`/api/models/${modelId}/runs/${runId}`, {
    method: 'DELETE',
  })
}

export async function stopSpecificRun(modelId: number, runId: number) {
  return apiFetch(`/api/models/${modelId}/runs/${runId}/stop`, {
    method: 'POST',
  })
}

// ============================================================================
// PORTFOLIO & POSITIONS
// ============================================================================

export async function getPositions(modelId: number) {
  return apiFetch(`/api/models/${modelId}/positions`)
}

// Alias for compatibility with original frontend
export const fetchModelPositions = getPositions

export async function getPerformance(modelId: number) {
  return apiFetch(`/api/models/${modelId}/performance`)
}

export async function fetchModelLogs(modelId: number, date?: string) {
  const url = date 
    ? `/api/models/${modelId}/logs?date=${date}`
    : `/api/models/${modelId}/logs`
  
  return apiFetch(url)
}

// Alias for compatibility with original frontend
export const fetchModelPerformance = getPerformance

export async function getPortfolioStats() {
  // Aggregate stats across all models
  const models = await getModels()
  
  // Ensure models is an array
  const modelArray = Array.isArray(models) ? models : []
  
  let totalValue = 0
  let totalPL = 0
  let totalRuns = 0
  let totalInitialValue = 0
  
  for (const model of modelArray) {
    try {
      const performance = await getPerformance(model.id)
      const finalValue = performance?.metrics?.final_value || 0
      const initialValue = performance?.metrics?.initial_value || model.initial_cash || 0
      
      totalValue += finalValue
      totalInitialValue += initialValue
      // Calculate P/L in dollars, not percentage
      totalPL += (finalValue - initialValue)
      totalRuns += 1 // Could fetch actual runs count
    } catch (e) {
      // Skip models without performance data
    }
  }
  
  return {
    totalValue,
    totalPL,
    totalRuns,
    totalModels: modelArray.length,
  }
}

// ============================================================================
// LOGS & REASONING
// ============================================================================

export async function getLogs(modelId: number, date?: string) {
  const params = date ? `?date=${date}` : ''
  return apiFetch(`/api/models/${modelId}/logs${params}`)
}

// ============================================================================
// CHAT & SYSTEM AGENT
// ============================================================================

export async function sendChatMessage(
  modelId: number,
  runId: number,
  message: string
) {
  return apiFetch(`/api/models/${modelId}/runs/${runId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

export async function getChatHistory(modelId: number, runId: number) {
  return apiFetch(`/api/models/${modelId}/runs/${runId}/chat-history`)
}

// ============================================================================
// ADMIN & SYSTEM
// ============================================================================

export async function getAdminStats() {
  return apiFetch('/api/admin/stats')
}

export async function getUsers() {
  return apiFetch('/api/admin/users')
}

export async function updateUserWhitelist(email: string, whitelisted: boolean) {
  return apiFetch('/api/admin/users/whitelist', {
    method: 'POST',
    body: JSON.stringify({ email, whitelisted }),
  })
}

export async function getLeaderboard() {
  return apiFetch('/api/leaderboard')
}

export async function getMCPStatus() {
  return apiFetch('/api/mcp/status')
}

export async function restartMCPService(serviceName: string) {
  return apiFetch('/api/mcp/restart', {
    method: 'POST',
    body: JSON.stringify({ service: serviceName }),
  })
}

export async function testMCPService(serviceName: string) {
  return apiFetch('/api/mcp/test', {
    method: 'POST',
    body: JSON.stringify({ service: serviceName }),
  })
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export async function getStockPrice(symbol: string) {
  return apiFetch(`/api/stock-prices?symbol=${symbol}`)
}

export async function getAvailableAIModels() {
  const response = await apiFetch('/api/available-models')
  // Backend may return array directly or nested
  return Array.isArray(response) ? response : (response.data || response.models || [])
}

export async function getSystemHealth() {
  return apiFetch('/api/health')
}

export async function getBackendVersion() {
  return apiFetch('/api/version')
}

// ============================================================================
// REAL-TIME UPDATES (SSE)
// ============================================================================

export function subscribeTradingStream(modelId: number, onMessage: (event: any) => void) {
  const eventSource = new EventSource(`${API_BASE}/api/trading/stream/${modelId}`)
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onMessage(data)
    } catch (e) {
      console.error('Error parsing SSE message:', e)
    }
  }
  
  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error)
    eventSource.close()
  }
  
  return () => eventSource.close()
}

