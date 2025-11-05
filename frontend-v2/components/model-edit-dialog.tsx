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
    trading_style: (model as any)?.trading_style || "day-trading",
    instrument: (model as any)?.instrument || "stocks",
    allow_shorting: (model as any)?.allow_shorting || false,
    allow_options_strategies: (model as any)?.allow_options_strategies || false,
    allow_hedging: (model as any)?.allow_hedging || false,
    allowed_order_types: (model as any)?.allowed_order_types || ["market", "limit"],
    default_ai_model: model?.default_ai_model || "",
    custom_rules: (model as any)?.custom_rules || "",
    custom_instructions: (model as any)?.custom_instructions || "",
    starting_capital: (model as any)?.initial_cash || model?.starting_capital || 10000,
  })
  
  // Model parameters managed by ModelSettings component
  const [modelParameters, setModelParameters] = useState<Record<string, any>>(modelParams)
  
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const isEditMode = !!model?.id

  // Sync form data when model prop changes
  useEffect(() => {
    if (model) {
      const modelParams = (model as any)?.model_parameters || {}
      setFormData({
        name: model?.name || "",
        trading_style: (model as any)?.trading_style || "day-trading",
        instrument: (model as any)?.instrument || "stocks",
        allow_shorting: (model as any)?.allow_shorting || false,
        allow_options_strategies: (model as any)?.allow_options_strategies || false,
        allow_hedging: (model as any)?.allow_hedging || false,
        allowed_order_types: (model as any)?.allowed_order_types || ["market", "limit"],
        default_ai_model: model?.default_ai_model || "",
        custom_rules: (model as any)?.custom_rules || "",
        custom_instructions: (model as any)?.custom_instructions || "",
        starting_capital: (model as any)?.initial_cash || model?.starting_capital || 10000,
      })
      setModelParameters(modelParams)
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

    setLoading(true)

    try {
      // Use model_parameters from ModelSettings component (nested object)
      const modelData = {
        name: formData.name,
        trading_style: formData.trading_style,
        instrument: formData.instrument,
        allow_shorting: formData.allow_shorting,
        allow_options_strategies: formData.allow_options_strategies,
        allow_hedging: formData.allow_hedging,
        allowed_order_types: formData.allowed_order_types,
        default_ai_model: formData.default_ai_model,
        initial_cash: formData.starting_capital,
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

          {/* Trading Style */}
          <div className="space-y-2">
            <Label htmlFor="trading-style" className="text-sm text-white">
              Trading Style *
            </Label>
            <Select
              value={formData.trading_style}
              onValueChange={(value) => setFormData({ ...formData, trading_style: value })}
              disabled={loading}
            >
              <SelectTrigger className="bg-[#1a1a1a] border-[#262626] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#262626]">
                <SelectItem value="scalping" className="text-white hover:bg-[#262626]">
                  📊 Scalping - Quick 1-5 minute trades
                </SelectItem>
                <SelectItem value="day-trading" className="text-white hover:bg-[#262626]">
                  ⚡ Day Trading - Intraday positions only
                </SelectItem>
                <SelectItem value="swing-trading" className="text-white hover:bg-[#262626]">
                  📈 Swing Trading - Hold 2-7 days
                </SelectItem>
                <SelectItem value="investing" className="text-white hover:bg-[#262626]">
                  💼 Investing - Long-term growth
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Instrument */}
          <div className="space-y-2">
            <Label htmlFor="instrument" className="text-sm text-white">
              Instrument *
            </Label>
            <Select
              value={formData.instrument}
              onValueChange={(value) => setFormData({ ...formData, instrument: value })}
              disabled={loading}
            >
              <SelectTrigger className="bg-[#1a1a1a] border-[#262626] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#262626]">
                <SelectItem value="stocks" className="text-white hover:bg-[#262626]">
                  📈 Stocks ✅
                </SelectItem>
                <SelectItem value="options" disabled className="text-[#737373]">
                  📊 Options 🔒 Coming Soon
                </SelectItem>
                <SelectItem value="futures" disabled className="text-[#737373]">
                  📉 Futures 🔒 Coming Soon
                </SelectItem>
                <SelectItem value="crypto" disabled className="text-[#737373]">
                  ₿ Crypto 🔒 Coming Soon
                </SelectItem>
                <SelectItem value="forex" disabled className="text-[#737373]">
                  💱 Forex 🔒 Coming Soon
                </SelectItem>
                <SelectItem value="prediction" disabled className="text-[#737373]">
                  🎲 Prediction Markets 🔒 Coming Soon
                </SelectItem>
              </SelectContent>
            </Select>
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

          {/* Trading Capabilities */}
          <div className="space-y-3 border-t border-[#262626] pt-6">
            <Label className="text-sm text-white font-semibold">
              Trading Capabilities
            </Label>
            <p className="text-xs text-[#737373] -mt-2">
              Configure what trading actions this model is allowed to perform
            </p>
            
            <div className="space-y-3">
              {/* Allow Shorting */}
              <div className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-[#262626] rounded-lg">
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">Short Selling</div>
                  <div className="text-xs text-[#737373]">Allow model to short stocks (requires margin)</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.allow_shorting}
                  onChange={(e) => setFormData({ ...formData, allow_shorting: e.target.checked })}
                  className="w-4 h-4"
                  disabled={loading}
                />
              </div>

              {/* Allow Options Strategies */}
              <div className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-[#262626] rounded-lg">
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">Multi-Leg Options</div>
                  <div className="text-xs text-[#737373]">Enable spreads, straddles, iron condors, etc.</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.allow_options_strategies}
                  onChange={(e) => setFormData({ ...formData, allow_options_strategies: e.target.checked })}
                  className="w-4 h-4"
                  disabled={loading}
                />
              </div>

              {/* Allow Hedging */}
              <div className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-[#262626] rounded-lg">
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">Hedging</div>
                  <div className="text-xs text-[#737373]">Allow opening positions to hedge existing risk</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.allow_hedging}
                  onChange={(e) => setFormData({ ...formData, allow_hedging: e.target.checked })}
                  className="w-4 h-4"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Allowed Order Types */}
          <div className="space-y-3 border-t border-[#262626] pt-6">
            <Label className="text-sm text-white font-semibold">
              Allowed Order Types
            </Label>
            <p className="text-xs text-[#737373] -mt-2">
              Select which order types the model can use when trading
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "market", label: "Market", desc: "Execute immediately at current price" },
                { value: "limit", label: "Limit", desc: "Buy/sell at specific price or better" },
                { value: "stop", label: "Stop", desc: "Trigger market order at stop price" },
                { value: "stop-limit", label: "Stop-Limit", desc: "Trigger limit order at stop price" },
                { value: "trailing-stop", label: "Trailing Stop", desc: "Dynamic stop that follows price" },
                { value: "bracket", label: "Bracket", desc: "Entry with profit target & stop loss" },
              ].map((orderType) => (
                <div
                  key={orderType.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.allowed_order_types.includes(orderType.value)
                      ? 'bg-blue-500/20 border-blue-500/50'
                      : 'bg-[#1a1a1a] border-[#262626] hover:border-[#404040]'
                  }`}
                  onClick={() => {
                    const current = formData.allowed_order_types
                    const updated = current.includes(orderType.value)
                      ? current.filter(t => t !== orderType.value)
                      : [...current, orderType.value]
                    setFormData({ ...formData, allowed_order_types: updated })
                  }}
                >
                  <div className="text-sm text-white font-medium">{orderType.label}</div>
                  <div className="text-xs text-[#737373] mt-1">{orderType.desc}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#737373]">
              Selected: {formData.allowed_order_types.length} order type{formData.allowed_order_types.length !== 1 ? 's' : ''}
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

          {/* Allowed Symbols - Removed: AI can trade any symbol in custom rules instead */}
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
