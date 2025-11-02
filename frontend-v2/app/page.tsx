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

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()
  
  // State declarations
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null)
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null)
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

  // Don't render dashboard if not authenticated
  if (!user) {
    return null
  }

  const handleModelSelect = (id: number) => {
    setSelectedModelId(id)
    setContext("model")
  }
  
  const handleRunClick = async (modelId: number, runId: number) => {
    console.log('Run clicked:', modelId, runId)
    
    try {
      // Fetch full run details
      const { getRunDetails } = await import('@/lib/api')
      const runData = await getRunDetails(modelId, runId)
      
      // Trigger chat to show run details
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
    // In a real app, this would update the model status
  }

  const handleEditModel = async (id: number) => {
    // Fetch real model data from API
    try {
      const { getModelById } = await import('@/lib/api')
      const modelData = await getModelById(id)
      setEditingModel(modelData)
    setIsEditDialogOpen(true)
    } catch (error) {
      console.error('Failed to load model for editing:', error)
    }
  }

  const handleSaveModel = (updatedModel: any) => {
    console.log("Saving model:", updatedModel)
    // In a real app, this would update the model via API
    setIsEditDialogOpen(false)
    setEditingModel(null)
  }

  const handleDeleteModel = (id: number) => {
    console.log("Deleting model:", id)
    // In a real app, this would delete the model via API
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
            onSelectModel={handleModelSelect}
            onToggleModel={handleToggleModel}
          />
        </div>

        {/* Middle Column - Chat (Full width on mobile with padding for header/nav) */}
        <div className="w-full lg:w-[50%] flex-shrink-0 lg:mt-0 mt-[56px] lg:mb-0 mb-[72px]">
          <ChatInterface
            onContextChange={setContext}
            onModelSelect={handleModelSelect}
            onModelEdit={handleEditModel}
            onMobileDetailsClick={handleMobileDetailsClick}
            onShowRunDetails={handleRunClick}
          />
        </div>

        {/* Right Sidebar - Context Panel (Hidden on mobile) */}
        <div className="hidden lg:block lg:w-[30%] flex-shrink-0">
          <ContextPanel 
            context={context} 
            selectedModelId={selectedModelId} 
            onEditModel={handleEditModel}
            onRunClick={handleRunClick}
          />
        </div>
      </div>

      <MobileDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} side="left">
        <NavigationSidebar
          selectedModelId={selectedModelId}
          onSelectModel={(id) => {
            handleModelSelect(id)
            setIsMenuOpen(false)
          }}
          onToggleModel={handleToggleModel}
        />
      </MobileDrawer>

      <MobileBottomSheet isOpen={isContextOpen} onClose={() => setIsContextOpen(false)}>
        <ContextPanel 
          context={context} 
          selectedModelId={selectedModelId} 
          onEditModel={handleEditModel}
          onRunClick={handleRunClick}
        />
      </MobileBottomSheet>

      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {isEditDialogOpen && editingModel && (
        <ModelEditDialog
          model={editingModel}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={handleSaveModel}
          onDelete={handleDeleteModel}
        />
      )}

      <SystemStatusTrigger onClick={() => setIsStatusDrawerOpen(true)} status="operational" />
      <SystemStatusDrawer isOpen={isStatusDrawerOpen} onClose={() => setIsStatusDrawerOpen(false)} />
    </>
  )
}
