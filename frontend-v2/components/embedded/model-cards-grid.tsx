"use client"

import { Brain, Settings, Play, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { getModels, getPerformance, getTradingStatus, startTrading, stopTrading } from "@/lib/api"
import { useIsMobile } from "@/hooks/use-mobile"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { TradingForm } from "./trading-form"

interface ModelCardsGridProps {
  onModelSelect: (id: number) => void
  onModelEdit: (id: number) => void
  onMobileDetailsClick?: (id: number) => void
}

interface ModelCard {
  id: number
  name: string
  status: "running" | "stopped"
  portfolio: number
  return: number
  run: number
  hours: string
  tradingStyle: string
  strategy: string
  default_ai_model?: string
  model_parameters?: Record<string, any>
}

export function ModelCardsGrid({ onModelSelect, onModelEdit, onMobileDetailsClick }: ModelCardsGridProps) {
  const [hoveredModel, setHoveredModel] = useState<number | null>(null)
  const [models, setModels] = useState<ModelCard[]>([])
  const [loadingModels, setLoadingModels] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  
  // Trading form modal state
  const [showTradingForm, setShowTradingForm] = useState(false)
  const [tradingFormModelId, setTradingFormModelId] = useState<number | null>(null)
  const [tradingFormModelName, setTradingFormModelName] = useState<string>("")

  useEffect(() => {
    loadModels()
  }, [])

  async function loadModels() {
    try {
      const modelList = await getModels()
      const tradingStatuses = await getTradingStatus()
      
      // Create status map
      const statusMap: Record<number, boolean> = {}
      if (Array.isArray(tradingStatuses)) {
        tradingStatuses.forEach((status: any) => {
          statusMap[status.model_id] = status.is_running
        })
      }
      
      // Fetch performance for each model
      const modelsWithData = await Promise.all(
        modelList.map(async (model: any) => {
          try {
            const performance = await getPerformance(model.id)
            return {
              id: model.id,
              name: model.name,
              status: statusMap[model.id] ? "running" : "stopped" as const,
              portfolio: performance?.metrics?.final_value || 10000,
              return: performance?.metrics?.cumulative_return || 0,
              run: 0, // TODO: Get latest run number
              hours: statusMap[model.id] ? "Running now" : "Stopped",
              tradingStyle: "day-trading", // TODO: Derive from model settings
              strategy: "momentum", // TODO: Derive from model settings
              default_ai_model: model.default_ai_model,  // ← KEEP this from DB!
              model_parameters: model.model_parameters   // ← KEEP this too!
            }
          } catch (error) {
            // Return model with defaults if performance fetch fails
            return {
              id: model.id,
              name: model.name,
              status: statusMap[model.id] ? "running" : "stopped" as const,
              portfolio: 10000,
              return: 0,
              run: 0,
              hours: "No data",
              tradingStyle: "day-trading",
              strategy: "momentum",
              default_ai_model: model.default_ai_model,  // ← KEEP this from DB!
              model_parameters: model.model_parameters   // ← KEEP this too!
            }
          }
        })
      )
      
      setModels(modelsWithData)
    } catch (error) {
      console.error('Failed to load models:', error)
      toast.error('Failed to load models')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleModel = async (modelId: number, currentStatus: "running" | "stopped") => {
    console.log("Toggling model", modelId, "from", currentStatus)

    if (currentStatus === "running") {
      // STOP trading
      setLoadingModels((prev) => new Set(prev).add(modelId))
      
      try {
        await stopTrading(modelId)
        toast.success('Trading stopped')
        
        // Refresh models to get updated status
        await loadModels()
      } catch (error: any) {
        console.error("Error stopping trading:", error)
        toast.error(error.message || 'Failed to stop trading')
      } finally {
        setLoadingModels((prev) => {
          const next = new Set(prev)
          next.delete(modelId)
          return next
        })
      }
    } else {
      // START trading - SHOW FORM MODAL instead of immediately starting
      const model = models.find(m => m.id === modelId)
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
    
    // Refresh models to get updated status
    setTimeout(() => {
      loadModels()
    }, 2000)
  }

  const handleViewDetails = (modelId: number) => {
    console.log("Viewing details for model", modelId)
    if (isMobile && onMobileDetailsClick) {
      onMobileDetailsClick(modelId)
    } else {
      onModelSelect(modelId)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-5">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-[#262626] rounded w-3/4"></div>
              <div className="h-8 bg-[#262626] rounded w-1/2"></div>
              <div className="h-10 bg-[#262626] rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-8 text-center">
        <p className="text-[#a3a3a3]">No models yet. Create your first trading model!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {models.map((model) => {
        const isLoading = loadingModels.has(model.id)

        return (
          <div
            key={model.id}
            className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-5 hover:border-[#404040] transition-colors relative group"
            onMouseEnter={() => setHoveredModel(model.id)}
            onMouseLeave={() => setHoveredModel(null)}
          >
            <button
              onClick={() => onModelEdit(model.id)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-[#0a0a0a] border border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#404040] transition-all opacity-0 group-hover:opacity-100"
            >
              <Settings className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#3b82f6]" />
                <h3 className="text-base font-semibold text-white">{model.name}</h3>
              </div>
              <Badge
                className={`${
                  model.status === "running"
                    ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
                    : "bg-[#525252]/10 text-[#a3a3a3] border-[#525252]/20"
                } border flex items-center gap-1.5`}
              >
                {model.status === "running" && <div className="w-2 h-2 bg-[#10b981] rounded-full pulse-dot" />}
                {model.status === "running" ? "Live" : "Stopped"}
              </Badge>
            </div>

            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">${model.portfolio.toLocaleString()}</span>
                <span className={`text-base font-semibold ${model.return >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                  {model.return >= 0 ? "+" : ""}
                  {model.return}%
                </span>
              </div>
              <p className="text-xs text-[#737373] mt-1">
                Run #{model.run} • {model.hours}
              </p>
            </div>

            {/* Simple sparkline */}
            <div className="h-10 mb-4 flex items-end gap-0.5">
              {[...Array(20)].map((_, i) => {
                const height = model.return >= 0 ? 20 + Math.random() * 80 : 100 - Math.random() * 80
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm ${model.return >= 0 ? "bg-[#10b981]/30" : "bg-[#ef4444]/30"}`}
                    style={{ height: `${height}%` }}
                  />
                )
              })}
            </div>

            <div className="flex gap-2">
              {model.status === "running" ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 bg-[#ef4444] hover:bg-[#dc2626]"
                  onClick={() => handleToggleModel(model.id, model.status)}
                  disabled={isLoading}
                >
                  <Square className="w-3.5 h-3.5 mr-1.5" />
                  {isLoading ? "Stopping..." : "Stop"}
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white"
                  onClick={() => handleToggleModel(model.id, model.status)}
                  disabled={isLoading}
                >
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  {isLoading ? "Starting..." : "Start"}
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 bg-transparent border border-[#262626] hover:bg-[#1a1a1a] text-white"
                onClick={() => handleViewDetails(model.id)}
              >
                Details
              </Button>
            </div>
          </div>
        )
      })}
      
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
