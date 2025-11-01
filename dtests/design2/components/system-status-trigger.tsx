"use client"

import { Activity } from "lucide-react"

interface SystemStatusTriggerProps {
  onClick: () => void
  status: "operational" | "degraded" | "down"
}

export function SystemStatusTrigger({ onClick, status }: SystemStatusTriggerProps) {
  const getStatusColor = () => {
    switch (status) {
      case "operational":
        return "bg-[#10b981]"
      case "degraded":
        return "bg-[#f59e0b]"
      case "down":
        return "bg-[#ef4444]"
      default:
        return "bg-[#a3a3a3]"
    }
  }

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 bg-[#0f0f0f] border border-[#262626] rounded-full p-3 shadow-lg hover:bg-[#1a1a1a] transition-all hover:scale-105 group"
      aria-label="System Status"
    >
      <div className="relative">
        <Activity className="w-6 h-6 text-white" />
        <div
          className={`absolute -top-1 -right-1 w-3 h-3 ${getStatusColor()} rounded-full border-2 border-[#0f0f0f] pulse-dot`}
        />
      </div>
    </button>
  )
}
