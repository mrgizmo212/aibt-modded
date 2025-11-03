"use client"

import { useState, useEffect } from "react"
import { X, Trash2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { createModel, updateModel, deleteModel } from "@/lib/api"
import { toast } from "sonner"
import { AVAILABLE_MODELS } from "@/lib/constants"
import { ModelSettings } from "@/components/ModelSettings"

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
  // Extract model_parameters if they exist (backend stores them as nested object)
  const modelParams = (model as any)?.model_parameters || {}
  
  const [formData, setFormData] = useState({
    name: model?.name || "",
    default_ai_model: model?.default_ai_model || "",
    custom_rules: (model as any)?.custom_rules || "",
    custom_instructions: (model as any)?.custom_instructions || "",
    starting_capital: (model as any)?.initial_cash || model?.starting_capital || 10000,
    allowed_symbols: (model as any)?.allowed_tickers || model?.allowed_symbols || ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
  })
  
  // Model parameters managed by ModelSettings component
  const [modelParameters, setModelParameters] = useState<Record<string, any>>(modelParams)
  
  const [symbolsInput, setSymbolsInput] = useState(
    formData.allowed_symbols.join(", ")
  )
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const isEditMode = !!model?.id

  // Sync form data when model prop changes
  useEffect(() => {
    if (model) {
      const modelParams = (model as any)?.model_parameters || {}
      setFormData({
        name: model?.name || "",
        default_ai_model: model?.default_ai_model || "",
        custom_rules: (model as any)?.custom_rules || "",
        custom_instructions: (model as any)?.custom_instructions || "",
        starting_capital: (model as any)?.initial_cash || model?.starting_capital || 10000,
        allowed_symbols: (model as any)?.allowed_tickers || model?.allowed_symbols || ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
      })
      setModelParameters(modelParams)
      setSymbolsInput(((model as any)?.allowed_tickers || model?.allowed_symbols || ["AAPL"]).join(", "))
    }
  }, [model])

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
      // Use model_parameters from ModelSettings component (nested object)
      const modelData = {
        name: formData.name,
        default_ai_model: formData.default_ai_model,
        initial_cash: formData.starting_capital,
        allowed_tickers: symbols,
        model_parameters: modelParameters,
        custom_rules: formData.custom_rules || undefined,
        custom_instructions: formData.custom_instructions || undefined
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
              value={formData.default_ai_model || undefined}
              onValueChange={(value) => setFormData({ ...formData, default_ai_model: value })}
              disabled={loading}
            >
              <SelectTrigger className="bg-[#1a1a1a] border-[#262626] text-white">
                <SelectValue placeholder="Select AI Model" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#262626] max-h-[300px]">
                {AVAILABLE_MODELS.map((aiModel) => (
                  <SelectItem key={aiModel.id} value={aiModel.id}>
                    {aiModel.name} ({aiModel.provider})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#737373]">
              The AI model that will make trading decisions
            </p>
          </div>

          {/* Custom Trading Rules */}
          <div className="space-y-2">
            <Label htmlFor="custom-rules" className="text-sm text-white">
              Custom Trading Rules <span className="text-[#737373]">(Optional)</span>
            </Label>
            <Textarea
              id="custom-rules"
              value={formData.custom_rules}
              onChange={(e) => setFormData({ ...formData, custom_rules: e.target.value })}
              className="bg-[#1a1a1a] border-[#262626] text-white min-h-[100px] font-mono text-sm"
              placeholder="Example: Only trade tech stocks. Never hold more than 5 positions. Take profit at 10%. Use stop-loss at -5%."
              disabled={loading}
              maxLength={2000}
            />
            <p className="text-xs text-[#737373]">
              {formData.custom_rules.length}/2000 characters • Define specific trading rules the AI must follow
            </p>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label htmlFor="custom-instructions" className="text-sm text-white">
              Custom Instructions <span className="text-[#737373]">(Optional)</span>
            </Label>
            <Textarea
              id="custom-instructions"
              value={formData.custom_instructions}
              onChange={(e) => setFormData({ ...formData, custom_instructions: e.target.value })}
              className="bg-[#1a1a1a] border-[#262626] text-white min-h-[100px] font-mono text-sm"
              placeholder="Example: Focus on value investing. Prefer companies with P/E ratio under 20. Analyze market sentiment before each trade."
              disabled={loading}
              maxLength={2000}
            />
            <p className="text-xs text-[#737373]">
              {formData.custom_instructions.length}/2000 characters • Provide additional context or strategy guidance
            </p>
          </div>

          {/* Info Box - Rules vs Instructions */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-400">
                <p className="font-medium mb-1">Custom Rules & Instructions:</p>
                <ul className="space-y-1 text-purple-300 text-xs">
                  <li>• <strong>No rules/instructions:</strong> AI uses default trading behavior</li>
                  <li>• <strong>With rules:</strong> AI must follow your specific trading rules</li>
                  <li>• <strong>With instructions:</strong> AI considers your strategy guidance</li>
                  <li>• <strong>Both:</strong> AI follows rules AND considers instructions</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Model Parameters - Sophisticated Component from /frontend */}
          {formData.default_ai_model && (
            <div className="space-y-2">
              <Label className="text-sm text-white">Model Parameters</Label>
              <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4">
                <ModelSettings
                  key={formData.default_ai_model}
                  selectedAIModel={formData.default_ai_model}
                  currentParams={modelParameters}
                  onParamsChange={setModelParameters}
                />
              </div>
              <p className="text-xs text-[#737373]">
                Parameters auto-adjust based on selected AI model (GPT-5, Claude, Gemini, etc.)
              </p>
            </div>
          )}
          
          {!formData.default_ai_model && (
            <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-lg p-4">
              <p className="text-sm text-[#3b82f6]">
                ℹ️ Select an AI model above to configure model-specific parameters
              </p>
            </div>
          )}

          {/* Starting Capital */}
            <div className="space-y-2">
              <Label htmlFor="capital" className="text-sm text-white">
              Starting Capital ($) *
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
            <p className="text-xs text-[#737373]">
              Initial cash amount for trading. You choose daily vs intraday when starting a run.
            </p>
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
