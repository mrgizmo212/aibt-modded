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
      return [
        "Start by dragging Setup nodes (Model Name, AI Model, Trading Style) from the sidebar",
        "Drag components to the canvas to build your strategy visually"
      ]
    }
    
    if (validationStatus.required.includes('Set model name')) {
      return ["Add a Model Name node first - this identifies your trading strategy"]
    }
    
    if (validationStatus.required.includes('Select AI model')) {
      return ["Select which AI model will make trading decisions (GPT-4o, Claude, etc.)"]
    }
    
    if (validationStatus.required.includes('Choose trading style')) {
      return ["Choose your trading style: scalping, day trading, swing trading, or investing"]
    }
    
    if (validationStatus.required.includes('Add entry condition')) {
      return [
        "Entry conditions define WHEN to buy/enter trades",
        "Examples: MA crossover, RSI oversold, breakout above resistance",
        "Drag an Entry Condition node from the sidebar"
      ]
    }
    
    if (validationStatus.required.includes('Add exit condition')) {
      return [
        "Exit conditions define WHEN to sell/close positions",
        "Examples: Take profit at +10%, trailing stop, time-based exit",
        "Without exits, your strategy can only buy but never sell!"
      ]
    }
    
    if (!validationStatus.canGenerate) {
      return [
        "Complete all required fields to enable strategy generation",
        "Required fields are marked with red REQUIRED badges"
      ]
    }
    
    if (validationStatus.recommended.length > 0) {
      return [
        "Your strategy is functional! Consider adding recommended components for better control",
        "Risk management helps protect capital during losing streaks",
        "Position sizing controls how much to trade per signal",
        "Order types give you more control over execution"
      ]
    }
    
    return [
      "Your strategy is complete and ready to use!",
      "Click Generate Strategy when you're satisfied with your setup",
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
  
  // Reset tip index when tips change
  useEffect(() => {
    setCurrentTipIndex(0)
  }, [tips])
  
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
          <div className="flex items-center gap-3">
            <span className="text-lg">🤖</span>
            <span className="text-sm text-white font-medium">Coach</span>
            <div className="w-16 h-2 rounded-full bg-[#262626] overflow-hidden">
              <div 
                className={`h-full transition-all ${getProgressColor(validationStatus.percentage)}`}
                style={{ width: `${validationStatus.percentage}%` }}
              />
            </div>
            <span className="text-xs text-[#737373] font-medium">{validationStatus.percentage}%</span>
            <ChevronUp className="w-4 h-4 text-[#737373]" />
          </div>
        </button>
      </div>
    )
  }
  
  return (
    <div className="fixed bottom-6 left-6 z-50 w-[380px] max-h-[640px] bg-[#0a0a0a] border border-[#262626] rounded-lg shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#262626] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h3 className="text-sm font-semibold text-white">Strategy Coach</h3>
        </div>
        <button
          onClick={onToggleMinimize}
          className="p-1 hover:bg-[#0a0a0a] rounded transition-colors"
          title="Minimize"
        >
          <ChevronDown className="w-4 h-4 text-[#737373]" />
        </button>
      </div>
      
      {/* Content */}
      <div className="overflow-y-auto max-h-[560px] scrollbar-thin">
        <div className="p-4 space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#a3a3a3] font-medium">Progress</span>
              <span className="text-xs font-semibold text-white">{validationStatus.percentage}% Complete</span>
            </div>
            <div className="w-full h-2.5 bg-[#262626] rounded-full overflow-hidden">
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
                <span className="text-xs font-semibold text-[#10b981] uppercase tracking-wide">Completed</span>
              </div>
              <div className="space-y-1.5 pl-1">
                {validationStatus.completed.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#a3a3a3]">
                    <span className="text-[#10b981] font-bold">✓</span>
                    <span>{item}</span>
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
                <span className="text-xs font-semibold text-[#ef4444] uppercase tracking-wide">Required</span>
              </div>
              <div className="space-y-1.5 pl-1">
                {validationStatus.required.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#a3a3a3]">
                    <span className="text-[#ef4444] font-bold">⚠</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Recommended */}
          {validationStatus.recommended.length > 0 && validationStatus.canGenerate && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-[#f59e0b]" />
                <span className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wide">Recommended</span>
              </div>
              <div className="space-y-1.5 pl-1">
                {validationStatus.recommended.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#a3a3a3]">
                    <span className="text-[#f59e0b]">💡</span>
                    <span>{item}</span>
                  </div>
                ))}
                {validationStatus.recommended.length > 4 && (
                  <div className="text-xs text-[#737373] pl-5">
                    +{validationStatus.recommended.length - 4} more suggestions
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* What You Can Do */}
          <div>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between text-xs font-semibold text-[#3b82f6] hover:text-[#60a5fa] transition-colors py-1"
            >
              <span className="flex items-center gap-1.5">
                <span>📚</span>
                <span>What You Can Do</span>
              </span>
              {showInstructions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showInstructions && (
              <div className="mt-2 space-y-1.5 text-xs text-[#a3a3a3] pl-1">
                <div className="flex items-start gap-2">
                  <span className="text-[#3b82f6] mt-0.5">•</span>
                  <span>Drag components from left sidebar to canvas</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#3b82f6] mt-0.5">•</span>
                  <span>Click any node to edit its values</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#3b82f6] mt-0.5">•</span>
                  <span>Connect nodes with arrows (optional, visual only)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#3b82f6] mt-0.5">•</span>
                  <span>Delete: Select node + press Delete key</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#3b82f6] mt-0.5">•</span>
                  <span>Zoom: Mouse wheel or controls</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#3b82f6] mt-0.5">•</span>
                  <span>Pan: Drag background to move around</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Current Tip */}
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#3b82f6] flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#a3a3a3] leading-relaxed">
                  {tips[currentTipIndex]}
                </p>
                {tips.length > 1 && (
                  <div className="mt-2 flex gap-1">
                    {tips.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-all ${
                          i === currentTipIndex ? 'w-6 bg-[#3b82f6]' : 'w-1.5 bg-[#262626]'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Generate Button */}
          <Button
            onClick={onGenerateStrategy}
            disabled={!validationStatus.canGenerate}
            className={`w-full ${
              validationStatus.canGenerate
                ? 'bg-[#10b981] hover:bg-[#059669] text-white shadow-lg shadow-[#10b981]/20'
                : 'bg-[#262626] text-[#737373] cursor-not-allowed'
            }`}
          >
            <Zap className="w-4 h-4 mr-2" />
            {validationStatus.canGenerate 
              ? 'Generate Strategy ✨' 
              : `Complete ${validationStatus.required.length} Required ${validationStatus.required.length === 1 ? 'Item' : 'Items'}`}
          </Button>
          
          {/* Node Count */}
          <div className="text-center text-xs text-[#737373] pt-2 border-t border-[#262626]">
            {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'} on canvas
          </div>
        </div>
      </div>
    </div>
  )
}

