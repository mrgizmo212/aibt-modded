"use client"

import { Brain, Settings, Play, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { toggleModel } from "@/lib/mock-functions"
import { useIsMobile } from "@/hooks/use-mobile"

interface ModelCardsGridProps {
  onModelSelect: (id: number) => void
  onModelEdit: (id: number) => void
  onMobileDetailsClick?: (id: number) => void
}

const initialModels = [
  {
    id: 1,
    name: "GPT-5 Momentum",
    status: "running" as const,
    portfolio: 10234,
    return: 2.3,
    run: 5,
    hours: "3 hours",
    tradingStyle: "day-trading",
    strategy: "momentum",
  },
  {
    id: 2,
    name: "Claude Day Trader",
    status: "stopped" as const,
    portfolio: 9876,
    return: -1.2,
    run: 12,
    hours: "Yesterday",
    tradingStyle: "day-trading",
    strategy: "breakout",
  },
  {
    id: 3,
    name: "Gemini Long Term",
    status: "running" as const,
    portfolio: 11500,
    return: 15.0,
    run: 8,
    hours: "2 days",
    tradingStyle: "long-term",
    strategy: "momentum",
  },
]

export function ModelCardsGrid({ onModelSelect, onModelEdit, onMobileDetailsClick }: ModelCardsGridProps) {
  const [hoveredModel, setHoveredModel] = useState<number | null>(null)
  const [models, setModels] = useState(initialModels)
  const [loadingModels, setLoadingModels] = useState<Set<number>>(new Set())
  const isMobile = useIsMobile()

  const handleToggleModel = async (modelId: number, currentStatus: "running" | "stopped") => {
    console.log("[v0] Toggling model", modelId, "from", currentStatus)

    // Add to loading set
    setLoadingModels((prev) => new Set(prev).add(modelId))

    try {
      const newStatus = currentStatus === "running" ? "stopped" : "running"
      const result = await toggleModel(modelId, newStatus)

      if (result.success) {
        // Update local state
        setModels((prev) => prev.map((model) => (model.id === modelId ? { ...model, status: newStatus } : model)))
        console.log("[v0] Model toggled successfully:", result.message)
      }
    } catch (error) {
      console.error("[v0] Error toggling model:", error)
    } finally {
      // Remove from loading set
      setLoadingModels((prev) => {
        const next = new Set(prev)
        next.delete(modelId)
        return next
      })
    }
  }

  const handleViewDetails = (modelId: number) => {
    console.log("[v0] Viewing details for model", modelId)
    if (isMobile && onMobileDetailsClick) {
      onMobileDetailsClick(modelId)
    } else {
      onModelSelect(modelId)
    }
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
                } border`}
              >
                {model.status === "running" && <div className="w-2 h-2 bg-[#10b981] rounded-full pulse-dot mr-1.5" />}
                {model.status === "running" ? "Running" : "Stopped"}
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
    </div>
  )
}
