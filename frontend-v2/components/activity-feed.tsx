"use client"

import { useState, useEffect } from "react"
import { Activity, TrendingUp, TrendingDown, PlayCircle, CheckCircle2, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTradingStream } from "@/hooks/use-trading-stream"
import { getRuns } from "@/lib/api"

interface ActivityFeedProps {
  userId: string
  runningModelIds: number[]
  onModelClick?: (modelId: number) => void
}

interface ActivityItem {
  id: string
  timestamp: string
  type: 'trade' | 'session_start' | 'session_complete'
  modelId: number
  modelName: string
  data: any
}

export function ActivityFeed({ userId, runningModelIds, onModelClick }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  
  // Connect to SSE for first running model (or null if none)
  const streamModelId = runningModelIds[0] || null
  const { events } = useTradingStream(streamModelId, { enabled: !!streamModelId })
  
  // Load recent completed runs on mount
  useEffect(() => {
    loadRecentActivity()
  }, [])
  
  // Update activities when SSE events arrive
  useEffect(() => {
    if (events.length > 0) {
      const latestEvent = events[events.length - 1]
      
      // Convert SSE event to activity item
      if (latestEvent.type === 'trade' || latestEvent.type === 'session_start' || latestEvent.type === 'complete') {
        const activity: ActivityItem = {
          id: `${latestEvent.timestamp}-${Math.random()}`,
          timestamp: latestEvent.timestamp,
          type: latestEvent.type === 'complete' ? 'session_complete' : latestEvent.type as any,
          modelId: latestEvent.data.model_id || streamModelId!,
          modelName: 'Model', // Would need to fetch
          data: latestEvent.data
        }
        
        setActivities(prev => [activity, ...prev].slice(0, 20)) // Keep last 20
      }
    }
  }, [events])
  
  async function loadRecentActivity() {
    // Load recent runs (simplified - would aggregate from all user's models)
    // For now, just show placeholder
  }
  
  function getRelativeTime(timestamp: string): string {
    const now = new Date()
    const then = new Date(timestamp)
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return then.toLocaleDateString()
  }
  
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Activity className="w-12 h-12 text-[#525252] mb-4" />
        <p className="text-sm text-[#737373]">No recent activity</p>
        <p className="text-xs text-[#525252] mt-1">Start trading to see live updates</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <Card 
          key={activity.id}
          className={`bg-[#0a0a0a] border-[#262626] p-4 hover:border-[#404040] transition-all cursor-pointer ${
            index === 0 ? 'border-l-4 border-l-[#10b981]' : ''
          }`}
          onClick={() => onModelClick?.(activity.modelId)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              {/* Icon */}
              <div className={`mt-0.5 ${
                activity.type === 'trade' && activity.data.action === 'buy' ? 'text-[#10b981]' :
                activity.type === 'trade' && activity.data.action === 'sell' ? 'text-[#ef4444]' :
                activity.type === 'session_start' ? 'text-[#3b82f6]' :
                'text-[#10b981]'
              }`}>
                {activity.type === 'trade' && activity.data.action === 'buy' && <TrendingUp className="w-5 h-5" />}
                {activity.type === 'trade' && activity.data.action === 'sell' && <TrendingDown className="w-5 h-5" />}
                {activity.type === 'session_start' && <PlayCircle className="w-5 h-5" />}
                {activity.type === 'session_complete' && <CheckCircle2 className="w-5 h-5" />}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {activity.modelName}
                  </p>
                  {index === 0 && (
                    <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-xs animate-pulse">
                      LIVE
                    </Badge>
                  )}
                </div>
                
                {/* Trade details */}
                {activity.type === 'trade' && (
                  <p className={`text-sm font-mono ${
                    activity.data.action === 'buy' ? 'text-[#10b981]' : 'text-[#ef4444]'
                  }`}>
                    {activity.data.action?.toUpperCase()} {activity.data.amount} {activity.data.symbol} @ ${activity.data.price?.toFixed(2)}
                  </p>
                )}
                
                {/* Session start */}
                {activity.type === 'session_start' && (
                  <p className="text-sm text-[#3b82f6]">
                    Started {activity.data.symbol} intraday session
                  </p>
                )}
                
                {/* Session complete */}
                {activity.type === 'session_complete' && (
                  <p className="text-sm text-[#10b981]">
                    Completed: {activity.data.trades} trades • {activity.data.return > 0 ? '+' : ''}{(activity.data.return * 100).toFixed(2)}%
                  </p>
                )}
                
                <p className="text-xs text-[#525252] mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {getRelativeTime(activity.timestamp)}
                </p>
              </div>
            </div>
            
            {/* Value */}
            {activity.type === 'trade' && (
              <div className="text-right">
                <p className={`text-sm font-mono font-semibold ${
                  activity.data.action === 'buy' ? 'text-[#ef4444]' : 'text-[#10b981]'
                }`}>
                  {activity.data.action === 'buy' ? '-' : '+'}${(activity.data.amount * activity.data.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

