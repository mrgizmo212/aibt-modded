"use client"

import { useCallback, useState, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Panel,
  MiniMap,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Switch } from './ui/switch'
import { X, TrendingUp, TrendingDown, DollarSign, Shield, Settings, Zap, Sparkles, Loader2 } from 'lucide-react'

interface StrategyBuilderProps {
  onComplete: (config: { custom_rules: string; custom_instructions: string; name?: string; trading_style?: string; margin_account?: boolean; initial_cash?: number }) => void
  onCancel: () => void
}

// Enhanced node component with AI enhancement
function TextInputNode({ data, id }: { data: any; id: string }) {
  const [value, setValue] = useState(data.value || '')
  const [enhancing, setEnhancing] = useState(false)
  
  // Category-specific colors
  const categoryColors = {
    entry: { border: '#10b981', bg: '#10b981', text: 'text-[#10b981]' },
    exit: { border: '#ef4444', bg: '#ef4444', text: 'text-[#ef4444]' },
    position: { border: '#3b82f6', bg: '#3b82f6', text: 'text-[#3b82f6]' },
    risk: { border: '#f59e0b', bg: '#f59e0b', text: 'text-[#f59e0b]' },
    general: { border: '#8b5cf6', bg: '#8b5cf6', text: 'text-[#8b5cf6]' },
  }
  
  const colors = categoryColors[data.category as keyof typeof categoryColors] || categoryColors.general
  
  const handleEnhance = async () => {
    if (!value.trim()) return
    
    setEnhancing(true)
    try {
      // Call AI enhancement API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/enhance-strategy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          text: value,
          context: data.category || 'general'
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setValue(result.enhanced_text)
        if (data.onChange) {
          data.onChange(result.enhanced_text)
        }
      }
    } catch (error) {
      console.error('Enhancement failed:', error)
    } finally {
      setEnhancing(false)
    }
  }
  
  return (
    <div 
      className="bg-[#1a1a1a] border-2 rounded-lg p-3 min-w-[280px]"
      style={{ borderColor: colors.border }}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="text-xs font-semibold text-white mb-2">{data.label}</div>
      <Textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          if (data.onChange) data.onChange(e.target.value)
        }}
        className="bg-[#0a0a0a] border-[#262626] text-white text-xs min-h-[60px] mb-2"
        placeholder={data.placeholder || 'Enter details...'}
      />
      <button
        onClick={handleEnhance}
        disabled={!value.trim() || enhancing}
        className={`w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs transition-all disabled:opacity-50 ${colors.text}`}
        style={{ 
          backgroundColor: `${colors.bg}10`,
          borderColor: `${colors.bg}30`,
          borderWidth: '1px'
        }}
      >
        {enhancing ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Enhancing...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3 h-3" />
            <span>Enhance with AI</span>
          </>
        )}
      </button>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  )
}

// Select dropdown node
function SelectNode({ data }: { data: any }) {
  return (
    <div className="bg-[#1a1a1a] border-2 border-[#8b5cf6] rounded-lg p-3 min-w-[200px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="text-xs font-semibold text-white mb-2">{data.label}</div>
      <select
        value={data.value || ''}
        onChange={(e) => data.onChange && data.onChange(e.target.value)}
        className="w-full bg-[#0a0a0a] border border-[#262626] rounded text-white text-xs p-1.5"
        aria-label={data.label}
      >
        {data.options?.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  )
}

// Toggle node
function ToggleNode({ data }: { data: any }) {
  return (
    <div className="bg-[#1a1a1a] border-2 border-[#8b5cf6] rounded-lg p-3 min-w-[200px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-white">{data.label}</div>
        <Switch
          checked={data.value || false}
          onCheckedChange={(checked) => data.onChange && data.onChange(checked)}
        />
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  )
}

// Number input node
function NumberInputNode({ data }: { data: any }) {
  return (
    <div className="bg-[#1a1a1a] border-2 border-[#8b5cf6] rounded-lg p-3 min-w-[200px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="text-xs font-semibold text-white mb-2">{data.label}</div>
      <div className="relative">
        {data.prefix && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#737373] text-xs">
            {data.prefix}
          </span>
        )}
        <Input
          type="number"
          value={data.value || ''}
          onChange={(e) => data.onChange && data.onChange(parseFloat(e.target.value))}
          className={`bg-[#0a0a0a] border-[#262626] text-white text-xs ${data.prefix ? 'pl-6' : ''}`}
          min={data.min}
          max={data.max}
          step={data.step}
        />
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  )
}

// Preset nodes
function EntryConditionNode({ data }: { data: any }) {
  return (
    <div className="bg-[#10b981]/10 border-2 border-[#10b981] rounded-lg p-3 min-w-[200px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="w-4 h-4 text-[#10b981]" />
        <div className="text-xs font-semibold text-white">Entry</div>
      </div>
      <div className="text-xs text-[#a3a3a3]">{data.label}</div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  )
}

function ExitConditionNode({ data }: { data: any }) {
  return (
    <div className="bg-[#ef4444]/10 border-2 border-[#ef4444] rounded-lg p-3 min-w-[200px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex items-center gap-2 mb-1">
        <TrendingDown className="w-4 h-4 text-[#ef4444]" />
        <div className="text-xs font-semibold text-white">Exit</div>
      </div>
      <div className="text-xs text-[#a3a3a3]">{data.label}</div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  )
}

function PositionSizingNode({ data }: { data: any }) {
  return (
    <div className="bg-[#3b82f6]/10 border-2 border-[#3b82f6] rounded-lg p-3 min-w-[200px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className="w-4 h-4 text-[#3b82f6]" />
        <div className="text-xs font-semibold text-white">Position Size</div>
      </div>
      <div className="text-xs text-[#a3a3a3]">{data.label}</div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  )
}

function RiskManagementNode({ data }: { data: any }) {
  return (
    <div className="bg-[#f59e0b]/10 border-2 border-[#f59e0b] rounded-lg p-3 min-w-[200px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-4 h-4 text-[#f59e0b]" />
        <div className="text-xs font-semibold text-white">Risk Rule</div>
      </div>
      <div className="text-xs text-[#a3a3a3]">{data.label}</div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  )
}

const nodeTypes = {
  entry: EntryConditionNode,
  exit: ExitConditionNode,
  positionSizing: PositionSizingNode,
  riskManagement: RiskManagementNode,
  textInput: TextInputNode,
  select: SelectNode,
  toggle: ToggleNode,
  numberInput: NumberInputNode,
}

export function StrategyBuilder({ onComplete, onCancel }: StrategyBuilderProps) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50)
  }, [])
  
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedCategory, setSelectedCategory] = useState<string>('entry')

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // Categorized node templates
  const categories = {
    entry: [
      { type: 'entry', icon: TrendingUp, label: 'MA Crossover', data: { label: 'Buy when 10-day MA crosses above 20-day MA' } },
      { type: 'entry', icon: TrendingUp, label: 'RSI Oversold', data: { label: 'Buy when RSI < 30' } },
      { type: 'entry', icon: TrendingUp, label: 'Breakout', data: { label: 'Buy on breakout above resistance' } },
      { type: 'textInput', icon: TrendingUp, label: 'Custom Entry', data: { label: 'Custom Entry Condition', category: 'entry', placeholder: 'Describe when to buy...' } },
    ],
    exit: [
      { type: 'exit', icon: TrendingDown, label: 'Take Profit', data: { label: 'Sell at +10% profit' } },
      { type: 'exit', icon: TrendingDown, label: 'Stop Loss', data: { label: 'Sell at -5% loss' } },
      { type: 'exit', icon: TrendingDown, label: 'Trailing Stop', data: { label: 'Trailing stop at -3%' } },
      { type: 'textInput', icon: TrendingDown, label: 'Custom Exit', data: { label: 'Custom Exit Condition', category: 'exit', placeholder: 'Describe when to sell...' } },
    ],
    position: [
      { type: 'positionSizing', icon: DollarSign, label: 'Fixed %', data: { label: 'Risk 20% per trade' } },
      { type: 'positionSizing', icon: DollarSign, label: 'Fixed $', data: { label: 'Max $2,000 per trade' } },
      { type: 'positionSizing', icon: DollarSign, label: 'Risk-Based', data: { label: 'Size based on volatility' } },
      { type: 'textInput', icon: DollarSign, label: 'Custom Sizing', data: { label: 'Custom Position Size', category: 'position', placeholder: 'Describe position sizing...' } },
    ],
    risk: [
      { type: 'riskManagement', icon: Shield, label: 'Max Positions', data: { label: 'Max 3 open positions' } },
      { type: 'numberInput', icon: Shield, label: 'Max Daily Loss $', data: { label: 'Max Daily Loss', prefix: '$', value: 500, min: 50, max: 10000, step: 50 } },
      { type: 'numberInput', icon: Shield, label: 'Max Position $', data: { label: 'Max Position Size', prefix: '$', value: 2000, min: 100, max: 100000, step: 100 } },
      { type: 'riskManagement', icon: Shield, label: 'Min Cash Reserve', data: { label: 'Keep 20% cash minimum' } },
      { type: 'textInput', icon: Shield, label: 'Custom Risk', data: { label: 'Custom Risk Rule', category: 'risk', placeholder: 'Describe risk limits...' } },
    ],
    settings: [
      { type: 'select', icon: Settings, label: 'Trading Style', data: { label: 'Trading Style', value: 'day-trading', options: ['scalping', 'day-trading', 'swing-trading', 'long-term'] } },
      { type: 'select', icon: Settings, label: 'Instrument', data: { label: 'Instrument', value: 'stocks', options: ['stocks', 'options', 'futures', 'crypto'] } },
      { type: 'toggle', icon: Settings, label: 'Margin Account', data: { label: 'Margin Account', value: false } },
      { type: 'toggle', icon: Settings, label: 'Allow Shorting', data: { label: 'Allow Shorting', value: false } },
      { type: 'numberInput', icon: Settings, label: 'Initial Cash', data: { label: 'Initial Cash', prefix: '$', value: 10000, min: 1000, max: 1000000, step: 1000 } },
    ],
  }

  const addNode = (template: any) => {
    const newNode: Node = {
      id: `${template.type}-${Date.now()}`,
      type: template.type,
      position: { x: Math.random() * 300 + 50, y: Math.random() * 200 + 50 },
      data: {
        ...template.data,
        onChange: (value: any) => {
          // Update node data when value changes
          setNodes((nds) =>
            nds.map((node) =>
              node.id === newNode.id
                ? { ...node, data: { ...node.data, value } }
                : node
            )
          )
        },
      },
    }
    setNodes((nds) => [...nds, newNode])
  }

  const generateStrategy = () => {
    console.log('[Builder] Generating strategy from nodes:', nodes.length)
    
    if (nodes.length === 0) {
      console.log('[Builder] No nodes to generate from')
      return
    }
    
    setIsVisible(false)
    
    setTimeout(() => {
      console.log('[Builder] Converting flow to config...')
      let customRules = ''
      let customInstructions = ''
      let config: any = {}

      // Extract settings
      const settingsNodes = nodes.filter(n => ['select', 'toggle', 'numberInput'].includes(n.type || ''))
      console.log('[Builder] Found settings nodes:', settingsNodes.length)
      settingsNodes.forEach(node => {
        if (node.data.label === 'Trading Style') config.trading_style = node.data.value
        if (node.data.label === 'Instrument') config.instrument = node.data.value
        if (node.data.label === 'Margin Account') config.margin_account = node.data.value
        if (node.data.label === 'Allow Shorting') config.allow_shorting = node.data.value
        if (node.data.label === 'Initial Cash') config.initial_cash = node.data.value
      })

      // Group rule nodes
      const entryNodes = nodes.filter(n => n.type === 'entry' || (n.type === 'textInput' && n.data.category === 'entry'))
      const exitNodes = nodes.filter(n => n.type === 'exit' || (n.type === 'textInput' && n.data.category === 'exit'))
      const positionNodes = nodes.filter(n => n.type === 'positionSizing' || (n.type === 'textInput' && n.data.category === 'position'))
      const riskNodes = nodes.filter(n => (n.type === 'riskManagement' || n.type === 'numberInput' || (n.type === 'textInput' && n.data.category === 'risk')) && !['Trading Style', 'Instrument', 'Margin Account', 'Allow Shorting', 'Initial Cash'].includes(n.data.label))

      if (entryNodes.length > 0) {
        customRules += 'ENTRY CONDITIONS:\n'
        entryNodes.forEach(node => {
          const value = node.data.value || node.data.label
          customRules += `- ${value}\n`
        })
        customRules += '\n'
      }

      if (exitNodes.length > 0) {
        customRules += 'EXIT CONDITIONS:\n'
        exitNodes.forEach(node => {
          const value = node.data.value || node.data.label
          customRules += `- ${value}\n`
        })
        customRules += '\n'
      }

      if (positionNodes.length > 0) {
        customRules += 'POSITION SIZING:\n'
        positionNodes.forEach(node => {
          const value = node.data.value || node.data.label
          customRules += `- ${value}\n`
        })
        customRules += '\n'
      }

      if (riskNodes.length > 0) {
        customRules += 'RISK MANAGEMENT:\n'
        riskNodes.forEach(node => {
          const value = node.data.value || node.data.label
          if (node.data.label === 'Max Daily Loss') {
            customRules += `- Max daily loss: $${node.data.value}\n`
          } else if (node.data.label === 'Max Position Size') {
            customRules += `- Max position size: $${node.data.value}\n`
          } else {
            customRules += `- ${value}\n`
          }
        })
      }

      customInstructions = 'Strategy designed with visual builder. Follow all rules above without exception.'

      const finalConfig = {
        custom_rules: customRules.trim(),
        custom_instructions: customInstructions.trim(),
        ...config
      }
      
      console.log('[Builder] Generated config:', finalConfig)
      console.log('[Builder] Calling onComplete...')
      
      onComplete(finalConfig)
    }, 500)
  }
  
  const handleCancel = () => {
    setIsVisible(false)
    setTimeout(() => {
      onCancel()
    }, 500)
  }

  const categoryInfo = {
    entry: { icon: TrendingUp, color: '#10b981', label: 'Entry Conditions' },
    exit: { icon: TrendingDown, color: '#ef4444', label: 'Exit Conditions' },
    position: { icon: DollarSign, color: '#3b82f6', label: 'Position Sizing' },
    risk: { icon: Shield, color: '#f59e0b', label: 'Risk Management' },
    settings: { icon: Settings, color: '#8b5cf6', label: 'Model Settings' },
  }

  return (
    <div className={`h-screen bg-[#1a1a1a] border-l border-[#262626] flex flex-col transition-transform duration-500 ease-out ${
      isVisible ? 'translate-x-0' : 'translate-x-full'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-[#262626] flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#3b82f6]" />
            Strategy Builder
          </h2>
          <p className="text-xs text-[#737373] mt-1">Build your strategy visually</p>
        </div>
        <button
          onClick={handleCancel}
          className="p-1 hover:bg-[#262626] rounded text-[#a3a3a3] hover:text-white transition-colors"
          title="Close builder"
          aria-label="Close strategy builder"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-[#262626] overflow-x-auto">
        {Object.entries(categoryInfo).map(([key, info]) => {
          const Icon = info.icon
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === key
                  ? 'text-white border-b-2'
                  : 'text-[#737373] hover:text-white'
              }`}
              style={{ borderColor: selectedCategory === key ? info.color : 'transparent' }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: info.color }} />
              {info.label}
            </button>
          )
        })}
      </div>

      {/* Node Palette for Selected Category */}
      <div className="p-4 border-b border-[#262626]">
        <div className="grid grid-cols-2 gap-2">
          {categories[selectedCategory as keyof typeof categories]?.map((template, index) => {
            const Icon = template.icon
            const catInfo = categoryInfo[selectedCategory as keyof typeof categoryInfo]
            return (
              <button
                key={index}
                onClick={() => addNode(template)}
                className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-[#262626] hover:border-[#404040] rounded-lg text-xs text-white transition-all text-left"
                style={{ borderLeftColor: catInfo.color, borderLeftWidth: '3px' }}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: catInfo.color }} />
                <span className="truncate">{template.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#262626" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'entry' || (node.type === 'textInput' && node.data?.category === 'entry')) return '#10b981'
              if (node.type === 'exit' || (node.type === 'textInput' && node.data?.category === 'exit')) return '#ef4444'
              if (node.type === 'positionSizing' || (node.type === 'textInput' && node.data?.category === 'position')) return '#3b82f6'
              if (node.type === 'riskManagement' || node.type === 'numberInput' || (node.type === 'textInput' && node.data?.category === 'risk')) return '#f59e0b'
              return '#8b5cf6'
            }}
          />
          <Panel position="bottom-center">
            <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-3 mb-2 flex items-center gap-3">
              <div className="text-xs text-[#737373]">
                {nodes.length} nodes • {edges.length} connections
              </div>
              <Button
                onClick={generateStrategy}
                disabled={nodes.length === 0}
                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs h-8"
              >
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Generate Strategy
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="border-[#262626] text-[#a3a3a3] hover:text-white text-xs h-8"
              >
                Cancel
              </Button>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  )
}

