import { useState, useRef, useCallback } from 'react'

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
    // Get auth token
    const token = localStorage.getItem('auth_token')
    if (!token) {
      onError?.('Not authenticated')
      return
    }

    setIsStreaming(true)
    setStreamedContent('')
    setToolsUsed([])
    contentRef.current = ''

    // Create EventSource for SSE
    let url: string
    
    if (isGeneral) {
      // General chat (no run context)
      url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chat/general-stream?message=${encodeURIComponent(message)}&token=${token}`
    } else {
      // Run-specific chat (with analysis tools)
      if (!modelId || !runId) {
        onError?.('No run selected')
        setIsStreaming(false)
        return
      }
      url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/models/${modelId}/runs/${runId}/chat-stream?message=${encodeURIComponent(message)}&token=${token}`
    }
    
    console.log('[Chat Stream] Connecting to:', url.replace(token, 'TOKEN_HIDDEN'))
    
    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('[Chat Stream] Connected successfully')
    }

    eventSource.onmessage = (event) => {
      try {
        const data: StreamMessage = JSON.parse(event.data)
        console.log('[Chat Stream] Received:', data.type)

        if (data.type === 'token' && data.content) {
          contentRef.current += data.content
          setStreamedContent(contentRef.current)
        } else if (data.type === 'tool' && data.tool) {
          setToolsUsed(prev => [...prev, data.tool!])
        } else if (data.type === 'done') {
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
        console.error('[Chat Stream] Parse error:', err)
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


