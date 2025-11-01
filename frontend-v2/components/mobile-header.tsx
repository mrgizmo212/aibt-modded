"use client"

import { Menu, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MobileHeaderProps {
  onMenuClick: () => void
  onContextClick: () => void
}

export function MobileHeader({ onMenuClick, onContextClick }: MobileHeaderProps) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-[#262626] px-4 py-3 flex items-center justify-between">
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="text-white hover:bg-[#1a1a1a]">
        <Menu className="w-5 h-5" />
      </Button>
      <h1 className="text-base font-semibold text-white">AI Trading</h1>
      <Button variant="ghost" size="icon" onClick={onContextClick} className="text-white hover:bg-[#1a1a1a]">
        <Info className="w-5 h-5" />
      </Button>
    </div>
  )
}
