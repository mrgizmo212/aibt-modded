'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import {
  fetchSystemStats,
  fetchAdminLeaderboard,
  fetchAllModels,
  fetchMCPStatus,
  startMCPServices,
  stopMCPServices
} from '@/lib/api'
import type { SystemStats, LeaderboardEntry, Model } from '@/types/api'

export default function AdminDashboardPage() {
  const { user, loading: authLoading, isAdmin } = useAuth()
  const router = useRouter()
  
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [allModels, setAllModels] = useState<Model[]>([])
  const [mcpStatus, setMCPStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mcpLoading, setMCPLoading] = useState(false)
  
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
        return
      }
      if (!isAdmin) {
        router.push('/dashboard')
        return
      }
      
      loadData()
    }
  }, [user, authLoading, isAdmin, router])
  
  async function loadData() {
    try {
      const [statsData, lbData, modelsData, mcpData] = await Promise.all([
        fetchSystemStats(),
        fetchAdminLeaderboard(),
        fetchAllModels(),
        fetchMCPStatus()
      ])
      
      setStats(statsData)
      setLeaderboard(lbData.leaderboard)
      setAllModels(modelsData.models)
      setMCPStatus(mcpData)
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function handleStartMCP() {
    setMCPLoading(true)
    try {
      await startMCPServices()
      const mcpData = await fetchMCPStatus()
      setMCPStatus(mcpData)
    } catch (error: any) {
      alert(`Failed to start MCP services: ${error.message}`)
    } finally {
      setMCPLoading(false)
    }
  }
  
  async function handleStopMCP() {
    setMCPLoading(true)
    try {
      await stopMCPServices()
      const mcpData = await fetchMCPStatus()
      setMCPStatus(mcpData)
    } catch (error: any) {
      alert(`Failed to stop MCP services: ${error.message}`)
    } finally {
      setMCPLoading(false)
    }
  }
  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-gray-400">Loading admin dashboard...</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-black">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-zinc-950 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-xl font-bold text-yellow-500">AIBT Admin</a>
            <a href="/dashboard" className="text-sm text-gray-400 hover:text-white">User Dashboard</a>
          </div>
          <span className="text-sm text-gray-400">{user?.email}</span>
        </div>
      </nav>
      
      <main className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-yellow-500 mb-8">Admin Dashboard</h1>
        
        {/* System Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
              <p className="text-sm text-gray-400 mb-1">Total Users</p>
              <p className="text-3xl font-bold">{stats.total_users}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.admin_count} admin, {stats.user_count} regular
              </p>
            </div>
            
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
              <p className="text-sm text-gray-400 mb-1">Total Models</p>
              <p className="text-3xl font-bold">{stats.total_models}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.active_models} active</p>
            </div>
            
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
              <p className="text-sm text-gray-400 mb-1">Positions</p>
              <p className="text-3xl font-bold">{stats.total_positions}</p>
            </div>
            
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
              <p className="text-sm text-gray-400 mb-1">Log Entries</p>
              <p className="text-3xl font-bold">{stats.total_logs}</p>
            </div>
          </div>
        )}
        
        {/* MCP Services */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">MCP Services</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {mcpStatus && Object.entries(mcpStatus).map(([name, info]: [string, any]) => (
              <div key={name} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <p className="text-sm font-medium mb-1 capitalize">{name}</p>
                <p className={`text-xs ${info.status === 'running' ? 'text-green-500' : 'text-gray-500'}`}>
                  {info.status}
                </p>
                {info.port && <p className="text-xs text-gray-600">Port: {info.port}</p>}
              </div>
            ))}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleStartMCP}
              disabled={mcpLoading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50"
            >
              {mcpLoading ? 'Starting...' : 'Start All Services'}
            </button>
            
            <button
              onClick={handleStopMCP}
              disabled={mcpLoading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50"
            >
              {mcpLoading ? 'Stopping...' : 'Stop All Services'}
            </button>
          </div>
        </div>
        
        {/* Leaderboard */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">🏆 Global Leaderboard</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 text-sm text-gray-400">Rank</th>
                  <th className="text-left py-3 text-sm text-gray-400">Model</th>
                  <th className="text-left py-3 text-sm text-gray-400">User</th>
                  <th className="text-right py-3 text-sm text-gray-400">Return</th>
                  <th className="text-right py-3 text-sm text-gray-400">Sharpe</th>
                  <th className="text-right py-3 text-sm text-gray-400">Value</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={entry.model_id} className="border-b border-zinc-900 hover:bg-zinc-900">
                    <td className="py-3 text-lg font-bold">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                    </td>
                    <td className="py-3 font-medium">{entry.model_name}</td>
                    <td className="py-3 text-sm text-gray-400">{entry.user_email}</td>
                    <td className={`py-3 text-right font-bold ${
                      entry.cumulative_return > 0 ? 'text-green-500' :
                      entry.cumulative_return < 0 ? 'text-red-500' : 'text-gray-400'
                    }`}>
                      {(entry.cumulative_return * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 text-right">{entry.sharpe_ratio.toFixed(2)}</td>
                    <td className="py-3 text-right font-mono">
                      ${entry.final_value.toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {leaderboard.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No models with performance data yet
            </p>
          )}
        </div>
      </main>
    </div>
  )
}

