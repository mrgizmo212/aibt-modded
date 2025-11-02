"use client"

import { Bot, Activity } from "lucide-react"
import { useState, useEffect } from "react"
import { getModels, getPortfolioStats, getTradingStatus } from "@/lib/api"
import { useTradingStream } from "@/hooks/use-trading-stream"

interface StatsGridProps {
  refreshTrigger?: number
}

export function StatsGrid({ refreshTrigger }: StatsGridProps = {}) {
  const [stats, setStats] = useState({
    totalModels: 0,
    activeModels: 0,
    pausedModels: 0,
    runsToday: 0,
    runningNow: 0,
    profitLoss: 0,
    profitLossPercent: 0,
    totalCapital: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [refreshTrigger]) // Refresh when trigger changes

  async function loadStats() {
    try {
      // Fetch models
      const models = await getModels()
      
      // Fetch trading status
      const tradingStatuses = await getTradingStatus()
      const statusMap: Record<number, boolean> = {}
      if (Array.isArray(tradingStatuses)) {
        tradingStatuses.forEach((status: any) => {
          statusMap[status.model_id] = status.is_running
        })
      }
      
      // Count active/paused
      const activeCount = Object.values(statusMap).filter(Boolean).length
      const pausedCount = models.length - activeCount
      
      // Fetch portfolio stats
      const portfolioStats = await getPortfolioStats()
      
      setStats({
        totalModels: models.length,
        activeModels: activeCount,
        pausedModels: pausedCount,
        runsToday: portfolioStats.totalRuns || 0,
        runningNow: activeCount,
        profitLoss: portfolioStats.totalPL || 0,
        profitLossPercent: portfolioStats.totalValue > 0 
          ? ((portfolioStats.totalPL / portfolioStats.totalValue) * 100) 
          : 0,
        totalCapital: portfolioStats.totalValue || 0,
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 lg:p-5">
            <div className="animate-pulse">
              <div className="h-3 bg-[#262626] rounded w-20 mb-2"></div>
              <div className="h-6 bg-[#262626] rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const plSign = stats.profitLoss >= 0 ? "+" : ""
  const plColor = stats.profitLoss >= 0 ? "text-[#10b981]" : "text-[#ef4444]"

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 lg:p-5">
        <p className="text-xs text-[#a3a3a3] mb-2">Total Models</p>
        <p className="text-xl lg:text-2xl font-bold font-mono text-white">{stats.totalModels}</p>
        <div className="flex items-center gap-2 mt-2">
          <Bot className="w-4 h-4 text-[#3b82f6]" />
          <span className="text-sm text-[#a3a3a3]">
            {stats.activeModels} active, {stats.pausedModels} paused
          </span>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 lg:p-5">
        <p className="text-xs text-[#a3a3a3] mb-2">Runs Today</p>
        <p className="text-xl lg:text-2xl font-bold font-mono text-white">{stats.runsToday}</p>
        <div className="flex items-center gap-2 mt-2">
          <Activity className="w-4 h-4 text-[#10b981]" />
          <span className="text-sm text-[#10b981]">
            {stats.runningNow} running now
          </span>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 lg:p-5">
        <p className="text-xs text-[#a3a3a3] mb-2">Combined P/L Today</p>
        <p className={`text-xl lg:text-2xl font-bold font-mono ${plColor}`}>
          {plSign}${Math.abs(stats.profitLoss).toLocaleString()}
        </p>
        <span className={`text-sm font-semibold ${plColor}`}>
          {plSign}{stats.profitLossPercent.toFixed(1)}%
        </span>
      </div>

      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 lg:p-5">
        <p className="text-xs text-[#a3a3a3] mb-2">Total Capital</p>
        <p className="text-xl lg:text-2xl font-bold font-mono text-white">
          ${stats.totalCapital.toLocaleString()}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-mono text-[#a3a3a3]">across all models</span>
        </div>
      </div>
    </div>
  )
}
