'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  fetchModelPositions,
  fetchModelLatestPosition,
  fetchTradingStatus,
  startTrading,
  stopTrading,
  updateModel,
  deleteModel,
  fetchModelRuns
} from '@/lib/api'
import type { Model, Position, LatestPosition, TradingStatus } from '@/types/api'
import { AVAILABLE_MODELS } from '@/lib/constants'
import { TradingFeed } from '@/components/TradingFeed'
import { PerformanceMetrics } from '@/components/PerformanceMetrics'
import { PortfolioChart } from '@/components/PortfolioChart'
import { LogsViewer } from '@/components/LogsViewer'
import { ModelSettings } from '@/components/ModelSettings'
import { fetchMyModels } from '@/lib/api'

type TabType = 'performance' | 'chart' | 'logs' | 'history'

interface ModelUpdateData {
  name: string
  description?: string
  default_ai_model: string
  model_parameters: Record<string, unknown>
  custom_rules?: string
  custom_instructions?: string
}

interface RunSummary {
  id: number
  run_number: number
  trading_mode: string
  final_return?: number
  total_trades?: number
  intraday_symbol?: string
  intraday_date?: string
}

export default function ModelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const modelId = parseInt(params.id as string)
  
  const [positions, setPositions] = useState<Position[]>([])
  const [latestPosition, setLatestPosition] = useState<LatestPosition | null>(null)
  const [status, setStatus] = useState<TradingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [originalAI, setOriginalAI] = useState('openai/gpt-4o')
  const [activeTab, setActiveTab] = useState<TabType>('performance')
  const [currentModel, setCurrentModel] = useState<Model | null>(null)
  const [runs, setRuns] = useState<RunSummary[]>([])
  
  // Calculate default trading dates (skip weekends)
  const getRecentTradingDate = (daysBack: number): string => {
    const date = new Date()
    let tradingDaysFound = 0
    
    while (tradingDaysFound < daysBack) {
      date.setDate(date.getDate() - 1)
      const dayOfWeek = date.getDay()
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        tradingDaysFound++
      }
    }
    
    return date.toISOString().split('T')[0]
  }
  
  const [tradingMode, setTradingMode] = useState<'daily' | 'intraday'>('daily')
  const [baseModel, setBaseModel] = useState('openai/gpt-4o')
  const [startDate, setStartDate] = useState(getRecentTradingDate(3)) // 3 trading days back
  const [endDate, setEndDate] = useState(getRecentTradingDate(1))   // 1 trading day back
  
  // Intraday-specific state
  const [intradaySymbol, setIntradaySymbol] = useState('AAPL')
  const [intradayDate, setIntradayDate] = useState(getRecentTradingDate(1))
  const [intradaySession, setIntradaySession] = useState<'pre' | 'regular' | 'after'>('regular')
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editAIModel, setEditAIModel] = useState('openai/gpt-5')
  const [editParameters, setEditParameters] = useState<Record<string, unknown>>({})
  const [editRules, setEditRules] = useState('')
  const [editInstructions, setEditInstructions] = useState('')
  const [editInitialCash, setEditInitialCash] = useState('10000')
  const [editLoading, setEditLoading] = useState(false)
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmData, setConfirmData] = useState<{
    success: boolean
    savedModel: Model | null
    sentData: ModelUpdateData
    verificationStatus: string
  } | null>(null)
  
  const loadData = useCallback(async () => {
    try {
      // Fetch data with error handling for new models
      const [posData, latestData, statusData, modelsData, runsData] = await Promise.all([
        fetchModelPositions(modelId).catch(() => ({ positions: [] })),
        fetchModelLatestPosition(modelId).catch(() => null),
        fetchTradingStatus(modelId).catch(() => null),
        fetchMyModels().catch(() => ({ models: [] })),
        fetchModelRuns(modelId).catch(() => ({ runs: [], total: 0 }))
      ])
      
      setPositions(posData.positions || [])
      setRuns(runsData.runs || [])
      
      // Add stocks_value to latestData if missing (calculated from total_value - cash)
      if (latestData) {
        const dataWithStocksValue = {
          ...latestData,
          stocks_value: latestData.total_value - latestData.cash
        }
        setLatestPosition(dataWithStocksValue)
      } else {
        setLatestPosition(null)
      }
      
      setStatus(statusData)
      
      // Find and set current model
      const model = modelsData.models.find(m => m.id === modelId)
      if (model) {
        setCurrentModel(model)
      }
      
        // Determine original AI from model signature and pre-select it
        if (latestData) {
          const signature = latestData.model_name.toLowerCase()
          let detectedAI = 'openai/gpt-4o'  // fallback
          
          if (signature.includes('claude-4.5')) detectedAI = 'anthropic/claude-sonnet-4.5'
          else if (signature.includes('claude')) detectedAI = 'anthropic/claude-3.5-sonnet'
          else if (signature.includes('gemini-2.5')) detectedAI = 'google/gemini-2.5-flash-preview-09-2025'
          else if (signature.includes('gemini')) detectedAI = 'google/gemini-2.0-flash-exp'
          else if (signature.includes('deepseek')) detectedAI = 'deepseek/deepseek-v3.2-exp'
          else if (signature.includes('gpt-5-pro')) detectedAI = 'openai/gpt-5-pro'
          else if (signature.includes('gpt-5')) detectedAI = 'openai/gpt-5-codex'
          else if (signature.includes('gpt-4.1')) detectedAI = 'openai/gpt-4o'
          else if (signature.includes('qwen')) detectedAI = 'qwen/qwen3-next-80b-a3b-instruct'
          else if (signature.includes('llama')) detectedAI = 'meta-llama/llama-3.3-70b-instruct'
          
          setOriginalAI(detectedAI)
          setBaseModel(detectedAI)  // Pre-select the original AI!
        }
      
    } catch (error) {
      console.error('Failed to load model:', error)
    } finally {
      setLoading(false)
    }
  }, [modelId])
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    
    if (user) {
      loadData()
    }
  }, [user, authLoading, router, loadData])
  
  async function handleStart() {
    setActionLoading(true)
    try {
      // Use model's default AI or fallback
      const aiModel = currentModel?.default_ai_model || baseModel
      
      if (tradingMode === 'intraday') {
        // Intraday trading
        const { startIntradayTrading } = await import('@/lib/api')
        await startIntradayTrading(modelId, intradaySymbol, intradayDate, intradaySession as 'pre' | 'regular' | 'after', aiModel)
      } else {
        // Daily trading
        await startTrading(modelId, aiModel, startDate, endDate)
      }
      await loadData()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to start: ${message}`)
    } finally {
      setActionLoading(false)
    }
  }
  
  async function handleStop() {
    setActionLoading(true)
    try {
      await stopTrading(modelId)
      await loadData()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to stop: ${message}`)
    } finally {
      setActionLoading(false)
    }
  }
  
  async function handleOpenEdit() {
    try {
      // Use already loaded current model or fetch fresh
      let modelToEdit = currentModel
      
      if (!modelToEdit) {
        const modelsData = await fetchMyModels()
        modelToEdit = modelsData.models.find(m => m.id === modelId) || null
      }
      
      if (modelToEdit) {
        setEditName(modelToEdit.name || '')
        setEditDescription(modelToEdit.description || '')
        setEditAIModel(modelToEdit.default_ai_model || 'openai/gpt-5')
        setEditParameters(modelToEdit.model_parameters || {})
        setEditRules(modelToEdit.custom_rules || '')
        setEditInstructions(modelToEdit.custom_instructions || '')
        setEditInitialCash(String(modelToEdit.initial_cash || 10000))
      }
      
      setShowEditModal(true)
    } catch (error) {
      console.error('Failed to load model for editing:', error)
    }
  }
  
  // Deep equality check for objects (key order independent)
  function deepEqual(obj1: unknown, obj2: unknown): boolean {
    if (obj1 === obj2) return true
    if (obj1 == null || obj2 == null) return false
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false
    
    const keys1 = Object.keys(obj1 as Record<string, unknown>)
    const keys2 = Object.keys(obj2 as Record<string, unknown>)
    
    if (keys1.length !== keys2.length) return false
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false
      if (!deepEqual((obj1 as Record<string, unknown>)[key], (obj2 as Record<string, unknown>)[key])) return false
    }
    
    return true
  }
  
  async function handleSaveEdit() {
    setEditLoading(true)
    const sentData = {
      name: editName,
      description: editDescription || undefined,
      default_ai_model: editAIModel,
      model_parameters: editParameters,
      custom_rules: editRules || undefined,
      custom_instructions: editInstructions || undefined
    }
    
    try {
      // Step 1: Save to backend
      await updateModel(modelId, sentData)
      
      // Step 2: Verify by fetching from database
      const verifiedModels = await fetchMyModels()
      const savedModel = verifiedModels.models.find(m => m.id === modelId) || null
      
      // Step 3: Verify data integrity with deep equality (key order independent)
      let verificationStatus = 'verified'
      if (!savedModel) {
        verificationStatus = 'error: Model not found in database after save'
      } else {
        // Check key fields with proper comparison
        const nameMatch = savedModel.name === editName
        const modelMatch = savedModel.default_ai_model === editAIModel
        const paramsMatch = deepEqual(savedModel.model_parameters, editParameters)
        
        if (!nameMatch || !modelMatch || !paramsMatch) {
          verificationStatus = 'warning: Some fields may not have saved correctly'
        }
      }
      
      // Update local state
      if (savedModel) {
        setCurrentModel(savedModel)
      }
      
      // Show confirmation modal with verification results
      setConfirmData({
        success: true,
        savedModel,
        sentData,
        verificationStatus
      })
      setShowEditModal(false)
      setShowConfirmModal(true)
      
      // Reload full data in background
      await loadData()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      // Show error in confirmation modal
      setConfirmData({
        success: false,
        savedModel: null,
        sentData,
        verificationStatus: `error: ${message}`
      })
      setShowEditModal(false)
      setShowConfirmModal(true)
    } finally {
      setEditLoading(false)
    }
  }
  
  async function handleDelete() {
    const confirmed = confirm(
      `Are you sure you want to delete this model? This will remove all trading history and cannot be undone.`
    )
    if (!confirmed) return
    
    setActionLoading(true)
    try {
      await deleteModel(modelId)
      router.push('/dashboard')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to delete model: ${message}`)
      setActionLoading(false)
    }
  }
  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-gray-400">Loading model...</div>
      </div>
    )
  }
  
  // For brand new models without any trading history
  const isNewModel = !latestPosition
  
  const isRunning = status?.status === 'running'
  
  return (
    <div className="min-h-screen bg-black">
      {/* Simple Navbar */}
      <nav className="border-b border-zinc-800 bg-zinc-950 px-6 py-4">
        <div className="flex items-center justify-between">
          <a href="/dashboard" className="text-green-500 hover:underline">← Back to Dashboard</a>
          <button
            onClick={() => {
              localStorage.removeItem('auth_token')
              router.push('/login')
            }}
            className="text-sm text-gray-400 hover:text-white"
          >
            Logout
          </button>
        </div>
      </nav>
      
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {latestPosition ? latestPosition.model_name : editName || 'Loading...'}
            </h1>
            <p className="text-gray-400">Model ID: {modelId}</p>
            {editDescription && (
              <p className="text-sm text-gray-500 mt-2">{editDescription}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleOpenEdit}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm hover:bg-zinc-800 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600/10 border border-red-600 text-red-500 rounded-md text-sm hover:bg-red-600/20 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
        
        {/* Trading Controls and Current Position Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trading Controls */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">Trading Controls</h2>
          
          {!isNewModel && (
              <div className="mb-4 p-3 bg-zinc-900 border border-zinc-800 rounded-md">
              <p className="text-sm text-gray-400">
                Default AI Model: <span className="text-green-500 font-medium">
                  {currentModel?.default_ai_model 
                    ? AVAILABLE_MODELS.find(m => m.id === currentModel.default_ai_model)?.name || currentModel.default_ai_model
                    : AVAILABLE_MODELS.find(m => m.id === originalAI)?.name || 'Unknown'}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                You can select a different AI below to continue trading this portfolio
              </p>
            </div>
          )}
          
          {isNewModel && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500 rounded-md">
              <p className="text-sm text-blue-400">
                <strong>New Model</strong> - Start trading to begin building your portfolio. 
                You&apos;ll start with $10,000 in virtual capital.
              </p>
            </div>
          )}
          
          {/* Trading Mode Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Trading Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTradingMode('daily')}
                disabled={isRunning}
                className={`px-4 py-3 rounded-md border text-left transition-colors ${
                  tradingMode === 'daily'
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-medium">📅 Daily Trading</div>
                <div className="text-xs mt-1 opacity-75">1 decision per day, multiple days</div>
              </button>
              
              <button
                type="button"
                onClick={() => setTradingMode('intraday')}
                disabled={isRunning}
                className={`px-4 py-3 rounded-md border text-left transition-colors ${
                  tradingMode === 'intraday'
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-medium">⚡ Intraday Trading</div>
                <div className="text-xs mt-1 opacity-75">Minute-by-minute, single day</div>
              </button>
            </div>
          </div>
          
          {/* Daily Trading Fields */}
          {tradingMode === 'daily' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isRunning}
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isRunning}
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}
          
          {/* Intraday Trading Fields */}
          {tradingMode === 'intraday' && (
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Stock Symbol</label>
                  <input
                    type="text"
                    value={intradaySymbol}
                    onChange={(e) => setIntradaySymbol(e.target.value.toUpperCase())}
                    disabled={isRunning}
                    placeholder="AAPL"
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Single stock</p>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Trading Date</label>
                  <input
                    type="date"
                    value={intradayDate}
                    onChange={(e) => setIntradayDate(e.target.value)}
                    disabled={isRunning}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Session</label>
                  <select
                    value={intradaySession}
                    onChange={(e) => setIntradaySession(e.target.value as 'pre' | 'regular' | 'after')}
                    disabled={isRunning}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="pre">Pre-Market (4:00-9:30 AM)</option>
                    <option value="regular">Regular Hours (9:30 AM-4:00 PM)</option>
                    <option value="after">After-Hours (4:00-8:00 PM)</option>
                  </select>
                </div>
              </div>
              
              <div className="p-3 bg-purple-500/10 border border-purple-500 rounded-md">
                <p className="text-sm text-purple-400">
                  <strong>Intraday Mode:</strong> AI will trade {intradaySymbol} minute-by-minute during {intradaySession} session on {intradayDate}.
                  Uses your default AI model: <span className="text-purple-300 font-semibold">
                    {currentModel?.default_ai_model 
                      ? AVAILABLE_MODELS.find(m => m.id === currentModel.default_ai_model)?.name 
                      : 'Not set'}
                  </span>
                </p>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            {isRunning ? (
              <button
                onClick={handleStop}
                disabled={actionLoading}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Stopping...' : 'Stop Trading'}
              </button>
            ) : (
              <button
                onClick={handleStart}
                disabled={actionLoading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Starting...' : 'Start Trading'}
              </button>
            )}
            
            <span className="px-4 py-2 text-sm">
              Status: <span className={isRunning ? 'text-green-500' : 'text-gray-500'}>
                {status?.status || 'not_running'}
              </span>
            </span>
          </div>
          </div>
        
          {/* Right Column: Portfolio Summary + Current Position */}
          <div className="space-y-6">
            {/* Portfolio Summary */}
            {!isNewModel && latestPosition && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <h3 className="text-md font-bold mb-3">Portfolio Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-800">
                    <span className="text-sm text-gray-400">💰 Total Portfolio</span>
                    <span className="text-xl font-bold text-white">
                      ${latestPosition.total_value.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-800">
                    <span className="text-sm text-gray-400">📊 Position Value</span>
                    <span className="text-lg font-semibold text-blue-400">
                      ${(latestPosition.stocks_value || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-800">
                    <span className="text-sm text-gray-400">💵 Buying Power</span>
                    <span className="text-lg font-semibold text-green-500">
                      ${latestPosition.cash.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-800">
                    <span className="text-sm text-gray-400">Last Updated</span>
                    <span className="text-sm">{latestPosition.date}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-sm text-gray-400">Active Holdings</span>
                    <span className="text-sm font-semibold">
                      {Object.entries(latestPosition.positions).filter(([k,v]) => k !== 'CASH' && v > 0).length} stocks
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Runs (NEW) */}
            {runs.length > 0 && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <h3 className="text-md font-bold mb-3">Recent Runs</h3>
                <div className="space-y-2">
                  {runs.slice(0, 5).map((run) => (
                    <a
                      key={run.id}
                      href={`/models/${modelId}/r/${run.id}`}
                      className="block p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold">Run #{run.run_number}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            {run.trading_mode === 'intraday' ? '⚡' : '📅'} {run.trading_mode}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${
                            (run.final_return || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {run.final_return ? `${(run.final_return * 100).toFixed(2)}%` : '--'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {run.total_trades || 0} trades
                          </div>
                        </div>
                      </div>
                      {run.trading_mode === 'intraday' && run.intraday_symbol && (
                        <div className="text-xs text-gray-500 mt-1">
                          {run.intraday_symbol} on {run.intraday_date}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
                {runs.length > 5 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    + {runs.length - 5} more runs
                  </p>
                )}
              </div>
            )}
            
            {/* Current Position */}
            {!isNewModel && latestPosition && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-md font-bold mb-3">Current Position</h3>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-400">Top Holdings:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(latestPosition.positions)
                  .filter(([symbol, shares]) => symbol !== 'CASH' && shares > 0)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8)
                  .map(([symbol, shares]) => (
                    <span key={symbol} className="text-xs bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">
                      {symbol}: {shares}
                    </span>
                  ))}
              </div>
            </div>
              </div>
            )}
            
            {/* New Model Placeholder */}
            {isNewModel && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Portfolio Status</h2>
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-400 mb-2">No trading history yet</p>
                <p className="text-sm text-gray-500">
                  Start trading above to begin building your portfolio with $10,000 virtual capital
                </p>
              </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Live Trading Feed (when running) */}
        {isRunning && (
          <div className="mb-8">
            <TradingFeed modelId={modelId} />
          </div>
        )}
        
        {/* Tabs Navigation */}
        {!isNewModel && (
          <>
            <div className="mb-6 border-b border-zinc-800">
              <div className="flex gap-1">
                {[
                  { id: 'performance', label: 'Performance', icon: '📈' },
                  { id: 'chart', label: 'Chart', icon: '📉' },
                  { id: 'logs', label: 'AI Logs', icon: '🤖' },
                  { id: 'history', label: 'Trade History', icon: '📜' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? 'text-green-500'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="mb-8">
              {activeTab === 'performance' && (
                <PerformanceMetrics modelId={modelId} />
              )}

              {activeTab === 'chart' && (
                <PortfolioChart modelId={modelId} />
              )}

              {activeTab === 'logs' && (
                <LogsViewer modelId={modelId} />
              )}

              {activeTab === 'history' && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
                  <h2 className="text-lg font-bold mb-4">Complete Trading History</h2>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="text-left py-3 text-sm text-gray-400">Date</th>
                          <th className="text-left py-3 text-sm text-gray-400">Action</th>
                          <th className="text-left py-3 text-sm text-gray-400">Symbol</th>
                          <th className="text-right py-3 text-sm text-gray-400">Amount</th>
                          <th className="text-right py-3 text-sm text-gray-400">Cash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((pos) => (
                          <tr key={pos.id} className="border-b border-zinc-900 hover:bg-zinc-900">
                            <td className="py-3 text-sm">{pos.date}</td>
                            <td className="py-3">
                              {pos.action_type && (
                                <span className={`text-xs px-2 py-1 rounded ${
                                  pos.action_type === 'buy' ? 'bg-green-500/20 text-green-500' :
                                  pos.action_type === 'sell' ? 'bg-red-500/20 text-red-500' :
                                  'bg-gray-500/20 text-gray-500'
                                }`}>
                                  {pos.action_type}
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-sm font-mono">{pos.symbol || '-'}</td>
                            <td className="py-3 text-sm text-right">{pos.amount || '-'}</td>
                            <td className="py-3 text-sm text-right text-green-500">
                              ${pos.cash.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {positions.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No trading history yet
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      
      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Edit Model</h3>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Model Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Default AI Model <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editAIModel}
                    onChange={(e) => setEditAIModel(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {AVAILABLE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Starting Capital <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-gray-400">$</span>
                    <input
                      type="number"
                      value={editInitialCash}
                      onChange={(e) => setEditInitialCash(e.target.value)}
                      min="1000"
                      max="1000000"
                      step="1000"
                      className="w-full pl-8 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
              
              {/* AI Model Configuration */}
              <div className="border-t border-zinc-800 pt-4">
                <h4 className="text-sm font-semibold mb-3">AI Model Configuration</h4>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <ModelSettings
                    selectedAIModel={editAIModel}
                    currentParams={editParameters as Parameters<typeof ModelSettings>[0]['currentParams']}
                    onParamsChange={(params) => setEditParameters(params as Record<string, unknown>)}
                  />
                </div>
              </div>
              
              {/* Custom Rules */}
              <div className="border-t border-zinc-800 pt-4">
                <label className="block text-sm font-medium mb-2">
                  Custom Trading Rules <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  value={editRules}
                  onChange={(e) => setEditRules(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Define specific trading rules..."
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {editRules.length}/2000 characters
                </p>
              </div>
              
              {/* Custom Instructions */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Custom Instructions <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Provide strategy guidance..."
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {editInstructions.length}/2000 characters
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={editLoading}
                className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editLoading || !editName || !editName.trim()}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmation Modal */}
      {showConfirmModal && confirmData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 max-w-2xl w-full">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              {confirmData.success ? (
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold">
                  {confirmData.success ? 'Save Successful ✓' : 'Save Failed'}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {confirmData.verificationStatus.startsWith('verified') 
                    ? 'All changes verified in database'
                    : confirmData.verificationStatus}
                </p>
              </div>
            </div>
            
            {/* Verification Details */}
            <div className="space-y-4 mb-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Status:</span>
                {confirmData.verificationStatus === 'verified' ? (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                    ✓ Verified in Supabase
                  </span>
                ) : confirmData.verificationStatus.startsWith('warning') ? (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                    ⚠ Warning
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                    ✗ Error
                  </span>
                )}
              </div>
              
              {/* Saved Data Summary */}
              {confirmData.success && confirmData.savedModel && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Saved Configuration:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Model Name:</span>
                      <span className="text-gray-200">{confirmData.savedModel.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">AI Model:</span>
                      <span className="text-gray-200">{confirmData.savedModel.default_ai_model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Parameters:</span>
                      <span className="text-gray-200">
                        {Object.keys(confirmData.savedModel.model_parameters || {}).length} configured
                      </span>
                    </div>
                    {confirmData.savedModel.model_parameters && (
                      <div className="mt-3 pt-3 border-t border-zinc-700">
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                            View Parameter Details
                          </summary>
                          <pre className="mt-2 p-2 bg-black/30 rounded overflow-x-auto text-gray-300">
                            {JSON.stringify(confirmData.savedModel.model_parameters, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Error Details */}
              {!confirmData.success && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-sm text-red-400">
                    {confirmData.verificationStatus}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Please try again or contact support if the issue persists.
                  </p>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                {confirmData.success ? 'Done' : 'Close'}
              </button>
              {!confirmData.success && (
                <button
                  onClick={() => {
                    setShowConfirmModal(false)
                    setShowEditModal(true)
                  }}
                  className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

