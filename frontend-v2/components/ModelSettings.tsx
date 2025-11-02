'use client'

import { useState, useEffect } from 'react'
import { getModelConfig } from '@/lib/api'

interface ModelConfig {
  template?: {
    name?: string
    uses_max_output_tokens?: boolean
    supports_top_k?: boolean
    supports_web_search?: boolean
  }
  default_parameters: ModelParams
  supports_temperature: boolean
  supports_verbosity: boolean
  supports_reasoning_effort: boolean
  model_type: string
}

interface ModelParams {
  max_prompt_tokens?: number
  max_tokens?: number // @deprecated - use max_completion_tokens instead (kept for backwards compatibility)
  max_completion_tokens?: number
  max_output_tokens?: number
  temperature?: number
  verbosity?: 'low' | 'medium' | 'high'
  reasoning_effort?: 'minimal' | 'low' | 'medium' | 'high'
  top_p?: number
  top_k?: number
  frequency_penalty?: number
  presence_penalty?: number
  web_search?: boolean
}

interface ModelSettingsProps {
  selectedAIModel: string
  currentParams?: ModelParams
  onParamsChange: (params: ModelParams) => void
}

// Helper: Clean up deprecated and incompatible parameters
function cleanupDeprecatedParams(params: ModelParams, isGPT5?: boolean): ModelParams {
  const cleaned = { ...params }
  
  // Remove deprecated max_tokens if max_completion_tokens is present
  if (cleaned.max_completion_tokens !== undefined && cleaned.max_tokens !== undefined) {
    delete cleaned.max_tokens
  }
  
  // Remove GPT-5 incompatible parameters
  if (isGPT5) {
    delete cleaned.temperature    // Not supported in GPT-5
    delete cleaned.top_p          // Not supported in GPT-5
    // logprobs not in our interface but would be removed here
  }
  
  return cleaned
}

export function ModelSettings({ selectedAIModel, currentParams, onParamsChange }: ModelSettingsProps) {
  const [config, setConfig] = useState<ModelConfig | null>(null)
  const [params, setParams] = useState<ModelParams>(currentParams ?? {})
  const [loading, setLoading] = useState(true)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [maxTokensInput, setMaxTokensInput] = useState('')

  // Helper to check if current model is GPT-5
  const isGPT5 = config?.model_type === 'gpt5-new' || config?.model_type === 'reasoning'

  // Load config when AI model changes
  useEffect(() => {
    async function loadConfig() {
      setLoading(true)
      setIsLoadingConfig(true)
      try {
        const data = await getModelConfig(selectedAIModel)
        setConfig(data)
        
        // Check if this is a GPT-5 or reasoning model
        const isGPT5Model = data.model_type === 'gpt5-new' || data.model_type === 'reasoning'
        
        // Only use defaults if no currentParams provided (new model setup)
        // Otherwise, merge currentParams with defaults to preserve user settings
        const hasCurrentParams = currentParams && Object.keys(currentParams).length > 0
        const mergedParams = hasCurrentParams 
          ? { ...data.default_parameters, ...currentParams } // Preserve user settings
          : data.default_parameters // Use defaults for new setup
        
        // Clean up deprecated and incompatible parameters before setting
        const cleanedParams = cleanupDeprecatedParams(mergedParams, isGPT5Model)
        
        setParams(cleanedParams)
        onParamsChange(cleanedParams)
      } catch (error) {
        console.error('Failed to load model config:', error)
      } finally {
        setLoading(false)
        setIsLoadingConfig(false)
      }
    }
    
    loadConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAIModel]) // ✅ Only read dependency, not callback (onParamsChange should be memoized by parent)

  // Sync with external param changes (but not during config load)
  useEffect(() => {
    if (currentParams && Object.keys(currentParams).length > 0 && !isLoadingConfig) {
      const cleanedParams = cleanupDeprecatedParams(currentParams, isGPT5)
      setParams(cleanedParams)
    }
  }, [currentParams, isLoadingConfig, isGPT5])

  // Sync maxTokensInput with params.max_completion_tokens (or fallback to deprecated max_tokens)
  useEffect(() => {
    setMaxTokensInput(String(params.max_completion_tokens ?? params.max_tokens ?? 4000))
  }, [params.max_completion_tokens, params.max_tokens])

  function updateParam(key: keyof ModelParams, value: string | number | boolean) {
    const newParams = { ...params, [key]: value }
    
    // Clean up deprecated and incompatible parameters
    const cleanedParams = cleanupDeprecatedParams(newParams, isGPT5)
    
    setParams(cleanedParams)
    onParamsChange(cleanedParams)
  }

  function resetToDefaults() {
    if (config?.default_parameters) {
      const cleanedParams = cleanupDeprecatedParams(config.default_parameters, isGPT5)
      setParams(cleanedParams)
      onParamsChange(cleanedParams)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-zinc-800 rounded"></div>
      </div>
    )
  }

  if (!config) return null

  const modelTypeLabel = config.template?.name || 'Standard Model'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-300">AI Model Configuration</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {modelTypeLabel} • Optimized parameters
          </p>
        </div>
        <button
          onClick={resetToDefaults}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Parameter Controls */}
      <div className="space-y-4">
        {/* Token Limits Section */}
        <div>
          <h4 className="text-xs font-semibold text-gray-300 mb-3">Token Limits</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="max-input-tokens" className="block text-xs text-gray-400 mb-1.5">
                Max Input Tokens
              </label>
              <input
                id="max-input-tokens"
                type="number"
                min="0"
                step="1000"
                value={params.max_prompt_tokens ?? 100000}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  updateParam('max_prompt_tokens', value)
                }}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="max-output-tokens" className="block text-xs text-gray-400 mb-1.5">
                Max Output Tokens
              </label>
              <input
                id="max-output-tokens"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={maxTokensInput}
                onChange={(e) => {
                  const input = e.target.value
                  // Allow empty or valid numbers in the UI
                  if (input === '' || /^\d+$/.test(input)) {
                    setMaxTokensInput(input)
                    // Only update params when there's a valid number (no cap - model decides)
                    if (input !== '') {
                      const numValue = parseInt(input, 10)
                      // Use max_completion_tokens (new standard) instead of deprecated max_tokens
                      updateParam('max_completion_tokens', numValue)
                      if (config.template?.uses_max_output_tokens) {
                        updateParam('max_output_tokens', numValue)
                      }
                    }
                  }
                }}
                onBlur={() => {
                  // On blur, if empty, restore the default
                  if (maxTokensInput === '') {
                    const defaultValue = params.max_completion_tokens ?? params.max_tokens ?? 4000
                    setMaxTokensInput(String(defaultValue))
                    updateParam('max_completion_tokens', defaultValue)
                    if (config.template?.uses_max_output_tokens) {
                      updateParam('max_output_tokens', defaultValue)
                    }
                  }
                }}
                placeholder="4000"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Model-Specific Parameters */}
        <div>
          <h4 className="text-xs font-semibold text-gray-300 mb-3">Model Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Temperature (if supported) */}
            {config.supports_temperature && (
              <div>
                <label htmlFor="temperature" className="block text-xs text-gray-400 mb-1.5">
                  Temperature: {params.temperature !== undefined ? params.temperature.toFixed(1) : '0.7'}
                </label>
                <input
                  id="temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={params.temperature ?? 0.7}
                  onChange={(e) => updateParam('temperature', parseFloat(e.target.value))}
                  className="w-full"
                  aria-label="Temperature"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>0.0</span>
                  <span>1.0</span>
                  <span>2.0</span>
                </div>
              </div>
            )}

            {/* Verbosity (GPT-5) */}
            {config.supports_verbosity && (
              <div>
                <label htmlFor="verbosity" className="block text-xs text-gray-400 mb-1.5">Verbosity</label>
                <select
                  id="verbosity"
                  value={params.verbosity ?? 'high'}
                  onChange={(e) => updateParam('verbosity', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label="Verbosity"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            )}

            {/* Reasoning Effort */}
            {config.supports_reasoning_effort && (
              <div>
                <label htmlFor="reasoning-effort" className="block text-xs text-gray-400 mb-1.5">Reasoning Effort</label>
                <select
                  id="reasoning-effort"
                  value={params.reasoning_effort ?? 'high'}
                  onChange={(e) => updateParam('reasoning_effort', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label="Reasoning Effort"
                >
                  <option value="minimal">Minimal</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            )}

            {/* Top-p */}
            {config.supports_temperature && (
              <div>
                <label htmlFor="top-p" className="block text-xs text-gray-400 mb-1.5">
                  Top-p: {params.top_p !== undefined ? params.top_p.toFixed(2) : '0.90'}
                </label>
                <input
                  id="top-p"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={params.top_p ?? 0.9}
                  onChange={(e) => updateParam('top_p', parseFloat(e.target.value))}
                  className="w-full"
                  aria-label="Top-p"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>0.0</span>
                  <span>0.5</span>
                  <span>1.0</span>
                </div>
              </div>
            )}

            {/* Top-k (Claude/Gemini) */}
            {config.template?.supports_top_k && (
              <div>
                <label htmlFor="top-k" className="block text-xs text-gray-400 mb-1.5">
                  Top-k: {params.top_k !== undefined ? params.top_k : '250'}
                </label>
                <input
                  id="top-k"
                  type="number"
                  min="0"
                  max="500"
                  step="10"
                  value={params.top_k ?? 250}
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    updateParam('top_k', value)
                  }}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}

            {/* Frequency Penalty */}
            {config.supports_temperature && (
              <div>
                <label htmlFor="frequency-penalty" className="block text-xs text-gray-400 mb-1.5">
                  Frequency Penalty: {params.frequency_penalty !== undefined ? params.frequency_penalty.toFixed(1) : '0.0'}
                </label>
                <input
                  id="frequency-penalty"
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={params.frequency_penalty ?? 0.0}
                  onChange={(e) => updateParam('frequency_penalty', parseFloat(e.target.value))}
                  className="w-full"
                  aria-label="Frequency Penalty"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>-2.0</span>
                  <span>0.0</span>
                  <span>2.0</span>
                </div>
              </div>
            )}

            {/* Presence Penalty */}
            {config.supports_temperature && (
              <div>
                <label htmlFor="presence-penalty" className="block text-xs text-gray-400 mb-1.5">
                  Presence Penalty: {params.presence_penalty !== undefined ? params.presence_penalty.toFixed(1) : '0.0'}
                </label>
                <input
                  id="presence-penalty"
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={params.presence_penalty ?? 0.0}
                  onChange={(e) => updateParam('presence_penalty', parseFloat(e.target.value))}
                  className="w-full"
                  aria-label="Presence Penalty"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>-2.0</span>
                  <span>0.0</span>
                  <span>2.0</span>
                </div>
              </div>
            )}

            {/* Web Search (Grok) */}
            {config.template?.supports_web_search && (
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.web_search ?? false}
                    onChange={(e) => updateParam('web_search', e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-gray-300">Enable Real-time Web Search</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500 rounded-md p-3">
        <p className="text-xs text-blue-400">
          {config.model_type === 'gpt5-new' && '⚡ GPT-5 does NOT use temperature - uses verbosity + reasoning_effort instead'}
          {config.model_type === 'reasoning' && '🧠 Reasoning model (o3/o3-mini): NO temperature, uses reasoning_effort only'}
          {config.model_type === 'claude' && '🔒 Claude: Supports temperature, top_k, and all standard parameters'}
          {config.model_type === 'gemini' && '🌐 Gemini: Uses max_output_tokens, optimized for long context (1M+ tokens)'}
          {config.model_type === 'grok' && '🔍 Grok: Real-time web search capability for current market data'}
          {config.model_type === 'standard' && '⚙️ Standard: Temperature, max_tokens, top_p, penalties'}
        </p>
      </div>
    </div>
  )
}

