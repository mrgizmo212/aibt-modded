import { type NextRequest, NextResponse } from "next/server"
import type { PriceDataPoint } from "@/lib/types"
import type { TradingSession } from "@/components/stock-trader"

const POLYGON_API_KEY = "gO7by8llR_V1P0DT2wwdOzABKwQvSLBd" // Store in .env in production
const POLYGON_API_BASE_URL = "https://api.polygon.io"

// Types for Polygon.io Trades API
interface PolygonTradeItem {
  conditions?: number[]
  correction?: number
  exchange: number
  id: string // Trade ID
  participant_timestamp: number // Nanoseconds (preferred for actual trade time)
  price: number
  sequence_number: number
  sip_timestamp: number // Nanoseconds (when SIP received trade)
  size: number
  tape?: number
  trf_id?: number
  trf_timestamp?: number // Nanoseconds
}

interface PolygonTradesResponse {
  next_url?: string
  request_id?: string
  results?: PolygonTradeItem[]
  status?: string // Polygon might use this for overall status
  message?: string // For error messages from Polygon
}

// Simplified DST detection for America/New_York
// Returns the UTC offset in hours for ET (-4 for EDT, -5 for EST)
function getEtOffsetHours(date: Date): number {
  const year = date.getUTCFullYear()
  // DST in the US starts on the second Sunday in March and ends on the first Sunday in November.
  // At 2:00 AM local time.

  // Find the second Sunday in March UTC (when DST begins)
  const firstOfMarch = new Date(Date.UTC(year, 2, 1)) // March 1st
  let secondSundayInMarch = (7 - firstOfMarch.getUTCDay() + 7) % 7 // Days to first Sunday
  secondSundayInMarch += 8 // Add 7 for second Sunday, +1 because day is 1-indexed
  const dstStartDate = new Date(Date.UTC(year, 2, secondSundayInMarch, 2 + 5, 0, 0)) // 2 AM EST is 7 AM UTC

  // Find the first Sunday in November UTC (when DST ends)
  const firstOfNovember = new Date(Date.UTC(year, 10, 1)) // November 1st
  let firstSundayInNovember = (7 - firstOfNovember.getUTCDay()) % 7
  firstSundayInNovember += 1
  const dstEndDate = new Date(Date.UTC(year, 10, firstSundayInNovember, 2 + 4, 0, 0)) // 2 AM EDT is 6 AM UTC

  if (date >= dstStartDate && date < dstEndDate) {
    return -4 // EDT
  }
  return -5 // EST
}

function getSessionNanosecondTimestamps(
  dateStr: string, // YYYY-MM-DD
  session: TradingSession,
): { gteNano: string; lteNano: string } {
  const [year, month, day] = dateStr.split("-").map(Number)

  // Create a reference date in UTC to determine offset for that day
  // Using noon on the given date to avoid issues at midnight transitions
  const refDateUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  const etOffset = getEtOffsetHours(refDateUtc)

  let startHourEt: number, startMinuteEt: number, startSecondEt: number
  let endHourEt: number, endMinuteEt: number, endSecondEt: number

  switch (session) {
    case "pre": // 4:00:00 AM ET - 9:29:59 AM ET
      startHourEt = 4
      startMinuteEt = 0
      startSecondEt = 0
      endHourEt = 9
      endMinuteEt = 29
      endSecondEt = 59
      break
    case "regular": // 9:30:00 AM ET - 4:00:00 PM ET (inclusive of 4:00:00.000)
      startHourEt = 9
      startMinuteEt = 30
      startSecondEt = 0
      endHourEt = 16
      endMinuteEt = 0
      endSecondEt = 0
      break
    case "after": // 4:01:00 PM ET - 8:00:00 PM ET (inclusive of 8:00:00.000)
      startHourEt = 16
      startMinuteEt = 1
      startSecondEt = 0
      endHourEt = 20
      endMinuteEt = 0
      endSecondEt = 0
      break
    default:
      throw new Error("Invalid session key")
  }

  // Convert ET session times to UTC Date objects
  const startDateUtc = new Date(Date.UTC(year, month - 1, day, startHourEt - etOffset, startMinuteEt, startSecondEt, 0))

  // For end times, if it's exactly on the hour (e.g., 16:00:00), we want to include trades at that exact millisecond.
  // If it's like 9:29:59, we want to include trades up to 9:29:59.999.
  const endMilliseconds = session === "pre" ? 999 : 0
  const endDateUtc = new Date(
    Date.UTC(year, month - 1, day, endHourEt - etOffset, endMinuteEt, endSecondEt, endMilliseconds),
  )

  const gteNano = (startDateUtc.getTime() * 1_000_000).toString()
  const lteNano = (endDateUtc.getTime() * 1_000_000).toString()

  return { gteNano, lteNano }
}

// Helper function to fetch all trades with pagination
async function fetchAllTrades(
  ticker: string,
  gteNano: string,
  lteNano: string,
  apiKey: string,
): Promise<PolygonTradeItem[]> {
  const allTrades: PolygonTradeItem[] = []
  // Initial URL construction. Using `timestamp` for the whole day.
  // `sort=timestamp` should sort by participant_timestamp or sip_timestamp.
  // `order=asc` ensures chronological order.
  let url: string | undefined =
    `${POLYGON_API_BASE_URL}/v3/trades/${ticker.toUpperCase()}?timestamp.gte=${gteNano}&timestamp.lte=${lteNano}&limit=50000&sort=timestamp&order=asc`

  while (url) {
    const urlToFetch = url.includes("apiKey=") ? url : `${url}&apiKey=${apiKey}`

    const response = await fetch(urlToFetch, {
      method: "GET",
      headers: { accept: "application/json" },
    })

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch (e) {
        errorData = { message: await response.text() }
      }
      console.error(`Polygon Trades API error for ${urlToFetch}: ${response.status}`, errorData)
      throw new Error(errorData.message || `Polygon Trades API returned ${response.status} for ${ticker}`)
    }

    const pageData: PolygonTradesResponse = await response.json()

    if (pageData.results) {
      allTrades.push(...pageData.results)
    }
    url = pageData.next_url
  }
  return allTrades
}

// In aggregateTradesToSecondBars function

// Replace the existing aggregation logic with this more robust version:
function aggregateTradesToSecondBars(trades: PolygonTradeItem[]): PriceDataPoint[] {
  if (!trades || trades.length === 0) {
    return []
  }

  // Sort by participant_timestamp to ensure correct open/close for the second
  const sortedTrades = trades.sort((a, b) => a.participant_timestamp - b.participant_timestamp)

  // Use a Record where keys are timestamps (ms) and values are PriceDataPoint objects
  const secondBarsMap: Record<number, PriceDataPoint> = {}

  for (const trade of sortedTrades) {
    // Use participant_timestamp as it's closer to the actual trade execution time
    const tradeTimestampMs = Math.floor(trade.participant_timestamp / 1_000_000) // Convert nanoseconds to milliseconds
    const barTimestampMs = Math.floor(tradeTimestampMs / 1000) * 1000 // Timestamp for the start of the second

    if (!secondBarsMap[barTimestampMs]) {
      // This is the first trade in this 1-second interval
      secondBarsMap[barTimestampMs] = {
        timestamp: barTimestampMs,
        open: trade.price,
        high: trade.price,
        low: trade.price,
        price: trade.price, // Initialize 'price' (as closing price) with this first trade's price
        volume: trade.size,
      }
    } else {
      // This 1-second interval already exists, update it
      const bar = secondBarsMap[barTimestampMs]
      bar.high = Math.max(bar.high!, trade.price) // bar.high is guaranteed to be a number from initialization
      bar.low = Math.min(bar.low!, trade.price) // bar.low is guaranteed to be a number from initialization
      bar.price = trade.price // Update 'price' to the current trade's price (last trade in second becomes close)

      // Safely update volume
      if (typeof bar.volume === "number") {
        bar.volume += trade.size
      } else {
        bar.volume = trade.size // Should have been initialized, but defensive
      }
    }
  }

  // Convert the map to an array and sort by timestamp
  return Object.values(secondBarsMap).sort((a, b) => a.timestamp - b.timestamp)
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ticker = searchParams.get("ticker")
  const date = searchParams.get("date") // Expected format: YYYY-MM-DD
  const session = searchParams.get("session") as TradingSession | null

  if (!ticker) {
    return NextResponse.json({ error: "Ticker parameter is required" }, { status: 400 })
  }
  if (!date) {
    return NextResponse.json({ error: "Date parameter is required" }, { status: 400 })
  }
  if (!session || !["pre", "regular", "after"].includes(session)) {
    return NextResponse.json({ error: "Valid session parameter (pre, regular, after) is required" }, { status: 400 })
  }

  try {
    const { gteNano, lteNano } = getSessionNanosecondTimestamps(date, session)
    const rawTrades = await fetchAllTrades(ticker, gteNano, lteNano, POLYGON_API_KEY)

    if (rawTrades.length === 0) {
      return NextResponse.json({
        status: "success",
        data: [],
        ticker: ticker,
        requestedDate: date,
        session: session,
        message: `No trade data found for ${ticker} on ${date} during ${session} session.`,
      })
    }

    const oneSecondBars = aggregateTradesToSecondBars(rawTrades)

    if (oneSecondBars.length === 0) {
      // Should be caught by rawTrades.length === 0, but as a safeguard
      return NextResponse.json({
        status: "success",
        data: [],
        ticker: ticker,
        requestedDate: date,
        session: session,
        message: `No 1-second bars could be aggregated for ${ticker} on ${date} during ${session} session.`,
      })
    }

    return NextResponse.json({
      status: "success",
      data: oneSecondBars,
      ticker: ticker,
      requestedDate: date,
      session: session,
    })
  } catch (error: any) {
    console.error(`Failed to fetch/process trade data for ${ticker} on ${date} (${session}):`, error)
    return NextResponse.json(
      { error: `Failed to fetch/process trade data for ${ticker} (${session}): ${error.message}`, data: [] },
      { status: 500 },
    )
  }
}
