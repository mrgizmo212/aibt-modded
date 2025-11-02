"use client"

import { useState, useEffect } from "react"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { startIntradayTrading, startTrading, getModelById } from "@/lib/api"
import { toast } from "sonner"

interface TradingFormProps {
  modelId?: number
  modelName?: string
  onClose?: () => void
  onSuccess?: () => void
}

export function TradingForm({ modelId, modelName, onClose, onSuccess }: TradingFormProps) {
  const [mode, setMode] = useState<'paper' | 'intraday'>("intraday")
  const [session, setSession] = useState("regular")
  const [symbol, setSymbol] = useState("AAPL")
  const [loading, setLoading] = useState(false)
  const [modelData, setModelData] = useState<any>(null)

  // Load model configuration
  useEffect(() => {
    if (modelId) {
      getModelById(modelId).then(setModelData).catch(console.error)
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
        await startIntradayTrading(
          modelId,
          symbol,
          '2025-10-15',  // Recent date with complete data
          session as 'pre' | 'regular' | 'after',
          modelData.default_ai_model  // Use model's configured AI model
        )
      } else {
        await startTrading(
          modelId,
          modelData.default_ai_model,  // Use model's configured AI model
          '2025-10-15',
          '2025-10-15'
        )
      }
      toast.success(`Trading started in ${mode} mode`)
      
      if (onSuccess) onSuccess()
      if (onClose) onClose()
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
        <div>
          <Label className="text-sm text-white mb-3 block">Trading Mode</Label>
          <RadioGroup 
            value={mode} 
            onValueChange={(value: 'paper' | 'intraday') => setMode(value)} 
            className="space-y-3"
            disabled={loading}
          >
            <div className="flex items-start gap-3 p-3 rounded-lg border border-[#262626] hover:border-[#404040] transition-colors">
              <RadioGroupItem value="intraday" id="intraday" className="mt-0.5" />
              <div className="flex-1">
                <label htmlFor="intraday" className="text-sm font-medium text-white cursor-pointer">
                  Intraday
                </label>
                <p className="text-xs text-[#a3a3a3] mt-0.5">Today's market - live trading</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border border-[#262626] hover:border-[#404040] transition-colors">
              <RadioGroupItem value="paper" id="paper" className="mt-0.5" />
              <div className="flex-1">
                <label htmlFor="paper" className="text-sm font-medium text-white cursor-pointer">
                  Paper Trading
                </label>
                <p className="text-xs text-[#a3a3a3] mt-0.5">Simulated trading with fake money</p>
              </div>
            </div>
          </RadioGroup>
        </div>

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
              <SelectItem value="AAPL">AAPL - Apple Inc.</SelectItem>
              <SelectItem value="MSFT">MSFT - Microsoft</SelectItem>
              <SelectItem value="GOOGL">GOOGL - Google</SelectItem>
              <SelectItem value="AMZN">AMZN - Amazon</SelectItem>
              <SelectItem value="TSLA">TSLA - Tesla</SelectItem>
              <SelectItem value="NVDA">NVDA - NVIDIA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm text-white mb-2 block">Session</Label>
          <div className="flex gap-2">
            {["Regular", "Pre-Market", "After-Hours"].map((s) => (
              <Button
                key={s}
                variant={session === s.toLowerCase().replace("-", "") ? "default" : "outline"}
                size="sm"
                onClick={() => setSession(s.toLowerCase().replace("-", ""))}
                className={
                  session === s.toLowerCase().replace("-", "")
                    ? "bg-[#3b82f6] hover:bg-[#2563eb] text-white"
                    : "bg-transparent border-[#262626] text-[#a3a3a3] hover:bg-[#1a1a1a] hover:text-white"
                }
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-lg p-3 flex gap-3">
          <Info className="w-5 h-5 text-[#3b82f6] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#3b82f6]">
            This will start {mode} trading for {modelName || 'this model'}
          </p>
        </div>

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
            className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white"
            onClick={handleStartTrading}
            disabled={loading || !modelId}
          >
            {loading ? 'Starting...' : 'Start Trading →'}
          </Button>
        </div>
      </div>
    </div>
  )
}
