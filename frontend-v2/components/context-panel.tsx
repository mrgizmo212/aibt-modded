"use client"

import { Activity, CheckCircle, TrendingUp, TrendingDown, Bot, Settings, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import { getModelById, getRuns, getPositions, getTradingStatus, getPerformance } from "@/lib/api"
import { useTradingStream, type TradingEvent } from "@/hooks/use-trading-stream"

interface ContextPanelProps {
  context: "dashboard" | "model" | "run"
  selectedModelId: number | null
  onEditModel?: (id: number) => void
  onRunClick?: (modelId: number, runId: number) => void  // ← NEW: Click handler for runs
}

export function ContextPanel({ context, selectedModelId, onEditModel, onRunClick }: ContextPanelProps) {
  const [modelData, setModelData] = useState<any>(null)
  const [runs, setRuns] = useState<any[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [recentEvents, setRecentEvents] = useState<TradingEvent[]>([])
  const liveUpdatesRef = useRef<HTMLDivElement>(null)
  const [selectedRun, setSelectedRun] = useState<any>(null)

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
  const { events } = useTradingStream(streamModelId, { enabled: !!streamModelId })

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
      
      // Check if latest event is a trade - refresh positions IMMEDIATELY
      const latestEvent = events[events.length - 1]
      if (latestEvent.type === 'trade' && selectedModelId) {
        console.log('[ContextPanel] Trade detected - refreshing positions')
        // Refresh positions after trade with minimal delay
        setTimeout(() => {
          if (context === "model") {
            console.log('[ContextPanel] Reloading positions for model', selectedModelId)
            loadModelData()
          }
        }, 500) // Reduced delay for faster updates
      }
    }
  }, [events])

  useEffect(() => {
    if (context === "model" && selectedModelId) {
      loadModelData()
    }
  }, [context, selectedModelId])

  async function loadModelData() {
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
  }
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

          {/* Model Info */}
          {modelData && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Model Info</h3>
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#a3a3a3]">AI Model</span>
                  <span className="text-sm font-mono text-white">{modelData.default_ai_model || 'N/A'}</span>
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

          {/* Live Updates - Terminal Style */}
          {recentEvents.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Live Updates</h2>
                <Badge className="bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20">
                  <div className="w-2 h-2 bg-[#10b981] rounded-full pulse-dot mr-1.5" />
                  Streaming
                </Badge>
              </div>
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg">
                <div 
                  ref={liveUpdatesRef}
                  className="max-h-[400px] overflow-y-auto scrollbar-thin p-3 space-y-1"
                >
                  {recentEvents.map((event, index) => {
                    // Filter to show only terminal events for the terminal view
                    if (event.type !== 'terminal') return null
                    
                    const timestamp = event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'Just now'
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
                  })}
                  {recentEvents.filter(e => e.type === 'terminal').length === 0 && (
                    <div className="text-center py-8 text-[#737373]">
                      Waiting for trading activity...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Positions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Positions</h2>
              {positions.length > 0 && (
                <span className="text-xs text-[#737373]">{positions.length} position{positions.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            {positions.length > 0 ? (
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
              {runs.length > 0 && (
                <span className="text-xs text-[#737373]">{runs.length} total</span>
              )}
            </div>
            {runs.length > 0 ? (
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg max-h-[400px] overflow-y-auto scrollbar-thin">
                <div className="p-4 space-y-3">
                  {runs.map((run: any) => (
                  <button
                    key={run.id}
                    onClick={() => onRunClick?.(selectedModelId!, run.id)}
                    className="w-full flex items-center justify-between py-2 border-b border-[#262626]/50 last:border-0 hover:bg-[#1a1a1a] px-2 rounded transition-colors cursor-pointer"
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
