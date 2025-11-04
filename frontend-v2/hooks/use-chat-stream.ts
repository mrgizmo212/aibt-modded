import { useState, useRef, useCallback } from 'react'
import { getToken } from '@/lib/auth'

interface StreamMessage {
  type: 'token' | 'tool' | 'done' | 'error'
  content?: string
  tool?: string
  error?: string
}

interface UseChatStreamProps {
  modelId?: number
  runId?: number
  isGeneral?: boolean  // General chat (no run context)
  onComplete?: (fullResponse: string) => void
  onError?: (error: string) => void
}

export function useChatStream({ modelId, runId, isGeneral = false, onComplete, onError }: UseChatStreamProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedContent, setStreamedContent] = useState('')
  const [toolsUsed, setToolsUsed] = useState<string[]>([])
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const contentRef = useRef('')

  const startStream = useCallback(async (message: string) => {
    console.log('[Chat Stream] startStream called with:', message)
    console.log('[Chat Stream] isGeneral:', isGeneral, 'modelId:', modelId, 'runId:', runId)
    
    // Get auth token using the proper helper function
    const token = getToken()
    console.log('[Chat Stream] Token exists:', !!token)
    
    if (!token) {
      console.error('[Chat Stream] No token found')
      onError?.('Not authenticated - no token')
      return
    }

    setIsStreaming(true)
    setStreamedContent('')
    setToolsUsed([])
    contentRef.current = ''

    // Create EventSource for SSE
    let url: string
    let eventSource: EventSource
    
    try {
      if (isGeneral) {
        // General chat (may have model context)
        let baseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/chat/general-stream?message=${encodeURIComponent(message)}&token=${encodeURIComponent(token)}`
        
        // Add model_id if present (for model-specific conversations without run)
        if (modelId) {
          baseUrl += `&model_id=${modelId}`
          console.log('[Chat Stream] Using GENERAL chat endpoint WITH model context:', modelId)
        } else {
          console.log('[Chat Stream] Using GENERAL chat endpoint (no model)')
        }
        
        url = baseUrl
      } else {
        // Run-specific chat (with analysis tools)
        if (!modelId || !runId) {
          console.error('[Chat Stream] Missing modelId or runId')
          onError?.('No run selected')
          setIsStreaming(false)
          return
        }
        url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/models/${modelId}/runs/${runId}/chat-stream?message=${encodeURIComponent(message)}&token=${encodeURIComponent(token)}`
        console.log('[Chat Stream] Using RUN-SPECIFIC chat endpoint')
      }
      
      console.log('[Chat Stream] Full URL:', url.substring(0, 100) + '...')
      console.log('[Chat Stream] Creating EventSource...')
      
      eventSource = new EventSource(url)
      eventSourceRef.current = eventSource
      console.log('[Chat Stream] EventSource created, waiting for connection...')
    } catch (err) {
      console.error('[Chat Stream] Failed to create EventSource:', err)
      setIsStreaming(false)
      onError?.('Failed to create connection')
      return
    }

    eventSource.onopen = () => {
      console.log('[Chat Stream] Connected successfully')
    }

    eventSource.onmessage = (event) => {
      console.log('[Chat Stream] RAW EVENT RECEIVED:', event)
      console.log('[Chat Stream] Event data:', event.data)
      
      try {
        const data: StreamMessage = JSON.parse(event.data)
        console.log('[Chat Stream] Parsed data:', data)
        console.log('[Chat Stream] Data type:', data.type)

        if (data.type === 'token' && data.content) {
          contentRef.current += data.content
          setStreamedContent(contentRef.current)
          console.log('[Chat Stream] Token added, content:', data.content, 'total length:', contentRef.current.length)
        } else if (data.type === 'tool' && data.tool) {
          console.log('[Chat Stream] Tool used:', data.tool)
          setToolsUsed(prev => [...prev, data.tool!])
        } else if (data.type === 'done') {
          console.log('[Chat Stream] Stream done, final length:', contentRef.current.length)
          setIsStreaming(false)
          onComplete?.(contentRef.current)
          eventSource.close()
        } else if (data.type === 'error') {
          console.error('[Chat Stream] Server error:', data.error)
          setIsStreaming(false)
          onError?.(data.error || 'Unknown error')
          eventSource.close()
        }
      } catch (err) {
        console.error('[Chat Stream] Parse error:', err, 'Raw data:', event.data)
      }
    }

    eventSource.onerror = (err) => {
      console.error('[Chat Stream] EventSource error:', err)
      console.error('[Chat Stream] ReadyState:', eventSource.readyState)
      
      // Check if we got an initial response
      if (eventSource.readyState === EventSource.CLOSED) {
        setIsStreaming(false)
        onError?.('Not authenticated')
        eventSource.close()
      } else {
        setIsStreaming(false)
        onError?.('Connection error')
        eventSource.close()
      }
    }
  }, [modelId, runId, isGeneral, onComplete, onError])

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsStreaming(false)
  }, [])

  return {
    startStream,
    stopStream,
    isStreaming,
    streamedContent,
    toolsUsed
  }
}


