"use client"

import type React from "react"

import {
  LayoutDashboard,
  Plus,
  Shield,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Pencil,
  Check,
  X,
  Loader2,
  MessageSquare,
  Trash2,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { getModels, getTradingStatus, startIntradayTrading, stopTrading, updateModel, listChatSessions, createNewSession, resumeSession, deleteSession } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { useTradingStream } from "@/hooks/use-trading-stream"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { TradingForm } from "@/components/embedded/trading-form"

interface Model {
  id: number
  name: string
  status: "running" | "stopped"
  tradingStyle: "day-trading" | "swing-trading" | "scalping" | "long-term"
  default_ai_model?: string
  model_parameters?: Record<string, any>
}

interface NavigationSidebarProps {
  selectedModelId: number | null
  onSelectModel: (id: number) => void
  onToggleModel: (id: number) => void
}

export function NavigationSidebar({ selectedModelId, onSelectModel, onToggleModel }: NavigationSidebarProps) {
  const [modelsExpanded, setModelsExpanded] = useState(true)
  const [conversationsExpanded, setConversationsExpanded] = useState(true)
  const [expandedModels, setExpandedModels] = useState<Record<number, boolean>>({})
  const [editingModelId, setEditingModelId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")
  const [modelList, setModelList] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [tradingStatusMap, setTradingStatusMap] = useState<Record<number, boolean>>({})
  const [streamConnections, setStreamConnections] = useState<Record<number, boolean>>({})
  const [togglingModelId, setTogglingModelId] = useState<number | null>(null)
  const [savingModelId, setSavingModelId] = useState<number | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  
  // Trading form modal state
  const [showTradingForm, setShowTradingForm] = useState(false)
  const [tradingFormModelId, setTradingFormModelId] = useState<number | null>(null)
  const [tradingFormModelName, setTradingFormModelName] = useState<string>("")
  
  const { user, logout } = useAuth()
  
  // Chat sessions state
  const [generalConversations, setGeneralConversations] = useState<any[]>([])
  const [modelConversations, setModelConversations] = useState<Record<number, any[]>>({})

  // Get running model IDs for SSE connections
  const runningModelIds = modelList.filter(m => m.status === "running").map(m => m.id)
  const firstRunningId = runningModelIds[0] || null

  // Connect to SSE for running models
  const { events, connected } = useTradingStream(firstRunningId, {
    enabled: true, // Always enabled, will connect when firstRunningId becomes non-null
    onEvent: (event) => {
      // Handle real-time events
      console.log('[Navigation] SSE Event:', event.type, event.data)
      
      if (event.type === 'trade') {
        // Limit trade notifications (show every 5th trade to avoid spam)
        if (Math.random() < 0.2) {  // 20% chance = ~1 in 5 trades
          toast.info(`Trade: ${event.data?.action?.toUpperCase()}`, {
            description: event.data?.message,
            duration: 2000
          })
        }
        
        // Trigger refresh of stats and positions on trade events
        // Use counter or callback to trigger parent refresh
      }
      
      if (event.type === 'status') {
        // Only toast for important status updates, not every progress update
        if (!event.data?.message?.includes('minute')) {
          toast.info('Status Update', {
            description: event.data?.message,
            duration: 2000
          })
        }
      }
      
      if (event.type === 'progress') {
        // Don't toast progress, just log it (reduces spam)
        console.log('[Progress]', event.data?.message)
      }
      
      if (event.type === 'complete' || event.type === 'session_complete') {
        toast.success('Trading Session Completed')
        // Refresh trading status
        setTimeout(() => {
          loadTradingStatus()
          loadModels()
        }, 1000)
      }
      
      if (event.type === 'error') {
        toast.error('Trading Error', {
          description: event.data?.message
        })
      }
    }
  })

  // Track connected models and log connection status
  useEffect(() => {
    console.log('[Navigation] Running models:', runningModelIds, 'First:', firstRunningId, 'Connected:', connected)
    
    if (firstRunningId && connected) {
      setStreamConnections(prev => ({ ...prev, [firstRunningId]: true }))
    } else if (firstRunningId && !connected) {
      // Remove connection if disconnected
      setStreamConnections(prev => {
        const next = { ...prev }
        delete next[firstRunningId]
        return next
      })
    }
  }, [firstRunningId, connected, runningModelIds.length])

  // Load models and trading status on mount
  useEffect(() => {
    loadModels()
    loadTradingStatus()
    loadGeneralConversations()
    
    // Refresh status periodically for models not using SSE
    const interval = setInterval(() => {
      loadTradingStatus()
    }, 30000) // Every 30 seconds
    
    return () => clearInterval(interval)
  }, [])
  
  // Load model conversations when model list changes
  useEffect(() => {
    if (modelList.length > 0) {
      loadAllModelConversations()
    }
  }, [modelList.length])

  async function loadModels() {
    try {
      const data = await getModels()
      // Map backend model structure to component structure
      const mappedModels: Model[] = data.map((model: any) => ({
        id: model.id,
        name: model.name,
        status: "stopped" as const, // Will be updated by loadTradingStatus
        tradingStyle: "day-trading" as const, // Default, could be derived from model settings
        default_ai_model: model.default_ai_model,  // ← KEEP this from DB!
        model_parameters: model.model_parameters   // ← KEEP this too!
      }))
      setModelList(mappedModels)
    } catch (error) {
      console.error('Failed to load models:', error)
      toast.error('Failed to load models')
    } finally {
      setLoading(false)
    }
  }
  
  // Load general conversations
  async function loadGeneralConversations() {
    try {
      const data = await listChatSessions()  // No model_id = general conversations
      setGeneralConversations(data.sessions || [])
    } catch (error) {
      console.error('Failed to load general conversations:', error)
    }
  }
  
  // Load conversations for all models
  async function loadAllModelConversations() {
    for (const model of modelList) {
      try {
        const data = await listChatSessions(model.id)
        setModelConversations(prev => ({
          ...prev,
          [model.id]: data.sessions || []
        }))
      } catch (error) {
        console.error(`Failed to load conversations for model ${model.id}:`, error)
      }
    }
  }

  async function loadTradingStatus() {
    try {
      const statuses = await getTradingStatus()
      console.log('[Navigation] Trading status response:', statuses)
      
      // Convert array of statuses to map
      const statusMap: Record<number, boolean> = {}
      if (Array.isArray(statuses)) {
        console.log('[Navigation] Status is array, length:', statuses.length)
        statuses.forEach((status: any) => {
          console.log('[Navigation] Processing status:', status)
          statusMap[status.model_id] = status.is_running
        })
      } else {
        console.log('[Navigation] Status is NOT array:', typeof statuses)
      }
      
      console.log('[Navigation] Final statusMap:', statusMap)
      setTradingStatusMap(statusMap)
      
      // Update model list with trading status
      setModelList(prev => {
        const updated = prev.map(model => ({
          ...model,
          status: (statusMap[model.id] ? "running" : "stopped") as "running" | "stopped"
        }))
        console.log('[Navigation] Updated model list:', updated)
        return updated
      })
    } catch (error) {
      console.error('Failed to load trading status:', error)
    }
  }

  async function handleToggle(modelId: number) {
    const isRunning = tradingStatusMap[modelId]
    
    if (isRunning) {
      // STOP trading
      setTogglingModelId(modelId)
      try {
        toast.info('Stopping trading...')
        await stopTrading(modelId)
        toast.success('Trading stopped')
        
        // Wait a bit for backend to update status
        setTimeout(async () => {
          await loadTradingStatus()
          await loadModels()
        }, 1000)
        
        onToggleModel(modelId)
      } catch (error: any) {
        console.error('Failed to stop trading:', error)
        toast.error(error.message || 'Failed to stop trading')
      } finally {
        setTogglingModelId(null)
      }
    } else {
      // START trading - SHOW FORM MODAL instead of immediately starting
      const model = modelList.find(m => m.id === modelId)
      if (!model || !model.default_ai_model) {
        toast.error('Model has no AI model configured. Please edit the model first.')
        return
      }
      
      // Open Trading Form modal
      setTradingFormModelId(modelId)
      setTradingFormModelName(model.name)
      setShowTradingForm(true)
    }
  }
  
  // Callback when trading form successfully starts
  function handleTradingFormSuccess() {
    setShowTradingForm(false)
    setTradingFormModelId(null)
    setTradingFormModelName("")
    
    // Refresh status
    setTimeout(async () => {
      await loadTradingStatus()
      await loadModels()
    }, 2000)
    
    if (tradingFormModelId) {
      onToggleModel(tradingFormModelId)
    }
  }

  const groupedModels = modelList.reduce(
    (acc, model) => {
      if (!acc[model.tradingStyle]) {
        acc[model.tradingStyle] = []
      }
      acc[model.tradingStyle].push(model)
      return acc
    },
    {} as Record<string, Model[]>,
  )

  const tradingStyleLabels: Record<string, string> = {
    "day-trading": "Day Trading",
    "swing-trading": "Swing Trading",
    scalping: "Scalping",
    "long-term": "Long-term",
  }

  const handleStartEdit = (model: Model, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingModelId(model.id)
    setEditingName(model.name)
  }

  const handleSaveEdit = async (modelId: number) => {
    setSavingModelId(modelId)
    try {
      await updateModel(modelId, { name: editingName })
      setModelList(modelList.map((m) => (m.id === modelId ? { ...m, name: editingName } : m)))
      toast.success('Model name updated')
    } catch (error) {
      console.error('Failed to update model name:', error)
      toast.error('Failed to update model name')
    } finally {
      setSavingModelId(null)
      setEditingModelId(null)
      setEditingName("")
    }
  }

  const handleCancelEdit = () => {
    setEditingModelId(null)
    setEditingName("")
  }
  
  // Conversation handlers (mock for now, will wire up API later)
  const toggleModelExpanded = (modelId: number) => {
    setExpandedModels(prev => ({
      ...prev,
      [modelId]: !prev[modelId]
    }))
  }
  
  const handleSelectGeneralConversation = async (convId: number) => {
    try {
      await resumeSession(convId)
      setSelectedConversationId(convId)
      toast.info("Switched to conversation", { duration: 1000 })
      // TODO: Load messages into chat interface
    } catch (error: any) {
      toast.error(error.message || "Failed to switch conversation")
    }
  }
  
  const handleSelectModelConversation = async (modelId: number, convId: number) => {
    try {
      await resumeSession(convId)
      setSelectedConversationId(convId)
      onSelectModel(modelId)
      toast.info("Switched to conversation", { duration: 1000 })
      // TODO: Load messages into chat interface
    } catch (error: any) {
      toast.error(error.message || "Failed to switch conversation")
    }
  }
  
  const handleNewGeneralChat = async () => {
    try {
      const data = await createNewSession()  // No model_id = general
      const newSession = data.session
      
      setGeneralConversations(prev => [newSession, ...prev])
      setSelectedConversationId(newSession.id)
      toast.success("Started new conversation")
    } catch (error: any) {
      toast.error(error.message || "Failed to create conversation")
    }
  }
  
  const handleNewModelChat = async (modelId: number) => {
    try {
      const data = await createNewSession(modelId)
      const newSession = data.session
      
      setModelConversations(prev => ({
        ...prev,
        [modelId]: [newSession, ...(prev[modelId] || [])]
      }))
      setSelectedConversationId(newSession.id)
      onSelectModel(modelId)
      toast.success("Started new conversation for this model")
    } catch (error: any) {
      toast.error(error.message || "Failed to create conversation")
    }
  }
  
  const handleDeleteConversation = async (convId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      await deleteSession(convId)
      setGeneralConversations(prev => prev.filter(c => c.id !== convId))
      
      if (selectedConversationId === convId) {
        setSelectedConversationId(null)
      }
      
      toast.success("Conversation deleted")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete conversation")
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
      // Don't show error toast as logout will still clear local state
    }
    // Note: logout() in auth context handles redirect and cleanup
    // isLoggingOut will be reset when component unmounts
  }

  return (
    <div className="w-full h-screen bg-[#0a0a0a] border-r border-[#262626] flex flex-col">
      {/* Branding & User Profile */}
      <div className="p-6 border-b border-[#262626]">
        <div className="flex items-center gap-3 mb-4">
          <img 
            src="https://truetradinggroup.com/wp-content/uploads/2025/10/darkLogoN.png" 
            alt="TTG Pro"
            className="h-8 w-auto"
          />
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src="https://ui-avatars.com/api/?name=Adam&background=3b82f6&color=fff" />
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">Adam</div>
            <div className="text-[#a3a3a3] text-xs truncate">adam@truetradinggroup.com</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <nav className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1a1a1a] border-l-3 border-l-[#3b82f6] text-white hover:bg-[#141414] transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>

          {/* CONVERSATIONS Section (NEW) */}
          <div className="pt-4">
            <div className="flex items-center justify-between px-3 py-2">
              <button
                onClick={() => setConversationsExpanded(!conversationsExpanded)}
                className="flex items-center gap-2 text-[#a3a3a3] hover:text-white transition-colors"
              >
                <span className="text-xs font-semibold uppercase tracking-wider">Conversations</span>
                {conversationsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              <button
                onClick={handleNewGeneralChat}
                className="p-1 hover:bg-[#1a1a1a] rounded text-[#a3a3a3] hover:text-white transition-colors"
                title="New Chat"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {conversationsExpanded && (
              <div className="mt-1 space-y-1">
                {generalConversations.length === 0 ? (
                  <div className="px-3 py-2 text-center text-[#737373] text-xs">
                    No conversations yet
                  </div>
                ) : (
                  generalConversations.map((convo) => (
                    <div
                      key={convo.id}
                      onClick={() => handleSelectGeneralConversation(convo.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#141414] transition-colors cursor-pointer group ${
                        selectedConversationId === convo.id ? "bg-[#1a1a1a] border-l-2 border-l-[#3b82f6]" : ""
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-[#737373] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{convo.session_title}</p>
                        <p className="text-xs text-[#737373]">{convo.message_count} messages • {convo.last_message}</p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(convo.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#1a1a1a] rounded text-[#ef4444] transition-opacity"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* My Models Section */}
          <div className="pt-4">
            <button
              onClick={() => setModelsExpanded(!modelsExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 text-[#a3a3a3] hover:text-white transition-colors"
            >
              <span className="text-xs font-semibold uppercase tracking-wider">My Models</span>
              {modelsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {modelsExpanded && (
              <div className="mt-1 space-y-3">
                {loading ? (
                  <div className="px-3 py-4 space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2">
                        <div className="w-2 h-2 rounded-full bg-[#262626] animate-pulse" />
                        <div className="h-4 bg-[#262626] rounded animate-pulse flex-1" />
                      </div>
                    ))}
                  </div>
                ) : modelList.length === 0 ? (
                  <div className="px-3 py-4 text-center text-[#737373] text-sm">
                    No models yet. Create your first model!
                  </div>
                ) : (
                  Object.entries(groupedModels).map(([style, styleModels]) => (
                  <div key={style}>
                    <div className="px-3 py-1 text-[#737373] text-xs font-medium uppercase tracking-wide">
                      {tradingStyleLabels[style]}
                    </div>
                    <div className="space-y-1">
                      {styleModels.map((model) => (
                        <div key={model.id} className="space-y-1">
                          {/* Model header row */}
                          <div className="flex items-center gap-1">
                            {/* Expand/collapse button */}
                            <button
                              onClick={() => toggleModelExpanded(model.id)}
                              className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
                            >
                              {expandedModels[model.id] ? (
                                <ChevronDown className="w-3.5 h-3.5 text-[#737373]" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-[#737373]" />
                              )}
                            </button>
                            
                            {/* Model info */}
                            <div
                              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#141414] transition-colors cursor-pointer group ${
                                selectedModelId === model.id ? "bg-[#1a1a1a] border-l-3 border-l-[#3b82f6]" : ""
                              }`}
                              onClick={() => onSelectModel(model.id)}
                            >
                              <div
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  model.status === "running" ? "bg-[#10b981] pulse-dot" : "bg-[#525252]"
                                }`}
                              />

                          {editingModelId === model.id ? (
                            <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="h-7 text-sm bg-[#1a1a1a] border-[#404040] text-white"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveEdit(model.id)
                                  if (e.key === "Escape") handleCancelEdit()
                                }}
                              />
                              <button
                                onClick={() => handleSaveEdit(model.id)}
                                disabled={savingModelId === model.id}
                                className="p-1 hover:bg-[#1a1a1a] rounded text-[#10b981] disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {savingModelId === model.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 hover:bg-[#1a1a1a] rounded text-[#ef4444]"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1 flex items-center gap-2 min-w-0">
                                <span className="text-sm text-white truncate">{model.name}</span>
                                {model.status === "running" && streamConnections[model.id] && (
                                  <span className="text-xs text-[#10b981] flex items-center gap-1 flex-shrink-0">
                                    <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full pulse-dot" />
                                    Live
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={(e) => handleStartEdit(model, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#1a1a1a] rounded text-[#a3a3a3] hover:text-white transition-all"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {togglingModelId === model.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[#3b82f6] opacity-100" />
                              ) : (
                                <Switch
                                  checked={model.status === "running"}
                                  onCheckedChange={() => handleToggle(model.id)}
                                  disabled={togglingModelId === model.id}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              )}
                            </>
                          )}
                            </div>
                          </div>
                          
                          {/* Model's conversations (when expanded) */}
                          {expandedModels[model.id] && (
                            <div className="ml-8 space-y-1">
                              {/* New Chat button */}
                              <button
                                onClick={() => handleNewModelChat(model.id)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#737373] hover:text-white hover:bg-[#1a1a1a] rounded transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                New Chat
                              </button>
                              
                              {/* Conversations list */}
                              {modelConversations[model.id]?.length > 0 ? (
                                modelConversations[model.id].map((convo) => (
                                  <div
                                    key={convo.id}
                                    onClick={() => handleSelectModelConversation(model.id, convo.id)}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#1a1a1a] transition-colors cursor-pointer group ${
                                      selectedConversationId === convo.id ? "bg-[#1a1a1a] border-l-2 border-l-[#3b82f6]" : ""
                                    }`}
                                  >
                                    <MessageSquare className="w-3 h-3 text-[#737373] flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-white truncate">{convo.session_title}</p>
                                      <p className="text-[10px] text-[#737373]">{convo.message_count} msgs</p>
                                    </div>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation()
                                        
                                        try {
                                          await deleteSession(convo.id)
                                          setModelConversations(prev => ({
                                            ...prev,
                                            [model.id]: prev[model.id].filter(c => c.id !== convo.id)
                                          }))
                                          
                                          if (selectedConversationId === convo.id) {
                                            setSelectedConversationId(null)
                                          }
                                          
                                          toast.success("Conversation deleted")
                                        } catch (error: any) {
                                          toast.error(error.message || "Failed to delete conversation")
                                        }
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#262626] rounded text-[#ef4444] transition-opacity"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className="px-2 py-1 text-[10px] text-[#737373] text-center">
                                  No conversations yet
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
                )}
              </div>
            )}
          </div>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-dashed border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#404040] transition-colors mt-2">
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">Create Model</span>
          </button>

          <button 
            onClick={() => window.location.href = '/admin'}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#a3a3a3] hover:text-white hover:bg-[#141414] transition-colors mt-4"
          >
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">Admin</span>
          </button>
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#262626] space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#a3a3a3] hover:text-white hover:bg-[#141414] transition-colors">
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </button>
        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#a3a3a3] hover:text-white hover:bg-[#141414] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <LogOut className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>

      {/* Trading Form Modal */}
      <Dialog open={showTradingForm} onOpenChange={setShowTradingForm}>
        <DialogContent className="bg-[#0a0a0a] border-[#262626] max-w-2xl">
          <DialogTitle className="sr-only">Start Trading Configuration</DialogTitle>
          <TradingForm
            modelId={tradingFormModelId || undefined}
            modelName={tradingFormModelName}
            onClose={() => setShowTradingForm(false)}
            onSuccess={handleTradingFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
