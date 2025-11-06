"use client"

import { Activity, CheckCircle, TrendingUp, TrendingDown, Bot, Settings, AlertCircle, Square, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef, useCallback } from "react"
import { getModelById, getRuns, getPositions, getTradingStatus, getPerformance, stopTrading, deleteRun, stopSpecificRun } from "@/lib/api"
import { useTradingStream, type TradingEvent } from "@/hooks/use-trading-stream"
import { LogsViewer } from "@/components/LogsViewer"
import { ActivityFeed } from "@/components/activity-feed"
import { AVAILABLE_MODELS } from "@/lib/constants"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"

interface ContextPanelProps {
  context: "dashboard" | "model" | "run"
  selectedModelId: number | null
  onEditModel?: (id: number) => void
  onRunClick?: (modelId: number, runId: number) => void  // ← NEW: Click handler for runs
}

export function ContextPanel({ context, selectedModelId, onEditModel, onRunClick }: ContextPanelProps) {
  const { user } = useAuth()
  const [modelData, setModelData] = useState<any>(null)
  const [runs, setRuns] = useState<any[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [recentEvents, setRecentEvents] = useState<TradingEvent[]>([])
  const liveUpdatesRef = useRef<HTMLDivElement>(null)
  const [selectedRun, setSelectedRun] = useState<any>(null)
  const [carouselIndex, setCarouselIndex] = useState(0)

  // Connect to SSE for ANY running model to show in dashboard
  // If on model context, connect to that specific model
  // If on dashboard, try to connect to first running model (for global activity feed)
  const [runningModels, setRunningModels] = useState<number[]>([])
  
  useEffect(() => {
    // Get running models for dashboard activity feed
    if (context === "dashboard") {
      getTradingStatus().then(statuses => {
        const running = statuses.map((s: any) => s.model_id)
        setRunningModels(running)
      })
    }
  }, [context])

  const streamModelId = context === "model" ? selectedModelId : runningModels[0] || null
  const { events, clearEvents, connected } = useTradingStream(streamModelId, { enabled: !!streamModelId })

  // Update recent events from SSE
  useEffect(() => {
    if (events.length > 0) {
      setRecentEvents(events.slice(-100)) // Keep last 100 events (not reversed - newest at end)
      
      // Auto-scroll to bottom when new events arrive
      setTimeout(() => {
        if (liveUpdatesRef.current) {
          liveUpdatesRef.current.scrollTop = liveUpdatesRef.current.scrollHeight
        }
      }, 100)
      
      // Removed aggressive refresh on trade events
      // Positions now update via SSE trade events or manual refresh only
    }
  }, [events])

  // Memoize loadModelData to prevent duplicate calls
  const loadModelData = useCallback(async () => {
    if (!selectedModelId) return
    
    setLoading(true)
    try {
      const [model, modelRuns, modelPositions] = await Promise.all([
        getModelById(selectedModelId),
        getRuns(selectedModelId),
        getPositions(selectedModelId).catch(() => [])
      ])
      
      console.log('[ContextPanel] Model data loaded:', { model, runs: modelRuns, positions: modelPositions })
      
      setModelData(model)
      setRuns(modelRuns)
      setPositions(modelPositions)
    } catch (error) {
      console.error('Failed to load model data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedModelId])  // Memoize based on selectedModelId only
  
  // Call loadModelData when context/model changes
  useEffect(() => {
    if (context === "model" && selectedModelId) {
      loadModelData()
      
      // Poll for updates every 30 seconds (just for new runs, not trades)
      // Positions/trades update via SSE events
      const intervalId = setInterval(() => {
        loadModelData()
      }, 30000) // 30 seconds
      
      return () => clearInterval(intervalId)
    }
  }, [context, selectedModelId, loadModelData])
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'trade':
        return <TrendingUp className="w-4 h-4 text-[#10b981] flex-shrink-0 mt-0.5" />
      case 'status':
        return <Activity className="w-4 h-4 text-[#3b82f6] flex-shrink-0 mt-0.5" />
      case 'complete':
      case 'session_complete':
        return <CheckCircle className="w-4 h-4 text-[#10b981] flex-shrink-0 mt-0.5" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-[#ef4444] flex-shrink-0 mt-0.5" />
      case 'connected':
        return <Bot className="w-4 h-4 text-[#3b82f6] flex-shrink-0 mt-0.5" />
      default:
        return <Activity className="w-4 h-4 text-[#a3a3a3] flex-shrink-0 mt-0.5" />
    }
  }

  if (context === "dashboard") {
    return (
      <div className="h-screen bg-[#1a1a1a] border-l border-[#262626] overflow-y-auto scrollbar-thin">
        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-white" />
              <h2 className="text-base font-semibold text-white">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {recentEvents.length > 0 ? (
                recentEvents.map((event, index) => (
                  <div key={`${event.timestamp}-${index}`} className="flex gap-3">
                    {getEventIcon(event.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{event.data?.message || `Event: ${event.type}`}</p>
                      <p className="text-xs text-[#737373] mt-0.5" suppressHydrationWarning>
                        {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-8 h-8 text-[#525252] mx-auto mb-2" />
                  <p className="text-sm text-[#737373]">No recent activity</p>
                  <p className="text-xs text-[#525252] mt-1">Start trading to see live updates</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (context === "model" && selectedModelId) {
    return (
      <div className="h-screen bg-[#1a1a1a] border-l border-[#262626] overflow-y-auto scrollbar-thin">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Model Details</h2>
            <div className="flex gap-2">
              {(() => {
                const runningRuns = runs.filter(r => r.status === 'running')
                const hasRunning = runningRuns.length > 0
                
                return (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (!selectedModelId) return
                      
                      if (!hasRunning) {
                        toast.info('No active runs to stop')
                        return
                      }
                      
                      try {
                        toast.info(`Stopping ${runningRuns.length} active run${runningRuns.length > 1 ? 's' : ''}...`)
                        
                        // Stop ALL running runs for this model
                        await Promise.all(
                          runningRuns.map(run => stopSpecificRun(selectedModelId, run.id))
                        )
                        
                        toast.success(`Stopped and deleted ${runningRuns.length} run${runningRuns.length > 1 ? 's' : ''}`)
                        setCarouselIndex(0)
                        setTimeout(() => loadModelData(), 1000)
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to stop runs')
                      }
                    }}
                    className={hasRunning 
                      ? "text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      : "text-[#737373] hover:text-[#a3a3a3] cursor-default"
                    }
                    title={hasRunning 
                      ? `KILL SWITCH: Immediately stop and delete all ${runningRuns.length} running session${runningRuns.length > 1 ? 's' : ''} for this model`
                      : "No active runs to stop"
                    }
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop All Runs{runningRuns.length > 0 ? ` (${runningRuns.length})` : ''}
                  </Button>
                )
              })()}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEditModel?.(selectedModelId)}
                className="text-[#a3a3a3] hover:text-white hover:bg-[#0a0a0a]"
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Model
              </Button>
            </div>
          </div>

          {/* Background Tasks Progress - Carousel for running runs */}
          {(() => {
            const runningRuns = runs.filter(r => r.status === 'running')
            if (runningRuns.length === 0) return null
            
            // Reset carousel index if out of bounds
            if (carouselIndex >= runningRuns.length) {
              setCarouselIndex(0)
            }
            
            const currentRun = runningRuns[carouselIndex] || runningRuns[0]
            
            return (
              <div className="mb-4">
                <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-lg p-4 group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#3b82f6] animate-pulse" />
                      <span className="text-sm font-semibold text-white">
                        Run #{currentRun.run_number} In Progress
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30 text-xs">
                        Background
                      </Badge>
                      <button
                        onClick={async () => {
                          try {
                            toast.info(`Stopping Run #${currentRun.run_number}...`)
                            await stopSpecificRun(selectedModelId!, currentRun.id)
                            toast.success(`Run #${currentRun.run_number} stopped and deleted`)
                            setCarouselIndex(0) // Reset to first
                            loadModelData()
                          } catch (error: any) {
                            toast.error(error.message || 'Failed to stop')
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 rounded"
                        title="Stop and delete this run"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[#a3a3a3]">
                    {currentRun.intraday_symbol} • {new Date(currentRun.intraday_date).toLocaleDateString()} • {currentRun.intraday_session}
                  </p>
                  
                  {/* Carousel navigation (only if multiple running) */}
                  {runningRuns.length > 1 && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#3b82f6]/20">
                      <button
                        onClick={() => setCarouselIndex((prev) => (prev > 0 ? prev - 1 : runningRuns.length - 1))}
                        className="p-1 hover:bg-[#3b82f6]/20 rounded transition-colors"
                        title="Previous run"
                      >
                        <ChevronLeft className="w-4 h-4 text-[#3b82f6]" />
                      </button>
                      <div className="flex items-center gap-2">
                        {runningRuns.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCarouselIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              idx === carouselIndex ? 'bg-[#3b82f6]' : 'bg-[#3b82f6]/30'
                            }`}
                            title={`Run #${runningRuns[idx].run_number}`}
                          />
                        ))}
                        <span className="text-xs text-[#3b82f6] ml-1">
                          {carouselIndex + 1}/{runningRuns.length}
                        </span>
                      </div>
                      <button
                        onClick={() => setCarouselIndex((prev) => (prev < runningRuns.length - 1 ? prev + 1 : 0))}
                        className="p-1 hover:bg-[#3b82f6]/20 rounded transition-colors"
                        title="Next run"
                      >
                        <ChevronRight className="w-4 h-4 text-[#3b82f6]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Model Info */}
          {modelData && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Model Info</h3>
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#a3a3a3]">AI Model</span>
                  <span className="text-sm font-mono text-white">
                    {modelData.default_ai_model 
                      ? AVAILABLE_MODELS.find(m => m.id === modelData.default_ai_model)?.name || modelData.default_ai_model
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#a3a3a3]">Trading Mode</span>
                  <span className="text-sm text-white">{modelData.trading_mode || 'paper'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#a3a3a3]">Created</span>
                  <span className="text-xs text-white">{new Date(modelData.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Live Updates - Terminal Style (ALWAYS SHOW) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Live Updates</h2>
              <div className="flex items-center gap-2">
                {connected ? (
                  <Badge className="bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20">
                    <div className="w-2 h-2 bg-[#10b981] rounded-full pulse-dot mr-1.5" />
                    Streaming
                  </Badge>
                ) : (
                  <Badge className="bg-[#737373]/10 text-[#737373] border-[#737373]/20">
                    Disconnected
                  </Badge>
                )}
                {recentEvents.length > 0 && (
                  <button
                    onClick={() => {
                      clearEvents()
                      setRecentEvents([])
                      toast.success('Terminal cleared')
                    }}
                    className="text-[#737373] hover:text-white hover:bg-[#1a1a1a] p-1.5 rounded transition-colors"
                    title="Clear terminal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg">
              <div 
                ref={liveUpdatesRef}
                className="h-[400px] overflow-y-auto scrollbar-thin p-3 space-y-1"
              >
                {recentEvents.length > 0 ? (
                  recentEvents.map((event, index) => {
                    const timestamp = event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'Just now'
                    
                    // Show terminal events (console output)
                    if (event.type === 'terminal') {
                      const message = event.data?.message || ''
                      return (
                        <div key={`${event.timestamp}-${index}`} className="text-xs font-mono leading-relaxed">
                          <div className="text-[#525252]" suppressHydrationWarning>
                            {timestamp}
                          </div>
                          <div className="text-[#10b981] whitespace-pre-wrap">
                            {message}
                          </div>
                        </div>
                      )
                    }
                    
                    // Show trade events (buy/sell)
                    if (event.type === 'trade') {
                      const { action, symbol, amount, price } = event.data
                      const color = action === 'buy' ? 'text-green-400' : 'text-red-400'
                      return (
                        <div key={`${event.timestamp}-${index}`} className="text-xs font-mono leading-relaxed">
                          <div className="text-[#525252]" suppressHydrationWarning>
                            {timestamp}
                          </div>
                          <div className={color}>
                            {action?.toUpperCase()} {amount} {symbol} @ ${price}
                          </div>
                        </div>
                      )
                    }
                    
                    // Show progress events (trading updates)
                    if (event.type === 'progress') {
                      const message = event.data?.message || ''
                      return (
                        <div key={`${event.timestamp}-${index}`} className="text-xs font-mono leading-relaxed">
                          <div className="text-[#525252]" suppressHydrationWarning>
                            {timestamp}
                          </div>
                          <div className="text-[#3b82f6]">
                            {message}
                          </div>
                        </div>
                      )
                    }
                    
                    // Show status events
                    if (event.type === 'status') {
                      const message = event.data?.message || ''
                      return (
                        <div key={`${event.timestamp}-${index}`} className="text-xs font-mono leading-relaxed">
                          <div className="text-[#525252]" suppressHydrationWarning>
                            {timestamp}
                          </div>
                          <div className="text-[#fbbf24]">
                            {message}
                          </div>
                        </div>
                      )
                    }
                    
                    // Show other events
                    return null
                  })
                ) : (
                  <div className="text-center py-8 text-[#737373]">
                    Waiting for trading activity...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Positions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Positions</h2>
              {positions.length > 0 && !loading && (
                <span className="text-xs text-[#737373]">{positions.length} position{positions.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            {loading ? (
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4">
                <div className="animate-pulse space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 bg-[#262626] rounded w-12"></div>
                    <div className="h-3 bg-[#262626] rounded w-12"></div>
                    <div className="h-3 bg-[#262626] rounded w-16"></div>
                    <div className="h-3 bg-[#262626] rounded w-12"></div>
                  </div>
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex justify-between pt-2">
                      <div className="h-4 bg-[#262626] rounded w-12"></div>
                      <div className="h-4 bg-[#262626] rounded w-8"></div>
                      <div className="h-4 bg-[#262626] rounded w-16"></div>
                      <div className="h-4 bg-[#262626] rounded w-12"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : positions.length > 0 ? (
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#262626]">
                  <span className="text-[#a3a3a3] font-semibold">Symbol</span>
                  <span className="text-[#a3a3a3] font-semibold">Qty</span>
                  <span className="text-[#a3a3a3] font-semibold">Avg Price</span>
                  <span className="text-[#a3a3a3] font-semibold">P/L</span>
                </div>
                {positions.map((position: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-xs py-2 border-t border-[#262626]/50">
                    <span className="text-white font-semibold">{position.symbol}</span>
                    <span className="text-[#a3a3a3] font-mono">{position.quantity}</span>
                    <span className="text-white font-mono">${position.avg_price?.toFixed(2)}</span>
                    <span className={`font-mono ${position.unrealized_pl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                      {position.unrealized_pl >= 0 ? '+' : ''}${position.unrealized_pl?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-6 text-center">
                <p className="text-sm text-[#737373]">No positions yet</p>
                <p className="text-xs text-[#525252] mt-1">Start trading to see positions</p>
              </div>
            )}
          </div>

          {/* Runs History Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">All Runs</h2>
              {runs.length > 0 && !loading && (
                <span className="text-xs text-[#737373]">{runs.length} total</span>
              )}
            </div>
            {loading ? (
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-6">
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="h-4 bg-[#262626] rounded w-24"></div>
                      <div className="h-4 bg-[#262626] rounded w-16"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : runs.length > 0 ? (
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg max-h-[400px] overflow-y-auto scrollbar-thin">
                <div className="p-4 space-y-3">
                  {runs.map((run: any) => (
                  <div
                    key={run.id}
                    className="w-full flex items-center justify-between py-2 border-b border-[#262626]/50 last:border-0 hover:bg-[#1a1a1a] px-2 rounded transition-colors group"
                  >
                    <button
                      onClick={() => onRunClick?.(selectedModelId!, run.id)}
                      className="flex-1 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">Run #{run.run_number}</span>
                          <span className="text-xs text-[#737373]">
                            {run.trading_mode === 'intraday' ? '⚡ Intraday' : '📅 Daily'}
                          </span>
                        </div>
                        <p className="text-xs text-[#525252] mt-0.5">
                          {run.total_trades || 0} trades • {run.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-mono font-semibold ${
                          (run.final_return || 0) >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                        }`}>
                          {run.final_return ? `${(run.final_return * 100).toFixed(2)}%` : '--'}
                        </p>
                        <p className="text-xs text-[#737373]">
                          ${run.final_portfolio_value?.toFixed(2) || '--'}
                        </p>
                      </div>
                    </button>
                    
                    {/* Stop button for running tasks (orange square) */}
                    {run.status === 'running' && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            toast.info(`Stopping Run #${run.run_number}...`)
                            await stopSpecificRun(selectedModelId!, run.id)
                            toast.success(`Run #${run.run_number} stopped and deleted`)
                            loadModelData()
                          } catch (error: any) {
                            toast.error(error.message || 'Failed to stop')
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1.5 text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 rounded"
                        title="Stop and delete this run"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Delete button for completed tasks (red trash) */}
                    {run.status !== 'running' && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (confirm(`Delete Run #${run.run_number}? This cannot be undone.`)) {
                            try {
                              await deleteRun(selectedModelId!, run.id)
                              toast.success(`Run #${run.run_number} deleted`)
                              loadModelData() // Refresh
                            } catch (error: any) {
                              toast.error(error.message || 'Failed to delete')
                            }
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded"
                        title="Delete run"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-6 text-center">
                <p className="text-sm text-[#737373]">No runs yet</p>
                <p className="text-xs text-[#525252] mt-1">Start trading to create runs</p>
              </div>
            )}
          </div>

          {/* AI Decision Logs Section */}
          <div>
            <h2 className="text-base font-semibold text-white mb-4">AI Decision Logs</h2>
            <LogsViewer modelId={selectedModelId} />
          </div>
        </div>
      </div>
    )
  }

  if (context === "run") {
    return (
      <div className="h-screen bg-[#1a1a1a] border-l border-[#262626] overflow-y-auto scrollbar-thin">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white mb-4">Run #12 Stats</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[#a3a3a3] mb-1">Final Return</p>
                <p className="text-2xl font-bold font-mono text-[#ef4444]">-5.2%</p>
              </div>
              <div>
                <p className="text-xs text-[#a3a3a3] mb-1">Total Trades</p>
                <p className="text-xl font-semibold text-white">23</p>
              </div>
              <div>
                <p className="text-xs text-[#a3a3a3] mb-1">Win Rate</p>
                <p className="text-xl font-semibold text-white">35%</p>
                <p className="text-xs text-[#ef4444] mt-1">↓ Below average</p>
              </div>
              <div>
                <p className="text-xs text-[#a3a3a3] mb-1">Duration</p>
                <p className="text-xl font-semibold text-white">6.5 hours</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-4">Trade Timeline</h2>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-[#10b981] rounded-full" />
              <div className="w-3 h-3 bg-[#10b981] rounded-full" />
              <div className="w-3 h-3 bg-[#ef4444] rounded-full" />
              <div className="w-3 h-3 bg-[#ef4444] rounded-full" />
              <div className="w-3 h-3 bg-[#ef4444] rounded-full" />
              <div className="flex-1 h-px bg-[#262626]" />
            </div>
            <p className="text-xs text-[#a3a3a3] mt-2">← Losses started here</p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
