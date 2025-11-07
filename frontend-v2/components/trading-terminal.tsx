"use client"

import { useState, useEffect, useRef } from "react"
import { Terminal, TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { useTradingStream } from "@/hooks/use-trading-stream"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TradingTerminalProps {
  modelId: number | null
  modelName?: string
}

interface LogEntry {
  timestamp: string
  type: 'info' | 'success' | 'warning' | 'error' | 'trade'
  message: string
  icon?: React.ReactNode
}

export function TradingTerminal({ modelId, modelName }: TradingTerminalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [historicalLogs, setHistoricalLogs] = useState<LogEntry[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load historical logs from database on mount
  useEffect(() => {
    if (!modelId) return
    
    async function loadHistoricalLogs() {
      try {
        const { fetchModelLogs } = await import('@/lib/api')
        const data = await fetchModelLogs(modelId)
        
        if (data.logs && data.logs.length > 0) {
          const parsedLogs: LogEntry[] = []
          
          data.logs.forEach((log: any) => {
            const timestamp = new Date(log.timestamp || log.created_at).toLocaleTimeString()
            
            // Parse log messages
            const messages = log.messages || []
            messages.forEach((msg: any) => {
              parsedLogs.push({
                timestamp,
                type: 'info',
                message: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
              })
            })
          })
          
          setHistoricalLogs(parsedLogs)
          console.log('[TradingTerminal] Loaded', parsedLogs.length, 'historical log entries')
        }
      } catch (error) {
        console.error('[TradingTerminal] Failed to load historical logs:', error)
      }
    }
    
    loadHistoricalLogs()
  }, [modelId])

  const { events, connected } = useTradingStream(modelId, {
    enabled: !!modelId,
    onEvent: (event) => {
      // Convert SSE events to log entries
      const timestamp = new Date(event.timestamp || Date.now()).toLocaleTimeString()
      let logEntry: LogEntry

      switch (event.type) {
        case 'status':
          logEntry = {
            timestamp,
            type: 'info',
            message: event.data?.message || 'Status update',
            icon: <Terminal className="w-3 h-3" />
          }
          break

        case 'progress':
          logEntry = {
            timestamp,
            type: 'info',
            message: `🕐 ${event.data?.message}`,
          }
          break

        case 'trade':
          const action = event.data?.action?.toUpperCase()
          const symbol = event.data?.symbol || ''
          const amount = event.data?.amount || 0
          const price = event.data?.price || 0
          const reasoning = event.data?.reasoning || ''
          
          logEntry = {
            timestamp,
            type: 'trade',
            message: `${action === 'BUY' ? '💰' : '💵'} ${action} ${amount} ${symbol} @ $${price.toFixed(2)}\n       Why: ${reasoning}`,
            icon: action === 'BUY' ? <TrendingUp className="w-3 h-3 text-[#10b981]" /> : <TrendingDown className="w-3 h-3 text-[#ef4444]" />
          }
          break

        case 'complete':
        case 'session_complete':
          logEntry = {
            timestamp,
            type: 'success',
            message: `✅ ${event.data?.message || 'Session completed'}`,
            icon: <CheckCircle className="w-3 h-3 text-[#10b981]" />
          }
          break

        case 'error':
          logEntry = {
            timestamp,
            type: 'error',
            message: `❌ ${event.data?.message || 'Error occurred'}`,
            icon: <XCircle className="w-3 h-3 text-[#ef4444]" />
          }
          break

        case 'connected':
          logEntry = {
            timestamp,
            type: 'success',
            message: `🔌 Connected to trading stream`,
          }
          break

        case 'terminal':
          // Backend console output - the actual trading logs!
          logEntry = {
            timestamp,
            type: 'info',
            message: event.data?.message || '',
          }
          break

        default:
          logEntry = {
            timestamp,
            type: 'info',
            message: `Event: ${event.type}`,
          }
      }

      setLogs(prev => [...prev, logEntry].slice(-500)) // Keep last 500 logs (terminal can have lots)
    }
  })

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success':
      case 'trade':
        return 'text-[#10b981]'
      case 'error':
        return 'text-[#ef4444]'
      case 'warning':
        return 'text-[#f59e0b]'
      default:
        return 'text-[#a3a3a3]'
    }
  }

  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#262626] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#10b981]" />
          <span className="text-sm font-semibold text-white">
            Trading Terminal {modelName && `- ${modelName}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <>
              <div className="w-2 h-2 bg-[#10b981] rounded-full pulse-dot" />
              <span className="text-xs text-[#10b981]">Live</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-[#525252] rounded-full" />
              <span className="text-xs text-[#737373]">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Terminal Content */}
      <div className="h-[400px] overflow-y-auto scrollbar-thin" ref={scrollRef}>
        <div className="p-4 font-mono text-xs space-y-1">
          {/* Show historical logs first, then live logs */}
          {historicalLogs.length > 0 && (
            <>
              <div className="text-[#737373] border-b border-[#262626] pb-2 mb-2">
                ═══ Historical Logs ═══
              </div>
              {historicalLogs.map((log, index) => (
                <div key={`hist-${index}`} className={`${getLogColor(log.type)} flex gap-2`}>
                  <span className="text-[#525252]" suppressHydrationWarning>{log.timestamp}</span>
                  {log.icon && <span className="flex-shrink-0 mt-0.5">{log.icon}</span>}
                  <span className="whitespace-pre-wrap">{log.message}</span>
                </div>
              ))}
              {logs.length > 0 && (
                <div className="text-[#737373] border-b border-[#262626] py-2 my-2">
                  ═══ Live Updates ═══
                </div>
              )}
            </>
          )}
          {logs.length === 0 && historicalLogs.length === 0 ? (
            <div className="text-center py-8">
              <Terminal className="w-8 h-8 text-[#525252] mx-auto mb-2" />
              <p className="text-[#737373]">Waiting for trading activity...</p>
              <p className="text-[#525252] text-xs mt-1">Start trading to see live logs</p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`${getLogColor(log.type)} flex gap-2`}>
                <span className="text-[#525252]" suppressHydrationWarning>{log.timestamp}</span>
                {log.icon && <span className="flex-shrink-0 mt-0.5">{log.icon}</span>}
                <span className="whitespace-pre-wrap">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#1a1a1a] border-t border-[#262626] px-4 py-2 flex items-center justify-between text-xs text-[#737373]">
        <span>{historicalLogs.length + logs.length} log entries</span>
        <span>{historicalLogs.length > 0 ? 'Historical + ' : ''}Live (last 500)</span>
      </div>
    </div>
  )
}

