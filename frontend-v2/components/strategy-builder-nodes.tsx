"use client"

import { useState, useEffect } from 'react'
import { Handle, Position } from 'reactflow'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Switch } from './ui/switch'

// 1. Model Name Node
export function ModelNameNode({ data, id }: { data: any; id: string }) {
  const [value, setValue] = useState(data.value || '')
  
  useEffect(() => {
    data.onChange?.(id, value)
  }, [value, id])
  
  return (
    <div className="bg-[#1a1a1a] border-2 border-[#3b82f6] rounded-lg p-4 min-w-[280px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📝</span>
        <span className="text-sm font-medium text-white">Model Name</span>
        <span className="ml-auto text-[10px] text-[#ef4444] bg-[#ef4444]/10 px-2 py-0.5 rounded">REQUIRED</span>
      </div>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g., GPT-4 Momentum Trader"
        className="bg-[#0a0a0a] border-[#262626] text-white text-sm"
      />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

// 2. AI Model Selector Node
export function AIModelNode({ data, id }: { data: any; id: string }) {
  const [value, setValue] = useState(data.value || '')
  
  const aiModels = [
    { value: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Anthropic)' },
    { value: 'gpt-o1-mini', label: 'GPT-o1 Mini (OpenAI)' },
    { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (OpenRouter)' },
  ]
  
  useEffect(() => {
    data.onChange?.(id, value)
  }, [value, id])
  
  return (
    <div className="bg-[#1a1a1a] border-2 border-[#3b82f6] rounded-lg p-4 min-w-[280px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🤖</span>
        <span className="text-sm font-medium text-white">AI Model</span>
        <span className="ml-auto text-[10px] text-[#ef4444] bg-[#ef4444]/10 px-2 py-0.5 rounded">REQUIRED</span>
      </div>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full bg-[#0a0a0a] border border-[#262626] text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
      >
        <option value="">Select AI Model...</option>
        {aiModels.map(model => (
          <option key={model.value} value={model.value}>
            {model.label}
          </option>
        ))}
      </select>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

// 3. Trading Style Node
export function TradingStyleNode({ data, id }: { data: any; id: string }) {
  const [value, setValue] = useState(data.value || '')
  
  const styles = [
    { value: 'scalping', label: '⚡ Scalping', desc: 'Very short-term (minutes)' },
    { value: 'day-trading', label: '📊 Day Trading', desc: 'Intraday positions only' },
    { value: 'swing-trading', label: '📈 Swing Trading', desc: 'Days to weeks' },
    { value: 'investing', label: '💼 Investing', desc: 'Long-term holds' },
  ]
  
  useEffect(() => {
    data.onChange?.(id, value)
  }, [value, id])
  
  return (
    <div className="bg-[#1a1a1a] border-2 border-[#3b82f6] rounded-lg p-4 min-w-[280px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⚡</span>
        <span className="text-sm font-medium text-white">Trading Style</span>
        <span className="ml-auto text-[10px] text-[#ef4444] bg-[#ef4444]/10 px-2 py-0.5 rounded">REQUIRED</span>
      </div>
      <div className="space-y-2">
        {styles.map(style => (
          <button
            key={style.value}
            onClick={() => setValue(style.value)}
            className={`w-full text-left p-2.5 rounded border transition-all ${
              value === style.value
                ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-white'
                : 'bg-[#0a0a0a] border-[#262626] text-[#a3a3a3] hover:border-[#404040]'
            }`}
          >
            <div className="text-sm font-medium">{style.label}</div>
            <div className="text-xs text-[#737373]">{style.desc}</div>
          </button>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

// 4. Initial Cash Node
export function InitialCashNode({ data, id }: { data: any; id: string }) {
  const [value, setValue] = useState(data.value || 10000)
  
  useEffect(() => {
    data.onChange?.(id, value)
  }, [value, id])
  
  return (
    <div className="bg-[#1a1a1a] border-2 border-[#8b5cf6] rounded-lg p-4 min-w-[260px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">💰</span>
        <span className="text-sm font-medium text-white">Initial Cash</span>
        <span className="ml-auto text-[10px] text-[#737373] bg-[#0a0a0a] px-2 py-0.5 rounded border border-[#262626]">OPTIONAL</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xl text-white font-medium">$</span>
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="bg-[#0a0a0a] border-[#262626] text-white text-sm"
            min={1000}
            max={1000000}
            step={1000}
          />
        </div>
        <p className="text-xs text-[#737373]">Starting capital for trading</p>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

// 5. Trading Actions Node
export function TradingActionsNode({ data, id }: { data: any; id: string }) {
  const [shortSelling, setShortSelling] = useState(data.shortSelling || false)
  const [multiLeg, setMultiLeg] = useState(data.multiLegOptions || false)
  const [hedging, setHedging] = useState(data.hedging || false)
  
  useEffect(() => {
    data.onChange?.(id, { shortSelling, multiLegOptions: multiLeg, hedging })
  }, [shortSelling, multiLeg, hedging, id])
  
  return (
    <div className="bg-[#1a1a1a] border-2 border-[#8b5cf6] rounded-lg p-4 min-w-[300px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📊</span>
        <span className="text-sm font-medium text-white">Trading Actions</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white">Short Selling</div>
            <div className="text-xs text-[#737373]">Allow shorting stocks (requires margin)</div>
          </div>
          <Switch checked={shortSelling} onCheckedChange={setShortSelling} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white">Multi-Leg Options</div>
            <div className="text-xs text-[#737373]">Spreads, straddles, iron condors</div>
          </div>
          <Switch checked={multiLeg} onCheckedChange={setMultiLeg} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white">Hedging</div>
            <div className="text-xs text-[#737373]">Allow hedging existing positions</div>
          </div>
          <Switch checked={hedging} onCheckedChange={setHedging} />
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

// 6. Order Types Node
export function OrderTypesNode({ data, id }: { data: any; id: string }) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(data.selectedTypes || ['market', 'limit'])
  
  const orderTypes = [
    { value: 'market', label: 'Market', desc: 'Execute immediately at current price' },
    { value: 'limit', label: 'Limit', desc: 'Buy/sell at specific price or better' },
    { value: 'stop', label: 'Stop', desc: 'Trigger market order at stop price' },
    { value: 'stop_limit', label: 'Stop-Limit', desc: 'Trigger limit order at stop price' },
    { value: 'trailing_stop', label: 'Trailing Stop', desc: 'Dynamic stop that follows price' },
    { value: 'bracket', label: 'Bracket', desc: 'Entry with profit target & stop loss' },
  ]
  
  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }
  
  useEffect(() => {
    data.onChange?.(id, selectedTypes)
  }, [selectedTypes, id])
  
  return (
    <div className="bg-[#1a1a1a] border-2 border-[#8b5cf6] rounded-lg p-4 min-w-[300px] max-w-[320px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📈</span>
        <span className="text-sm font-medium text-white">Order Types</span>
      </div>
      <div className="space-y-1.5">
        {orderTypes.map(type => (
          <button
            key={type.value}
            onClick={() => toggleType(type.value)}
            className={`w-full text-left p-2 rounded border text-xs transition-all ${
              selectedTypes.includes(type.value)
                ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-white'
                : 'bg-[#0a0a0a] border-[#262626] text-[#a3a3a3] hover:border-[#404040]'
            }`}
          >
            <div className="font-medium">{type.label}</div>
            <div className="text-[#737373]">{type.desc}</div>
          </button>
        ))}
      </div>
      <div className="mt-3 text-xs text-[#737373] bg-[#0a0a0a] px-2 py-1 rounded border border-[#262626]">
        Selected: {selectedTypes.length} types
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

// 7. Custom Instructions Node
export function CustomInstructionsNode({ data, id }: { data: any; id: string }) {
  const [value, setValue] = useState(data.value || '')
  
  useEffect(() => {
    data.onChange?.(id, value)
  }, [value, id])
  
  return (
    <div className="bg-[#1a1a1a] border-2 border-[#8b5cf6] rounded-lg p-4 min-w-[340px] max-w-[380px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">💭</span>
        <span className="text-sm font-medium text-white">Custom Instructions</span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Example: Focus on value investing. Prefer companies with P/E ratio under 20. Analyze market sentiment before each trade."
        className="bg-[#0a0a0a] border-[#262626] text-white text-sm min-h-[120px] resize-none"
        maxLength={2000}
      />
      <div className="mt-2 text-xs text-[#737373]">
        {value.length}/2000 characters • Provide additional context or strategy guidance
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

