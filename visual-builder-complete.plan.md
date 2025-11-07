# Complete Visual Builder Implementation Plan

## 🔴 SAFETY FIRST: All Changes Are Additive Only

**Zero Risk Approach:**
- ✅ Only ADD new components, never modify existing
- ✅ Existing node types remain untouched
- ✅ Current generation logic preserved
- ✅ Fallback to form always available
- ✅ Each phase independently testable

---

## Phase 1: Create New Node Components

### File: `frontend-v2/components/strategy-builder-nodes.tsx` (NEW FILE)

Create a separate file for new node types to avoid touching existing code.

```typescript
"use client"

import { useState, useEffect } from 'react'
import { Handle, Position } from 'reactflow'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Switch } from './ui/switch'
import { Label } from './ui/label'

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
        className="w-full bg-[#0a0a0a] border border-[#262626] text-white text-sm rounded-md px-3 py-2"
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
    { value: 'day-trading', label: '📊 Day Trading', desc: 'Intraday only' },
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
            className={`w-full text-left p-2 rounded border transition-all ${
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
          <span className="text-xl text-white">$</span>
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
    <div className="bg-[#1a1a1a] border-2 border-[#8b5cf6] rounded-lg p-4 min-w-[280px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📊</span>
        <span className="text-sm font-medium text-white">Trading Actions</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white">Short Selling</div>
            <div className="text-xs text-[#737373]">Allow shorting stocks</div>
          </div>
          <Switch checked={shortSelling} onCheckedChange={setShortSelling} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white">Multi-Leg Options</div>
            <div className="text-xs text-[#737373]">Spreads, straddles, etc.</div>
          </div>
          <Switch checked={multiLeg} onCheckedChange={setMultiLeg} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white">Hedging</div>
            <div className="text-xs text-[#737373]">Hedge existing positions</div>
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
    { value: 'market', label: 'Market', desc: 'Immediate execution' },
    { value: 'limit', label: 'Limit', desc: 'At specific price' },
    { value: 'stop', label: 'Stop', desc: 'Trigger at stop price' },
    { value: 'stop_limit', label: 'Stop-Limit', desc: 'Trigger limit order' },
    { value: 'trailing_stop', label: 'Trailing Stop', desc: 'Dynamic stop' },
    { value: 'bracket', label: 'Bracket', desc: 'Entry + targets' },
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
    <div className="bg-[#1a1a1a] border-2 border-[#8b5cf6] rounded-lg p-4 min-w-[280px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📈</span>
        <span className="text-sm font-medium text-white">Order Types</span>
      </div>
      <div className="space-y-2">
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
      <div className="mt-2 text-xs text-[#737373]">
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
    <div className="bg-[#1a1a1a] border-2 border-[#8b5cf6] rounded-lg p-4 min-w-[320px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">💭</span>
        <span className="text-sm font-medium text-white">Custom Instructions</span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Focus on value investing. Prefer companies with P/E ratio under 20..."
        className="bg-[#0a0a0a] border-[#262626] text-white text-sm min-h-[100px] resize-none"
        maxLength={2000}
      />
      <div className="mt-2 text-xs text-[#737373]">
        {value.length}/2000 characters
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
```

---

## Phase 2: Create Strategy Coach Panel

### File: `frontend-v2/components/strategy-coach.tsx` (NEW FILE)

```typescript
"use client"

import { useState, useEffect, useMemo } from 'react'
import { Node } from 'reactflow'
import { Button } from './ui/button'
import { ChevronDown, ChevronUp, Zap, CheckCircle, AlertTriangle, Lightbulb, Info } from 'lucide-react'

interface StrategyCoachProps {
  nodes: Node[]
  onGenerateStrategy: () => void
  isMinimized: boolean
  onToggleMinimize: () => void
}

interface ValidationStatus {
  percentage: number
  canGenerate: boolean
  completed: string[]
  required: string[]
  recommended: string[]
}

export function StrategyCoach({ nodes, onGenerateStrategy, isMinimized, onToggleMinimize }: StrategyCoachProps) {
  const [showInstructions, setShowInstructions] = useState(false)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  
  // Calculate validation status
  const validationStatus = useMemo((): ValidationStatus => {
    const has = {
      name: nodes.some(n => n.type === 'modelName' && n.data.value?.trim()),
      aiModel: nodes.some(n => n.type === 'aiModel' && n.data.value),
      style: nodes.some(n => n.type === 'tradingStyle' && n.data.value),
      entry: nodes.some(n => n.type === 'entry'),
      exit: nodes.some(n => n.type === 'exit'),
      cash: nodes.some(n => n.type === 'initialCash' && n.data.value),
      position: nodes.some(n => n.type === 'positionSizing'),
      risk: nodes.some(n => n.type === 'riskManagement'),
      orderTypes: nodes.some(n => n.type === 'orderTypes'),
      actions: nodes.some(n => n.type === 'tradingActions'),
      instructions: nodes.some(n => n.type === 'customInstructions' && n.data.value?.trim()),
    }
    
    const completed: string[] = []
    const required: string[] = []
    const recommended: string[] = []
    
    // Track required
    if (has.name) completed.push('Model name defined')
    else required.push('Set model name')
    
    if (has.aiModel) completed.push('AI model selected')
    else required.push('Select AI model')
    
    if (has.style) completed.push('Trading style chosen')
    else required.push('Choose trading style')
    
    if (has.entry) completed.push('Entry condition added')
    else required.push('Add entry condition')
    
    if (has.exit) completed.push('Exit condition added')
    else required.push('Add exit condition')
    
    // Track recommended
    if (!has.cash) recommended.push('Set initial cash amount')
    if (!has.position) recommended.push('Add position sizing rules')
    if (!has.risk) recommended.push('Configure risk management')
    if (!has.orderTypes) recommended.push('Select order types')
    if (!has.actions) recommended.push('Enable trading actions')
    if (!has.instructions) recommended.push('Add custom instructions')
    
    const requiredCount = [has.name, has.aiModel, has.style, has.entry, has.exit].filter(Boolean).length
    const recommendedCount = [has.cash, has.position, has.risk, has.orderTypes, has.actions, has.instructions].filter(Boolean).length
    
    return {
      percentage: Math.round((requiredCount / 5) * 70 + (recommendedCount / 6) * 30),
      canGenerate: requiredCount === 5,
      completed,
      required,
      recommended,
    }
  }, [nodes])
  
  // Contextual tips based on current state
  const tips = useMemo(() => {
    if (nodes.length === 0) {
      return ["Start by adding Setup nodes (Model Name, AI Model, Trading Style)", "Drag components from the sidebar to build your strategy"]
    }
    
    if (validationStatus.required.includes('Add entry condition')) {
      return ["Entry conditions define WHEN to buy/enter trades", "Examples: MA crossover, RSI oversold, breakout above resistance"]
    }
    
    if (validationStatus.required.includes('Add exit condition')) {
      return ["Exit conditions define WHEN to sell/close positions", "Examples: Take profit at +10%, trailing stop, time-based exit"]
    }
    
    if (!validationStatus.canGenerate) {
      return [
        "Complete all required fields to enable strategy generation",
        "Required fields are marked with red REQUIRED badges"
      ]
    }
    
    if (validationStatus.recommended.length > 0) {
      return [
        "Your strategy is functional! Consider adding recommended components",
        "Risk management helps protect capital during losing streaks",
        "Position sizing controls how much to trade per signal"
      ]
    }
    
    return [
      "Your strategy is complete and ready to use!",
      "Click Generate Strategy to create your model",
      "You can always edit and refine your strategy later"
    ]
  }, [nodes.length, validationStatus])
  
  // Rotate tips every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % tips.length)
    }, 10000)
    
    return () => clearInterval(interval)
  }, [tips.length])
  
  // Get progress bar color
  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'bg-[#ef4444]'
    if (percentage < 75) return 'bg-[#f59e0b]'
    return 'bg-[#10b981]'
  }
  
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={onToggleMinimize}
          className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 hover:border-[#3b82f6]/50 transition-all shadow-xl"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="text-sm text-white font-medium">Coach</span>
            <div className={`w-12 h-2 rounded-full bg-[#262626] overflow-hidden`}>
              <div 
                className={`h-full transition-all ${getProgressColor(validationStatus.percentage)}`}
                style={{ width: `${validationStatus.percentage}%` }}
              />
            </div>
            <span className="text-xs text-[#737373]">{validationStatus.percentage}%</span>
            <ChevronUp className="w-4 h-4 text-[#737373]" />
          </div>
        </button>
      </div>
    )
  }
  
  return (
    <div className="fixed bottom-6 left-6 z-50 w-[360px] max-h-[600px] bg-[#0a0a0a] border border-[#262626] rounded-lg shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#262626] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h3 className="text-sm font-semibold text-white">Strategy Coach</h3>
        </div>
        <button
          onClick={onToggleMinimize}
          className="p-1 hover:bg-[#0a0a0a] rounded transition-colors"
        >
          <ChevronDown className="w-4 h-4 text-[#737373]" />
        </button>
      </div>
      
      {/* Content */}
      <div className="overflow-y-auto max-h-[520px] scrollbar-thin">
        <div className="p-4 space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#a3a3a3]">Progress</span>
              <span className="text-xs font-medium text-white">{validationStatus.percentage}% Complete</span>
            </div>
            <div className="w-full h-2 bg-[#262626] rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${getProgressColor(validationStatus.percentage)}`}
                style={{ width: `${validationStatus.percentage}%` }}
              />
            </div>
          </div>
          
          {/* Completed Items */}
          {validationStatus.completed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-[#10b981]" />
                <span className="text-xs font-medium text-[#10b981] uppercase">Completed</span>
              </div>
              <div className="space-y-1">
                {validationStatus.completed.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#a3a3a3]">
                    <span className="text-[#10b981]">✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Required (Missing) */}
          {validationStatus.required.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
                <span className="text-xs font-medium text-[#ef4444] uppercase">Required</span>
              </div>
              <div className="space-y-1">
                {validationStatus.required.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#a3a3a3]">
                    <span className="text-[#ef4444]">⚠</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Recommended */}
          {validationStatus.recommended.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-[#f59e0b]" />
                <span className="text-xs font-medium text-[#f59e0b] uppercase">Recommended</span>
              </div>
              <div className="space-y-1">
                {validationStatus.recommended.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#a3a3a3]">
                    <span className="text-[#f59e0b]">💡</span>
                    {item}
                  </div>
                ))}
                {validationStatus.recommended.length > 3 && (
                  <div className="text-xs text-[#737373] pl-5">
                    +{validationStatus.recommended.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* What You Can Do */}
          <div>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between text-xs font-medium text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
            >
              <span>📚 What You Can Do</span>
              {showInstructions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showInstructions && (
              <div className="mt-2 space-y-1 text-xs text-[#a3a3a3] pl-1">
                <div>• Drag components from sidebar</div>
                <div>• Click any node to edit values</div>
                <div>• Connect nodes with arrows (optional)</div>
                <div>• Delete: Select node + press Delete</div>
                <div>• Zoom: Mouse wheel or controls</div>
                <div>• Pan: Drag background</div>
              </div>
            )}
          </div>
          
          {/* Current Tip */}
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#3b82f6] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                {tips[currentTipIndex]}
              </p>
            </div>
          </div>
          
          {/* Generate Button */}
          <Button
            onClick={onGenerateStrategy}
            disabled={!validationStatus.canGenerate}
            className={`w-full ${
              validationStatus.canGenerate
                ? 'bg-[#10b981] hover:bg-[#059669] text-white'
                : 'bg-[#262626] text-[#737373] cursor-not-allowed'
            }`}
          >
            <Zap className="w-4 h-4 mr-2" />
            {validationStatus.canGenerate 
              ? 'Generate Strategy' 
              : `Complete ${validationStatus.required.length} Required Items`}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## Phase 3: Update Strategy Builder

### File: `frontend-v2/components/strategy-builder.tsx`

**Step 1: Import new components (ADD at top)**

```typescript
// ADD these imports
import {
  ModelNameNode,
  AIModelNode,
  TradingStyleNode,
  InitialCashNode,
  TradingActionsNode,
  OrderTypesNode,
  CustomInstructionsNode,
} from './strategy-builder-nodes'
import { StrategyCoach } from './strategy-coach'
```

**Step 2: ADD to nodeTypes object (DON'T replace, just add)**

```typescript
const nodeTypes = {
  // Existing types (KEEP ALL OF THESE)
  entry: EntryConditionNode,
  exit: ExitConditionNode,
  positionSizing: PositionSizingNode,
  riskManagement: RiskManagementNode,
  textInput: TextInputNode,
  select: SelectNode,
  numberInput: NumberInputNode,
  
  // NEW types (ADD THESE)
  modelName: ModelNameNode,
  aiModel: AIModelNode,
  tradingStyle: TradingStyleNode,
  initialCash: InitialCashNode,
  tradingActions: TradingActionsNode,
  orderTypes: OrderTypesNode,
  customInstructions: CustomInstructionsNode,
}
```

**Step 3: ADD new category to categories object**

```typescript
const categories = {
  // Existing categories (KEEP AS-IS)
  entry: [...existing...],
  exit: [...existing...],
  position: [...existing...],
  risk: [...existing...],
  
  // NEW category (ADD THIS)
  setup: [
    { type: 'modelName', label: 'Model Name', icon: '📝' },
    { type: 'aiModel', label: 'AI Model', icon: '🤖' },
    { type: 'tradingStyle', label: 'Trading Style', icon: '⚡' },
    { type: 'initialCash', label: 'Initial Cash', icon: '💰' },
    { type: 'tradingActions', label: 'Trading Actions', icon: '📊' },
    { type: 'orderTypes', label: 'Order Types', icon: '📈' },
    { type: 'customInstructions', label: 'Custom Instructions', icon: '💭' },
  ],
}
```

**Step 4: ADD state for coach (non-breaking)**

```typescript
// ADD this state (doesn't affect existing state)
const [coachMinimized, setCoachMinimized] = useState(false)
```

**Step 5: EXTEND generateStrategy() function (additive only)**

```typescript
const generateStrategy = () => {
  console.log('[Builder] Generating strategy from nodes:', nodes.length)
  
  // EXISTING logic for rules (KEEP AS-IS)
  let customRules = ''
  let customInstructions = ''
  
  const entryNodes = nodes.filter(n => n.type === 'entry')
  const exitNodes = nodes.filter(n => n.type === 'exit')
  const positionNodes = nodes.filter(n => n.type === 'positionSizing')
  const riskNodes = nodes.filter(n => n.type === 'riskManagement')
  
  // ... existing rule building logic (KEEP AS-IS) ...
  
  // NEW: Extract setup configuration (ADDITIVE)
  const nameNode = nodes.find(n => n.type === 'modelName')
  const aiModelNode = nodes.find(n => n.type === 'aiModel')
  const styleNode = nodes.find(n => n.type === 'tradingStyle')
  const cashNode = nodes.find(n => n.type === 'initialCash')
  const actionsNode = nodes.find(n => n.type === 'tradingActions')
  const orderTypesNode = nodes.find(n => n.type === 'orderTypes')
  const instructionsNode = nodes.find(n => n.type === 'customInstructions')
  
  // Build complete config (EXTEND existing config object)
  const config = {
    // NEW setup fields
    name: nameNode?.data.value,
    default_ai_model: aiModelNode?.data.value,
    trading_style: styleNode?.data.value,
    initial_cash: cashNode?.data.value || 10000,
    
    // NEW trading configuration
    allow_short_selling: actionsNode?.data.shortSelling || false,
    allow_multi_leg_options: actionsNode?.data.multiLegOptions || false,
    allow_hedging: actionsNode?.data.hedging || false,
    
    // NEW order types
    allowed_order_types: orderTypesNode?.data.selectedTypes || ['market', 'limit'],
    
    // EXISTING custom_rules (KEEP AS-IS)
    custom_rules: customRules.trim(),
    
    // EXTEND custom_instructions
    custom_instructions: instructionsNode?.data.value?.trim() || 
                        customInstructions.trim() || 
                        'Strategy designed with visual builder.',
  }
  
  console.log('[Builder] Generated config:', config)
  onComplete(config)
}
```

**Step 6: ADD Coach Panel to UI (non-breaking)**

```typescript
// Inside return statement, ADD coach panel
// Place it AFTER ReactFlow component (additive, doesn't modify existing JSX)

return (
  <div ...>
    {/* Existing sidebar (KEEP AS-IS) */}
    <div className="w-64 bg-[#0a0a0a]...">
      {/* ... existing sidebar code ... */}
    </div>
    
    {/* Existing ReactFlow (KEEP AS-IS) */}
    <div className="flex-1 relative">
      <ReactFlow ... />
    </div>
    
    {/* NEW: Strategy Coach Panel (ADDITIVE) */}
    <StrategyCoach
      nodes={nodes}
      onGenerateStrategy={generateStrategy}
      isMinimized={coachMinimized}
      onToggleMinimize={() => setCoachMinimized(!coachMinimized)}
    />
  </div>
)
```

---

## Testing Checklist (Verify Nothing Breaks)

### Test Existing Functionality:
- [ ] Can still add entry/exit nodes (old nodes work)
- [ ] Can still generate with old nodes only
- [ ] Existing generateStrategy() still works
- [ ] Form-based creation still works
- [ ] Choice dialog still works
- [ ] No new API call duplicates
- [ ] No console errors

### Test New Functionality:
- [ ] New setup nodes can be added
- [ ] New nodes save values correctly
- [ ] Coach panel shows correct progress
- [ ] Generate button validates correctly
- [ ] Complete strategy generates all fields
- [ ] Coach tips update dynamically
- [ ] Minimize/expand works

## Rollback Safety

**If anything breaks:**
1. Remove new node imports from strategy-builder.tsx
2. Remove new types from nodeTypes object
3. Remove new category from categories
4. Remove StrategyCoach component
5. Revert generateStrategy if needed
6. Everything returns to current working state

**Each phase is independent - can stop at any point without breaking existing features.**

---

## Implementation Order (Safest Path)

1. ✅ Create strategy-builder-nodes.tsx (new file, zero risk)
2. ✅ Create strategy-coach.tsx (new file, zero risk)
3. ✅ Test components in isolation
4. ✅ Add imports to strategy-builder.tsx (low risk)
5. ✅ Add to nodeTypes (non-breaking addition)
6. ✅ Add to categories (non-breaking addition)
7. ✅ Add coach panel to UI (non-breaking addition)
8. ✅ Extend generateStrategy (safe extension)
9. ✅ Test everything together
10. ✅ Verify old strategies still generate correctly

**Each step is tested before moving to next. Can abort at any point.**

