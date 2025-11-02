"use client"

import { useState, useEffect } from "react"
import { X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { createModel, updateModel, deleteModel, getAvailableAIModels } from "@/lib/api"
import { toast } from "sonner"

interface ModelEditDialogProps {
  model?: {
    id?: number
    name?: string
    default_ai_model?: string
    system_prompt?: string
    temperature?: number
    max_tokens?: number
    trading_mode?: 'paper' | 'live'
    starting_capital?: number
    max_position_size?: number
    max_daily_loss?: number
    allowed_symbols?: string[]
  } | null
  onClose: () => void
  onSave: () => void
}

export function ModelEditDialog({ model, onClose, onSave }: ModelEditDialogProps) {
  const [formData, setFormData] = useState({
    name: model?.name || "",
    default_ai_model: model?.default_ai_model || "gpt-4o",
    system_prompt: model?.system_prompt || "You are a professional AI trading assistant. Analyze market data and make informed trading decisions based on technical analysis and risk management principles.",
    temperature: model?.temperature || 0.7,
    max_tokens: model?.max_tokens || 2000,
    trading_mode: model?.trading_mode || "paper" as 'paper' | 'live',
    starting_capital: model?.starting_capital || 10000,
    max_position_size: model?.max_position_size || 25,
    max_daily_loss: model?.max_daily_loss || 5,
    allowed_symbols: model?.allowed_symbols || ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
  })
  
  const [symbolsInput, setSymbolsInput] = useState(
    formData.allowed_symbols.join(", ")
  )
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const isEditMode = !!model?.id

  useEffect(() => {
    loadAvailableModels()
  }, [])

  async function loadAvailableModels() {
    try {
      const models = await getAvailableAIModels()
      if (Array.isArray(models) && models.length > 0) {
        setAvailableModels(models.map((m: any) => m.id || m.name || m))
      } else {
        // Fallback to common models
        setAvailableModels([
          "gpt-4o",
          "gpt-4-turbo",
          "claude-3-5-sonnet-20241022",
          "claude-3-opus-20240229",
          "gemini-2.0-flash-exp",
          "gemini-1.5-pro",
        ])
      }
    } catch (error) {
      console.error('Failed to load available models:', error)
      // Use fallback models
      setAvailableModels([
        "gpt-4o",
        "gpt-4-turbo",
        "claude-3-5-sonnet-20241022",
        "gemini-2.0-flash-exp",
      ])
    }
  }

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter a model name')
      return
    }

    if (!formData.default_ai_model) {
      toast.error('Please select an AI model')
      return
    }

    // Parse symbols from comma-separated input
    const symbols = symbolsInput
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0)

    if (symbols.length === 0) {
      toast.error('Please enter at least one trading symbol')
      return
    }

    setLoading(true)

    try {
      const modelData = {
        ...formData,
        allowed_symbols: symbols,
      }

      if (isEditMode && model?.id) {
        await updateModel(model.id, modelData)
        toast.success('Model updated successfully')
      } else {
        await createModel(modelData)
        toast.success('Model created successfully')
      }

      onSave()
      onClose()
    } catch (error: any) {
      console.error('Failed to save model:', error)
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} model`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!model?.id) return

    setLoading(true)

    try {
      await deleteModel(model.id)
      toast.success('Model deleted successfully')
      onSave()
      onClose()
    } catch (error: any) {
      console.error('Failed to delete model:', error)
      toast.error(error.message || 'Failed to delete model')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#262626] sticky top-0 bg-[#0a0a0a] z-10">
          <h2 className="text-xl font-semibold text-white">
            {isEditMode ? 'Edit Model' : 'Create New Model'}
          </h2>
          <button onClick={onClose} className="text-[#a3a3a3] hover:text-white transition-colors" disabled={loading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Model Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm text-white">
              Model Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-[#1a1a1a] border-[#262626] text-white"
              placeholder="e.g., GPT-4 Momentum Trader"
              disabled={loading}
            />
          </div>

          {/* AI Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="ai-model" className="text-sm text-white">
              AI Model *
            </Label>
            <Select
              value={formData.default_ai_model}
              onValueChange={(value) => setFormData({ ...formData, default_ai_model: value })}
              disabled={loading}
            >
              <SelectTrigger className="bg-[#1a1a1a] border-[#262626] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#262626]">
                {availableModels.map((modelName) => (
                  <SelectItem key={modelName} value={modelName}>
                    {modelName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#737373]">
              The AI model that will make trading decisions
            </p>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-sm text-white">
              System Prompt
            </Label>
            <Textarea
              id="prompt"
              value={formData.system_prompt}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              className="bg-[#1a1a1a] border-[#262626] text-white min-h-[100px] font-mono text-sm"
              placeholder="Enter instructions for the AI trading agent..."
              disabled={loading}
            />
            <p className="text-xs text-[#737373]">
              Instructions that guide the AI's trading strategy and decision-making
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Temperature */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-white">Temperature</Label>
                <span className="text-sm font-mono text-[#a3a3a3]">{formData.temperature.toFixed(1)}</span>
              </div>
              <Slider
                value={[formData.temperature]}
                onValueChange={(value) => setFormData({ ...formData, temperature: value[0] })}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
                disabled={loading}
              />
              <div className="flex justify-between text-xs text-[#737373]">
                <span>Focused</span>
                <span>Creative</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-white">Max Tokens</Label>
                <span className="text-sm font-mono text-[#a3a3a3]">{formData.max_tokens}</span>
              </div>
              <Slider
                value={[formData.max_tokens]}
                onValueChange={(value) => setFormData({ ...formData, max_tokens: value[0] })}
                min={500}
                max={4000}
                step={500}
                className="w-full"
                disabled={loading}
              />
            </div>
          </div>

          {/* Trading Mode & Starting Capital */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trading-mode" className="text-sm text-white">
                Trading Mode *
              </Label>
              <Select
                value={formData.trading_mode}
                onValueChange={(value: 'paper' | 'live') => setFormData({ ...formData, trading_mode: value })}
                disabled={loading}
              >
                <SelectTrigger className="bg-[#1a1a1a] border-[#262626] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#262626]">
                  <SelectItem value="paper">Paper Trading (Simulated)</SelectItem>
                  <SelectItem value="live">Live Trading (Real Money)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capital" className="text-sm text-white">
                Starting Capital ($)
              </Label>
              <Input
                id="capital"
                type="number"
                value={formData.starting_capital}
                onChange={(e) => setFormData({ ...formData, starting_capital: parseFloat(e.target.value) || 0 })}
                className="bg-[#1a1a1a] border-[#262626] text-white"
                min="1000"
                step="1000"
                disabled={loading}
              />
            </div>
          </div>

          {/* Risk Management */}
          <div className="space-y-4 p-4 bg-[#1a1a1a] rounded-lg border border-[#262626]">
            <h3 className="text-sm font-semibold text-white">Risk Management</h3>
            
            {/* Max Position Size */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-white">Max Position Size</Label>
                <span className="text-sm font-mono text-[#a3a3a3]">{formData.max_position_size}%</span>
              </div>
              <Slider
                value={[formData.max_position_size]}
                onValueChange={(value) => setFormData({ ...formData, max_position_size: value[0] })}
                min={5}
                max={50}
                step={5}
                className="w-full"
                disabled={loading}
              />
              <p className="text-xs text-[#737373]">
                Maximum percentage of capital per trade
              </p>
            </div>

            {/* Max Daily Loss */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-white">Max Daily Loss</Label>
                <span className="text-sm font-mono text-[#a3a3a3]">{formData.max_daily_loss}%</span>
              </div>
              <Slider
                value={[formData.max_daily_loss]}
                onValueChange={(value) => setFormData({ ...formData, max_daily_loss: value[0] })}
                min={1}
                max={20}
                step={1}
                className="w-full"
                disabled={loading}
              />
              <p className="text-xs text-[#737373]">
                Stop trading if daily loss exceeds this percentage
              </p>
            </div>
          </div>

          {/* Allowed Symbols */}
          <div className="space-y-2">
            <Label htmlFor="symbols" className="text-sm text-white">
              Allowed Symbols *
            </Label>
            <Input
              id="symbols"
              value={symbolsInput}
              onChange={(e) => setSymbolsInput(e.target.value)}
              className="bg-[#1a1a1a] border-[#262626] text-white font-mono"
              placeholder="AAPL, MSFT, GOOGL, AMZN, TSLA"
              disabled={loading}
            />
            <p className="text-xs text-[#737373]">
              Comma-separated list of stock symbols this model can trade
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[#262626] sticky bottom-0 bg-[#0a0a0a]">
          <div>
            {isEditMode && (
              <>
                {!showDeleteConfirm ? (
                  <Button
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-[#ef4444] hover:text-[#dc2626] hover:bg-[#ef4444]/10"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Model
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#a3a3a3]">Are you sure?</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={loading}
                      className="bg-[#ef4444] hover:bg-[#dc2626]"
                    >
                      {loading ? 'Deleting...' : 'Yes, Delete'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={loading}
                      className="text-[#a3a3a3]"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              onClick={onClose} 
              disabled={loading}
              className="text-[#a3a3a3] hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
            >
              {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Model')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
