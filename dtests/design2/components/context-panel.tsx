"use client"

import { Activity, CheckCircle, TrendingUp, TrendingDown, Bot, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ContextPanelProps {
  context: "dashboard" | "model" | "run"
  selectedModelId: number | null
  onEditModel?: (id: number) => void
}

export function ContextPanel({ context, selectedModelId, onEditModel }: ContextPanelProps) {
  if (context === "dashboard") {
    return (
      <div className="h-screen bg-[#1a1a1a] border-l border-[#262626] overflow-y-auto scrollbar-thin">
        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-white" />
              <h2 className="text-base font-semibold text-white">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <Bot className="w-4 h-4 text-[#3b82f6] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">GPT-5 Model started Run #45</p>
                  <p className="text-xs text-[#737373] mt-0.5">14:45:23</p>
                </div>
              </div>
              <div className="flex gap-3">
                <TrendingUp className="w-4 h-4 text-[#10b981] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">Claude Day Trader: +$340 profit</p>
                  <p className="text-xs text-[#737373] mt-0.5">14:30:15</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-4 h-4 text-[#10b981] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">Gemini Swing: Run #12 completed</p>
                  <p className="text-xs text-[#737373] mt-0.5">14:15:00</p>
                </div>
              </div>
              <div className="flex gap-3">
                <TrendingDown className="w-4 h-4 text-[#ef4444] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">Llama Scalper: Run stopped (loss limit)</p>
                  <p className="text-xs text-[#737373] mt-0.5">13:50:42</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (context === "model" && selectedModelId) {
    return (
      <div className="h-screen bg-[#1a1a1a] border-l border-[#262626] overflow-y-auto scrollbar-thin">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Model Details</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEditModel?.(selectedModelId)}
              className="text-[#a3a3a3] hover:text-white hover:bg-[#0a0a0a]"
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit Model
            </Button>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Model Portfolio</h3>
            <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#a3a3a3]">Account Balance</span>
                <span className="text-sm font-mono text-white">$10,480</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#a3a3a3]">Available Cash</span>
                <span className="text-sm font-mono text-white">$3,245</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#a3a3a3]">Positions Value</span>
                <span className="text-sm font-mono text-white">$7,235</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#262626]">
                <span className="text-xs text-[#a3a3a3]">Today's P/L</span>
                <span className="text-sm font-mono text-[#10b981]">+$142</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Live Updates</h2>
              <Badge className="bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20">Streaming</Badge>
            </div>
            <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 space-y-2 font-mono text-xs">
              <div className="text-[#a3a3a3]">
                <span className="text-[#737373]">14:45:23</span> Analyzing market conditions...
              </div>
              <div className="text-[#10b981]">
                <span className="text-[#737373]">14:45:25</span> ✓ BUY signal detected for AAPL
              </div>
              <div className="text-white">
                <span className="text-[#737373]">14:45:27</span> Executing: BUY 10 AAPL @ $180.50
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-4">Current Positions</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#a3a3a3] font-semibold">Symbol</span>
                <span className="text-[#a3a3a3] font-semibold">Qty</span>
                <span className="text-[#a3a3a3] font-semibold">Value</span>
                <span className="text-[#a3a3a3] font-semibold">P/L</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-t border-[#262626]">
                <span className="text-white font-semibold">AAPL</span>
                <span className="text-[#a3a3a3] font-mono">10</span>
                <span className="text-white font-mono">$1,805</span>
                <span className="text-[#10b981] font-mono">+$47</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-t border-[#262626]">
                <span className="text-white font-semibold">MSFT</span>
                <span className="text-[#a3a3a3] font-mono">5</span>
                <span className="text-white font-mono">$1,750</span>
                <span className="text-[#ef4444] font-mono">-$25</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-t border-[#262626]">
                <span className="text-white font-semibold">NVDA</span>
                <span className="text-[#a3a3a3] font-mono">8</span>
                <span className="text-white font-mono">$3,680</span>
                <span className="text-[#10b981] font-mono">+$120</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (context === "run") {
    return (
      <div className="h-screen bg-[#1a1a1a] border-l border-[#262626] overflow-y-auto scrollbar-thin">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white mb-4">Run #12 Stats</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[#a3a3a3] mb-1">Final Return</p>
                <p className="text-2xl font-bold font-mono text-[#ef4444]">-5.2%</p>
              </div>
              <div>
                <p className="text-xs text-[#a3a3a3] mb-1">Total Trades</p>
                <p className="text-xl font-semibold text-white">23</p>
              </div>
              <div>
                <p className="text-xs text-[#a3a3a3] mb-1">Win Rate</p>
                <p className="text-xl font-semibold text-white">35%</p>
                <p className="text-xs text-[#ef4444] mt-1">↓ Below average</p>
              </div>
              <div>
                <p className="text-xs text-[#a3a3a3] mb-1">Duration</p>
                <p className="text-xl font-semibold text-white">6.5 hours</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-4">Trade Timeline</h2>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-[#10b981] rounded-full" />
              <div className="w-3 h-3 bg-[#10b981] rounded-full" />
              <div className="w-3 h-3 bg-[#ef4444] rounded-full" />
              <div className="w-3 h-3 bg-[#ef4444] rounded-full" />
              <div className="w-3 h-3 bg-[#ef4444] rounded-full" />
              <div className="flex-1 h-px bg-[#262626]" />
            </div>
            <p className="text-xs text-[#a3a3a3] mt-2">← Losses started here</p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
