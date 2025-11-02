"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Trash2, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatsGrid } from "./embedded/stats-grid"
import { ModelCardsGrid } from "./embedded/model-cards-grid"
import { TradingForm } from "./embedded/trading-form"
import { AnalysisCard } from "./embedded/analysis-card"
import { ModelCreationStep } from "./embedded/model-creation-step"
import { PerformanceMetrics } from "./PerformanceMetrics"
import { PortfolioChart } from "./PortfolioChart"
import RunData from "./RunData"

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
}

interface ChatInterfaceProps {
  onContextChange: (context: "dashboard" | "model" | "run") => void
  onModelSelect: (id: number) => void
  onModelEdit?: (id: number) => void
  onMobileDetailsClick?: (id: number) => void
  onShowRunDetails?: (modelId: number, runId: number, runData: any) => void
}

export function ChatInterface({
  onContextChange,
  onModelSelect,
  onModelEdit,
  onMobileDetailsClick,
  onShowRunDetails,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      text: "Good morning! How can I help you with your trading today?",
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      suggestedActions: ["Show stats", "Show all models", "Create new model", "View recent runs"],
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [modelCreationData, setModelCreationData] = useState<any>({})
  const [currentCreationStep, setCurrentCreationStep] = useState<
    "name" | "type" | "strategy" | "risk" | "backtest" | "confirm" | null
  >(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
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
          suggestedActions: ["Show all models", "Start trading", "View backtest results"],
        }
        setMessages((prev) => [...prev, completionMessage])
        setModelCreationData({})
      }, 1000)
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
    const userInput = input // Save input before clearing
    setInput("")
    setIsTyping(true)

    setTimeout(async () => {
      let aiMessage: Message

      if (
        userInput.toLowerCase().includes("create") &&
        (userInput.toLowerCase().includes("model") || userInput.toLowerCase().includes("new"))
      ) {
        setCurrentCreationStep("name")
        aiMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          text: "Excellent! Let's create a new trading model together. I'll guide you through each step.",
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          embeddedComponent: { type: "model_creation_step", props: { step: "name", data: {} } },
        }
      } else if (userInput.toLowerCase().includes("show") && userInput.toLowerCase().includes("model")) {
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
          suggestedActions: modelCount === 0 ? ["Create new model"] : undefined,
        }
        onContextChange("dashboard")
      } else if (userInput.toLowerCase().includes("start") && userInput.toLowerCase().includes("claude")) {
        aiMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          text: "Ready to start trading on Claude Day Trader! Please configure:",
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          embeddedComponent: { type: "form" },
        }
        onContextChange("model")
        onModelSelect(2)
      } else if (userInput.toLowerCase().includes("why") && userInput.toLowerCase().includes("run")) {
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
      } else {
        aiMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          text: "I can help you with that! Try asking me to 'Show all models' or 'Analyze performance'.",
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          suggestedActions: ["Show all models", "Analyze performance", "Create new model"],
        }
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, 1000)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    setTimeout(() => handleSend(), 100)
  }

  return (
    <div className="h-screen bg-[#121212] flex flex-col">
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
                        <p className="text-sm lg:text-sm text-white leading-relaxed">{message.text}</p>
                        <p className="text-xs text-[#737373] mt-2">{message.timestamp}</p>
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
        {isTyping && (
          <div className="flex gap-2 lg:gap-3 max-w-[95%] lg:max-w-[90%]">
            <Avatar className="w-7 h-7 lg:w-8 lg:h-8 bg-[#3b82f6] flex-shrink-0">
              <AvatarFallback className="bg-[#3b82f6] text-white">
                <Bot className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-3 lg:p-4">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#a3a3a3] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-[#a3a3a3] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-[#a3a3a3] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 lg:p-4 bg-[#0a0a0a] border-t border-[#262626]">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 bg-[#1a1a1a] border-[#262626] text-white placeholder:text-[#7373a3] focus-visible:ring-[#3b82f6] h-11 lg:h-10"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white h-11 w-11 lg:h-10 lg:w-10"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
