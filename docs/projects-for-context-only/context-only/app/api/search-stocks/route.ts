import { type NextRequest, NextResponse } from "next/server"

const SEARCH_API_BASE_URL = "https://moa-xhck.onrender.com"
const SEARCH_API_KEY = "yfin_api_123456789"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query")
  const limit = searchParams.get("limit") || "10"

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    const url = `${SEARCH_API_BASE_URL}/search?query=${encodeURIComponent(query)}&limit=${encodeURIComponent(limit)}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": SEARCH_API_KEY,
        accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Search API (moa-xhck) returned ${response.status}: ${errorText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to search stocks for query "${query}": ${error.message}` },
      { status: 500 },
    )
  }
}
