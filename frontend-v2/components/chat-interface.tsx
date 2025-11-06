"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Trash2, Bot, Square, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { StatsGrid } from "./embedded/stats-grid"
import { ModelCardsGrid } from "./embedded/model-cards-grid"
import { TradingForm } from "./embedded/trading-form"
import { AnalysisCard } from "./embedded/analysis-card"
import { ModelCreationStep } from "./embedded/model-creation-step"
import { PerformanceMetrics } from "./PerformanceMetrics"
import { PortfolioChart } from "./PortfolioChart"
import RunData from "./RunData"
import { MarkdownRenderer } from "./markdown-renderer"
import { useChatStream } from "@/hooks/use-chat-stream"
import { toast } from "sonner"

export interface Message {
  id: string
  type: "user" | "ai"
  text: string
  timestamp: string
  embeddedComponent?: {
    type: "stats_grid" | "model_cards" | "form" | "analysis" | "model_creation_step" | "run_details" | "performance_chart"
    props?: any
  }
  suggestedActions?: string[]
  thinking?: boolean
  streaming?: boolean
  toolsUsed?: string[]
}

interface ChatInterfaceProps {
  onContextChange: (context: "dashboard" | "model" | "run") => void
  onModelSelect: (id: number) => void
  onModelEdit?: (id: number) => void
  onMobileDetailsClick?: (id: number) => void
  onShowRunDetails?: (modelId: number, runId: number, runData: any) => void
  selectedModelId?: number
  selectedRunId?: number
  // NEW: Ephemeral conversation props
  isEphemeral?: boolean  // Are we on /new or /m/[id]/new?
  ephemeralModelId?: number  // Model ID for /m/[id]/new
  selectedConversationId?: number | null  // Existing conversation ID for /c/[id]
  onConversationCreated?: (sessionId: number, modelId?: number) => void  // Callback after session created
}

export function ChatInterface({
  onContextChange,
  onModelSelect,
  onModelEdit,
  onMobileDetailsClick,
  onShowRunDetails,
  selectedModelId,
  selectedRunId,
  // NEW: Destructure ephemeral conversation props
  isEphemeral = false,
  ephemeralModelId,
  selectedConversationId,
  onConversationCreated,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      text: "Good morning! How can I help you with your trading today?",
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [modelCreationData, setModelCreationData] = useState<any>({})
  const [currentCreationStep, setCurrentCreationStep] = useState<
    "name" | "type" | "strategy" | "risk" | "backtest" | "confirm" | null
  >(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const streamingMessageIdRef = useRef<string | null>(null)
  
  // Detect chat type from URL and props
  // Model ID comes from props (passed from route params)
  const effectiveModelId = selectedModelId
  
  // Streaming hook - use general chat if no model, model-specific if model selected
  const canStream = true  // Always enable streaming!
  const isGeneralChat = !effectiveModelId || !selectedRunId
  
  const chatStream = useChatStream({
    modelId: effectiveModelId || undefined,
    runId: selectedRunId || undefined,
    isGeneral: isGeneralChat,
    onComplete: (fullResponse) => {
      console.log('[Chat] onComplete fired! Full response length:', fullResponse.length)
      console.log('[Chat] streamingMessageIdRef.current:', streamingMessageIdRef.current)
      // Update streaming message with final content using ref (not stale closure)
      const msgId = streamingMessageIdRef.current
      if (msgId) {
        console.log('[Chat] Marking message as complete, removing streaming flag')
        setMessages(prev => prev.map(m => 
          m.id === msgId 
            ? { ...m, streaming: false, text: fullResponse }
            : m
        ))
        setStreamingMessageId(null)
        streamingMessageIdRef.current = null
      }
      setIsTyping(false)
      console.log('[Chat] onComplete finished')
    },
    onError: (error) => {
      console.error('Stream error:', error)
      if (streamingMessageId) {
        setMessages(prev => prev.map(m =>
          m.id === streamingMessageId
            ? { ...m, streaming: false, text: `Error: ${error}` }
            : m
        ))
        setStreamingMessageId(null)
      }
    }
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, chatStream.streamedContent])
  
  // Track current session ID from URL
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  
  // Load conversation messages when selectedConversationId prop changes
  useEffect(() => {
    const loadConversationMessages = async () => {
      // Use prop instead of URL parsing
      const sessionId = selectedConversationId
      
      // CRITICAL: Don't reload if currently streaming (prevents race condition on first message)
      if (streamingMessageId || isTyping) {
        console.log('[Chat] Currently streaming, skip message reload to prevent clearing streaming state')
        return
      }
      
      // Check if session actually changed (prevent unnecessary reloads)
      if (sessionId === currentSessionId) {
        return  // Same conversation, don't reload
      }
      
      // Prevent concurrent loads
      if (isLoadingMessages) {
        console.log('[Chat] Already loading messages, skipping...')
        return
      }
      
      console.log('[Chat] Session changed from', currentSessionId, 'to', sessionId)
      setCurrentSessionId(sessionId ? sessionId.toString() : null)
      setIsLoadingMessages(true)
      
      if (!sessionId) {
        // No conversation selected, show only welcome message
        console.log('[Chat] No session ID, showing welcome message')
        setMessages([{
          id: "1",
          type: "ai",
          text: "Good morning! How can I help you with your trading today?",
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        }])
        setIsLoadingMessages(false)
        return
      }
      
      try {
        console.log('[Chat] Loading messages for session', sessionId)
        const { getSessionMessages } = await import('@/lib/api')
        const data = await getSessionMessages(sessionId)
        
        if (data.messages && data.messages.length > 0) {
          // Convert to Message format
          const historicalMessages = data.messages.map((msg: any) => ({
            id: msg.id.toString(),
            type: msg.role === 'user' ? 'user' : 'ai',
            text: msg.content,
            timestamp: new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            toolsUsed: msg.tool_calls || []
          }))
          
          // Show conversation history
          setMessages(historicalMessages)
          console.log('[Chat] Loaded', historicalMessages.length, 'messages for conversation', sessionId)
        } else {
          // Empty conversation, show welcome
          setMessages([{
            id: "1",
            type: "ai",
            text: "Good morning! How can I help you with your trading today?",
            timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            suggestedActions: ["Show stats", "Show all models", "Create new model", "View recent runs"],
          }])
        }
      } catch (error) {
        console.error('Failed to load conversation messages:', error)
      } finally {
        setIsLoadingMessages(false)
      }
    }
    
    loadConversationMessages()
  }, [selectedConversationId])  // Use prop instead of parsing URL
  
  // Listen for conversation deletion events
  useEffect(() => {
    const handleConversationDeleted = (e: Event) => {
      const customEvent = e as CustomEvent
      const { conversationId } = customEvent.detail
      
      // If we're viewing the deleted conversation (or any conversation on /new)
      // reset to welcome message
      if (currentSessionId === conversationId?.toString() || 
          (isEphemeral && currentSessionId)) {
        console.log('[Chat] Conversation deleted, resetting to welcome message')
        setCurrentSessionId(null)
        setMessages([{
          id: "1",
          type: "ai",
          text: "Good morning! How can I help you with your trading today?",
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        }])
      }
    }
    
    const handleNewChatRequested = () => {
      console.log('[Chat] New chat requested, resetting to fresh ephemeral state')
      setCurrentSessionId(null)
      setMessages([{
        id: "1",
        type: "ai",
        text: "Good morning! How can I help you with your trading today?",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        suggestedActions: ["Show stats", "Show all models", "Create new model", "View recent runs"],
      }])
    }
    
    window.addEventListener('conversation-deleted', handleConversationDeleted)
    window.addEventListener('new-chat-requested', handleNewChatRequested)
    return () => {
      window.removeEventListener('conversation-deleted', handleConversationDeleted)
      window.removeEventListener('new-chat-requested', handleNewChatRequested)
    }
  }, [currentSessionId, isEphemeral])
  
  // Update streaming message as content arrives
  useEffect(() => {
    if (streamingMessageId && chatStream.streamedContent) {
      console.log('[Chat] Updating streamed content, length:', chatStream.streamedContent.length)
      setMessages(prev => prev.map(m =>
        m.id === streamingMessageId
          ? { ...m, text: chatStream.streamedContent, toolsUsed: chatStream.toolsUsed }
          : m
      ))
    }
  }, [chatStream.streamedContent, chatStream.toolsUsed, streamingMessageId])
  
  // Expose method to add run details to chat
  useEffect(() => {
    if (onShowRunDetails) {
      // Create a function that adds run details to chat
      const showRunInChat = async (modelId: number, runId: number, runData: any) => {
        const newMessage: Message = {
          id: Date.now().toString(),
          type: "ai",
          text: `Here are the details for Run #${runData.run_number} (${runData.trading_mode === 'intraday' ? '⚡ Intraday' : '📅 Daily'}):`,
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          embeddedComponent: {
            type: "run_details",
            props: { run: runData, modelId }
          },
          suggestedActions: ["Compare with other runs", "Analyze AI decisions", "View all runs"]
        }
        
        setMessages(prev => [...prev, newMessage])
      }
      
      // Store it for parent to call
      (window as any).__showRunInChat = showRunInChat
    }
  }, [onShowRunDetails])

  const handleModelCreationNext = (stepData: any) => {
    const updatedData = { ...modelCreationData, ...stepData }
    setModelCreationData(updatedData)

    const stepOrder: Array<"name" | "type" | "strategy" | "risk" | "backtest" | "confirm"> = [
      "name",
      "type",
      "strategy",
      "risk",
      "backtest",
      "confirm",
    ]
    const currentIndex = stepOrder.indexOf(currentCreationStep!)
    const nextStep = stepOrder[currentIndex + 1]

    if (nextStep) {
      setCurrentCreationStep(nextStep)
      setTimeout(() => {
        let aiMessage: Message
        if (nextStep === "type") {
          aiMessage = {
            id: Date.now().toString(),
            type: "ai",
            text: `Great! "${updatedData.name}" is a perfect name. Now, what type of trading model would you like to create?`,
            timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            embeddedComponent: { type: "model_creation_step", props: { step: "type", data: updatedData } },
          }
        } else if (nextStep === "strategy") {
          const typeDisplay = updatedData.type?.replace("-", " ") || updatedData.type || "trading"
          aiMessage = {
            id: Date.now().toString(),
            type: "ai",
            text: `Perfect! ${typeDisplay} is a solid choice. What strategy would you like to use?`,
            timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            embeddedComponent: { type: "model_creation_step", props: { step: "strategy", data: updatedData } },
          }
        } else if (nextStep === "risk") {
          const strategyDisplay = updatedData.strategy?.replace("-", " ") || updatedData.strategy || "strategy"
          aiMessage = {
            id: Date.now().toString(),
            type: "ai",
            text: `Excellent! ${strategyDisplay} strategy selected. Now let's configure your risk parameters:`,
            timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            embeddedComponent: { type: "model_creation_step", props: { step: "risk", data: updatedData } },
          }
        } else if (nextStep === "backtest") {
          aiMessage = {
            id: Date.now().toString(),
            type: "ai",
            text: `Risk parameters set! ${updatedData.riskPerTrade}% per trade with ${updatedData.stopLoss}% stop loss.`,
            timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            embeddedComponent: { type: "model_creation_step", props: { step: "backtest", data: updatedData } },
          }
        } else if (nextStep === "confirm") {
          aiMessage = {
            id: Date.now().toString(),
            type: "ai",
            text: updatedData.backtest
              ? "Great! We'll run a backtest after creation. Let's review everything:"
              : "No problem! You can always backtest later. Let's review everything:",
            timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            embeddedComponent: { type: "model_creation_step", props: { step: "confirm", data: updatedData } },
          }
        }
        setMessages((prev) => [...prev, aiMessage!])
      }, 800)
    } else {
      setCurrentCreationStep(null)
      setTimeout(() => {
        const completionMessage: Message = {
          id: Date.now().toString(),
          type: "ai",
          text: `🎉 Success! "${updatedData.name}" has been created and ${updatedData.backtest ? "backtest is running" : "is ready to use"}. You can start trading or view it in your models list.`,
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        }
        setMessages((prev) => [...prev, completionMessage])
        setModelCreationData({})
      }, 1000)
    }
  }

  /**
   * Handle first message in ephemeral conversation
   * Creates session and streams response in ONE operation
   */
  const handleFirstMessage = async (message: string) => {
    setIsTyping(true)
    
    try {
      const { getToken } = await import('@/lib/auth')
      const token = getToken()
      
      if (!token) {
        console.error('[Chat] No auth token for first message')
        setIsTyping(false)
        toast.error('Not authenticated')
        return
      }
      
      // Construct URL for create-and-stream endpoint
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const modelParam = ephemeralModelId ? `&model_id=${ephemeralModelId}` : ''
      const url = `${API_BASE}/api/chat/stream-new?message=${encodeURIComponent(message)}&token=${encodeURIComponent(token)}${modelParam}`
      
      console.log('[Chat] Creating session + streaming first message')
      console.log('[Chat] Ephemeral mode:', isEphemeral, 'Model:', ephemeralModelId)
      
      // Create placeholder AI message for streaming
      const streamingMsgId = (Date.now() + 1).toString()
      const streamingMessage: Message = {
        id: streamingMsgId,
        type: "ai",
        text: "",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        streaming: true
      }
      
      setMessages(prev => [...prev, streamingMessage])
      setStreamingMessageId(streamingMsgId)
      streamingMessageIdRef.current = streamingMsgId
      
      // Open SSE connection
      const eventSource = new EventSource(url)
      let createdSessionId: number | null = null
      let fullResponse = ''
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('[Chat] SSE event:', data.type || data)
          
          // CRITICAL: Session created event (comes first)
          if (data.type === 'session_created' && data.session_id) {
            createdSessionId = data.session_id
            console.log('[Chat] ✅ Session created:', createdSessionId)
            
            // NOTE: Do NOT navigate yet - wait for streaming to complete
            // Will call onConversationCreated in 'done' event
            
            // Dispatch event for sidebar refresh (this is safe)
            window.dispatchEvent(new CustomEvent('conversation-created', {
              detail: { sessionId: createdSessionId, modelId: ephemeralModelId }
            }))
          }
          
          // Token streaming
          if (data.type === 'token' && data.content) {
            fullResponse += data.content
            setMessages(prev => prev.map(m =>
              m.id === streamingMsgId 
                ? { ...m, text: fullResponse }
                : m
            ))
          }
          
          // Tool usage
          if (data.type === 'tool' && data.tool) {
            setMessages(prev => prev.map(m =>
              m.id === streamingMsgId
                ? { ...m, toolsUsed: [...(m.toolsUsed || []), data.tool] }
                : m
            ))
          }
          
          // Stream complete
          if (data.type === 'done') {
            console.log('[Chat] ✅ Stream complete')
            setMessages(prev => prev.map(m =>
              m.id === streamingMsgId
                ? { ...m, streaming: false }
                : m
            ))
            eventSource.close()
            
            // Navigate FIRST (while streaming flags still set to prevent race)
            if (createdSessionId && onConversationCreated) {
              console.log('[Chat] Navigating to conversation:', createdSessionId)
              onConversationCreated(createdSessionId, ephemeralModelId)
            }
            
            // THEN clear streaming state after navigation completes
            // Delay to ensure URL change and guard check happen while flags still set
            setTimeout(() => {
              setStreamingMessageId(null)
              streamingMessageIdRef.current = null
              setIsTyping(false)
              console.log('[Chat] Cleared streaming state after navigation')
            }, 100)
          }
          
          // Error
          if (data.type === 'error') {
            console.error('[Chat] Stream error:', data.error)
            setMessages(prev => prev.map(m =>
              m.id === streamingMsgId
                ? { ...m, streaming: false, text: `Error: ${data.error}` }
                : m
            ))
            setIsTyping(false)
            eventSource.close()
          }
          
        } catch (err) {
          console.error('[Chat] Failed to parse SSE event:', err, 'Raw:', event.data)
        }
      }
      
      eventSource.onerror = (err) => {
        console.error('[Chat] SSE connection error:', err)
        setMessages(prev => prev.map(m =>
          m.id === streamingMsgId
            ? { ...m, streaming: false, text: 'Connection error. Please try again.' }
            : m
        ))
        setIsTyping(false)
        eventSource.close()
      }
      
    } catch (error: any) {
      console.error('[Chat] handleFirstMessage error:', error)
      toast.error(error.message || 'Failed to create conversation')
      setIsTyping(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      text: input,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    
    // DECISION POINT: Ephemeral or persistent conversation?
    if (isEphemeral) {
      // This is FIRST message in /new or /m/[id]/new
      // Create session AND stream in one call
      console.log('[Chat] Ephemeral mode - creating session with first message')
      await handleFirstMessage(currentInput)
      return
    }
    
    // Normal flow - existing conversation
    // ALWAYS use STREAMING chat with real AI (general or run-specific)
    setIsTyping(true)
    
    console.log('[Chat] Starting stream - isGeneral:', isGeneralChat, 'modelId:', selectedModelId, 'runId:', selectedRunId)
    
    // Create placeholder streaming message
    const streamingMsgId = (Date.now() + 1).toString()
    const streamingMessage: Message = {
      id: streamingMsgId,
      type: "ai",
      text: "",
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      streaming: true
    }
    
    setMessages(prev => [...prev, streamingMessage])
    setStreamingMessageId(streamingMsgId)
    streamingMessageIdRef.current = streamingMsgId  // ← Also save to ref
    
    // Start stream
    console.log('[Chat] Calling chatStream.startStream with message:', currentInput)
    try {
      await chatStream.startStream(currentInput)
      console.log('[Chat] Stream connection established')
      // Note: setIsTyping(false) is called in onComplete callback when stream finishes
    } catch (error) {
      console.error('[Chat] Stream start failed:', error)
      setIsTyping(false)
    }
    return
    
    // OLD PATTERN MATCHING (no longer used - AI handles everything)
    /* Fallback to pattern matching for dashboard commands (keep existing functionality)
    const userInput = currentInput.toLowerCase()
    setIsTyping(true)

    setTimeout(async () => {
      let aiMessage: Message

      // Show stats
      if (userInput.includes("stat") || userInput.includes("overview") || userInput.includes("dashboard")) {
        aiMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          text: "Here's your portfolio overview:",
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          embeddedComponent: { type: "stats_grid" },
        }
        onContextChange("dashboard")
      } 
      // Create new model
      else if (
        userInput.includes("create") &&
        (userInput.includes("model") || userInput.includes("new"))
      ) {
        setCurrentCreationStep("name")
        aiMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          text: "Excellent! Let's create a new trading model together. I'll guide you through each step.",
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          embeddedComponent: { type: "model_creation_step", props: { step: "name", data: {} } },
        }
      } 
      // Show all models
      else if (userInput.includes("show") && userInput.includes("model")) {
        // Fetch actual model count
        const { getModels } = await import('@/lib/api')
        const modelList = await getModels()
        const modelCount = modelList.length
        
        aiMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          text: modelCount > 0 
            ? `Here are your ${modelCount} trading model${modelCount === 1 ? '' : 's'}:` 
            : "You don't have any trading models yet. Would you like to create one?",
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          embeddedComponent: modelCount > 0 ? { type: "model_cards" } : undefined,
        }
        onContextChange("dashboard")
      } 
      // Analyze performance
      else if (userInput.includes("analyz") || userInput.includes("performance") || userInput.includes("metric")) {
        aiMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          text: "Here's your performance analysis. I can help you understand what worked and what didn't.",
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          embeddedComponent: { type: "stats_grid" },
        }
        onContextChange("dashboard")
      }
      // View recent runs
      else if (userInput.includes("run") || userInput.includes("recent") || userInput.includes("history")) {
        const { getModels } = await import('@/lib/api')
        const modelList = await getModels()
        
        aiMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          text: modelList.length > 0
            ? "Here are your trading models. Click 'Details' to see runs."
            : "No models yet. Create one to start trading!",
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          embeddedComponent: modelList.length > 0 ? { type: "model_cards" } : undefined,
          suggestedActions: modelList.length === 0 ? ["Create new model"] : undefined,
        }
        onContextChange("dashboard")
      }
      // Start trading (legacy)
      else if (userInput.includes("start") && userInput.includes("claude")) {
        aiMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          text: "Ready to start trading on Claude Day Trader! Please configure:",
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          embeddedComponent: { type: "form" },
        }
        onContextChange("model")
        onModelSelect(2)
      } 
      // Why questions (legacy demo)
      else if (userInput.includes("why") && userInput.includes("run")) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: "ai",
            text: "Let me analyze Run #12 for you...",
            timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            thinking: true,
          },
        ])

        setTimeout(() => {
          setMessages((prev) =>
            prev
              .filter((m) => !m.thinking)
              .concat({
                id: (Date.now() + 2).toString(),
                type: "ai",
                text: "I found 3 main issues with Run #12:",
                timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                embeddedComponent: { type: "analysis" },
              }),
          )
          onContextChange("run")
          setIsTyping(false)
        }, 2000)
        return
      } 
      // General greetings
      else if (userInput.includes("hello") || userInput.includes("hi") || userInput.includes("hey")) {
        aiMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          text: "Hello! I'm your trading assistant. I can help you analyze performance, create models, and manage your trading strategies.",
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        }
      }
      // Help/capabilities question
      else if (userInput.includes("help") || userInput.includes("what can you") || userInput.includes("how can you")) {
        aiMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          text: "I can help you with:\n\n📊 View your portfolio stats and performance\n🤖 Show and manage your trading models\n📈 Analyze trading runs and suggest improvements\n✨ Create new models with custom strategies\n📜 View trading history and recent runs\n\nClick a suggestion below or select a specific run to have a detailed AI conversation about performance!",
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        }
      }
      // Fallback - helpful suggestions
      else {
        aiMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          text: `I can help with: viewing stats, showing models, analyzing performance, or creating new models. Click a suggestion or select a specific run for detailed AI analysis.`,
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        }
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, 1000)
    */
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    setTimeout(() => handleSend(), 100)
  }

  return (
    <div className="h-full bg-[#121212] flex flex-col">
      <div className="hidden lg:block p-6 border-b border-[#262626]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">AI Assistant</h1>
            <p className="text-xs text-[#a3a3a3] mt-1">Ask me anything about your trading</p>
          </div>
          <Button variant="ghost" size="icon" className="text-[#a3a3a3] hover:text-white">
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-6 space-y-4 lg:space-y-6">
        {messages.map((message) => (
          <div key={message.id}>
            {message.type === "ai" ? (
              <div className="flex gap-2 lg:gap-3 max-w-[95%] lg:max-w-[90%]">
                <Avatar className="w-7 h-7 lg:w-8 lg:h-8 bg-[#3b82f6] flex-shrink-0">
                  <AvatarFallback className="bg-[#3b82f6] text-white">
                    <Bot className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-3 lg:p-4">
                    {message.thinking ? (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div
                            className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <div
                            className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <div
                            className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                        <span className="text-xs lg:text-sm text-[#a3a3a3]">Analyzing 23 trades...</span>
                      </div>
                    ) : (
                      <>
                        {message.streaming ? (
                          <>
                            <MarkdownRenderer 
                              content={chatStream.streamedContent} 
                              className="text-sm text-white"
                            />
                            {chatStream.toolsUsed.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {chatStream.toolsUsed.map((tool, i) => (
                                  <Badge key={i} variant="outline" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                                    🔧 {tool}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                              <span className="text-xs text-[#737373]">Streaming...</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <MarkdownRenderer 
                              content={message.text} 
                              className="text-sm text-white"
                            />
                            {message.toolsUsed && message.toolsUsed.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {message.toolsUsed.map((tool, i) => (
                                  <Badge key={i} variant="outline" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                                    🔧 {tool}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-[#737373] mt-2">{message.timestamp}</p>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {message.embeddedComponent && (
                    <div className="mt-3 lg:mt-4">
                      {message.embeddedComponent.type === "stats_grid" && <StatsGrid />}
                      {message.embeddedComponent.type === "model_cards" && (
                        <ModelCardsGrid
                          onModelSelect={onModelSelect}
                          onModelEdit={onModelEdit || (() => {})}
                          onMobileDetailsClick={onMobileDetailsClick}
                        />
                      )}
                      {message.embeddedComponent.type === "form" && <TradingForm />}
                      {message.embeddedComponent.type === "analysis" && <AnalysisCard />}
                      {message.embeddedComponent.type === "model_creation_step" && (
                        <ModelCreationStep
                          step={message.embeddedComponent.props.step}
                          data={message.embeddedComponent.props.data}
                          onNext={handleModelCreationNext}
                        />
                      )}
                      {message.embeddedComponent.type === "performance_chart" && message.embeddedComponent.props?.modelId && (
                        <div className="space-y-4">
                          <PerformanceMetrics modelId={message.embeddedComponent.props.modelId} />
                          <PortfolioChart modelId={message.embeddedComponent.props.modelId} />
                        </div>
                      )}
                      {message.embeddedComponent.type === "run_details" && message.embeddedComponent.props?.run && (
                        <RunData run={message.embeddedComponent.props.run} />
                      )}
                    </div>
                  )}

                  {message.suggestedActions && (
                    <div className="flex flex-wrap gap-2 mt-3 lg:mt-4">
                      {message.suggestedActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(action)}
                          className="px-3 py-1.5 bg-[#1a1a1a] border border-[#262626] rounded-full text-xs text-[#a3a3a3] hover:text-white hover:border-[#404040] transition-colors"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <div className="max-w-[95%] lg:max-w-[90%] bg-[#3b82f6] rounded-xl px-3 py-2.5 lg:px-4 lg:py-3">
                  <p className="text-sm text-white leading-relaxed">{message.text}</p>
                  <p className="text-xs text-white/70 mt-2">{message.timestamp}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {/* Removed: Three loading dots (isTyping animation) */}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 lg:p-4 bg-[#0a0a0a] border-t border-[#262626]">
        {/* Show context badge */}
        <div className="mb-2 text-xs text-[#737373] flex items-center gap-2">
          {!isGeneralChat ? (
            <>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                Run #{selectedRunId}
              </Badge>
              <span>AI chat with full analysis tools (4 tools available)</span>
            </>
          ) : (
            <>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                General Chat
              </Badge>
              <span>AI assistant (select a run for detailed analysis)</span>
            </>
          )}
        </div>
        
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={isGeneralChat ? "Ask me anything..." : "Ask about this run..."}
            disabled={chatStream.isStreaming}
            className="flex-1 bg-[#1a1a1a] border-[#262626] text-white placeholder:text-[#7373a3] focus-visible:ring-[#3b82f6] h-11 lg:h-10"
          />
          
          {chatStream.isStreaming ? (
            <Button
              onClick={chatStream.stopStream}
              className="bg-red-600 hover:bg-red-700 text-white h-11 w-11 lg:h-10 lg:w-10"
              title="Stop streaming"
            >
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white h-11 w-11 lg:h-10 lg:w-10"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
