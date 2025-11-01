"use client"

import { useState } from "react"
import { X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

interface ModelEditDialogProps {
  model: {
    id: number
    name: string
    tradingStyle: string
    strategy: string
    riskLevel: number
    maxLoss: number
    maxPosition: number
  }
  onClose: () => void
  onSave: (updatedModel: any) => void
  onDelete: (id: number) => void
}

export function ModelEditDialog({ model, onClose, onSave, onDelete }: ModelEditDialogProps) {
  const [formData, setFormData] = useState(model)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSave = () => {
    onSave(formData)
    onClose()
  }

  const handleDelete = () => {
    onDelete(model.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#262626]">
          <h2 className="text-xl font-semibold text-white">Edit Model</h2>
          <button onClick={onClose} className="text-[#a3a3a3] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Model Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm text-white">
              Model Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-[#1a1a1a] border-[#262626] text-white"
              placeholder="Enter model name"
            />
          </div>

          {/* Trading Style */}
          <div className="space-y-2">
            <Label htmlFor="tradingStyle" className="text-sm text-white">
              Trading Style
            </Label>
            <Select
              value={formData.tradingStyle}
              onValueChange={(value) => setFormData({ ...formData, tradingStyle: value })}
            >
              <SelectTrigger className="bg-[#1a1a1a] border-[#262626] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#262626]">
                <SelectItem value="day-trading">Day Trading</SelectItem>
                <SelectItem value="swing-trading">Swing Trading</SelectItem>
                <SelectItem value="scalping">Scalping</SelectItem>
                <SelectItem value="long-term">Long-term</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Strategy */}
          <div className="space-y-2">
            <Label htmlFor="strategy" className="text-sm text-white">
              Strategy
            </Label>
            <Select value={formData.strategy} onValueChange={(value) => setFormData({ ...formData, strategy: value })}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#262626] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#262626]">
                <SelectItem value="momentum">Momentum</SelectItem>
                <SelectItem value="mean-reversion">Mean Reversion</SelectItem>
                <SelectItem value="breakout">Breakout</SelectItem>
                <SelectItem value="arbitrage">Arbitrage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Risk Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-white">Risk Level</Label>
              <span className="text-sm font-mono text-[#a3a3a3]">{formData.riskLevel}%</span>
            </div>
            <Slider
              value={[formData.riskLevel]}
              onValueChange={(value) => setFormData({ ...formData, riskLevel: value[0] })}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[#737373]">
              <span>Conservative</span>
              <span>Aggressive</span>
            </div>
          </div>

          {/* Max Loss Per Trade */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-white">Max Loss Per Trade</Label>
              <span className="text-sm font-mono text-[#a3a3a3]">{formData.maxLoss}%</span>
            </div>
            <Slider
              value={[formData.maxLoss]}
              onValueChange={(value) => setFormData({ ...formData, maxLoss: value[0] })}
              min={1}
              max={20}
              step={1}
              className="w-full"
            />
          </div>

          {/* Max Position Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-white">Max Position Size</Label>
              <span className="text-sm font-mono text-[#a3a3a3]">{formData.maxPosition}%</span>
            </div>
            <Slider
              value={[formData.maxPosition]}
              onValueChange={(value) => setFormData({ ...formData, maxPosition: value[0] })}
              min={5}
              max={50}
              step={5}
              className="w-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[#262626]">
          <div>
            {!showDeleteConfirm ? (
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-[#ef4444] hover:text-[#dc2626] hover:bg-[#ef4444]/10"
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
                  className="bg-[#ef4444] hover:bg-[#dc2626]"
                >
                  Yes, Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-[#a3a3a3]"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="text-[#a3a3a3] hover:text-white">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#3b82f6] hover:bg-[#2563eb] text-white">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
