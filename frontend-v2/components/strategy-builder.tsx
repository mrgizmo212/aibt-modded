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
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Button } from './ui/button'
import { X, Plus, TrendingUp, TrendingDown, DollarSign, Shield, Zap } from 'lucide-react'

interface StrategyBuilderProps {
  onComplete: (config: { custom_rules: string; custom_instructions: string }) => void
  onCancel: () => void
}

// Node types we'll support
const nodeTypes = {
  entry: EntryConditionNode,
  exit: ExitConditionNode,
  positionSizing: PositionSizingNode,
  riskManagement: RiskManagementNode,
}

// Custom node components
function EntryConditionNode({ data }: { data: any }) {
  return (
    <div className="bg-[#10b981]/10 border-2 border-[#10b981] rounded-lg p-3 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-4 h-4 text-[#10b981]" />
        <div className="text-sm font-semibold text-white">Entry Condition</div>
      </div>
      <div className="text-xs text-[#a3a3a3]">
        {data.label || 'Buy when...'}
      </div>
    </div>
  )
}

function ExitConditionNode({ data }: { data: any }) {
  return (
    <div className="bg-[#ef4444]/10 border-2 border-[#ef4444] rounded-lg p-3 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <TrendingDown className="w-4 h-4 text-[#ef4444]" />
        <div className="text-sm font-semibold text-white">Exit Condition</div>
      </div>
      <div className="text-xs text-[#a3a3a3]">
        {data.label || 'Sell when...'}
      </div>
    </div>
  )
}

function PositionSizingNode({ data }: { data: any }) {
  return (
    <div className="bg-[#3b82f6]/10 border-2 border-[#3b82f6] rounded-lg p-3 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="w-4 h-4 text-[#3b82f6]" />
        <div className="text-sm font-semibold text-white">Position Sizing</div>
      </div>
      <div className="text-xs text-[#a3a3a3]">
        {data.label || 'Risk per trade'}
      </div>
    </div>
  )
}

function RiskManagementNode({ data }: { data: any }) {
  return (
    <div className="bg-[#f59e0b]/10 border-2 border-[#f59e0b] rounded-lg p-3 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-[#f59e0b]" />
        <div className="text-sm font-semibold text-white">Risk Management</div>
      </div>
      <div className="text-xs text-[#a3a3a3]">
        {data.label || 'Safety limits'}
      </div>
    </div>
  )
}

export function StrategyBuilder({ onComplete, onCancel }: StrategyBuilderProps) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    // Trigger slide-in animation after mount
    setTimeout(() => setIsVisible(true), 50)
  }, [])
  
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // Available node templates
  const nodeTemplates = [
    {
      type: 'entry',
      icon: TrendingUp,
      label: 'MA Crossover',
      color: '#10b981',
      data: { label: 'Buy when 10-day MA crosses above 20-day MA' }
    },
    {
      type: 'entry',
      icon: TrendingUp,
      label: 'RSI Oversold',
      color: '#10b981',
      data: { label: 'Buy when RSI < 30 (oversold)' }
    },
    {
      type: 'entry',
      icon: TrendingUp,
      label: 'Breakout',
      color: '#10b981',
      data: { label: 'Buy on breakout above resistance' }
    },
    {
      type: 'exit',
      icon: TrendingDown,
      label: 'Take Profit',
      color: '#ef4444',
      data: { label: 'Sell at +10% profit' }
    },
    {
      type: 'exit',
      icon: TrendingDown,
      label: 'Stop Loss',
      color: '#ef4444',
      data: { label: 'Sell at -5% loss' }
    },
    {
      type: 'positionSizing',
      icon: DollarSign,
      label: 'Fixed %',
      color: '#3b82f6',
      data: { label: 'Risk 20% per trade' }
    },
    {
      type: 'positionSizing',
      icon: DollarSign,
      label: 'Fixed $',
      color: '#3b82f6',
      data: { label: 'Max $2,000 per trade' }
    },
    {
      type: 'riskManagement',
      icon: Shield,
      label: 'Max Positions',
      color: '#f59e0b',
      data: { label: 'Max 3 open positions' }
    },
    {
      type: 'riskManagement',
      icon: Shield,
      label: 'Daily Loss Limit',
      color: '#f59e0b',
      data: { label: 'Stop if daily loss > $500' }
    },
  ]

  const addNode = (template: typeof nodeTemplates[0]) => {
    const newNode: Node = {
      id: `${template.type}-${Date.now()}`,
      type: template.type,
      position: { x: 250, y: nodes.length * 100 + 50 },
      data: template.data,
    }
    setNodes((nds) => [...nds, newNode])
  }

  const generateStrategy = () => {
    // Slide out animation before completing
    setIsVisible(false)
    
    setTimeout(() => {
      // Convert flow to readable strategy text
      let customRules = ''
      let customInstructions = ''

      // Group nodes by type
      const entryNodes = nodes.filter(n => n.type === 'entry')
      const exitNodes = nodes.filter(n => n.type === 'exit')
      const positionNodes = nodes.filter(n => n.type === 'positionSizing')
      const riskNodes = nodes.filter(n => n.type === 'riskManagement')

      // Build custom_rules
      if (entryNodes.length > 0) {
        customRules += 'ENTRY CONDITIONS:\n'
        entryNodes.forEach(node => {
          customRules += `- ${node.data.label}\n`
        })
        customRules += '\n'
      }

      if (exitNodes.length > 0) {
        customRules += 'EXIT CONDITIONS:\n'
        exitNodes.forEach(node => {
          customRules += `- ${node.data.label}\n`
        })
        customRules += '\n'
      }

      if (positionNodes.length > 0) {
        customRules += 'POSITION SIZING:\n'
        positionNodes.forEach(node => {
          customRules += `- ${node.data.label}\n`
        })
        customRules += '\n'
      }

      if (riskNodes.length > 0) {
        customRules += 'RISK MANAGEMENT:\n'
        riskNodes.forEach(node => {
          customRules += `- ${node.data.label}\n`
        })
      }

      // Build custom_instructions
      customInstructions = 'Strategy built with visual builder. Follow the rules above strictly. '
      if (entryNodes.length > 0) {
        customInstructions += 'Only enter trades when entry conditions are met. '
      }
      if (exitNodes.length > 0) {
        customInstructions += 'Exit all trades according to exit conditions. '
      }
      if (riskNodes.length > 0) {
        customInstructions += 'Respect all risk management limits without exception.'
      }

      onComplete({
        custom_rules: customRules.trim(),
        custom_instructions: customInstructions.trim()
      })
    }, 500) // Wait for slide-out animation
  }
  
  const handleCancel = () => {
    // Slide out animation before closing
    setIsVisible(false)
    setTimeout(() => {
      onCancel()
    }, 500)
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
          <p className="text-xs text-[#737373] mt-1">Drag nodes to design your strategy</p>
        </div>
        <button
          onClick={handleCancel}
          className="p-1 hover:bg-[#262626] rounded text-[#a3a3a3] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Node Palette */}
      <div className="p-4 border-b border-[#262626] overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {nodeTemplates.map((template, index) => {
            const Icon = template.icon
            return (
              <button
                key={index}
                onClick={() => addNode(template)}
                className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-[#262626] hover:border-[#404040] rounded-lg text-xs text-white transition-all whitespace-nowrap"
                style={{ borderLeftColor: template.color, borderLeftWidth: '3px' }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: template.color }} />
                <span>{template.label}</span>
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
              switch (node.type) {
                case 'entry': return '#10b981'
                case 'exit': return '#ef4444'
                case 'positionSizing': return '#3b82f6'
                case 'riskManagement': return '#f59e0b'
                default: return '#737373'
              }
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

