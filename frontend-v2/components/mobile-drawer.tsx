"use client"

import type React from "react"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  side: "left" | "right"
  children: React.ReactNode
}

export function MobileDrawer({ isOpen, onClose, side, children }: MobileDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300 ease-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 ${side === "left" ? "left-0" : "right-0"} bottom-0 w-[280px] bg-[#0a0a0a] z-50 lg:hidden transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : side === "left" ? "-translate-x-full" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#262626]">
          <h2 className="text-base font-semibold text-white">{side === "left" ? "Menu" : "Details"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-[#1a1a1a]">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-64px)]">{isOpen && children}</div>
      </div>
    </>
  )
}
