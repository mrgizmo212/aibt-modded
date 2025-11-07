"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavigationSidebar } from "@/components/navigation-sidebar"
import { ChatInterface } from "@/components/chat-interface"
import { ContextPanel } from "@/components/context-panel"
import { MobileHeader } from "@/components/mobile-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { MobileDrawer } from "@/components/mobile-drawer"
import { MobileBottomSheet } from "@/components/mobile-bottom-sheet"
import { ModelEditDialog } from "@/components/model-edit-dialog"
import { ModelCreationChoice } from "@/components/model-creation-choice"
import { SystemStatusDrawer } from "@/components/system-status-drawer"
import { SystemStatusTrigger } from "@/components/system-status-trigger"

/**
 * Model Conversation Detail Route
 * URL: /m/[modelId]/c/[conversationId]
 * Purpose: Display existing model-specific conversation
 * Database record exists - conversation has been created
 */
export default function ModelConversationPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading } = useAuth()
  
  // Extract model ID and conversation ID from URL params
  const modelId = params.modelId ? parseInt(params.modelId as string) : null
  const conversationId = params.conversationId ? parseInt(params.conversationId as string) : null
  
  // State declarations
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null)
  const [context, setContext] = useState<"dashboard" | "model" | "run">("model")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isContextOpen, setIsContextOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<any>(null)
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false)
  const [isStatusDrawerOpen, setIsStatusDrawerOpen] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!user) {
    return null
  }

  const handleModelSelect = (id: number) => {
    setContext("model")
  }
  
  const handleRunClick = async (runModelId: number, runId: number) => {
    // Navigate to dedicated run analysis route
    router.push(`/m/${runModelId}/r/${runId}`)
  }

  const handleToggleModel = (id: number) => {
    console.log("Toggle model:", id)
  }

  const handleEditModel = async (id: number) => {
    try {
      const { getModelById } = await import('@/lib/api')
      const modelData = await getModelById(id)
      setEditingModel(modelData)
      setIsEditDialogOpen(true)
    } catch (error) {
      console.error('Failed to load model for editing:', error)
    }
  }

  const handleCreateModel = () => {
    setIsChoiceDialogOpen(true)  // Show choice dialog first
  }
  
  const handleChooseForm = () => {
    setEditingModel(null)  // null = create mode
    setIsEditDialogOpen(true)
  }
  
  const handleChooseBuilder = () => {
    // Redirect to /new with builder open
    router.push('/new')
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-strategy-builder'))
    }, 100)
  }

  const handleSaveModel = () => {
    console.log("Model saved")
    setIsEditDialogOpen(false)
    setEditingModel(null)
  }

  const handleDeleteModel = (id: number) => {
    console.log("Deleting model:", id)
    setIsEditDialogOpen(false)
    setEditingModel(null)
  }

  const handleMobileDetailsClick = (id: number) => {
    setContext("model")
    setIsContextOpen(true)
  }

  return (
    <>
      <MobileHeader onMenuClick={() => setIsMenuOpen(true)} onContextClick={() => setIsContextOpen(true)} />

      <div className="flex h-screen overflow-hidden">
        {/* Left Sidebar - Navigation (Hidden on mobile) */}
        <div className="hidden lg:block lg:w-[20%] flex-shrink-0">
          <NavigationSidebar
            selectedModelId={modelId}
            selectedConversationId={conversationId}
            isEphemeralActive={false}
            onSelectModel={handleModelSelect}
            onToggleModel={handleToggleModel}
            onModelEdit={handleEditModel}
            onCreateModel={handleCreateModel}
            onConversationSelect={(sessionId, convModelId) => {
              if (convModelId) {
                router.push(`/m/${convModelId}/c/${sessionId}`)
              } else {
                router.push(`/c/${sessionId}`)
              }
            }}
          />
        </div>

        {/* Middle Column - Chat (Full width on mobile) */}
        <div className="w-full lg:w-[50%] flex-shrink-0 lg:mt-0 mt-[56px] lg:mb-0 mb-[72px]">
          <ChatInterface
            isEphemeral={false}
            selectedConversationId={conversationId}
            onConversationCreated={(sessionId, createdModelId) => {
              console.log('[ModelConversationPage] New conversation created:', sessionId, 'model:', createdModelId)
              // Navigate to new conversation
              router.push(`/m/${createdModelId}/c/${sessionId}`)
              
              // Notify sidebar to refresh
              window.dispatchEvent(new CustomEvent('conversation-created', {
                detail: { sessionId, modelId: createdModelId }
              }))
            }}
            onContextChange={setContext}
            onModelSelect={handleModelSelect}
            onModelEdit={handleEditModel}
            onMobileDetailsClick={handleMobileDetailsClick}
            onShowRunDetails={handleRunClick}
            selectedModelId={modelId || undefined}
            selectedRunId={undefined}
          />
        </div>

        {/* Right Sidebar - Context Panel (Hidden on mobile) */}
        <div className="hidden lg:block lg:w-[30%] flex-shrink-0">
          <ContextPanel 
            context={context} 
            selectedModelId={modelId} 
            onEditModel={handleEditModel}
            onRunClick={handleRunClick}
          />
        </div>
      </div>

      <MobileDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} side="left">
        <NavigationSidebar
          selectedModelId={modelId}
          selectedConversationId={conversationId}
          isEphemeralActive={false}
          onSelectModel={(id) => {
            handleModelSelect(id)
            setIsMenuOpen(false)
          }}
          onToggleModel={handleToggleModel}
          onModelEdit={handleEditModel}
          onCreateModel={handleCreateModel}
          onConversationSelect={(sessionId, convModelId) => {
            if (convModelId) {
              router.push(`/m/${convModelId}/c/${sessionId}`)
            } else {
              router.push(`/c/${sessionId}`)
            }
            setIsMenuOpen(false)
          }}
          isHidden={!isMenuOpen}
        />
      </MobileDrawer>

      <MobileBottomSheet isOpen={isContextOpen} onClose={() => setIsContextOpen(false)}>
        <ContextPanel 
          context={context} 
          selectedModelId={modelId} 
          onEditModel={handleEditModel}
          onRunClick={handleRunClick}
        />
      </MobileBottomSheet>

      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <ModelCreationChoice
        isOpen={isChoiceDialogOpen}
        onClose={() => setIsChoiceDialogOpen(false)}
        onChooseForm={handleChooseForm}
        onChooseBuilder={handleChooseBuilder}
      />

      {isEditDialogOpen && (
        <ModelEditDialog
          model={editingModel}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={handleSaveModel}
        />
      )}

      <SystemStatusTrigger onClick={() => setIsStatusDrawerOpen(true)} status="operational" />
      <SystemStatusDrawer isOpen={isStatusDrawerOpen} onClose={() => setIsStatusDrawerOpen(false)} />
    </>
  )
}
