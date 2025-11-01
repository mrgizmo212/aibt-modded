"use client"
import { Activity, Database, Zap, TrendingUp, X, CheckCircle2, AlertCircle, XCircle } from "lucide-react"

interface SystemStatusDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function SystemStatusDrawer({ isOpen, onClose }: SystemStatusDrawerProps) {
  const systemStatus = {
    overall: "operational" as "operational" | "degraded" | "down",
    services: [
      { name: "Trading API", status: "operational" as const, latency: "45ms", uptime: "99.9%" },
      { name: "Database", status: "operational" as const, latency: "12ms", uptime: "100%" },
      { name: "AI Models", status: "operational" as const, latency: "230ms", uptime: "99.7%" },
      { name: "Market Data", status: "operational" as const, latency: "89ms", uptime: "99.8%" },
    ],
    metrics: {
      activeRuns: 3,
      queuedOrders: 7,
      apiCalls: "1.2k/hr",
      dataUsage: "45.2 GB",
    },
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "text-[#10b981]"
      case "degraded":
        return "text-[#f59e0b]"
      case "down":
        return "text-[#ef4444]"
      default:
        return "text-[#a3a3a3]"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle2 className="w-4 h-4" />
      case "degraded":
        return <AlertCircle className="w-4 h-4" />
      case "down":
        return <XCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-500 ease-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed bottom-0 right-0 w-96 bg-[#0a0a0a] border-l border-t border-[#262626] rounded-tl-2xl shadow-2xl z-50 transition-all duration-500 ease-out ${
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#3b82f6]" />
            <h3 className="text-white font-semibold">System Status</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#1a1a1a] rounded-lg text-[#a3a3a3] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin">
          {/* Overall Status */}
          <div className="bg-[#0f0f0f] border border-[#262626] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-[#a3a3a3] text-sm">Overall Status</span>
              <div className={`flex items-center gap-2 ${getStatusColor(systemStatus.overall)}`}>
                {getStatusIcon(systemStatus.overall)}
                <span className="text-sm font-medium capitalize">{systemStatus.overall}</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-[#a3a3a3] text-xs font-semibold uppercase tracking-wider mb-2">Services</h4>
            <div className="space-y-2">
              {systemStatus.services.map((service) => (
                <div key={service.name} className="bg-[#0f0f0f] border border-[#262626] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-medium">{service.name}</span>
                    <div className={`flex items-center gap-1.5 ${getStatusColor(service.status)}`}>
                      {getStatusIcon(service.status)}
                      <span className="text-xs font-medium capitalize">{service.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#737373]">
                    <span>
                      Latency: <span className="text-[#a3a3a3] font-mono">{service.latency}</span>
                    </span>
                    <span>
                      Uptime: <span className="text-[#a3a3a3] font-mono">{service.uptime}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics */}
          <div>
            <h4 className="text-[#a3a3a3] text-xs font-semibold uppercase tracking-wider mb-2">Metrics</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0f0f0f] border border-[#262626] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-[#f59e0b]" />
                  <span className="text-[#a3a3a3] text-xs">Active Runs</span>
                </div>
                <div className="text-white text-xl font-bold font-mono">{systemStatus.metrics.activeRuns}</div>
              </div>
              <div className="bg-[#0f0f0f] border border-[#262626] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-[#3b82f6]" />
                  <span className="text-[#a3a3a3] text-xs">Queued Orders</span>
                </div>
                <div className="text-white text-xl font-bold font-mono">{systemStatus.metrics.queuedOrders}</div>
              </div>
              <div className="bg-[#0f0f0f] border border-[#262626] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-[#10b981]" />
                  <span className="text-[#a3a3a3] text-xs">API Calls</span>
                </div>
                <div className="text-white text-lg font-bold font-mono">{systemStatus.metrics.apiCalls}</div>
              </div>
              <div className="bg-[#0f0f0f] border border-[#262626] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-[#8b5cf6]" />
                  <span className="text-[#a3a3a3] text-xs">Data Usage</span>
                </div>
                <div className="text-white text-lg font-bold font-mono">{systemStatus.metrics.dataUsage}</div>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-center text-[#737373] text-xs pt-2">Last updated: {new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    </>
  )
}
