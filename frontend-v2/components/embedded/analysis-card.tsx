import { TrendingDown, AlertTriangle, Scale, RefreshCw, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function AnalysisCard() {
  return (
    <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl overflow-hidden">
      <div className="bg-[#ef4444]/10 border-b border-[#ef4444]/20 p-4 flex items-center gap-3">
        <TrendingDown className="w-5 h-5 text-[#ef4444]" />
        <div className="flex-1">
          <h3 className="text-base font-semibold text-white">Run #12 Analysis</h3>
          <p className="text-xs text-[#a3a3a3] mt-0.5">❌ -5.2% • 23 trades • 6.5 hours</p>
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

        {/* Impact Summary */}
        <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-lg p-4">
          <p className="text-sm text-[#3b82f6] leading-relaxed">
            💡 With these 3 rules, this run would have changed from -5.2% loss to +2.1% gain
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white">Apply All 3 Rules</Button>
          <Button variant="ghost" className="flex-1 text-[#a3a3a3] hover:text-white">
            View Trade Log
          </Button>
        </div>
      </div>
    </div>
  )
}
