"use client"

import { useMemo } from "react"
import type { PriceDataPoint } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns" // Ensure date-fns is installed

interface MarketTimeAndSalesProps {
  priceDataForDay: PriceDataPoint[]
  currentReplayIndex: number
  currentStockTicker: string | null
  maxTradesToShow?: number
}

export function MarketTimeAndSales({
  priceDataForDay,
  currentReplayIndex,
  currentStockTicker,
  maxTradesToShow = 20,
}: MarketTimeAndSalesProps) {
  const derivedTrades = useMemo(() => {
    if (!priceDataForDay || priceDataForDay.length === 0 || currentReplayIndex < 0) {
      return []
    }

    const trades = []
    const dataSlice = priceDataForDay.slice(0, currentReplayIndex + 1)

    for (let i = 0; i < dataSlice.length; i++) {
      const point = dataSlice[i]
      const prevPoint = i > 0 ? dataSlice[i - 1] : null

      let type: "BUY" | "SELL" = "BUY" // Default
      const currentPrice = point.price
      const currentOpen = point.open
      const prevPrice = prevPoint?.price

      if (prevPoint) {
        // Not the first point
        if (currentPrice > prevPrice!) type = "BUY"
        else if (currentPrice < prevPrice!) type = "SELL"
        else {
          // currentPrice === prevPrice
          if (currentOpen !== undefined) {
            if (currentPrice > currentOpen) type = "BUY"
            else if (currentPrice < currentOpen) type = "SELL"
            // If currentPrice === currentOpen, it remains the default ("BUY" or last type)
          }
        }
      } else {
        // First data point
        if (currentOpen !== undefined) {
          if (currentPrice > currentOpen) type = "BUY"
          else if (currentPrice < currentOpen) type = "SELL"
        }
      }

      trades.push({
        id: point.timestamp, // Unique ID for the key
        time: format(new Date(point.timestamp), "HH:mm:ss"),
        type: type,
        size: point.volume ?? "-",
        price: typeof point.price === "number" ? point.price : 0,
      })
    }
    return trades.slice(-maxTradesToShow).reverse()
  }, [priceDataForDay, currentReplayIndex, maxTradesToShow])

  if (!currentStockTicker) {
    return <p className="text-xs text-muted-foreground text-center py-3 px-2">Select a stock to see market activity.</p>
  }

  if (derivedTrades.length === 0 && currentStockTicker && priceDataForDay && priceDataForDay.length > 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-3 px-2">
        Market activity will appear as replay progresses.
      </p>
    )
  }

  if (derivedTrades.length === 0 && currentStockTicker) {
    return (
      <p className="text-xs text-muted-foreground text-center py-3 px-2">
        No market data to display for {currentStockTicker}.
      </p>
    )
  }

  return (
    <ScrollArea className="h-[200px] w-full">
      {" "}
      {/* Adjust height as needed */}
      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            <TableHead className="h-8 px-2 py-1">Time</TableHead>
            <TableHead className="h-8 px-2 py-1">Type</TableHead>
            <TableHead className="h-8 px-2 py-1 text-right">Size</TableHead>
            <TableHead className="h-8 px-2 py-1 text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {derivedTrades.map((trade) => (
            <TableRow key={trade.id} className="hover:bg-muted/50">
              <TableCell className="px-2 py-1.5 tabular-nums">{trade.time}</TableCell>
              <TableCell
                className={`px-2 py-1.5 font-semibold ${trade.type === "BUY" ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
              >
                {trade.type}
              </TableCell>
              <TableCell className="px-2 py-1.5 text-right tabular-nums">{trade.size}</TableCell>
              <TableCell className="px-2 py-1.5 text-right tabular-nums">
                {typeof trade.price === "number" ? `$${trade.price.toFixed(2)}` : "$--.--"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}
