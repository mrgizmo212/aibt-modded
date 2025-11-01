"use client"

import type React from "react"

import { useEffect } from "react"

interface MobileBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function MobileBottomSheet({ isOpen, onClose, children }: MobileBottomSheetProps) {
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
      <div
        className={`fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300 ease-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed bottom-0 left-0 right-0 h-[60vh] bg-[#1a1a1a] z-50 lg:hidden rounded-t-2xl transition-all duration-500 ease-out ${
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-[#404040] rounded-full" />
        </div>

        <div className="overflow-y-auto h-[calc(60vh-32px)] scrollbar-thin">{children}</div>
      </div>
    </>
  )
}
