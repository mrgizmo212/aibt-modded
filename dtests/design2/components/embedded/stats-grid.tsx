import { Bot, Activity } from "lucide-react"

export function StatsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 lg:p-5">
        <p className="text-xs text-[#a3a3a3] mb-2">Total Models</p>
        <p className="text-xl lg:text-2xl font-bold font-mono text-white">7</p>
        <div className="flex items-center gap-2 mt-2">
          <Bot className="w-4 h-4 text-[#3b82f6]" />
          <span className="text-sm text-[#a3a3a3]">3 active, 4 paused</span>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 lg:p-5">
        <p className="text-xs text-[#a3a3a3] mb-2">Runs Today</p>
        <p className="text-xl lg:text-2xl font-bold font-mono text-white">12</p>
        <div className="flex items-center gap-2 mt-2">
          <Activity className="w-4 h-4 text-[#10b981]" />
          <span className="text-sm text-[#10b981]">2 running now</span>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 lg:p-5">
        <p className="text-xs text-[#a3a3a3] mb-2">Combined P/L Today</p>
        <p className="text-xl lg:text-2xl font-bold font-mono text-white">+$1,245</p>
        <span className="text-sm font-semibold text-[#10b981]">+1.7%</span>
      </div>

      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 lg:p-5">
        <p className="text-xs text-[#a3a3a3] mb-2">Total Capital</p>
        <p className="text-xl lg:text-2xl font-bold font-mono text-white">$73,245</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-mono text-[#a3a3a3]">across all models</span>
        </div>
      </div>
    </div>
  )
}
