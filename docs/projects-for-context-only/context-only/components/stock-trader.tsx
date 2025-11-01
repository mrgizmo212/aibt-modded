"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import toast, { Toaster } from "react-hot-toast"
import {
  TrendingUp,
  TrendingDown,
  Briefcase,
  History,
  Activity,
  AlertCircle,
  Search,
  XCircle,
  DollarSign,
  ListOrdered,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/date-picker"
import { ReplayControls } from "@/components/replay-controls"
import SimpleStockChart from "@/components/simple-stock-chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MarketTimeAndSales } from "@/components/market-time-and-sales"
import { Progress } from "@/components/ui/progress"

import type {
  Transaction,
  Portfolio,
  HistoricalDayData,
  ReplayState,
  SearchResultItem,
  PriceDataPoint,
  OpenOrder,
} from "@/lib/types"
import { fetchHistoricalDataForReplay, searchStocks } from "@/lib/api"
import { OpenExecutedPositions } from "@/components/open-executed-positions"

const INITIAL_CASH = 100000
const DEBOUNCE_DELAY = 300
const EMPTY_PRICE_DATA: PriceDataPoint[] = []

export type TradingSession = "pre" | "regular" | "after"

const sessionDetails: Record<TradingSession, string> = {
  pre: "Pre-Market (4:00 AM - 9:29 AM ET)",
  regular: "Regular Market (9:30 AM - 4:00 PM ET)",
  after: "After-Market (4:01 PM - 8:00 PM ET)",
}

export default function StockTrader() {
  const [selectedStock, setSelectedStock] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([])
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [quantity, setQuantity] = useState<string>("1")
  const [portfolio, setPortfolio] = useState<Portfolio>({
    holdings: [],
    cash: INITIAL_CASH,
    initialCash: INITIAL_CASH,
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSession, setSelectedSession] = useState<TradingSession | null>(null)

  const [historicalData, setHistoricalData] = useState<HistoricalDayData>({
    ticker: "",
    date: "",
    priceData: EMPTY_PRICE_DATA,
    isLoading: false,
    error: null,
  })
  const [replayState, setReplayState] = useState<ReplayState>({
    isActive: false,
    isPaused: false,
    currentIndex: 0,
    speed: 1,
    currentTimestamp: null,
    currentPrice: null,
  })

  const [selectedOrderType, setSelectedOrderType] = useState<string>("MARKET")
  const [limitPrice, setLimitPrice] = useState<string>("")
  const [stopPrice, setStopPrice] = useState<string>("")
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([])

  // Add this helper function definition within your StockTrader.tsx file,
  // either outside the component or memoized if preferred, though for this structure,
  // being inside and re-declared on each render is fine as it's used in a useEffect
  // whose dependencies will manage re-execution.
  const calculateOrderProcessingResults = (
    currentPrice: number,
    currentTimestamp: number,
    currentTicker: string,
    currentOpenOrders: OpenOrder[],
    currentPortfolio: Portfolio,
  ): {
    finalOpenOrders: OpenOrder[]
    executedTransactions: Transaction[]
    finalPortfolio: Portfolio | null // null if no change
    toastsToDisplay: Array<{ message: string; type: "success" }> // Add 'error' if needed
  } => {
    const nextOpenOrders = [...currentOpenOrders]
    const newTransactions: Transaction[] = []
    const toasts: Array<{ message: string; type: "success" }> = []

    const tempPortfolio = {
      ...currentPortfolio,
      holdings: currentPortfolio.holdings.map((h) => ({ ...h })),
    }
    let portfolioHasChanged = false

    for (let i = nextOpenOrders.length - 1; i >= 0; i--) {
      const order = nextOpenOrders[i]
      if (order.ticker !== currentTicker) continue

      let filled = false
      const executionPrice = currentPrice

      if (order.type === "BUY") {
        if (order.orderType === "LIMIT" && currentPrice <= order.targetPrice) filled = true
        else if (order.orderType === "STOP" && currentPrice >= order.targetPrice) filled = true
      } else {
        // SELL
        if (order.orderType === "LIMIT" && currentPrice >= order.targetPrice) filled = true
        else if (order.orderType === "STOP" && currentPrice <= order.targetPrice) filled = true
      }

      if (filled) {
        const numQuantity = order.quantity
        const totalValue = executionPrice * numQuantity
        let canExecute = true

        if (order.type === "BUY") {
          if (tempPortfolio.cash < totalValue) canExecute = false
        } else {
          const existingHolding = tempPortfolio.holdings.find((h) => h.ticker === order.ticker)
          if (!existingHolding || existingHolding.quantity < numQuantity) canExecute = false
        }

        if (canExecute) {
          portfolioHasChanged = true
          if (order.type === "BUY") {
            const existingHoldingIndex = tempPortfolio.holdings.findIndex((h) => h.ticker === order.ticker)
            if (existingHoldingIndex > -1) {
              const existing = tempPortfolio.holdings[existingHoldingIndex]
              const newAvgBuyPrice =
                (existing.avgBuyPrice * existing.quantity + totalValue) / (existing.quantity + numQuantity)
              tempPortfolio.holdings[existingHoldingIndex] = {
                ...existing,
                quantity: existing.quantity + numQuantity,
                avgBuyPrice: newAvgBuyPrice,
                currentPrice: executionPrice,
                lastPriceUpdate: currentTimestamp,
              }
            } else {
              tempPortfolio.holdings.push({
                ticker: order.ticker,
                quantity: numQuantity,
                avgBuyPrice: executionPrice,
                currentPrice: executionPrice,
                lastPriceUpdate: currentTimestamp,
              })
            }
            tempPortfolio.cash -= totalValue
          } else {
            // SELL
            const holdingIdx = tempPortfolio.holdings.findIndex((h) => h.ticker === order.ticker)!
            if (tempPortfolio.holdings[holdingIdx].quantity === numQuantity) {
              tempPortfolio.holdings = tempPortfolio.holdings.filter((h) => h.ticker !== order.ticker)
            } else {
              tempPortfolio.holdings[holdingIdx] = {
                ...tempPortfolio.holdings[holdingIdx],
                quantity: tempPortfolio.holdings[holdingIdx].quantity - numQuantity,
                currentPrice: executionPrice,
                lastPriceUpdate: currentTimestamp,
              }
            }
            tempPortfolio.cash += totalValue
          }

          newTransactions.push({
            id: order.id,
            type: order.type,
            ticker: order.ticker,
            quantity: numQuantity,
            price: executionPrice,
            totalValue,
            timestamp: new Date(currentTimestamp).toISOString(),
          })

          const orderAction = `${order.orderType} ${order.type}`
          toasts.push({
            message: `Filled: ${orderAction} ${numQuantity} ${order.ticker} @ $${executionPrice.toFixed(2)}`,
            type: "success",
          })
          nextOpenOrders.splice(i, 1)
        }
      }
    }

    return {
      finalOpenOrders: nextOpenOrders,
      executedTransactions: newTransactions,
      finalPortfolio: portfolioHasChanged ? tempPortfolio : null,
      toastsToDisplay: toasts,
    }
  }

  // Remove or comment out the old `processOpenOrders` useCallback:
  /*
const processOpenOrders = useCallback(
(currentPrice: number, currentTimestamp: number, currentTicker: string) => {
  setOpenOrders((prevOpenOrders) => {
    // ... existing complex logic ...
  });
},
// ... old dependencies ...
);
*/

  useEffect(() => {
    if (searchQuery === selectedStock && selectedStock !== null) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    const timerId = setTimeout(async () => {
      try {
        const results = await searchStocks(searchQuery)
        if (searchQuery !== selectedStock) {
          setSearchResults(results)
        } else {
          setSearchResults([])
        }
      } catch (error) {
        console.error("Search failed:", error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, DEBOUNCE_DELAY)
    return () => clearTimeout(timerId)
  }, [searchQuery, selectedStock])

  const handleStockSelectionFromSearch = (stock: SearchResultItem) => {
    setSelectedStock(stock.symbol)
    setSearchQuery(stock.symbol)
    setSearchResults([])
  }

  const loadHistoricalDataForDay = useCallback(async (ticker: string, date: Date, session: TradingSession) => {
    if (!ticker || !date || !session) return
    const dateString = date.toISOString().split("T")[0]
    setHistoricalData((prev) => ({
      ...prev,
      ticker,
      date: dateString,
      priceData: EMPTY_PRICE_DATA,
      isLoading: true,
      error: null,
    }))
    setReplayState((prevActualReplayState) => ({
      isActive: false,
      isPaused: false,
      currentIndex: 0,
      speed: prevActualReplayState.speed,
      currentTimestamp: null,
      currentPrice: null,
    }))
    try {
      const simulatedIntradayData = await fetchHistoricalDataForReplay(ticker, dateString, session)
      if (simulatedIntradayData && simulatedIntradayData.length > 0) {
        setHistoricalData((prev) => ({ ...prev, priceData: simulatedIntradayData, isLoading: false }))
        const firstPoint = simulatedIntradayData[0]
        setReplayState((prev) => ({
          ...prev,
          currentPrice: firstPoint.price,
          currentTimestamp: firstPoint.timestamp,
        }))
      } else {
        setHistoricalData((prev) => ({
          ...prev,
          priceData: EMPTY_PRICE_DATA,
          isLoading: false,
          error:
            prev.error ||
            `No historical data for ${ticker} on ${dateString} for ${sessionDetails[session]}. May be non-trading period.`,
        }))
      }
    } catch (error: any) {
      setHistoricalData((prev) => ({
        ...prev,
        priceData: EMPTY_PRICE_DATA,
        isLoading: false,
        error: error.message || "Failed to load data",
      }))
    }
  }, [])

  useEffect(() => {
    if (selectedStock && selectedDate && selectedSession) {
      loadHistoricalDataForDay(selectedStock, selectedDate, selectedSession)
    } else {
      setHistoricalData({
        ticker: "",
        date: "",
        priceData: EMPTY_PRICE_DATA,
        isLoading: false,
        error: null,
      })
      setReplayState((prev) => ({
        ...prev,
        isActive: false,
        isPaused: false,
        currentIndex: 0,
        currentPrice: null,
        currentTimestamp: null,
      }))
    }
  }, [selectedStock, selectedDate, selectedSession, loadHistoricalDataForDay])

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date)
  }

  // Replace the useEffect hook that calls processOpenOrders with this:
  useEffect(() => {
    if (
      replayState.isActive &&
      !replayState.isPaused &&
      typeof replayState.currentPrice === "number" &&
      replayState.currentTimestamp &&
      selectedStock &&
      openOrders.length > 0 &&
      historicalData.ticker === selectedStock
    ) {
      const results = calculateOrderProcessingResults(
        replayState.currentPrice,
        replayState.currentTimestamp,
        selectedStock,
        openOrders,
        portfolio,
      )

      if (results.finalPortfolio) {
        setPortfolio(results.finalPortfolio)
      }

      if (results.executedTransactions.length > 0) {
        setTransactions((prev) => [...prev, ...results.executedTransactions])
      }

      // Update openOrders if there's a change in length or if transactions occurred (implying removal)
      if (results.finalOpenOrders.length !== openOrders.length || results.executedTransactions.length > 0) {
        setOpenOrders(results.finalOpenOrders)
      }

      results.toastsToDisplay.forEach((t) => {
        if (t.type === "success") {
          toast.success(t.message)
        }
        // Add other toast types if needed, e.g., toast.error(t.message);
      })
    }
  }, [
    replayState.isActive,
    replayState.isPaused,
    replayState.currentPrice,
    replayState.currentTimestamp,
    selectedStock,
    openOrders,
    portfolio,
    historicalData.ticker,
    // setPortfolio, setTransactions, setOpenOrders are stable setters from useState
    // calculateOrderProcessingResults is a stable function if defined outside or its dependencies are met
  ])

  const handleReplayStateChange = useCallback((state: Partial<ReplayState>) => {
    setReplayState((prev) => ({ ...prev, ...state }))
  }, [])

  const handleCancelOrder = useCallback(
    (orderId: string) => {
      setOpenOrders((prevOpenOrders) => prevOpenOrders.filter((order) => order.id !== orderId))
      toast.info(`Order ${orderId.substring(0, 6)} cancelled.`)
    },
    [setOpenOrders],
  )

  const handlePriceUpdateFromReplay = useCallback(
    (price: number, timestamp: number) => {
      setReplayState((prev) => ({ ...prev, currentPrice: price, currentTimestamp: timestamp }))
      setPortfolio((prevPortfolio) => ({
        ...prevPortfolio,
        holdings: prevPortfolio.holdings.map((h) =>
          h.ticker === historicalData.ticker ? { ...h, currentPrice: price, lastPriceUpdate: timestamp } : h,
        ),
      }))
    },
    [historicalData.ticker, setPortfolio],
  )

  const handleBuy = () => {
    if (!selectedStock || typeof replayState.currentPrice !== "number" || !quantity) {
      toast.error("Select stock/date/session, ensure replay is active with valid price, and enter quantity.")
      return
    }
    const numQuantity = Number.parseInt(quantity)
    if (isNaN(numQuantity) || numQuantity <= 0) {
      toast.error("Invalid quantity.")
      return
    }
    const currentPriceNum = replayState.currentPrice

    if (selectedOrderType === "MARKET") {
      const totalCost = currentPriceNum * numQuantity
      if (totalCost > portfolio.cash) {
        toast.error("Insufficient cash.")
        return
      }
      setPortfolio((prev) => {
        const stockToUpdate = selectedStock! // ticker is checked
        const existingHoldingIndex = prev.holdings.findIndex((h) => h.ticker === stockToUpdate)
        const newHoldings = [...prev.holdings]
        if (existingHoldingIndex > -1) {
          const existing = newHoldings[existingHoldingIndex]
          const newAvgBuyPrice =
            (existing.avgBuyPrice * existing.quantity + totalCost) / (existing.quantity + numQuantity)
          newHoldings[existingHoldingIndex] = {
            ...existing,
            quantity: existing.quantity + numQuantity,
            avgBuyPrice: newAvgBuyPrice,
            currentPrice: currentPriceNum,
            lastPriceUpdate: replayState.currentTimestamp,
          }
        } else {
          newHoldings.push({
            ticker: stockToUpdate,
            quantity: numQuantity,
            avgBuyPrice: currentPriceNum,
            currentPrice: currentPriceNum,
            lastPriceUpdate: replayState.currentTimestamp,
          })
        }
        return { ...prev, holdings: newHoldings, cash: prev.cash - totalCost }
      })
      setTransactions((prev) => [
        ...prev,
        {
          id: uuidv4(),
          type: "BUY",
          ticker: selectedStock!, // ticker is checked
          quantity: numQuantity,
          price: currentPriceNum,
          totalValue: totalCost,
          timestamp: new Date(replayState.currentTimestamp || Date.now()).toISOString(),
        },
      ])
      toast.success(`Market Buy: ${numQuantity} ${selectedStock} @ $${currentPriceNum.toFixed(2)}`)
    } else if (selectedOrderType === "LIMIT") {
      if (!limitPrice || isNaN(Number.parseFloat(limitPrice)) || Number.parseFloat(limitPrice) <= 0) {
        toast.error("Please enter a valid limit price.")
        return
      }
      const parsedLimitPrice = Number.parseFloat(limitPrice)
      const newOrder: OpenOrder = {
        id: uuidv4(),
        type: "BUY",
        ticker: selectedStock!, // ticker is checked
        quantity: numQuantity,
        orderType: "LIMIT",
        targetPrice: parsedLimitPrice,
        timestamp: new Date(replayState.currentTimestamp || Date.now()).toISOString(),
      }
      setOpenOrders((prev) => [...prev, newOrder])
      toast.success(
        `Limit Buy Order Placed: ${numQuantity} ${selectedStock} @ $${parsedLimitPrice.toFixed(2)} or less.`,
      )
    } else if (selectedOrderType === "STOP") {
      if (!stopPrice || isNaN(Number.parseFloat(stopPrice)) || Number.parseFloat(stopPrice) <= 0) {
        toast.error("Please enter a valid stop price.")
        return
      }
      const parsedStopPrice = Number.parseFloat(stopPrice)
      const newOrder: OpenOrder = {
        id: uuidv4(),
        type: "BUY",
        ticker: selectedStock!, // ticker is checked
        quantity: numQuantity,
        orderType: "STOP",
        targetPrice: parsedStopPrice,
        timestamp: new Date(replayState.currentTimestamp || Date.now()).toISOString(),
      }
      setOpenOrders((prev) => [...prev, newOrder])
      toast.success(
        `Stop Buy Order Placed: ${numQuantity} ${selectedStock} if price reaches $${parsedStopPrice.toFixed(2)} or more.`,
      )
    }
    // Clear quantity and price fields after placing order
    setQuantity("1")
    setLimitPrice("")
    setStopPrice("")
  }

  const handleSell = () => {
    if (!selectedStock || typeof replayState.currentPrice !== "number" || !quantity) {
      toast.error("Select stock/date/session, ensure replay is active with valid price, and enter quantity.")
      return
    }
    const numQuantity = Number.parseInt(quantity)
    if (isNaN(numQuantity) || numQuantity <= 0) {
      toast.error("Invalid quantity.")
      return
    }
    const stockToUpdate = selectedStock! // ticker is checked
    const existingHolding = portfolio.holdings.find((h) => h.ticker === stockToUpdate)
    const currentPriceNum = replayState.currentPrice

    if (selectedOrderType === "MARKET") {
      if (!existingHolding || existingHolding.quantity < numQuantity) {
        toast.error("Not enough shares to sell.")
        return
      }
      const totalProceeds = currentPriceNum * numQuantity
      const profitOnSale = (currentPriceNum - existingHolding.avgBuyPrice) * numQuantity
      setPortfolio((prev) => {
        let newHoldings = [...prev.holdings]
        const idx = newHoldings.findIndex((h) => h.ticker === stockToUpdate) // Should exist
        if (newHoldings[idx].quantity === numQuantity) {
          newHoldings = newHoldings.filter((h) => h.ticker !== stockToUpdate)
        } else {
          newHoldings[idx] = {
            ...newHoldings[idx],
            quantity: newHoldings[idx].quantity - numQuantity,
            currentPrice: currentPriceNum,
            lastPriceUpdate: replayState.currentTimestamp,
          }
        }
        return { ...prev, holdings: newHoldings, cash: prev.cash + totalProceeds }
      })
      setTransactions((prev) => [
        ...prev,
        {
          id: uuidv4(),
          type: "SELL",
          ticker: stockToUpdate,
          quantity: numQuantity,
          price: currentPriceNum,
          totalValue: totalProceeds,
          timestamp: new Date(replayState.currentTimestamp || Date.now()).toISOString(),
        },
      ])
      toast.success(
        `Market Sell: ${numQuantity} ${stockToUpdate} @ $${currentPriceNum.toFixed(2)}. P/L: $${profitOnSale.toFixed(2)}`,
      )
    } else if (selectedOrderType === "LIMIT") {
      if (!limitPrice || isNaN(Number.parseFloat(limitPrice)) || Number.parseFloat(limitPrice) <= 0) {
        toast.error("Please enter a valid limit price.")
        return
      }
      if (!existingHolding || existingHolding.quantity < numQuantity) {
        toast.error("Not enough shares for limit sell order.")
        return
      }
      const parsedLimitPrice = Number.parseFloat(limitPrice)
      const newOrder: OpenOrder = {
        id: uuidv4(),
        type: "SELL",
        ticker: stockToUpdate,
        quantity: numQuantity,
        orderType: "LIMIT",
        targetPrice: parsedLimitPrice,
        timestamp: new Date(replayState.currentTimestamp || Date.now()).toISOString(),
      }
      setOpenOrders((prev) => [...prev, newOrder])
      toast.success(
        `Limit Sell Order Placed: ${numQuantity} ${stockToUpdate} @ $${parsedLimitPrice.toFixed(2)} or more.`,
      )
    } else if (selectedOrderType === "STOP") {
      if (!stopPrice || isNaN(Number.parseFloat(stopPrice)) || Number.parseFloat(stopPrice) <= 0) {
        toast.error("Please enter a valid stop price.")
        return
      }
      if (!existingHolding || existingHolding.quantity < numQuantity) {
        toast.error("Not enough shares for stop sell order.")
        return
      }
      const parsedStopPrice = Number.parseFloat(stopPrice)
      const newOrder: OpenOrder = {
        id: uuidv4(),
        type: "SELL",
        ticker: stockToUpdate,
        quantity: numQuantity,
        orderType: "STOP",
        targetPrice: parsedStopPrice,
        timestamp: new Date(replayState.currentTimestamp || Date.now()).toISOString(),
      }
      setOpenOrders((prev) => [...prev, newOrder])
      toast.success(
        `Stop Sell (Stop-Loss) Order Placed: ${numQuantity} ${stockToUpdate} if price reaches $${parsedStopPrice.toFixed(2)} or less.`,
      )
    }
    // Clear quantity and price fields after placing order
    setQuantity("1")
    setLimitPrice("")
    setStopPrice("")
  }

  const portfolioValue = portfolio.holdings.reduce((acc, h) => acc + h.quantity * (h.currentPrice || h.avgBuyPrice), 0)
  const totalAssets = portfolio.cash + portfolioValue
  const overallPL = totalAssets - portfolio.initialCash

  const currentDisplayStock = selectedStock || "N/A"
  // currentDisplayPrice is replayState.currentPrice

  let setupPromptMessage = "Please search for a stock, select a date, and choose a trading session to start the replay."
  if (selectedStock && selectedDate && !selectedSession) {
    setupPromptMessage = `Stock ${selectedStock} and date ${selectedDate.toLocaleDateString()} selected. Now, please select a trading session.`
  } else if (selectedStock && !selectedDate && !selectedSession) {
    setupPromptMessage = `Stock ${selectedStock} selected. Now, please select a date and trading session.`
  } else if (!selectedStock && selectedDate && !selectedSession) {
    setupPromptMessage = `Date ${selectedDate.toLocaleDateString()} selected. Now, please select a stock and trading session.`
  }

  const chartDataForSimpleChart =
    historicalData.priceData.length > 0 && replayState.isActive
      ? historicalData.priceData.slice(0, replayState.currentIndex + 1)
      : historicalData.priceData

  const openingPriceForChart =
    historicalData.priceData.length > 0
      ? (historicalData.priceData[0].open ?? historicalData.priceData[0].price)
      : undefined

  return (
    <div className="container mx-auto p-4">
      <Toaster position="top-right" />
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white text-center">
          <img
            src="https://truetradinggroup.com/wp-content/uploads/2024/08/lightLogo.png"
            alt="True Trading Group Logo"
            className="h-12 inline-block"
          />
        </h1>
      </header>

      <Card className="overflow-hidden mb-6">
        <CardContent className="p-0">
          <ReplayControls
            priceData={historicalData.priceData}
            replayState={replayState}
            onReplayStateChange={handleReplayStateChange}
            onPriceUpdate={handlePriceUpdateFromReplay}
          />
        </CardContent>
      </Card>
      <Card className="sticky top-4 z-20 mb-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Portfolio Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-2 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">Cash Balance</p>
              <p className="text-lg font-semibold">${portfolio.cash.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">Holdings Value</p>
              <p className="text-lg font-semibold">${portfolioValue.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">Overall P/L</p>
              <p className={`text-lg font-semibold ${overallPL >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${overallPL.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Row for Open/Executed Orders and Holdings/History Tabs */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Holdings/History Tabs - moved here */}
        <div className="lg:w-1/2">
          <Tabs defaultValue="portfolio" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="portfolio">
                <Briefcase className="mr-2 h-4 w-4" />
                Holdings
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-2 h-4 w-4" />
                Transaction History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="portfolio">
              <Card>
                <CardHeader>
                  <CardTitle>Current Holdings</CardTitle>
                </CardHeader>
                <CardContent>
                  {portfolio.holdings.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No holdings yet. Start trading!</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticker</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Avg. Buy Price</TableHead>
                          <TableHead className="text-right">Current Price</TableHead>
                          <TableHead className="text-right">Current Value</TableHead>
                          <TableHead className="text-right">P/L</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {portfolio.holdings.map((h) => {
                          const currentVal = h.quantity * (h.currentPrice || 0)
                          const pl = h.currentPrice ? (h.currentPrice - h.avgBuyPrice) * h.quantity : 0
                          return (
                            <TableRow key={h.ticker}>
                              <TableCell className="font-medium">{h.ticker}</TableCell>
                              <TableCell className="text-right">{h.quantity}</TableCell>
                              <TableCell className="text-right">${h.avgBuyPrice.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${(h.currentPrice || 0).toFixed(2)}</TableCell>
                              <TableCell className="text-right">${currentVal.toFixed(2)}</TableCell>
                              <TableCell
                                className={`text-right font-medium ${pl >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                ${pl.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Log</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No transactions recorded yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Ticker</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions
                          .slice()
                          .reverse()
                          .map((t) => (
                            <TableRow key={t.id}>
                              <TableCell>{new Date(t.timestamp).toLocaleString()}</TableCell>
                              <TableCell>
                                <span
                                  className={`font-medium px-2 py-0.5 rounded-full text-xs ${t.type === "BUY" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}
                                >
                                  {t.type}
                                </span>
                              </TableCell>
                              <TableCell className="font-medium">{t.ticker}</TableCell>
                              <TableCell className="text-right">{t.quantity}</TableCell>
                              <TableCell className="text-right">${t.price.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${t.totalValue.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Open/Executed Orders - moved here */}
        <div className="lg:w-1/2 flex flex-col">
          <OpenExecutedPositions
            openOrders={openOrders}
            executedTransactions={transactions}
            onCancelOrder={handleCancelOrder}
            currentStockTicker={selectedStock}
            className="flex-1"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Search className="mr-2 h-5 w-5" />
                Select Stock, Date & Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="relative md:col-span-1">
                  <label htmlFor="stock-search" className="block text-sm font-medium text-muted-foreground mb-1">
                    Stock Symbol
                  </label>
                  {/* Stock search input remains the same */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="stock-search"
                      ref={searchInputRef}
                      type="search"
                      placeholder="e.g., AAPL"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                      className="pl-8"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => {
                          setSearchQuery("")
                          setSearchResults([])
                          setSelectedStock(null)
                          if (searchInputRef.current) searchInputRef.current.focus()
                        }}
                        aria-label="Clear search"
                      >
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                  {isSearching && <p className="text-xs text-muted-foreground mt-1">Searching...</p>}
                  {searchResults.length > 0 && !isSearching && (
                    <ul className="absolute z-20 w-full bg-card border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                      {searchResults.map((stock) => (
                        <li key={stock.symbol}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-left h-auto py-2 px-3"
                            onClick={() => handleStockSelectionFromSearch(stock)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{stock.symbol}</span>
                              <span className="text-xs text-muted-foreground">{stock.name}</span>
                            </div>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Trading Date</label>
                  <DatePicker date={selectedDate} onDateChange={handleDateChange} />
                </div>
                <div className="md:col-span-1">
                  <label htmlFor="session-select" className="block text-sm font-medium text-muted-foreground mb-1">
                    Trading Session
                  </label>
                  <Select
                    value={selectedSession || ""}
                    onValueChange={(value) => setSelectedSession(value as TradingSession | null)}
                  >
                    <SelectTrigger id="session-select">
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(sessionDetails).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedStock && selectedDate && selectedSession && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{selectedStock}</CardTitle>
                    <p className="text-sm text-muted-foreground">{sessionDetails[selectedSession]}</p>
                    {typeof replayState.currentPrice === "number" ? (
                      <p className="text-3xl font-bold">
                        ${replayState.currentPrice.toFixed(2)}
                        {historicalData.priceData.length > 0 &&
                          typeof historicalData.priceData[0]?.open === "number" &&
                          historicalData.priceData[0].open !== 0 &&
                          (() => {
                            const openPrice = historicalData.priceData[0].open as number
                            const currentPriceNum = replayState.currentPrice as number
                            const priceChange = currentPriceNum - openPrice
                            const percentageChange = (priceChange / openPrice) * 100
                            return (
                              <span
                                className={`ml-2 text-sm font-medium ${priceChange >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {priceChange >= 0 ? "▲" : "▼"}${priceChange.toFixed(2)} ({percentageChange.toFixed(2)}%)
                              </span>
                            )
                          })()}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {historicalData.isLoading ? "Loading price..." : "Price N/A"}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {replayState.currentTimestamp && (
                      <p className="text-sm text-muted-foreground">
                        Market Time:{" "}
                        {new Date(replayState.currentTimestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {historicalData.isLoading && (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-sm text-blue-500">
                      Loading historical data for {selectedStock} (
                      {sessionDetails[selectedSession!].split("(")[0].trim()})...
                    </p>
                    <Progress value={undefined} className="w-3/4 mx-auto" />
                  </div>
                )}
                {historicalData.error && !historicalData.isLoading && (
                  <p className="text-sm text-red-500 flex items-center justify-center py-4">
                    <AlertCircle className="h-4 w-4 mr-1" /> {historicalData.error}
                  </p>
                )}

                {selectedStock && (
                  <SimpleStockChart data={chartDataForSimpleChart} openingPrice={openingPriceForChart} height="350px" />
                )}

                {historicalData.priceData.length === 0 &&
                  !historicalData.isLoading &&
                  !historicalData.error &&
                  selectedDate &&
                  selectedStock &&
                  selectedSession && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No trading data found for {selectedStock} on {selectedDate.toLocaleDateString()} during{" "}
                      {sessionDetails[selectedSession]}.
                    </p>
                  )}
              </CardContent>
            </Card>
          )}
          {(!selectedStock || !selectedDate || !selectedSession) &&
            !historicalData.isLoading &&
            !historicalData.error && (
              <Card className="text-center">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">{setupPromptMessage}</p>
                </CardContent>
              </Card>
            )}
        </div>

        <div className="lg:w-1/3">
          <div className="sticky top-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Activity className="mr-2 h-5 w-5" />
                  Trade {selectedStock || "Stock"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {typeof replayState.currentPrice === "number" && selectedStock ? (
                  <div className="p-3 bg-secondary rounded-md">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-semibold text-primary">
                        Current Price: ${replayState.currentPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-secondary rounded-md text-center">
                    <p className="text-muted-foreground">
                      {selectedStock && selectedDate && selectedSession
                        ? "Replay not active or data loading."
                        : "Select stock, date, and session to trade."}
                    </p>
                  </div>
                )}
                <div>
                  <label htmlFor="orderType" className="block text-sm font-medium text-muted-foreground mb-1">
                    Order Type
                  </label>
                  <Select value={selectedOrderType} onValueChange={setSelectedOrderType}>
                    <SelectTrigger id="orderType">
                      <SelectValue placeholder="Select order type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MARKET">Market Order</SelectItem>
                      <SelectItem value="LIMIT">Limit Order</SelectItem>
                      <SelectItem value="STOP">Stop Order</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedOrderType === "LIMIT" && (
                    <div className="mt-2">
                      <label htmlFor="limitPrice" className="block text-sm font-medium text-muted-foreground mb-1">
                        Limit Price
                      </label>
                      <Input
                        id="limitPrice"
                        type="number"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        placeholder="Enter limit price"
                        disabled={
                          !replayState.isActive ||
                          !selectedStock ||
                          !selectedSession ||
                          typeof replayState.currentPrice !== "number"
                        }
                      />
                    </div>
                  )}
                  {selectedOrderType === "STOP" && (
                    <div className="mt-2">
                      <label htmlFor="stopPrice" className="block text-sm font-medium text-muted-foreground mb-1">
                        Stop Price
                      </label>
                      <Input
                        id="stopPrice"
                        type="number"
                        value={stopPrice}
                        onChange={(e) => setStopPrice(e.target.value)}
                        placeholder="Enter stop price"
                        disabled={
                          !replayState.isActive ||
                          !selectedStock ||
                          !selectedSession ||
                          typeof replayState.currentPrice !== "number"
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <label htmlFor="quantity" className="block text-sm font-medium text-muted-foreground mb-1">
                    Quantity
                  </label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    placeholder="Enter quantity"
                    disabled={
                      !replayState.isActive ||
                      typeof replayState.currentPrice !== "number" ||
                      !selectedStock ||
                      !selectedSession ||
                      (selectedOrderType === "LIMIT" && !limitPrice) ||
                      (selectedOrderType === "STOP" && !stopPrice)
                    }
                  />
                </div>

                <div className="flex space-x-2 mt-4">
                  <Button
                    onClick={handleBuy}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={
                      !replayState.isActive ||
                      typeof replayState.currentPrice !== "number" ||
                      !selectedStock ||
                      !selectedSession ||
                      (selectedOrderType === "LIMIT" && !limitPrice) ||
                      (selectedOrderType === "STOP" && !stopPrice)
                    }
                  >
                    <TrendingUp className="mr-2 h-4 w-4" /> Buy
                  </Button>
                  <Button
                    onClick={handleSell}
                    variant="destructive"
                    className="flex-1"
                    disabled={
                      !replayState.isActive ||
                      typeof replayState.currentPrice !== "number" ||
                      !selectedStock ||
                      !selectedSession ||
                      (selectedOrderType === "LIMIT" && !limitPrice) ||
                      (selectedOrderType === "STOP" && !stopPrice)
                    }
                  >
                    <TrendingDown className="mr-2 h-4 w-4" /> Sell
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="flex items-center text-md">
                  <ListOrdered className="mr-2 h-4 w-4" />
                  Recent Trades ({selectedStock || "N/A"})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <MarketTimeAndSales
                  priceDataForDay={historicalData.priceData}
                  currentReplayIndex={replayState.currentIndex}
                  currentStockTicker={selectedStock}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
