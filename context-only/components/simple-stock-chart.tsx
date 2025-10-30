"use client"

import type React from "react"
import { useMemo } from "react"
import { format } from "date-fns"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  // CartesianGrid, // We might not need this for a cleaner look
} from "recharts"
import {
  ChartContainer,
  ChartTooltipContent,
  // ChartLegend, // Not used in the target design
  // ChartLegendContent,
} from "@/components/ui/chart"
import type { PriceDataPoint } from "@/lib/types"

interface SimpleStockChartProps {
  data: PriceDataPoint[]
  openingPrice?: number
  className?: string
  height?: string
}

const SimpleStockChart: React.FC<SimpleStockChartProps> = ({ data, openingPrice, className, height = "400px" }) => {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      timestamp: point.timestamp,
      time: new Date(point.timestamp), // For XAxis tick formatting
      price: point.price,
    }))
  }, [data])

  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100] // Default domain
    const prices = chartData.map((p) => p.price)
    let minPrice = Math.min(...prices)
    let maxPrice = Math.max(...prices)

    if (openingPrice !== undefined) {
      minPrice = Math.min(minPrice, openingPrice)
      maxPrice = Math.max(maxPrice, openingPrice)
    }

    const padding = (maxPrice - minPrice) * 0.1 // 10% padding
    return [Math.max(0, minPrice - padding), maxPrice + padding]
  }, [chartData, openingPrice])

  if (!chartData || chartData.length === 0) {
    return (
      <div style={{ height }} className={`flex items-center justify-center text-muted-foreground ${className}`}>
        No chart data available.
      </div>
    )
  }

  return (
    <div style={{ height }} className={className}>
      <ChartContainer
        config={{
          price: {
            label: "Price",
            color: "hsl(var(--chart-1))", // Orange-like color from shadcn default
          },
          reference: {
            label: "Open",
            color: "hsl(var(--muted-foreground))",
          },
        }}
        className="h-full w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 10, // Make space for Y-axis labels if shown, or just padding
              left: -25, // Adjust if Y-axis labels are hidden to use space
              bottom: 0,
            }}
          >
            {/* <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} /> */}
            <XAxis
              dataKey="time"
              tickFormatter={(value) => {
                try {
                  const date = new Date(value)
                  if (isNaN(date.getTime())) {
                    return "N/A"
                  }
                  return format(date, "HH:mm")
                } catch (error) {
                  return "N/A"
                }
              }}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd" // Show first and last tick
              minTickGap={60} // Minimum gap between ticks in pixels
            />
            <YAxis
              dataKey="price"
              domain={yDomain}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              orientation="right" // Move Y-axis to the right like in some financial charts
              width={65} // Give enough space for price labels
            />
            <Tooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="price"
                  labelFormatter={(label) => {
                    try {
                      const date = new Date(label)
                      if (isNaN(date.getTime())) {
                        return "Invalid Date"
                      }
                      return format(date, "MMM d, HH:mm:ss")
                    } catch (error) {
                      return "Invalid Date"
                    }
                  }}
                  formatter={(value, name, item) => {
                    try {
                      const timestamp = item.payload?.timestamp
                      const price = item.payload?.price

                      if (typeof price !== "number" || isNaN(price)) {
                        return <div className="font-medium">Price: N/A</div>
                      }

                      let timeString = "N/A"
                      if (timestamp && !isNaN(new Date(timestamp).getTime())) {
                        timeString = format(new Date(timestamp), "p")
                      }

                      return (
                        <>
                          <div className="font-medium">{`$${price.toFixed(2)}`}</div>
                          <div className="text-xs text-muted-foreground">{timeString}</div>
                        </>
                      )
                    } catch (error) {
                      return <div className="font-medium">Error displaying data</div>
                    }
                  }}
                  itemStyle={{ color: "hsl(var(--chart-1))" }}
                />
              }
              cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            {openingPrice !== undefined && (
              <ReferenceLine
                y={openingPrice}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            )}
            <Line
              dataKey="price"
              type="monotone"
              stroke="hsl(var(--chart-1))" // Orange-like color
              strokeWidth={2}
              dot={false}
              isAnimationActive={false} // Important for live replay updates
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}

export default SimpleStockChart
