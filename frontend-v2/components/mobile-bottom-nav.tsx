"use client"

import { Home, List, Plus, Menu } from "lucide-react"

interface MobileBottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  const tabs = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "models", icon: List, label: "Models" },
    { id: "create", icon: Plus, label: "Create" },
    { id: "more", icon: Menu, label: "More" },
  ]

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-[#262626] px-2 py-2">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[44px] ${
                isActive ? "text-[#3b82f6]" : "text-[#a3a3a3]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
