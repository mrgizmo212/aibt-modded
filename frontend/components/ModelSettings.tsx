'use client'

import { useState, useEffect } from 'react'
import { getModelConfig } from '@/lib/api'

interface ModelSettingsProps {
  selectedAIModel: string
  currentParams?: Record<string, any>
  onParamsChange: (params: Record<string, any>) => void
}

export function ModelSettings({ selectedAIModel, currentParams, onParamsChange }: ModelSettingsProps) {
  const [config, setConfig] = useState<any>(null)
  const [params, setParams] = useState<Record<string, any>>(currentParams || {})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfig()
  }, [selectedAIModel])

  useEffect(() => {
    if (currentParams) {
      setParams(currentParams)
    }
  }, [currentParams])

  async function loadConfig() {
    try {
      const data = await getModelConfig(selectedAIModel)
      setConfig(data)
      
      // Initialize with defaults if no current params
      if (!currentParams || Object.keys(currentParams).length === 0) {
        setParams(data.default_parameters)
        onParamsChange(data.default_parameters)
      }
    } catch (error) {
      console.error('Failed to load model config:', error)
    } finally {
      setLoading(false)
    }
  }

  function updateParam(key: string, value: any) {
    const newParams = { ...params, [key]: value }
    setParams(newParams)
    onParamsChange(newParams)
  }

  function resetToDefaults() {
    if (config?.default_parameters) {
      setParams(config.default_parameters)
      onParamsChange(config.default_parameters)
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
              <label className="block text-xs text-gray-400 mb-1.5">
                Max Input Tokens
              </label>
              <input
                type="number"
                min="100"
                max="128000"
                step="1000"
                value={params.max_prompt_tokens || 100000}
                onChange={(e) => updateParam('max_prompt_tokens', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Max Output Tokens
              </label>
              <input
                type="number"
                min="100"
                max="32000"
                step="100"
                value={params.max_completion_tokens || params.max_tokens || params.max_output_tokens || 4000}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  updateParam('max_completion_tokens', value)
                  updateParam('max_tokens', value)
                  if (config.template?.uses_max_output_tokens) {
                    updateParam('max_output_tokens', value)
                  }
                }}
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
                <label className="block text-xs text-gray-400 mb-1.5">
                  Temperature: {params.temperature !== undefined ? params.temperature.toFixed(1) : '0.7'}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={params.temperature || 0.7}
                  onChange={(e) => updateParam('temperature', parseFloat(e.target.value))}
                  className="w-full"
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
                <label className="block text-xs text-gray-400 mb-1.5">Verbosity</label>
                <select
                  value={params.verbosity || 'high'}
                  onChange={(e) => updateParam('verbosity', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                <label className="block text-xs text-gray-400 mb-1.5">Reasoning Effort</label>
                <select
                  value={params.reasoning_effort || 'high'}
                  onChange={(e) => updateParam('reasoning_effort', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                <label className="block text-xs text-gray-400 mb-1.5">
                  Top-p: {params.top_p !== undefined ? params.top_p.toFixed(2) : '0.90'}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={params.top_p || 0.9}
                  onChange={(e) => updateParam('top_p', parseFloat(e.target.value))}
                  className="w-full"
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
                <label className="block text-xs text-gray-400 mb-1.5">
                  Top-k: {params.top_k !== undefined ? params.top_k : '250'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  step="10"
                  value={params.top_k || 250}
                  onChange={(e) => updateParam('top_k', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}

            {/* Frequency Penalty */}
            {config.supports_temperature && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Frequency Penalty: {params.frequency_penalty !== undefined ? params.frequency_penalty.toFixed(1) : '0.0'}
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={params.frequency_penalty || 0.0}
                  onChange={(e) => updateParam('frequency_penalty', parseFloat(e.target.value))}
                  className="w-full"
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
                <label className="block text-xs text-gray-400 mb-1.5">
                  Presence Penalty: {params.presence_penalty !== undefined ? params.presence_penalty.toFixed(1) : '0.0'}
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={params.presence_penalty || 0.0}
                  onChange={(e) => updateParam('presence_penalty', parseFloat(e.target.value))}
                  className="w-full"
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
                    checked={params.web_search || false}
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

