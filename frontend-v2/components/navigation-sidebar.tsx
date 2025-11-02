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
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { getModels, getTradingStatus, startTrading, stopTrading, updateModel } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface Model {
  id: number
  name: string
  status: "running" | "stopped"
  tradingStyle: "day-trading" | "swing-trading" | "scalping" | "long-term"
}

interface NavigationSidebarProps {
  selectedModelId: number | null
  onSelectModel: (id: number) => void
  onToggleModel: (id: number) => void
}

export function NavigationSidebar({ selectedModelId, onSelectModel, onToggleModel }: NavigationSidebarProps) {
  const [modelsExpanded, setModelsExpanded] = useState(true)
  const [editingModelId, setEditingModelId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")
  const [modelList, setModelList] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [tradingStatusMap, setTradingStatusMap] = useState<Record<number, boolean>>({})
  const { user } = useAuth()

  // Load models and trading status on mount
  useEffect(() => {
    loadModels()
    loadTradingStatus()
  }, [])

  async function loadModels() {
    try {
      const data = await getModels()
      // Map backend model structure to component structure
      const mappedModels: Model[] = data.map((model: any) => ({
        id: model.id,
        name: model.name,
        status: "stopped" as const, // Will be updated by loadTradingStatus
        tradingStyle: "day-trading" as const, // Default, could be derived from model settings
      }))
      setModelList(mappedModels)
    } catch (error) {
      console.error('Failed to load models:', error)
      toast.error('Failed to load models')
    } finally {
      setLoading(false)
    }
  }

  async function loadTradingStatus() {
    try {
      const statuses = await getTradingStatus()
      // Convert array of statuses to map
      const statusMap: Record<number, boolean> = {}
      if (Array.isArray(statuses)) {
        statuses.forEach((status: any) => {
          statusMap[status.model_id] = status.is_running
        })
      }
      setTradingStatusMap(statusMap)
      
      // Update model list with trading status
      setModelList(prev => prev.map(model => ({
        ...model,
        status: statusMap[model.id] ? "running" : "stopped"
      })))
    } catch (error) {
      console.error('Failed to load trading status:', error)
    }
  }

  async function handleToggle(modelId: number) {
    const isRunning = tradingStatusMap[modelId]
    
    try {
      if (isRunning) {
        await stopTrading(modelId)
        toast.success('Trading stopped')
      } else {
        await startTrading(modelId, 'paper')
        toast.success('Trading started')
      }
      
      // Refresh status
      await loadTradingStatus()
      onToggleModel(modelId)
    } catch (error: any) {
      console.error('Failed to toggle trading:', error)
      toast.error(error.message || 'Failed to toggle trading')
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
    try {
      await updateModel(modelId, { name: editingName })
      setModelList(modelList.map((m) => (m.id === modelId ? { ...m, name: editingName } : m)))
      toast.success('Model name updated')
    } catch (error) {
      console.error('Failed to update model name:', error)
      toast.error('Failed to update model name')
    } finally {
      setEditingModelId(null)
      setEditingName("")
    }
  }

  const handleCancelEdit = () => {
    setEditingModelId(null)
    setEditingName("")
  }

  return (
    <div className="w-full h-screen bg-[#0a0a0a] border-r border-[#262626] flex flex-col">
      {/* Branding & User Profile */}
      <div className="p-6 border-b border-[#262626]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-[#3b82f6] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            TTG
          </div>
          <span className="text-white font-semibold text-lg">TTG Pro</span>
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
                {Object.entries(groupedModels).map(([style, styleModels]) => (
                  <div key={style}>
                    <div className="px-3 py-1 text-[#737373] text-xs font-medium uppercase tracking-wide">
                      {tradingStyleLabels[style]}
                    </div>
                    <div className="space-y-1">
                      {styleModels.map((model) => (
                        <div
                          key={model.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#141414] transition-colors cursor-pointer group ${
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
                                className="p-1 hover:bg-[#1a1a1a] rounded text-[#10b981]"
                              >
                                <Check className="w-4 h-4" />
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
                              <span className="flex-1 text-sm text-white truncate">{model.name}</span>
                              <button
                                onClick={(e) => handleStartEdit(model, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#1a1a1a] rounded text-[#a3a3a3] hover:text-white transition-all"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <Switch
                                checked={model.status === "running"}
                                onCheckedChange={() => handleToggle(model.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-dashed border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#404040] transition-colors mt-2">
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">Create Model</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#a3a3a3] hover:text-white hover:bg-[#141414] transition-colors mt-4">
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
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#a3a3a3] hover:text-white hover:bg-[#141414] transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  )
}
