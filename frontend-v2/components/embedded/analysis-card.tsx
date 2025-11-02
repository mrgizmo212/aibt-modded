"use client"

import { TrendingDown, TrendingUp, AlertTriangle, Scale, RefreshCw, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { getRunDetails } from "@/lib/api"

interface AnalysisCardProps {
  modelId?: number
  runId?: number
}

export function AnalysisCard({ modelId, runId }: AnalysisCardProps) {
  const [runData, setRunData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (modelId && runId) {
      loadRunAnalysis()
    } else {
      setLoading(false)
    }
  }, [modelId, runId])

  async function loadRunAnalysis() {
    try {
      const data = await getRunDetails(modelId!, runId!)
      setRunData(data)
    } catch (error) {
      console.error('Failed to load run analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-[#262626] rounded w-3/4"></div>
          <div className="h-20 bg-[#262626] rounded"></div>
        </div>
      </div>
    )
  }

  if (!runData) {
    return (
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
        <p className="text-[#a3a3a3] text-sm">Select a run to view analysis</p>
      </div>
    )
  }

  const isProfit = (runData.total_return || 0) >= 0
  const Icon = isProfit ? TrendingUp : TrendingDown
  return (
    <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl overflow-hidden">
      <div className={`${isProfit ? 'bg-[#10b981]/10 border-[#10b981]/20' : 'bg-[#ef4444]/10 border-[#ef4444]/20'} border-b p-4 flex items-center gap-3`}>
        <Icon className={`w-5 h-5 ${isProfit ? 'text-[#10b981]' : 'text-[#ef4444]'}`} />
        <div className="flex-1">
          <h3 className="text-base font-semibold text-white">Run #{runData.id} Analysis</h3>
          <p className="text-xs text-[#a3a3a3] mt-0.5">
            {isProfit ? '✓' : '✗'} {runData.total_return_percent?.toFixed(1) || 0}% • {runData.total_trades || 0} trades
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Issue 1 */}
        <div className="border border-[#262626] rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold text-white">No Stop-Loss Protection</h4>
                <Badge className="bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20 text-xs">Biggest Impact</Badge>
              </div>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Your biggest loss was -$215 on TSLA (trade #7 at 11:15am). The AI held this position down -8.6% before
                selling.
              </p>
            </div>
          </div>
          <Button size="sm" className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Stop-Loss at -5%
          </Button>
        </div>

        {/* Issue 2 */}
        <div className="border border-[#262626] rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            <Scale className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-2">Poor Win/Loss Ratio</h4>
              <div className="flex gap-4 mb-2">
                <div>
                  <p className="text-xs text-[#a3a3a3]">Avg Win</p>
                  <p className="text-sm font-mono text-[#10b981]">$45</p>
                </div>
                <div>
                  <p className="text-xs text-[#a3a3a3]">Avg Loss</p>
                  <p className="text-sm font-mono text-[#ef4444]">$87</p>
                </div>
                <div>
                  <p className="text-xs text-[#a3a3a3]">Ratio</p>
                  <p className="text-sm font-mono text-[#ef4444]">1:1.9</p>
                </div>
              </div>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Winners averaged $45 but losers averaged $87. You need winners 2x bigger than losers to profit.
              </p>
            </div>
          </div>
          <Button size="sm" className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Profit Target at +10%
          </Button>
        </div>

        {/* Issue 3 */}
        <div className="border border-[#262626] rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            <RefreshCw className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-1">Overtrading</h4>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                23 trades in 6.5 hours = 1 trade every 17 minutes. Many were whipsaw entries/exits.
              </p>
            </div>
          </div>
          <Button size="sm" className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Min Hold Time: 30min
          </Button>
        </div>

        {/* Performance Summary */}
        <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#a3a3a3]">Win Rate:</span>
            <span className="text-white font-mono">{runData.win_rate?.toFixed(1) || 0}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#a3a3a3]">Profit Factor:</span>
            <span className="text-white font-mono">{runData.profit_factor?.toFixed(2) || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#a3a3a3]">Max Drawdown:</span>
            <span className="text-[#ef4444] font-mono">{runData.max_drawdown?.toFixed(1) || 0}%</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white">
            View Full Report
          </Button>
          <Button variant="ghost" className="flex-1 text-[#a3a3a3] hover:text-white">
            Chat About Run
          </Button>
        </div>
      </div>
    </div>
  )
}
