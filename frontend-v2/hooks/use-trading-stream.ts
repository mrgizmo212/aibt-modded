"use client"

import { useEffect, useState, useRef } from 'react'
import { getToken } from '@/lib/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const MAX_EVENTS = 100 // Keep only last 100 events in memory
const RECONNECT_DELAY = 3000 // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5

export interface TradingEvent {
  type: 'connected' | 'status' | 'trade' | 'session_complete' | 'complete' | 'error' | 'terminal' | 'progress'
  timestamp: string
  data: {
    model_id?: number
    message?: string
    action?: 'buy' | 'sell' | 'hold'
    [key: string]: any
  }
}

interface UseTradingStreamOptions {
  enabled?: boolean
  onEvent?: (event: TradingEvent) => void
  autoReconnect?: boolean
}

export function useTradingStream(
  modelId: number | null,
  options: UseTradingStreamOptions = {}
) {
  const {
    enabled = true,
    onEvent,
    autoReconnect = true
  } = options

  const [events, setEvents] = useState<TradingEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectingRef = useRef<boolean>(false)

  useEffect(() => {
    console.log('[SSE Hook] useEffect triggered - modelId:', modelId, 'enabled:', enabled)
    
    // Don't connect if disabled or no model selected
    if (!enabled || !modelId) {
      console.log('[SSE Hook] Not connecting - disabled or no modelId')
      return
    }

    console.log('[SSE Hook] Calling connectToStream for model:', modelId)
    connectToStream()

    // Cleanup on unmount or dependency change
    return () => {
      console.log('[SSE Hook] Cleanup - disconnecting')
      disconnectFromStream()
    }
  }, [modelId])  // Removed 'enabled' from deps - use only modelId to prevent rapid re-triggers

  function connectToStream() {
    // Guard #1: Check if already connecting (prevents React Strict Mode double-mount)
    if (isConnectingRef.current) {
      console.log('[SSE Hook] Already connecting, skipping duplicate attempt')
      return
    }
    
    // Guard #2: Check if already connected or connecting
    if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSource.CLOSED) {
      console.log('[SSE Hook] Connection already active (readyState:', eventSourceRef.current.readyState, '), skipping')
      return
    }
    
    // Set connecting flag
    isConnectingRef.current = true
    
    // Clean up any existing connection
    disconnectFromStream()

    const token = getToken()
    if (!token) {
      setError('Not authenticated')
      return
    }

    try {
      // Create EventSource with token in query parameter
      // EventSource can't send custom headers, so token must be in URL
      const url = `${API_BASE}/api/trading/stream/${modelId}?token=${token}`
      const eventSource = new EventSource(url)
      
      // CRITICAL: Set ref immediately to prevent duplicate connections in React Strict Mode
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log(`[SSE] Connected to trading stream for model ${modelId}`)
        setConnected(true)
        setError(null)
        setReconnectAttempts(0)
        isConnectingRef.current = false  // Clear connecting flag on success
      }

      eventSource.onmessage = (event) => {
        try {
          const parsedEvent: TradingEvent = JSON.parse(event.data)
          
          // Add to events array (keep only last MAX_EVENTS)
          setEvents(prev => {
            const updated = [...prev, parsedEvent]
            return updated.slice(-MAX_EVENTS)
          })

          // Call custom event handler if provided
          if (onEvent) {
            onEvent(parsedEvent)
          }

          console.log(`[SSE] Event received:`, parsedEvent.type, parsedEvent.data)
        } catch (e) {
          console.error('[SSE] Failed to parse event:', e)
        }
      }

      eventSource.onerror = (err) => {
        console.error('[SSE] Connection error:', err)
        setConnected(false)
        setError('Connection lost')
        isConnectingRef.current = false  // Clear connecting flag on error
        
        // Close current connection
        eventSource.close()

        // Attempt reconnection if enabled
        if (autoReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts) // Exponential backoff
          console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1)
            connectToStream()
          }, delay)
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          setError('Max reconnection attempts reached')
          console.error('[SSE] Max reconnection attempts reached')
        }
      }

    } catch (e) {
      console.error('[SSE] Failed to create EventSource:', e)
      setError('Failed to connect')
      eventSourceRef.current = null  // Clear ref on failure
      isConnectingRef.current = false  // Clear connecting flag on exception
    }
  }

  function disconnectFromStream() {
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Close EventSource
    if (eventSourceRef.current) {
      const wasConnected = connected  // Capture state before closing
      eventSourceRef.current.close()
      eventSourceRef.current = null
      console.log(`[SSE] Disconnected from trading stream for model ${modelId}`)
      
      // Only reset connecting flag if we were actually connected
      // This allows reconnection after real disconnects, but prevents
      // React Strict Mode double-mount from resetting the guard
      if (wasConnected) {
        isConnectingRef.current = false
      }
    }

    setConnected(false)
  }

  function clearEvents() {
    setEvents([])
  }

  function reconnect() {
    setReconnectAttempts(0)
    connectToStream()
  }

  return {
    events,
    connected,
    error,
    reconnectAttempts,
    clearEvents,
    reconnect,
    disconnect: disconnectFromStream,
  }
}

