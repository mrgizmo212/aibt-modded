'use client'

import { useEffect, useState, useRef } from 'react'

interface TradingEvent {
  type: string
  timestamp: string
  data: {
    message: string
    action?: string
    step?: number
    tools?: string[]
  }
}

export function TradingFeed({ modelId }: { modelId: number }) {
  const [events, setEvents] = useState<TradingEvent[]>([])
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) return
    
    // Connect to SSE stream (pass token as query param since EventSource can't set headers)
    const eventSource = new EventSource(
      `http://localhost:8080/api/trading/stream/${modelId}?token=${token}`
    )
    
    eventSource.onopen = () => {
      setConnected(true)
      console.log('Trading stream connected')
    }
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('Received event:', data) // Debug log
        
        // Skip 'connected' type events (just connection confirmation)
        if (data.type === 'connected') {
          console.log('Stream connected to model', data.model_id)
          return
        }
        
        // Ensure proper structure
        const formattedEvent = {
          type: data.type || 'unknown',
          timestamp: data.timestamp || new Date().toISOString(),
          data: data.data || { message: 'No data' }
        }
        
        setEvents(prev => [...prev, formattedEvent].slice(-50)) // Keep last 50 events
      } catch (err) {
        console.error('Error parsing event:', err, event.data)
      }
    }
    
    eventSource.onerror = () => {
      setConnected(false)
      console.log('Trading stream disconnected')
    }
    
    eventSourceRef.current = eventSource
    
    // Cleanup
    return () => {
      eventSource.close()
    }
  }, [modelId])
  
  const getEventIcon = (type: string, action?: string) => {
    if (type === 'trade') {
      if (action === 'buy') return '📈'
      if (action === 'sell') return '📉'
      if (action === 'hold') return '⏸️'
    }
    if (type === 'thinking') return '🤔'
    if (type === 'session_start') return '🚀'
    if (type === 'session_complete') return '✅'
    if (type === 'error') return '❌'
    if (type === 'tool_use') return '🔧'
    return '💬'
  }
  
  const getEventColor = (type: string, action?: string) => {
    if (type === 'trade') {
      if (action === 'buy') return 'text-green-500'
      if (action === 'sell') return 'text-red-500'
      if (action === 'hold') return 'text-yellow-500'
    }
    if (type === 'error') return 'text-red-500'
    if (type === 'session_complete') return 'text-green-500'
    return 'text-gray-400'
  }
  
  if (events.length === 0) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">Live Trading Feed</h3>
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            {connected ? 'Waiting for trading events...' : 'Not connected'}
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Live Trading Feed</h3>
        {connected && (
          <span className="flex items-center gap-2 text-xs text-green-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live
          </span>
        )}
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {events.map((event, idx) => (
          <div
            key={idx}
            className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-md"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">
                {getEventIcon(event.type, event.data?.action)}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${getEventColor(event.type, event.data?.action)}`}>
                  {event.data?.message || 'Event'}
                </p>
                {event.data?.tools && event.data.tools.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Tools: {event.data.tools.join(', ')}
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'Just now'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {events.length >= 50 && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Showing latest 50 events
        </p>
      )}
    </div>
  )
}

