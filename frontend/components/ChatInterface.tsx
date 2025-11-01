'use client'

import { useState, useEffect, useRef } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  tool_calls?: any[]
}

export default function ChatInterface({ 
  modelId, 
  runId 
}: { 
  modelId: number
  runId: number 
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Load chat history
  useEffect(() => {
    loadChatHistory()
  }, [modelId, runId])
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  async function loadChatHistory() {
    try {
      const response = await fetch(
        `http://localhost:8080/api/models/${modelId}/runs/${runId}/chat-history`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error('Failed to load chat history:', err)
    }
  }
  
  async function sendMessage() {
    if (!input.trim() || loading) return
    
    const userMessage = input.trim()
    setInput('')
    
    // Add user message immediately
    const newUserMsg: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, newUserMsg])
    
    setLoading(true)
    
    try {
      const response = await fetch(
        `http://localhost:8080/api/models/${modelId}/runs/${runId}/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ message: userMessage })
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to get response')
      }
      
      const data = await response.json()
      
      // Add AI response
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        tool_calls: data.tool_calls
      }
      setMessages(prev => [...prev, aiMsg])
      
    } catch (err: any) {
      console.error('Chat error:', err)
      const errorMsg: ChatMessage = {
        role: 'system',
        content: `Error: ${err.message}`,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-2">Start by asking about this trading run</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-600 ml-12'
                : msg.role === 'assistant'
                ? 'bg-zinc-800 mr-12'
                : 'bg-yellow-600/20 text-yellow-400'
            }`}
          >
            <div className="text-xs opacity-70 mb-1">
              {msg.role === 'user' ? '👤 You' : msg.role === 'assistant' ? '🤖 AI Analyst' : 'ℹ️ System'}
              <span className="ml-2">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {msg.content}
            </div>
            {msg.tool_calls && msg.tool_calls.length > 0 && (
              <div className="mt-2 text-xs opacity-60">
                Used tools: {msg.tool_calls.map((t: any) => t.tool || t.name).join(', ')}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="border-t border-zinc-800 pt-4">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage()}
            placeholder="Ask about this trading run..."
            disabled={loading}
            className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </div>
        
        {/* Suggested questions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setInput("Why did I lose money on this run?")}
            className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
            disabled={loading}
          >
            💭 Why did I lose money?
          </button>
          <button
            onClick={() => setInput("What were my best and worst trades?")}
            className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
            disabled={loading}
          >
            📊 Best/worst trades
          </button>
          <button
            onClick={() => setInput("Suggest rules to improve my performance")}
            className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
            disabled={loading}
          >
            💡 Suggest improvements
          </button>
          <button
            onClick={() => setInput("Calculate detailed metrics for this run")}
            className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
            disabled={loading}
          >
            📈 Show metrics
          </button>
        </div>
      </div>
    </div>
  )
}

