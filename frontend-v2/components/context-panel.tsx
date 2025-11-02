"use client"

import { Activity, CheckCircle, TrendingUp, TrendingDown, Bot, Settings, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { getModelById, getRuns, getPositions, getTradingStatus, getPerformance } from "@/lib/api"
import { useTradingStream, type TradingEvent } from "@/hooks/use-trading-stream"

interface ContextPanelProps {
  context: "dashboard" | "model" | "run"
  selectedModelId: number | null
  onEditModel?: (id: number) => void
}

export function ContextPanel({ context, selectedModelId, onEditModel }: ContextPanelProps) {
  const [modelData, setModelData] = useState<any>(null)
  const [runs, setRuns] = useState<any[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [recentEvents, setRecentEvents] = useState<TradingEvent[]>([])

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
      setRecentEvents(events.slice(-10).reverse()) // Last 10 events, newest first
      
      // Check if latest event is a trade - refresh positions
      const latestEvent = events[events.length - 1]
      if (latestEvent.type === 'trade' && selectedModelId) {
        // Refresh positions after trade
        setTimeout(() => {
          if (context === "model") {
            loadModelData()
          }
        }, 1000) // Small delay for backend to save trade
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

          {/* Live Updates */}
          {recentEvents.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Live Updates</h2>
                <Badge className="bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20">
                  <div className="w-2 h-2 bg-[#10b981] rounded-full pulse-dot mr-1.5" />
                  Streaming
                </Badge>
              </div>
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 space-y-2">
                {recentEvents.slice(0, 5).map((event, index) => (
                  <div key={`${event.timestamp}-${index}`} className="text-xs font-mono">
                    <span className="text-[#737373]" suppressHydrationWarning>
                      {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'Just now'}
                    </span>
                    <span className={`ml-2 ${
                      event.type === 'trade' ? 'text-[#10b981]' :
                      event.type === 'error' ? 'text-[#ef4444]' :
                      'text-[#a3a3a3]'
                    }`}>
                      {event.data?.message || event.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Positions */}
          <div>
            <h2 className="text-base font-semibold text-white mb-4">Current Positions</h2>
            {positions.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#a3a3a3] font-semibold">Symbol</span>
                  <span className="text-[#a3a3a3] font-semibold">Qty</span>
                  <span className="text-[#a3a3a3] font-semibold">Avg Price</span>
                  <span className="text-[#a3a3a3] font-semibold">P/L</span>
                </div>
                {positions.map((position: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-xs py-2 border-t border-[#262626]">
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
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4 text-center">
                <p className="text-sm text-[#737373]">No positions yet</p>
                <p className="text-xs text-[#525252] mt-1">Start trading to see positions</p>
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
