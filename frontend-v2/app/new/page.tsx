"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavigationSidebar } from "@/components/navigation-sidebar"
import { ChatInterface } from "@/components/chat-interface"
import { ContextPanel } from "@/components/context-panel"
import { MobileHeader } from "@/components/mobile-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { MobileDrawer } from "@/components/mobile-drawer"
import { MobileBottomSheet } from "@/components/mobile-bottom-sheet"
import { ModelEditDialog } from "@/components/model-edit-dialog"
import { SystemStatusDrawer } from "@/components/system-status-drawer"
import { SystemStatusTrigger } from "@/components/system-status-trigger"

/**
 * Ephemeral General Conversation Route
 * URL: /new
 * Purpose: New conversation state BEFORE first message is sent
 * No database record exists yet (optimistic creation)
 */
export default function NewConversationPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  
  // State declarations
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null)
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null)
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  const [context, setContext] = useState<"dashboard" | "model" | "run">("dashboard")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isContextOpen, setIsContextOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<any>(null)
  const [isStatusDrawerOpen, setIsStatusDrawerOpen] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Reset conversation state when navigating to /new
  useEffect(() => {
    const handleRouteChange = () => {
      // If we navigated to /new, reset conversation state
      if (window.location.pathname === '/new') {
        console.log('[NewPage] Route is /new, resetting conversation state')
        setSelectedConversationId(null)
      }
    }
    
    const handleNewChatRequested = () => {
      console.log('[NewPage] New chat requested, resetting conversation state')
      setSelectedConversationId(null)
    }
    
    const handleConversationSwitched = (e: Event) => {
      const customEvent = e as CustomEvent
      const { sessionId, modelId } = customEvent.detail
      console.log('[NewPage] Conversation switched event:', sessionId)
      setSelectedConversationId(sessionId)
    }
    
    // Check on mount and when pathname changes
    handleRouteChange()
    
    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handleRouteChange)
    
    // Listen for explicit "New Chat" button clicks
    window.addEventListener('new-chat-requested', handleNewChatRequested)
    
    // Listen for conversation switches (ChatGPT-style instant switching)
    window.addEventListener('conversation-switched', handleConversationSwitched)
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      window.removeEventListener('new-chat-requested', handleNewChatRequested)
      window.removeEventListener('conversation-switched', handleConversationSwitched)
    }
  }, [])

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
    // Navigate to model's chat page (cross-page navigation, must use router)
    router.push(`/m/${id}/new`)
  }
  
  const handleRunClick = async (modelId: number, runId: number) => {
    console.log('Run clicked:', modelId, runId)
    
    setSelectedModelId(modelId)
    setSelectedRunId(runId)
    
    try {
      const { getRunDetails } = await import('@/lib/api')
      const runData = await getRunDetails(modelId, runId)
      
      if ((window as any).__showRunInChat) {
        (window as any).__showRunInChat(modelId, runId, runData)
      }
      
      setContext("run")
    } catch (error) {
      console.error('Failed to load run details:', error)
    }
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
    console.log('[NewPage] Opening create model dialog')
    setEditingModel(null)  // null = create mode
    setIsEditDialogOpen(true)
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
    if (selectedModelId === id) {
      setSelectedModelId(null)
      setContext("dashboard")
    }
  }

  const handleMobileDetailsClick = (id: number) => {
    setSelectedModelId(id)
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
            selectedModelId={selectedModelId}
            selectedConversationId={null}
            isEphemeralActive={true}
            onSelectModel={handleModelSelect}
            onToggleModel={handleToggleModel}
            onModelEdit={handleEditModel}
            onCreateModel={handleCreateModel}
            onConversationSelect={(sessionId, modelId) => {
              // ChatGPT-style: Update URL without page reload
              const newUrl = modelId ? `/m/${modelId}/c/${sessionId}` : `/c/${sessionId}`
              window.history.pushState({}, '', newUrl)
              console.log('[NewPage] Switched to conversation:', sessionId, 'URL:', newUrl)
              
              // Update local state
              setSelectedConversationId(sessionId)
              
              // Dispatch event for other components
              window.dispatchEvent(new CustomEvent('conversation-switched', {
                detail: { sessionId, modelId }
              }))
            }}
          />
        </div>

        {/* Middle Column - Chat (Full width on mobile) */}
        <div className="w-full lg:w-[50%] flex-shrink-0 lg:mt-0 mt-[56px] lg:mb-0 mb-[72px]">
          <ChatInterface
            isEphemeral={selectedConversationId === null}
            selectedConversationId={selectedConversationId}
            onConversationCreated={(sessionId, modelId) => {
              console.log('[NewPage] Conversation created:', sessionId, 'model:', modelId)
              
              // Update state to transition from ephemeral to persistent
              setSelectedConversationId(sessionId)
              
              // Update URL without navigation (just change browser history)
              window.history.replaceState({}, '', `/c/${sessionId}`)
              console.log('[NewPage] URL updated to /c/' + sessionId + ' without page reload')
              
              // Notify sidebar to refresh
              window.dispatchEvent(new CustomEvent('conversation-created', {
                detail: { sessionId, modelId }
              }))
            }}
            onContextChange={setContext}
            onModelSelect={handleModelSelect}
            onModelEdit={handleEditModel}
            onMobileDetailsClick={handleMobileDetailsClick}
            onShowRunDetails={handleRunClick}
            selectedModelId={undefined}
            selectedRunId={undefined}
          />
        </div>

        {/* Right Sidebar - Context Panel (Hidden on mobile) */}
        <div className="hidden lg:block lg:w-[30%] flex-shrink-0">
          <ContextPanel 
            context={context} 
            selectedModelId={selectedModelId}
            selectedRunId={selectedRunId}
            onEditModel={handleEditModel}
            onRunClick={handleRunClick}
          />
        </div>
      </div>

      <MobileDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} side="left">
        <NavigationSidebar
          selectedModelId={selectedModelId}
          selectedConversationId={null}
          isEphemeralActive={true}
          onSelectModel={(id) => {
            handleModelSelect(id)
            setIsMenuOpen(false)
          }}
          onToggleModel={handleToggleModel}
          onModelEdit={handleEditModel}
          onCreateModel={handleCreateModel}
          onConversationSelect={(sessionId, modelId) => {
            if (modelId) {
              router.push(`/m/${modelId}/c/${sessionId}`)
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
          selectedModelId={selectedModelId}
          selectedRunId={selectedRunId}
          onEditModel={handleEditModel}
          onRunClick={handleRunClick}
        />
      </MobileBottomSheet>

      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />

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

