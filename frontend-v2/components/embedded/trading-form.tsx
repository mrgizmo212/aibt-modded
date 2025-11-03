"use client"

import { useState, useEffect } from "react"
import { Info, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { startIntradayTrading, startTrading, getModelById, getRuns } from "@/lib/api"
import { toast } from "sonner"

interface TradingFormProps {
  modelId?: number
  modelName?: string
  onClose?: () => void
  onSuccess?: () => void
}

export function TradingForm({ modelId, modelName, onClose, onSuccess }: TradingFormProps) {
  // Helper to get recent trading date (skip weekends)
  const getRecentTradingDate = (daysBack: number): string => {
    const date = new Date()
    let tradingDaysFound = 0
    
    while (tradingDaysFound < daysBack) {
      date.setDate(date.getDate() - 1)
      const dayOfWeek = date.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        tradingDaysFound++
      }
    }
    
    return date.toISOString().split('T')[0]
  }

  const [mode, setMode] = useState<'daily' | 'intraday'>("intraday")
  const [session, setSession] = useState("regular")
  const [symbol, setSymbol] = useState("SPY")  // Default to SPY (S&P 500 ETF)
  const [loading, setLoading] = useState(false)
  const [modelData, setModelData] = useState<any>(null)
  const [runningRunsCount, setRunningRunsCount] = useState(0)
  
  // Daily mode state
  const [startDate, setStartDate] = useState(getRecentTradingDate(3)) // 3 trading days back
  const [endDate, setEndDate] = useState(getRecentTradingDate(1))     // 1 trading day back
  
  // Intraday mode state
  const [intradayDate, setIntradayDate] = useState(getRecentTradingDate(1))
  
  // Limit: Max 2 concurrent runs per model
  const MAX_CONCURRENT_RUNS = 2

  // Load model configuration and check running runs
  useEffect(() => {
    if (modelId) {
      getModelById(modelId).then(setModelData).catch(console.error)
      
      // Check how many runs are currently running
      getRuns(modelId).then(runs => {
        const runningCount = runs.filter((r: any) => r.status === 'running').length
        setRunningRunsCount(runningCount)
      }).catch(console.error)
    }
  }, [modelId])

  async function handleStartTrading() {
    if (!modelId) {
      toast.error('No model selected')
      return
    }

    if (!modelData || !modelData.default_ai_model) {
      toast.error('Model has no AI model configured')
      return
    }

    setLoading(true)

    try {
      if (mode === 'intraday') {
        const response = await startIntradayTrading(
          modelId,
          symbol,
          intradayDate,
          session as 'pre' | 'regular' | 'after',
          modelData.default_ai_model
        )
        
        // NEW: Handle async response with task_id
        if (response.task_id) {
          toast.success(`Trading queued! Run #${response.run_number || '?'}`)
          toast.info('Trading runs in background. Check Live Updates for progress.')
        } else {
          // Old blocking response (shouldn't happen anymore)
          toast.success('Trading completed')
        }
      } else {
        // Daily mode (still blocking for now)
        await startTrading(
          modelId,
          modelData.default_ai_model,
          startDate,
          endDate
        )
        toast.success('Daily trading started')
      }
      
      if (onClose) onClose()
      
      // Trigger success callback AFTER closing (so parent can refresh)
      if (onSuccess) {
        setTimeout(() => onSuccess(), 100)
      }
    } catch (error: any) {
      console.error('Failed to start trading:', error)
      toast.error(error.message || 'Failed to start trading')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6">
        Start Trading {modelName ? `- ${modelName}` : ''}
      </h3>

      <div className="space-y-6">
        {/* Trading Mode Selection: Daily vs Intraday */}
        <div>
          <Label className="text-sm text-white mb-3 block">Trading Mode</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('daily')}
              disabled={loading}
              className={`px-4 py-3 rounded-lg border text-left transition-colors ${
                mode === 'daily'
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'bg-[#0a0a0a] border-[#262626] text-[#a3a3a3] hover:border-[#404040]'
              }`}
            >
              <div className="font-medium">📅 Daily Trading</div>
              <div className="text-xs mt-1 opacity-75">1 decision per day, multiple days</div>
            </button>
            
            <button
              type="button"
              onClick={() => setMode('intraday')}
              disabled={loading}
              className={`px-4 py-3 rounded-lg border text-left transition-colors ${
                mode === 'intraday'
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'bg-[#0a0a0a] border-[#262626] text-[#a3a3a3] hover:border-[#404040]'
              }`}
            >
              <div className="font-medium">⚡ Intraday Trading</div>
              <div className="text-xs mt-1 opacity-75">Minute-by-minute, single day</div>
            </button>
          </div>
        </div>

        {/* Daily Mode Fields */}
        {mode === 'daily' && (
          <>
            <div>
              <Label className="text-sm text-white mb-2 block">Start Date</Label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white focus:border-[#3b82f6] focus:outline-none"
              />
            </div>
            
            <div>
              <Label className="text-sm text-white mb-2 block">End Date</Label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white focus:border-[#3b82f6] focus:outline-none"
              />
            </div>
          </>
        )}

        {/* Intraday Mode Fields */}
        {mode === 'intraday' && (
          <>
            <div>
              <Label className="text-sm text-white mb-2 block">Symbol</Label>
              <Select 
                value={symbol} 
                onValueChange={setSymbol}
                disabled={loading}
              >
                <SelectTrigger className="bg-[#0a0a0a] border-[#262626] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#262626]">
                  <SelectItem value="SPY">SPY - S&P 500 ETF</SelectItem>
                  <SelectItem value="AAPL">AAPL - Apple Inc.</SelectItem>
                  <SelectItem value="MSFT">MSFT - Microsoft</SelectItem>
                  <SelectItem value="GOOGL">GOOGL - Google</SelectItem>
                  <SelectItem value="META">META - Meta Platforms</SelectItem>
                  <SelectItem value="AMZN">AMZN - Amazon</SelectItem>
                  <SelectItem value="TSLA">TSLA - Tesla</SelectItem>
                  <SelectItem value="NVDA">NVDA - NVIDIA</SelectItem>
                  <SelectItem value="COIN">COIN - Coinbase</SelectItem>
                  <SelectItem value="BYND">BYND - Beyond Meat</SelectItem>
                  <SelectItem value="IBM">IBM - IBM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-white mb-2 block">Trading Date</Label>
              <input
                type="date"
                value={intradayDate}
                onChange={(e) => setIntradayDate(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white focus:border-[#3b82f6] focus:outline-none"
              />
            </div>

            <div>
              <Label className="text-sm text-white mb-2 block">Session</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'pre', label: 'Pre-Market', time: '4:00-9:30 AM' },
                  { value: 'regular', label: 'Regular', time: '9:30 AM-4 PM' },
                  { value: 'after', label: 'After-Hours', time: '4:00-8:00 PM' }
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSession(s.value)}
                    disabled={loading}
                    className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                      session === s.value
                        ? 'bg-[#3b82f6] border-[#3b82f6] text-white'
                        : 'bg-[#0a0a0a] border-[#262626] text-[#a3a3a3] hover:border-[#404040]'
                    }`}
                  >
                    <div className="text-sm font-medium">{s.label}</div>
                    <div className="text-xs opacity-75">{s.time}</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Concurrent run limit warning */}
        {runningRunsCount >= MAX_CONCURRENT_RUNS && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-orange-500 font-semibold">
                Maximum concurrent runs reached ({runningRunsCount}/{MAX_CONCURRENT_RUNS})
              </p>
              <p className="text-xs text-orange-400 mt-1">
                Stop one of the running sessions before starting a new one.
              </p>
            </div>
          </div>
        )}

        {/* Trading info */}
        {runningRunsCount < MAX_CONCURRENT_RUNS && (
          <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-lg p-3 flex gap-3">
            <Info className="w-5 h-5 text-[#3b82f6] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#3b82f6]">
              {mode === 'daily' 
                ? `Will trade all symbols from ${startDate} to ${endDate} (1 decision per day)`
                : `Will trade ${symbol} on ${intradayDate} (${session} session, minute-by-minute)`
              }
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button 
            variant="ghost" 
            className="flex-1 text-[#a3a3a3] hover:text-white"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleStartTrading}
            disabled={loading || !modelId || runningRunsCount >= MAX_CONCURRENT_RUNS}
          >
            {loading ? 'Starting...' : runningRunsCount >= MAX_CONCURRENT_RUNS ? 'Max Runs Reached' : 'Start Trading →'}
          </Button>
        </div>
      </div>
    </div>
  )
}
