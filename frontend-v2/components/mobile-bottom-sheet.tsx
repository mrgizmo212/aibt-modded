"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"

interface MobileBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function MobileBottomSheet({ isOpen, onClose, children }: MobileBottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
      setIsExpanded(false) // Reset expansion when closed
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartY(e.touches[0].clientY)
    setCurrentY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const newY = e.touches[0].clientY
    setCurrentY(newY)
    
    // If swiping up significantly, expand
    if (startY - newY > 100) {
      setIsExpanded(true)
    }
    // If swiping down significantly from top, collapse
    else if (newY - startY > 100) {
      setIsExpanded(false)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    
    // If dragged down significantly at bottom, close
    if (currentY - startY > 150) {
      onClose()
    }
  }

  const height = isExpanded ? "90vh" : "65vh"

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300 ease-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-[#1a1a1a] z-50 lg:hidden rounded-t-2xl transition-all duration-300 ease-out ${
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
        style={{ height }}
      >
        {/* Drag Handle - Swipe up/down to expand/collapse */}
        <div 
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1 bg-[#404040] rounded-full" />
        </div>

        {/* Expansion indicator */}
        <div className="flex justify-center pb-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-[#737373] hover:text-white transition-colors"
          >
            {isExpanded ? "↓ Minimize" : "↑ Expand"}
          </button>
        </div>

        {/* Content - Fully scrollable */}
        <div className="overflow-y-auto scrollbar-thin" style={{ height: `calc(${height} - 60px)` }}>
          {isOpen && children}
        </div>
      </div>
    </>
  )
}
