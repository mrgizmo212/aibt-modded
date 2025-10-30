"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Play, Pause, SkipForward, SkipBack, Clock, Square, Move, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import type { ReplayState, PriceDataPoint } from "@/lib/types"

interface ReplayControlsProps {
  priceData: PriceDataPoint[] | null
  replayState: ReplayState
  onReplayStateChange: (state: Partial<ReplayState>) => void
  onPriceUpdate: (price: number, timestamp: number) => void
}

const SPEED_OPTIONS = [1, 5, 10] as const

export function ReplayControls({ priceData, replayState, onReplayStateChange, onPriceUpdate }: ReplayControlsProps) {
  const [timeDisplay, setTimeDisplay] = useState<string>("00:00:00")
  const secondsTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const currentDisplayedSecondsRef = useRef<number>(0)

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 150 }) // Initial position
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 })
  const widgetRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (widgetRef.current) {
      setIsDragging(true)
      const rect = widgetRef.current.getBoundingClientRect()
      setDragStartOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
      // Prevent text selection while dragging
      e.preventDefault()
    }
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStartOffset.x,
          y: e.clientY - dragStartOffset.y,
        })
      }
    },
    [isDragging, dragStartOffset],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    } else {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Corrected intervalTime for real-time speed
  useEffect(() => {
    if (!priceData || !priceData.length || !replayState.isActive || replayState.isPaused) {
      return
    }
    // Process one bar per (1000ms / speed)
    // e.g., 1x speed = 1000ms interval, 10x speed = 100ms interval
    const intervalTime = 1000 / replayState.speed
    const interval = setInterval(() => {
      if (replayState.currentIndex < priceData.length - 1) {
        const nextIndex = replayState.currentIndex + 1
        const nextDataPoint = priceData[nextIndex]
        onPriceUpdate(nextDataPoint.price, nextDataPoint.timestamp)
        onReplayStateChange({
          currentIndex: nextIndex,
          currentPrice: nextDataPoint.price,
          currentTimestamp: nextDataPoint.timestamp,
        })
        // currentDisplayedSecondsRef.current = 0; // This might not be needed here if clock syncs differently
      } else {
        onReplayStateChange({ isActive: false, isPaused: true })
        clearInterval(interval)
      }
    }, intervalTime)
    return () => clearInterval(interval)
  }, [
    priceData,
    replayState.isActive,
    replayState.isPaused,
    replayState.currentIndex,
    replayState.speed,
    onReplayStateChange,
    onPriceUpdate,
  ])

  // Clock display logic (adjust if needed to perfectly sync with the above data update)
  useEffect(() => {
    if (secondsTimerRef.current) {
      clearInterval(secondsTimerRef.current)
      secondsTimerRef.current = undefined
    }

    if (replayState.isActive && !replayState.isPaused && replayState.currentTimestamp) {
      // The clock should advance one simulated second for each data point processed.
      // The real-time interval for this clock tick should match the data processing interval.
      const realTimeIntervalForSimulatedSecondTick = 1000 / replayState.speed

      // Initialize displayed seconds based on the current data point's timestamp
      currentDisplayedSecondsRef.current = new Date(replayState.currentTimestamp).getSeconds()

      const updateDisplay = () => {
        const displayTimestamp =
          Math.floor(replayState.currentTimestamp! / (60 * 1000)) * (60 * 1000) + // Start of the current minute
          currentDisplayedSecondsRef.current * 1000
        setTimeDisplay(
          new Date(displayTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        )
      }
      updateDisplay() // Initial display for the current second

      secondsTimerRef.current = setInterval(() => {
        // This timer is now more for visual updates if the main data interval is slightly different
        // or if we want sub-second visual clock updates (though data only changes per bar).
        // For simplicity, let's assume the clock updates when data *might* change.
        // The actual currentDisplayedSecondsRef should ideally be driven by the main data loop's timestamp.
        // However, the main loop updates currentTimestamp which reflects the *start* of the 1s bar.
        // The visual clock needs to tick through the seconds *within* that bar if we want that granularity.
        // For now, let's keep it simple: the clock reflects the timestamp of the current bar.
        if (replayState.currentTimestamp) {
          currentDisplayedSecondsRef.current = new Date(replayState.currentTimestamp).getSeconds()
          const displayTimestamp = replayState.currentTimestamp
          setTimeDisplay(
            new Date(displayTimestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          )
        }
      }, realTimeIntervalForSimulatedSecondTick) // Sync with data update speed
    } else if (replayState.currentTimestamp) {
      // Paused or stopped but with a valid timestamp
      currentDisplayedSecondsRef.current = new Date(replayState.currentTimestamp).getSeconds()
      setTimeDisplay(
        new Date(replayState.currentTimestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      )
    } else if (priceData && priceData.length > 0 && !replayState.isActive) {
      // Initial state before play
      currentDisplayedSecondsRef.current = new Date(priceData[0].timestamp).getSeconds()
      setTimeDisplay(
        new Date(priceData[0].timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      )
    } else {
      setTimeDisplay("00:00:00")
      currentDisplayedSecondsRef.current = 0
    }

    return () => {
      if (secondsTimerRef.current) {
        clearInterval(secondsTimerRef.current)
        secondsTimerRef.current = undefined
      }
    }
  }, [replayState.isActive, replayState.isPaused, replayState.currentTimestamp, replayState.speed, priceData])

  const handlePlayPause = () => {
    if (!priceData || !priceData.length) return
    if (!replayState.isActive) {
      const startIndex = replayState.currentIndex < priceData.length - 1 ? replayState.currentIndex : 0
      const startDataPoint = priceData[startIndex]
      // currentDisplayedSecondsRef.current = new Date(startDataPoint.timestamp).getSeconds(); // Set by useEffect
      onPriceUpdate(startDataPoint.price, startDataPoint.timestamp)
      onReplayStateChange({
        isActive: true,
        isPaused: false,
        currentIndex: startIndex,
        currentPrice: startDataPoint.price,
        currentTimestamp: startDataPoint.timestamp,
      })
    } else {
      onReplayStateChange({ isPaused: !replayState.isPaused })
    }
  }

  const handleStop = () => {
    if (priceData && priceData.length > 0) {
      const firstDataPoint = priceData[0]
      // currentDisplayedSecondsRef.current = new Date(firstDataPoint.timestamp).getSeconds(); // Set by useEffect
      onPriceUpdate(firstDataPoint.price, firstDataPoint.timestamp)
      onReplayStateChange({
        isActive: false,
        isPaused: false,
        currentIndex: 0,
        currentPrice: firstDataPoint.price,
        currentTimestamp: firstDataPoint.timestamp,
      })
    } else {
      // currentDisplayedSecondsRef.current = 0; // Set by useEffect
      onReplayStateChange({
        isActive: false,
        isPaused: false,
        currentIndex: 0,
        currentPrice: null,
        currentTimestamp: null,
      })
    }
  }

  const handleSkipForward = () => {
    if (!priceData || !priceData.length) return
    const nextIndex = Math.min(replayState.currentIndex + 10, priceData.length - 1)
    const nextDataPoint = priceData[nextIndex]
    // currentDisplayedSecondsRef.current = new Date(nextDataPoint.timestamp).getSeconds(); // Set by useEffect
    onPriceUpdate(nextDataPoint.price, nextDataPoint.timestamp)
    onReplayStateChange({
      currentIndex: nextIndex,
      currentPrice: nextDataPoint.price,
      currentTimestamp: nextDataPoint.timestamp,
    })
  }

  const handleSkipBack = () => {
    if (!priceData || !priceData.length) return
    const prevIndex = Math.max(replayState.currentIndex - 10, 0)
    const prevDataPoint = priceData[prevIndex]
    // currentDisplayedSecondsRef.current = new Date(prevDataPoint.timestamp).getSeconds(); // Set by useEffect
    onPriceUpdate(prevDataPoint.price, prevDataPoint.timestamp)
    onReplayStateChange({
      currentIndex: prevIndex,
      currentPrice: prevDataPoint.price,
      currentTimestamp: prevDataPoint.timestamp,
    })
  }

  const handleTimelineSliderChange = (value: number[]) => {
    if (!priceData || !priceData.length) return
    const index = Math.floor((value[0] / 100) * (priceData.length - 1))
    const dataPoint = priceData[index]
    // currentDisplayedSecondsRef.current = new Date(dataPoint.timestamp).getSeconds(); // Set by useEffect
    onPriceUpdate(dataPoint.price, dataPoint.timestamp)
    onReplayStateChange({
      currentIndex: index,
      currentPrice: dataPoint.price,
      currentTimestamp: dataPoint.timestamp,
    })
  }

  const progress = priceData && priceData.length > 1 ? (replayState.currentIndex / (priceData.length - 1)) * 100 : 0

  return (
    <Card
      ref={widgetRef}
      className="fixed shadow-xl border bg-background z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "320px", // Or a suitable width
      }}
    >
      <div
        className="flex items-center justify-between p-2 border-b cursor-grab bg-muted/50"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center">
          <Move className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-xs font-semibold">Replay Controls</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleCollapse} className="h-6 w-6">
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>
      {!isCollapsed && (
        <CardContent className="p-2">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium tabular-nums">{timeDisplay}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-xs text-muted-foreground mr-1">Speed:</span>
                {SPEED_OPTIONS.map((speedVal) => (
                  <Button
                    key={speedVal}
                    variant={replayState.speed === speedVal ? "default" : "outline"}
                    size="xs"
                    onClick={() => onReplayStateChange({ speed: speedVal })}
                    disabled={!priceData || priceData.length === 0}
                    className="px-2 py-1 text-xs"
                  >
                    {speedVal}x
                  </Button>
                ))}
              </div>
            </div>

            <Slider
              value={[progress]}
              min={0}
              max={100}
              step={0.1}
              onValueChange={handleTimelineSliderChange}
              disabled={!priceData || priceData.length === 0}
            />

            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSkipBack}
                disabled={!priceData || priceData.length === 0 || replayState.currentIndex <= 0}
                aria-label="Skip Back"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant={replayState.isActive && !replayState.isPaused ? "outline" : "default"}
                size="icon"
                onClick={handlePlayPause}
                disabled={!priceData || priceData.length === 0}
                aria-label={replayState.isActive && !replayState.isPaused ? "Pause" : "Play"}
              >
                {replayState.isActive && !replayState.isPaused ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleStop}
                disabled={!priceData || priceData.length === 0}
                aria-label="Stop and Reset"
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleSkipForward}
                disabled={
                  !priceData || priceData.length === 0 || replayState.currentIndex >= (priceData?.length || 0) - 1
                }
                aria-label="Skip Forward"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
