'use client'

import { useEffect, useState } from 'react'
import { fetchModelLogs } from '@/lib/api'

interface LogsViewerProps {
  modelId: number
}

export function LogsViewer({ modelId }: LogsViewerProps) {
  const [logs, setLogs] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedLog, setExpandedLog] = useState<number | null>(null)

  useEffect(() => {
    loadLogs()
  }, [modelId, selectedDate])

  async function loadLogs() {
    try {
      setLoading(true)
      const data = await fetchModelLogs(modelId, selectedDate || undefined)
      setLogs(data.logs || [])
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to load logs')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  function toggleLogExpand(logId: number) {
    setExpandedLog(expandedLog === logId ? null : logId)
  }

  if (loading) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
          <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
          <div className="h-4 bg-zinc-800 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-6">
        <p className="text-yellow-500 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">AI Decision Logs</h3>
            <p className="text-sm text-gray-400 mt-1">
              View reasoning behind trading decisions
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-400">Filter by date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-sm text-gray-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="divide-y divide-zinc-800 max-h-[600px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-400 text-sm mb-1">No logs available</p>
            <p className="text-gray-500 text-xs">
              {selectedDate ? 'Try selecting a different date' : 'Start trading to generate logs'}
            </p>
          </div>
        ) : (
          logs.map((log, index) => {
            const isExpanded = expandedLog === log.id
            const messages = log.messages || []
            
            return (
              <div key={log.id || index} className="p-4 hover:bg-zinc-900/50 transition-colors">
                {/* Log Header */}
                <div
                  onClick={() => toggleLogExpand(log.id)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-400">
                          {log.date}
                        </span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp || log.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mt-1 truncate">
                        {log.signature || 'Trading Decision'}
                      </p>
                    </div>
                  </div>
                  
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded Log Content */}
                {isExpanded && messages.length > 0 && (
                  <div className="mt-4 pl-5 space-y-3">
                    {messages.map((msg: any, msgIndex: number) => (
                      <div 
                        key={msgIndex}
                        className={`p-3 rounded-lg text-sm ${
                          msg.role === 'user' 
                            ? 'bg-blue-500/10 border border-blue-500/20' 
                            : msg.role === 'assistant'
                            ? 'bg-green-500/10 border border-green-500/20'
                            : 'bg-zinc-800/50 border border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`text-xs font-semibold uppercase ${
                            msg.role === 'user' ? 'text-blue-400' : 
                            msg.role === 'assistant' ? 'text-green-400' : 
                            'text-gray-400'
                          }`}>
                            {msg.role || 'system'}
                          </span>
                        </div>
                        <div className="mt-2 text-gray-300 whitespace-pre-wrap font-mono text-xs">
                          {typeof msg.content === 'string' 
                            ? msg.content 
                            : JSON.stringify(msg.content, null, 2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty messages indicator */}
                {isExpanded && messages.length === 0 && (
                  <div className="mt-4 pl-5 text-sm text-gray-500">
                    No detailed messages available for this log entry
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {logs.length > 0 && (
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-gray-500 text-center">
            Showing {logs.length} log {logs.length === 1 ? 'entry' : 'entries'}
            {selectedDate && ` for ${selectedDate}`}
          </p>
        </div>
      )}
    </div>
  )
}

