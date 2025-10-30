'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { fetchMyModels, fetchAllTradingStatus, startTrading, stopTrading } from '@/lib/api'
import type { Model, TradingStatus } from '@/types/api'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [models, setModels] = useState<Model[]>([])
  const [tradingStatus, setTradingStatus] = useState<Record<number, TradingStatus>>({})
  const [loading, setLoading] = useState(true)
  
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
                localStorage.removeItem('auth_token')
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">My AI Models</h2>
          <p className="text-gray-400">Manage your autonomous trading agents</p>
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
            
            return (
              <div
                key={model.id}
                className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
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

