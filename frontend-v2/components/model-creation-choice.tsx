"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { FileText, Sparkles } from "lucide-react"

interface ModelCreationChoiceProps {
  isOpen: boolean
  onClose: () => void
  onChooseForm: () => void
  onChooseBuilder: () => void
}

export function ModelCreationChoice({ isOpen, onClose, onChooseForm, onChooseBuilder }: ModelCreationChoiceProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border-[#262626] max-w-2xl">
        <DialogTitle className="text-xl text-white font-semibold mb-6">
          How would you like to create your model?
        </DialogTitle>
        
        <div className="space-y-4">
          {/* Form-Based Option */}
          <button
            onClick={() => {
              onClose()
              onChooseForm()
            }}
            className="w-full bg-[#1a1a1a] border border-[#262626] hover:border-[#3b82f6]/50 hover:bg-[#3b82f6]/5 rounded-lg p-5 text-left transition-all group"
          >
            <div className="flex gap-4">
              <div className="p-3 bg-[#0a0a0a] border border-[#262626] rounded-lg group-hover:border-[#3b82f6]/30 transition-colors flex-shrink-0">
                <FileText className="w-6 h-6 text-[#3b82f6]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-white font-medium text-base">Use Form</h3>
                  <span className="text-[10px] text-[#737373] bg-[#0a0a0a] px-2 py-0.5 rounded border border-[#262626]">QUICK</span>
                </div>
                <p className="text-sm text-[#a3a3a3] leading-relaxed mb-3">
                  Traditional form-based creation with all model parameters. Quick and straightforward - perfect if you know exactly what you want to configure.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] text-[#737373] bg-[#0a0a0a] px-2 py-1 rounded border border-[#262626]">AI Model</span>
                  <span className="text-[10px] text-[#737373] bg-[#0a0a0a] px-2 py-1 rounded border border-[#262626]">Trading Style</span>
                  <span className="text-[10px] text-[#737373] bg-[#0a0a0a] px-2 py-1 rounded border border-[#262626]">Parameters</span>
                </div>
              </div>
            </div>
          </button>

          {/* Visual Builder Option */}
          <button
            onClick={() => {
              onClose()
              onChooseBuilder()
            }}
            className="w-full bg-[#1a1a1a] border border-[#262626] hover:border-[#3b82f6]/50 hover:bg-[#3b82f6]/5 rounded-lg p-5 text-left transition-all group"
          >
            <div className="flex gap-4">
              <div className="p-3 bg-[#0a0a0a] border border-[#262626] rounded-lg group-hover:border-[#3b82f6]/30 transition-colors flex-shrink-0">
                <Sparkles className="w-6 h-6 text-[#3b82f6]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-white font-medium text-base">Visual Builder</h3>
                  <span className="text-[10px] text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/30">RECOMMENDED</span>
                </div>
                <p className="text-sm text-[#a3a3a3] leading-relaxed mb-3">
                  Interactive visual interface to design your trading strategy step-by-step. Build custom rules, set conditions, and see everything visually.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] text-[#737373] bg-[#0a0a0a] px-2 py-1 rounded border border-[#262626]">Interactive</span>
                  <span className="text-[10px] text-[#737373] bg-[#0a0a0a] px-2 py-1 rounded border border-[#262626]">Visual Rules</span>
                  <span className="text-[10px] text-[#737373] bg-[#0a0a0a] px-2 py-1 rounded border border-[#262626]">Guided</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-6 p-4 bg-[#1a1a1a] border border-[#262626] rounded-lg">
          <p className="text-xs text-[#737373] leading-relaxed">
            💡 <span className="text-[#a3a3a3]">Not sure which to use?</span> The Visual Builder is great for designing complex strategies with custom rules, while the Form is faster for simple models.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
