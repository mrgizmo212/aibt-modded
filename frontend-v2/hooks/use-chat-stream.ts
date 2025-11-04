import { useState, useRef, useCallback } from 'react'

interface StreamMessage {
  type: 'token' | 'tool' | 'done' | 'error'
  content?: string
  tool?: string
  error?: string
}

interface UseChatStreamProps {
  modelId: number
  runId: number
  onComplete?: (fullResponse: string) => void
  onError?: (error: string) => void
}

export function useChatStream({ modelId, runId, onComplete, onError }: UseChatStreamProps) {
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
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/models/${modelId}/runs/${runId}/chat-stream?message=${encodeURIComponent(message)}&token=${token}`
    
    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data: StreamMessage = JSON.parse(event.data)

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
          setIsStreaming(false)
          onError?.(data.error || 'Unknown error')
          eventSource.close()
        }
      } catch (err) {
        console.error('Stream parse error:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.error('EventSource error:', err)
      setIsStreaming(false)
      onError?.('Connection error')
      eventSource.close()
    }
  }, [modelId, runId, onComplete, onError])

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

