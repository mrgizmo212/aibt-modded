"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Shield, Save, ArrowLeft, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { AVAILABLE_MODELS } from "@/lib/constants"
import { ModelSettings } from "@/components/ModelSettings"

export default function AdminPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  
  const [chatModel, setChatModel] = useState("openai/gpt-4.1-mini")
  const [chatInstructions, setChatInstructions] = useState("")
  const [modelParameters, setModelParameters] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Redirect if not admin
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    // TODO: Check if user is admin, redirect if not
  }, [user, loading, router])

  // Load global chat settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Import apiFetch helper
        const { getAdminChatSettings } = await import('@/lib/api')
        const data = await getAdminChatSettings()
        
        setChatModel(data.chat_model || "openai/gpt-4.1-mini")
        setChatInstructions(data.chat_instructions || "")
        setModelParameters(data.model_parameters || {})
      } catch (error) {
        console.error('Failed to load settings:', error)
        toast.error('Failed to load admin settings')
      } finally {
        setLoadingData(false)
      }
    }
    
    if (user) {
      loadSettings()
    }
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    
    try {
      // Use apiFetch helper for proper auth
      const { saveAdminChatSettings } = await import('@/lib/api')
      await saveAdminChatSettings(chatModel, chatInstructions, modelParameters)
      
      toast.success('Global chat settings saved!')
      toast.info('All new chat conversations will use these settings')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-[#737373]">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-[#a3a3a3] hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Settings</h1>
            <p className="text-sm text-[#737373]">Configure global chat AI model and system instructions</p>
          </div>
        </div>

        {/* Global Chat Settings Card */}
        <Card className="bg-[#1a1a1a] border-[#262626]">
          <CardHeader>
            <CardTitle className="text-white">Global Chat AI Configuration</CardTitle>
            <CardDescription className="text-[#737373]">
              This AI model and instructions will be used for ALL chat conversations across the platform.
              Users' individual model settings are used for trading, not chat.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* AI Model Selector */}
            <div>
              <Label className="text-sm text-white mb-2 block">Chat AI Model</Label>
              <Select value={chatModel} onValueChange={setChatModel}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#262626] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#262626] max-h-[400px]">
                  {AVAILABLE_MODELS.map((model) => (
                    <SelectItem 
                      key={model.id} 
                      value={model.id}
                      className="text-white hover:bg-[#262626]"
                    >
                      {model.name} ({model.provider})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-[#737373] mt-2">
                Selected: <span className="text-blue-400">{chatModel}</span>
              </p>
            </div>

            {/* Model Parameters */}
            {chatModel && (
              <div>
                <Label className="text-sm text-white mb-2 block">Model Parameters</Label>
                <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4">
                  <ModelSettings
                    selectedAIModel={chatModel}
                    currentParams={modelParameters}
                    onParamsChange={setModelParameters}
                  />
                </div>
                <p className="text-xs text-[#737373] mt-2">
                  Configure temperature, top_p, and token limits for the chat AI
                </p>
              </div>
            )}

            {/* Global Instructions */}
            <div>
              <Label className="text-sm text-white mb-2 block">
                Global Chat Instructions
              </Label>
              <Textarea
                value={chatInstructions}
                onChange={(e) => setChatInstructions(e.target.value)}
                placeholder="Enter system-wide chat instructions here...&#10;&#10;Examples:&#10;- Always be concise and direct&#10;- Focus on actionable insights&#10;- Cite specific trades as evidence&#10;- Suggest concrete rules with parameters&#10;&#10;No character limit!"
                className="min-h-[300px] bg-[#0a0a0a] border-[#262626] text-white resize-y font-mono text-sm"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-[#737373]">
                  {chatInstructions.length.toLocaleString()} characters (no limit)
                </p>
                {chatInstructions.length > 10000 && (
                  <p className="text-xs text-orange-400">
                    ⚠️ Very long instructions may impact response time
                  </p>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-purple-300 font-medium mb-2">
                    🌐 How Global Chat Works:
                  </p>
                  <ul className="text-xs text-purple-200 space-y-1">
                    <li>✅ This AI model powers ALL chat conversations (not trading)</li>
                    <li>✅ Instructions are added to every chat session system prompt</li>
                    <li>✅ Model parameters apply to all users' chats</li>
                    <li>✅ Trading uses each user's individual model settings</li>
                    <li>✅ Changes take effect immediately for new chat messages</li>
                    <li>⚠️ Audit trail tracks who changed settings and when</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-[#262626]">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Global Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card className="bg-[#1a1a1a] border-[#262626] mt-6">
          <CardHeader>
            <CardTitle className="text-white text-sm">Preview: Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Model Info */}
            <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4">
              <p className="text-xs text-[#737373] mb-2">AI Model:</p>
              <p className="text-white font-mono text-sm">{chatModel}</p>
            </div>
            
            {/* Parameters Preview */}
            <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4">
              <p className="text-xs text-[#737373] mb-2">Model Parameters:</p>
              <pre className="text-white font-mono text-xs overflow-x-auto">
                {JSON.stringify(modelParameters, null, 2)}
              </pre>
            </div>
            
            {/* Instructions Preview */}
            {chatInstructions && (
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4">
                <p className="text-xs text-[#737373] mb-2">Global Instructions:</p>
                <p className="text-white font-mono text-xs whitespace-pre-wrap">{chatInstructions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

