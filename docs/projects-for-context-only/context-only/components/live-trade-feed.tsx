"use client"

import type { Transaction } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns" // Ensure date-fns is installed

interface LiveTradeFeedProps {
  transactions: Transaction[]
  maxTradesToShow?: number
  currentStockTicker: string | null
}

export function LiveTradeFeed({ transactions, maxTradesToShow = 100, currentStockTicker }: LiveTradeFeedProps) {
  // Filter transactions for the current stock and then take the most recent ones
  const relevantTransactions = transactions
    .filter((t) => t.ticker === currentStockTicker)
    .slice() // Create a shallow copy before reversing
    .reverse() // Show most recent first
    .slice(0, maxTradesToShow)

  if (!currentStockTicker) {
    return <p className="text-xs text-muted-foreground text-center py-3 px-2">Select a stock to see trades.</p>
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
          {relevantTransactions.map((t) => (
            <TableRow key={t.id} className="hover:bg-muted/50">
              <TableCell className="px-2 py-1.5">{format(new Date(t.timestamp), "MMM d, HH:mm:ss")}</TableCell>
              <TableCell
                className={`px-2 py-1.5 font-semibold ${t.type === "BUY" ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
              >
                {t.type}
              </TableCell>
              <TableCell className="px-2 py-1.5 text-right">{t.quantity}</TableCell>
              <TableCell className="px-2 py-1.5 text-right">${t.price.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}
