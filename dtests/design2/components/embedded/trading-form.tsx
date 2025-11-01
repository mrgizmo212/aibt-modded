"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function TradingForm() {
  const [mode, setMode] = useState("intraday")
  const [session, setSession] = useState("regular")

  return (
    <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Start Trading - Claude Day Trader</h3>

      <div className="space-y-6">
        <div>
          <Label className="text-sm text-white mb-3 block">Trading Mode</Label>
          <RadioGroup value={mode} onValueChange={setMode} className="space-y-3">
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
              <RadioGroupItem value="daily" id="daily" className="mt-0.5" />
              <div className="flex-1">
                <label htmlFor="daily" className="text-sm font-medium text-white cursor-pointer">
                  Daily
                </label>
                <p className="text-xs text-[#a3a3a3] mt-0.5">Historical backtest</p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-sm text-white mb-2 block">Symbol</Label>
          <Select defaultValue="AAPL">
            <SelectTrigger className="bg-[#0a0a0a] border-[#262626] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#262626]">
              <SelectItem value="AAPL">AAPL</SelectItem>
              <SelectItem value="MSFT">MSFT</SelectItem>
              <SelectItem value="NVDA">NVDA</SelectItem>
              <SelectItem value="TSLA">TSLA</SelectItem>
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
          <p className="text-sm text-[#3b82f6]">This will create Run #13 using Claude 4.5 Sonnet</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" className="flex-1 text-[#a3a3a3] hover:text-white">
            Cancel
          </Button>
          <Button className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white">Start Trading →</Button>
        </div>
      </div>
    </div>
  )
}
