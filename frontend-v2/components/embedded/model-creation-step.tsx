"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"

interface ModelCreationStepProps {
  step: "name" | "type" | "strategy" | "risk" | "backtest" | "confirm"
  data?: any
  onNext: (data: any) => void
}

export function ModelCreationStep({ step, data = {}, onNext }: ModelCreationStepProps) {
  if (step === "name") {
    return (
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 space-y-4">
        <div>
          <Label htmlFor="modelName" className="text-sm text-white mb-2 block">
            What would you like to name your model?
          </Label>
          <Input
            id="modelName"
            placeholder="e.g., Momentum Scalper, Mean Reversion Bot"
            className="bg-[#0a0a0a] border-[#262626] text-white"
            defaultValue={data.name || ""}
          />
        </div>
        <Button
          onClick={() => {
            const input = document.getElementById("modelName") as HTMLInputElement
            onNext({ name: input.value })
          }}
          className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white"
        >
          Continue
        </Button>
      </div>
    )
  }

  if (step === "type") {
    return (
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 space-y-4">
        <Label className="text-sm text-white block">What type of trading model?</Label>
        <RadioGroup defaultValue={data.type || "day-trading"} className="space-y-3">
          <div className="flex items-center space-x-3 bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 hover:border-[#404040] transition-colors">
            <RadioGroupItem value="day-trading" id="day-trading" />
            <Label htmlFor="day-trading" className="flex-1 cursor-pointer">
              <div className="text-white font-medium">Day Trading</div>
              <div className="text-xs text-[#a3a3a3]">Open and close positions within the same day</div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 hover:border-[#404040] transition-colors">
            <RadioGroupItem value="swing-trading" id="swing-trading" />
            <Label htmlFor="swing-trading" className="flex-1 cursor-pointer">
              <div className="text-white font-medium">Swing Trading</div>
              <div className="text-xs text-[#a3a3a3]">Hold positions for days or weeks</div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 hover:border-[#404040] transition-colors">
            <RadioGroupItem value="scalping" id="scalping" />
            <Label htmlFor="scalping" className="flex-1 cursor-pointer">
              <div className="text-white font-medium">Scalping</div>
              <div className="text-xs text-[#a3a3a3]">Very short-term trades, seconds to minutes</div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 hover:border-[#404040] transition-colors">
            <RadioGroupItem value="long-term" id="long-term" />
            <Label htmlFor="long-term" className="flex-1 cursor-pointer">
              <div className="text-white font-medium">Long-term Investment</div>
              <div className="text-xs text-[#a3a3a3]">Hold positions for months or years</div>
            </Label>
          </div>
        </RadioGroup>
        <Button
          onClick={() => {
            const selected = document.querySelector('input[name="type"]:checked') as HTMLInputElement
            onNext({ type: selected?.value || "day-trading" })
          }}
          className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white"
        >
          Continue
        </Button>
      </div>
    )
  }

  if (step === "strategy") {
    return (
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 space-y-4">
        <Label className="text-sm text-white block">Choose your trading strategy</Label>
        <RadioGroup defaultValue={data.strategy || "momentum"} className="space-y-3">
          <div className="flex items-center space-x-3 bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 hover:border-[#404040] transition-colors">
            <RadioGroupItem value="momentum" id="momentum" />
            <Label htmlFor="momentum" className="flex-1 cursor-pointer">
              <div className="text-white font-medium">Momentum</div>
              <div className="text-xs text-[#a3a3a3]">Follow strong price trends</div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 hover:border-[#404040] transition-colors">
            <RadioGroupItem value="mean-reversion" id="mean-reversion" />
            <Label htmlFor="mean-reversion" className="flex-1 cursor-pointer">
              <div className="text-white font-medium">Mean Reversion</div>
              <div className="text-xs text-[#a3a3a3]">Buy low, sell high based on averages</div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 hover:border-[#404040] transition-colors">
            <RadioGroupItem value="breakout" id="breakout" />
            <Label htmlFor="breakout" className="flex-1 cursor-pointer">
              <div className="text-white font-medium">Breakout</div>
              <div className="text-xs text-[#a3a3a3]">Trade when price breaks key levels</div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 hover:border-[#404040] transition-colors">
            <RadioGroupItem value="arbitrage" id="arbitrage" />
            <Label htmlFor="arbitrage" className="flex-1 cursor-pointer">
              <div className="text-white font-medium">Arbitrage</div>
              <div className="text-xs text-[#a3a3a3]">Exploit price differences across markets</div>
            </Label>
          </div>
        </RadioGroup>
        <Button
          onClick={() => {
            const selected = document.querySelector('input[name="strategy"]:checked') as HTMLInputElement
            onNext({ strategy: selected?.value || "momentum" })
          }}
          className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white"
        >
          Continue
        </Button>
      </div>
    )
  }

  if (step === "risk") {
    return (
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 space-y-4">
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-white mb-3 block">Risk per trade</Label>
            <div className="space-y-2">
              <Slider
                defaultValue={[data.riskPerTrade || 2]}
                max={10}
                min={0.5}
                step={0.5}
                className="w-full"
                id="riskSlider"
              />
              <div className="flex justify-between text-xs text-[#a3a3a3]">
                <span>0.5%</span>
                <span id="riskValue" className="text-white font-mono">
                  {data.riskPerTrade || 2}%
                </span>
                <span>10%</span>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="maxDrawdown" className="text-sm text-white mb-2 block">
              Maximum drawdown limit
            </Label>
            <div className="relative">
              <Input
                id="maxDrawdown"
                type="number"
                placeholder="20"
                defaultValue={data.maxDrawdown || "20"}
                className="bg-[#0a0a0a] border-[#262626] text-white pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3a3a3] text-sm">%</span>
            </div>
          </div>

          <div>
            <Label htmlFor="stopLoss" className="text-sm text-white mb-2 block">
              Default stop loss
            </Label>
            <div className="relative">
              <Input
                id="stopLoss"
                type="number"
                placeholder="2"
                defaultValue={data.stopLoss || "2"}
                className="bg-[#0a0a0a] border-[#262626] text-white pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3a3a3] text-sm">%</span>
            </div>
          </div>
        </div>
        <Button
          onClick={() => {
            const riskSlider = document.getElementById("riskSlider") as HTMLInputElement
            const maxDrawdown = document.getElementById("maxDrawdown") as HTMLInputElement
            const stopLoss = document.getElementById("stopLoss") as HTMLInputElement
            onNext({
              riskPerTrade: Number.parseFloat(riskSlider.value),
              maxDrawdown: Number.parseFloat(maxDrawdown.value),
              stopLoss: Number.parseFloat(stopLoss.value),
            })
          }}
          className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white"
        >
          Continue
        </Button>
      </div>
    )
  }

  if (step === "backtest") {
    return (
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 space-y-4">
        <Label className="text-sm text-white block">Would you like to backtest this model?</Label>
        <div className="space-y-3">
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-3">
            <div className="text-white text-sm mb-2">Backtesting helps validate your strategy</div>
            <div className="text-xs text-[#a3a3a3]">
              We'll test your model against historical data to see how it would have performed
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => onNext({ backtest: false })}
              variant="outline"
              className="bg-[#0a0a0a] border-[#262626] text-white hover:bg-[#1a1a1a] hover:text-white"
            >
              Skip for now
            </Button>
            <Button onClick={() => onNext({ backtest: true })} className="bg-[#3b82f6] hover:bg-[#2563eb] text-white">
              Run backtest
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (step === "confirm") {
    return (
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 space-y-4">
        <div className="space-y-3">
          <div className="text-white font-medium">Review your model</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-[#262626]">
              <span className="text-[#a3a3a3]">Name</span>
              <span className="text-white">{data.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#262626]">
              <span className="text-[#a3a3a3]">Type</span>
              <span className="text-white capitalize">{data.type?.replace("-", " ")}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#262626]">
              <span className="text-[#a3a3a3]">Strategy</span>
              <span className="text-white capitalize">{data.strategy?.replace("-", " ")}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#262626]">
              <span className="text-[#a3a3a3]">Risk per trade</span>
              <span className="text-white font-mono">{data.riskPerTrade}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#262626]">
              <span className="text-[#a3a3a3]">Max drawdown</span>
              <span className="text-white font-mono">{data.maxDrawdown}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#262626]">
              <span className="text-[#a3a3a3]">Stop loss</span>
              <span className="text-white font-mono">{data.stopLoss}%</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[#a3a3a3]">Backtest</span>
              <span className="text-white">{data.backtest ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>
        <Button onClick={() => onNext({})} className="w-full bg-[#10b981] hover:bg-[#059669] text-white">
          Create Model
        </Button>
      </div>
    )
  }

  return null
}
