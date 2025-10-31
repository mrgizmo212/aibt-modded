'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ChatInterface from '@/components/ChatInterface'
import RunData from '@/components/RunData'

export default function RunPage() {
  const params = useParams()
  const modelId = parseInt(params.id as string)
  const runId = parseInt(params.run as string)
  
  const [run, setRun] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  useEffect(() => {
    loadRun()
  }, [modelId, runId])
  
  async function loadRun() {
    try {
      const response = await fetch(`http://localhost:8000/api/models/${modelId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to load run')
      }
      
      const data = await response.json()
      setRun(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load run')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading run details...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 max-w-md">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }
  
  if (!run) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-gray-400">Run not found</p>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <a 
              href={`/models/${modelId}`}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Model
            </a>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">
            Run #{run.run_number}
            <span className="ml-4 text-xl text-gray-400">
              {run.trading_mode === 'intraday' ? '⚡ Intraday' : '📅 Daily'} Trading
            </span>
          </h1>
          
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span>Started: {new Date(run.started_at).toLocaleString()}</span>
            {run.ended_at && <span>Ended: {new Date(run.ended_at).toLocaleString()}</span>}
            <span className={`px-2 py-1 rounded-full text-xs ${
              run.status === 'completed' ? 'bg-green-500/20 text-green-400' :
              run.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
              run.status === 'failed' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {run.status}
            </span>
            <span>Trades: {run.total_trades || run.position_count || 0}</span>
          </div>
          
          {run.trading_mode === 'intraday' && (
            <div className="mt-2 text-sm text-gray-500">
              Symbol: {run.intraday_symbol} | 
              Date: {run.intraday_date} | 
              Session: {run.intraday_session}
            </div>
          )}
        </div>
        
        {/* Two-column layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Chat with System Agent */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>💬</span>
              <span>Strategy Chat</span>
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Ask the AI analyst about this trading run
            </p>
            <ChatInterface modelId={modelId} runId={runId} />
          </div>
          
          {/* Right: Run Data */}
          <div>
            <RunData run={run} />
          </div>
        </div>
      </div>
    </div>
  )
}

