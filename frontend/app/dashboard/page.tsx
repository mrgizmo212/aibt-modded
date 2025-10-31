'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { fetchMyModels, fetchAllTradingStatus, startTrading, stopTrading, deleteModel } from '@/lib/api'
import type { Model, TradingStatus } from '@/types/api'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [models, setModels] = useState<Model[]>([])
  const [tradingStatus, setTradingStatus] = useState<Record<number, TradingStatus>>({})
  const [loading, setLoading] = useState(true)
  const [selectedModels, setSelectedModels] = useState<Set<number>>(new Set())
  const [deleting, setDeleting] = useState(false)
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    
    if (user) {
      loadData()
    }
  }, [user, authLoading, router])
  
  async function loadData() {
    try {
      const [modelsData, statusData] = await Promise.all([
        fetchMyModels(),
        fetchAllTradingStatus()
      ])
      
      setModels(modelsData.models)
      setTradingStatus(statusData.running_agents)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function handleStartModel(modelId: number) {
    const confirmed = confirm('Start AI trading for this model?')
    if (!confirmed) return
    
    try {
      await startTrading(modelId, 'openai/gpt-4o', '2025-10-29', '2025-10-30')
      await loadData() // Refresh to show new status
    } catch (error: any) {
      alert(`Failed to start trading: ${error.message}`)
    }
  }
  
  async function handleStopModel(modelId: number) {
    const confirmed = confirm('Stop AI trading for this model?')
    if (!confirmed) return
    
    try {
      await stopTrading(modelId)
      await loadData() // Refresh to show new status
    } catch (error: any) {
      alert(`Failed to stop trading: ${error.message}`)
    }
  }
  
  function toggleModelSelection(modelId: number) {
    const newSelected = new Set(selectedModels)
    if (newSelected.has(modelId)) {
      newSelected.delete(modelId)
    } else {
      newSelected.add(modelId)
    }
    setSelectedModels(newSelected)
  }
  
  function toggleSelectAll() {
    if (selectedModels.size === models.length) {
      // Deselect all
      setSelectedModels(new Set())
    } else {
      // Select all
      setSelectedModels(new Set(models.map(m => m.id)))
    }
  }
  
  async function handleDeleteSelected() {
    if (selectedModels.size === 0) return
    
    const confirmed = confirm(
      `Are you sure you want to delete ${selectedModels.size} model(s)? This action cannot be undone.`
    )
    if (!confirmed) return
    
    setDeleting(true)
    
    try {
      // Delete all selected models
      await Promise.all(
        Array.from(selectedModels).map(modelId => deleteModel(modelId))
      )
      
      // Clear selection and reload
      setSelectedModels(new Set())
      await loadData()
      
      alert(`Successfully deleted ${selectedModels.size} model(s)`)
    } catch (error: any) {
      alert(`Failed to delete models: ${error.message}`)
    } finally {
      setDeleting(false)
    }
  }
  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-black">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-zinc-950 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-500">AIBT</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user?.email}</span>
            {user?.role === 'admin' && (
              <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">
                Admin
              </span>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('token')
                router.push('/login')
              }}
              className="text-sm text-gray-400 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">My AI Models</h2>
            <p className="text-gray-400">Manage your autonomous trading agents</p>
          </div>
          
          {models.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-400 hover:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedModels.size === models.length && models.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-green-600 focus:ring-green-500 focus:ring-offset-0"
                />
                Select All
              </label>
              
              {selectedModels.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {deleting 
                    ? 'Deleting...' 
                    : `Delete Selected (${selectedModels.size})`
                  }
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-1">Total Models</p>
            <p className="text-3xl font-bold text-green-500">{models.length}</p>
          </div>
          
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-1">Running</p>
            <p className="text-3xl font-bold text-blue-500">
              {Object.keys(tradingStatus).length}
            </p>
          </div>
          
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-1">Total Capital</p>
            <p className="text-3xl font-bold text-purple-500">
              ${(models.length * 10000).toLocaleString()}
            </p>
          </div>
          
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-1">Active</p>
            <p className="text-3xl font-bold text-yellow-500">{models.length}</p>
          </div>
        </div>
        
        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => {
            const status = tradingStatus[model.id]
            const isRunning = status?.status === 'running'
            const isSelected = selectedModels.has(model.id)
            
            return (
              <div
                key={model.id}
                className={`bg-zinc-950 border rounded-lg p-6 hover:border-zinc-700 transition-colors relative ${
                  isSelected ? 'border-green-500 ring-2 ring-green-500/20' : 'border-zinc-800'
                }`}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-4 right-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleModelSelection(model.id)}
                    className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-green-600 focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
                  />
                </div>
                
                <div className="flex items-start justify-between mb-4 pr-8">
                  <div>
                    <h3 className="text-lg font-bold mb-1">{model.name}</h3>
                    <p className="text-xs text-gray-500">{model.signature}</p>
                  </div>
                  
                  {model.is_active && (
                    <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded border border-green-500">
                      Active
                    </span>
                  )}
                </div>
                
                {status && (
                  <div className="mb-3">
                    <span className="text-sm text-gray-400">Status: </span>
                    <span className={`text-sm font-medium ${
                      isRunning ? 'text-green-500' : 'text-gray-500'
                    }`}>
                      {status.status.replace('_', ' ')}
                    </span>
                  </div>
                )}
                
                {model.description && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{model.description}</p>
                )}
                
                <div className="flex gap-2">
                  <a
                    href={`/models/${model.id}`}
                    className="flex-1 text-center px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm hover:bg-zinc-800 transition-colors"
                  >
                    View Details
                  </a>
                  
                  <button 
                    onClick={() => isRunning ? handleStopModel(model.id) : handleStartModel(model.id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors"
                  >
                    {isRunning ? 'Stop' : 'Start'}
                  </button>
                </div>
              </div>
            )
          })}
          
          {models.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 border-2 border-dashed border-zinc-800 rounded-lg">
              <p className="text-gray-400 mb-4">No models yet</p>
              <a 
                href="/models/create"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium"
              >
                Create Your First Model
              </a>
            </div>
          )}
        </div>
        
        {/* Admin Link */}
        {user?.role === 'admin' && (
          <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg">
            <p className="text-sm text-yellow-500 mb-2">Admin Access Available</p>
            <a href="/admin" className="text-sm text-yellow-400 hover:underline">
              Go to Admin Dashboard →
            </a>
          </div>
        )}
      </main>
    </div>
  )
}

