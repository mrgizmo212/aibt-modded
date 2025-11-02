'use client'

import { useEffect, useState } from 'react'
import { fetchModelPositions } from '@/lib/api'
import type { Position } from '@/types/api'

interface PortfolioChartProps {
  modelId: number
}

export function PortfolioChart({ modelId }: PortfolioChartProps) {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPositions() {
      try {
        const data = await fetchModelPositions(modelId)
        setPositions(data.positions || [])
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load positions'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }
    
    loadPositions()
  }, [modelId])

  if (loading) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-64 bg-zinc-900 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-6">
        <p className="text-yellow-500 text-sm">{error}</p>
      </div>
    )
  }

  if (positions.length === 0) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-8 text-center">
        <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <p className="text-gray-400 text-sm">
          No trading data available for chart
        </p>
      </div>
    )
  }

  // Group by date and calculate portfolio value
  const chartData: { date: string; value: number; cash: number }[] = []
  const dateMap = new Map<string, Position[]>()

  positions.forEach(pos => {
    const existing = dateMap.get(pos.date) || []
    existing.push(pos)
    dateMap.set(pos.date, existing)
  })

  // Get unique sorted dates
  const dates = Array.from(dateMap.keys()).sort()
  
  // Build price tracker from all trades
  const sortedPositions = [...positions].sort((a, b) => a.id - b.id)
  const priceTracker: Record<string, number> = {}
  
  sortedPositions.forEach((pos, idx) => {
    if (pos.action_type && pos.symbol && pos.amount && pos.amount > 0 && idx > 0) {
      const prevPos = sortedPositions[idx - 1]
      const cashChange = Math.abs(pos.cash - prevPos.cash)
      const price = cashChange / pos.amount
      if (price > 0) {
        priceTracker[pos.symbol] = price
      }
    }
  })
  
  // For each unique date, show progression
  dates.forEach(date => {
    const dayPositions = dateMap.get(date) || []
    const sortedDayPositions = dayPositions.sort((a, b) => a.id - b.id)
    
    // Add FIRST position of the day (starting point)
    const firstPos = sortedDayPositions[0]
    const lastPos = sortedDayPositions[sortedDayPositions.length - 1]
    
    // Starting point (before first trade or with first trade)
    if (firstPos && chartData.length === 0) {
      chartData.push({
        date,
        value: 10000, // Starting capital
        cash: 10000
      })
    }
    
    // Ending point (after all trades)
    if (lastPos) {
      let totalValue = lastPos.cash
      
      // Add stock values
      if (lastPos.positions && typeof lastPos.positions === 'object') {
        Object.entries(lastPos.positions).forEach(([symbol, shares]) => {
          if (symbol !== 'CASH' && typeof shares === 'number' && shares > 0) {
            const price = priceTracker[symbol]
            if (price && price > 0) {
              totalValue += shares * price
            }
          }
        })
      }
      
      chartData.push({
        date,
        value: totalValue,
        cash: lastPos.cash
      })
    }
  })

  // Debug: Log chart data
  console.log('Chart data points:', chartData.length, chartData)
  
  // Calculate min and max for scaling
  const values = chartData.map(d => d.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = maxValue - minValue || 1
  
  // Handle single data point case
  const isSinglePoint = chartData.length === 1

  // Calculate initial and final values
  const initialValue = chartData[0]?.value || 0
  const finalValue = chartData[chartData.length - 1]?.value || 0
  const totalReturn = ((finalValue - initialValue) / initialValue) * 100
  const isProfit = totalReturn >= 0

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-2">Portfolio Value Over Time</h3>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-gray-400">Initial Value</p>
            <p className="text-xl font-semibold">${initialValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Current Value</p>
            <p className="text-xl font-semibold">${finalValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Return</p>
            <p className={`text-xl font-semibold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {isProfit ? '+' : ''}{totalReturn.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Simple Line Chart */}
      <div className="relative h-64 bg-zinc-900/50 rounded-lg p-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-4 bottom-4 w-16 flex flex-col justify-between text-right pr-2">
          <span className="text-xs text-gray-500">${maxValue.toFixed(0)}</span>
          <span className="text-xs text-gray-500">${((maxValue + minValue) / 2).toFixed(0)}</span>
          <span className="text-xs text-gray-500">${minValue.toFixed(0)}</span>
        </div>

        {/* Chart area */}
        <div className="ml-16 h-full relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            <div className="border-t border-zinc-800"></div>
            <div className="border-t border-zinc-800"></div>
            <div className="border-t border-zinc-800"></div>
          </div>

          {/* Line chart */}
          <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={isProfit ? "#22c55e" : "#ef4444"} stopOpacity="0.3" />
                <stop offset="100%" stopColor={isProfit ? "#22c55e" : "#ef4444"} stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Area under line */}
            <path
              d={`M 0 200 ${chartData.map((point, i) => {
                const x = isSinglePoint ? 400 : (i / (chartData.length - 1)) * 800
                const y = 200 - ((point.value - minValue) / valueRange) * 200
                return `L ${x} ${y}`
              }).join(' ')} L ${isSinglePoint ? 400 : 800} 200 Z`}
              fill="url(#gradient)"
            />

            {/* Line */}
            {!isSinglePoint && (
              <polyline
                points={chartData.map((point, i) => {
                  const x = (i / (chartData.length - 1)) * 800
                  const y = 200 - ((point.value - minValue) / valueRange) * 200
                  return `${x},${y}`
                }).join(' ')}
                fill="none"
                stroke={isProfit ? "#22c55e" : "#ef4444"}
                strokeWidth="2"
              />
            )}

            {/* Data points */}
            {chartData.map((point, i) => {
              const x = isSinglePoint ? 400 : (i / (chartData.length - 1)) * 800
              const y = 200 - ((point.value - minValue) / valueRange) * 200
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={isSinglePoint ? "5" : "3"}
                  fill={isProfit ? "#22c55e" : "#ef4444"}
                  className="hover:r-4 transition-all"
                >
                  <title>{`${point.date}: $${point.value.toFixed(2)}`}</title>
                </circle>
              )
            })}
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="ml-16 mt-2 flex justify-between text-xs text-gray-500">
          {isSinglePoint ? (
            <span className="mx-auto">{chartData[0]?.date || ''}</span>
          ) : (
            <>
              <span>{chartData[0]?.date || ''}</span>
              {chartData.length > 2 && <span>{chartData[Math.floor(chartData.length / 2)]?.date || ''}</span>}
              <span>{chartData[chartData.length - 1]?.date || ''}</span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isProfit ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-400">Portfolio Value</span>
          </div>
        </div>
        <div className="text-gray-500">
          {dates.length} trading {dates.length === 1 ? 'day' : 'days'}
        </div>
      </div>
    </div>
  )
}

