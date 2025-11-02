'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, FileText } from 'lucide-react'
import { fetchModelLogs } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-[#262626] rounded w-3/4"></div>
          <div className="h-4 bg-[#262626] rounded w-1/2"></div>
          <div className="h-4 bg-[#262626] rounded w-5/6"></div>
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
    <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-[#262626]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-white" />
            <h3 className="text-sm font-semibold text-white">AI Decision Logs</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            placeholder="Filter by date"
            className="flex-1 h-8 bg-[#0a0a0a] border-[#262626] text-white text-xs"
          />
          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate('')}
              className="h-8 text-xs text-[#a3a3a3] hover:text-white"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Logs List */}
      <div className="divide-y divide-[#262626] max-h-[400px] overflow-y-auto scrollbar-thin">
        {logs.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-8 h-8 mx-auto text-[#525252] mb-2" />
            <p className="text-[#a3a3a3] text-sm mb-1">No logs available</p>
            <p className="text-[#525252] text-xs">
              {selectedDate ? 'Try selecting a different date' : 'Start trading to generate logs'}
            </p>
          </div>
        ) : (
          logs.map((log, index) => {
            const isExpanded = expandedLog === log.id
            const messages = log.messages || []
            
            return (
              <div key={log.id || index} className="p-3 hover:bg-[#141414] transition-colors">
                {/* Log Header */}
                <div
                  onClick={() => toggleLogExpand(log.id)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#a3a3a3]">
                          {log.date}
                        </span>
                        <span className="text-xs text-[#525252]">•</span>
                        <span className="text-xs text-[#737373]">
                          {new Date(log.timestamp || log.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-white mt-1 truncate">
                        {log.signature || 'Trading Decision'}
                      </p>
                    </div>
                  </div>
                  
                  <ChevronDown 
                    className={`w-4 h-4 text-[#a3a3a3] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>

                {/* Expanded Log Content */}
                {isExpanded && messages.length > 0 && (
                  <div className="mt-3 pl-5 space-y-2">
                    {messages.map((msg: any, msgIndex: number) => (
                      <div 
                        key={msgIndex}
                        className={`p-3 rounded-lg text-sm ${
                          msg.role === 'user' 
                            ? 'bg-blue-500/10 border border-blue-500/20' 
                            : msg.role === 'assistant'
                            ? 'bg-green-500/10 border border-green-500/20'
                            : 'bg-[#262626]/50 border border-[#404040]'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`text-xs font-semibold uppercase ${
                            msg.role === 'user' ? 'text-blue-400' : 
                            msg.role === 'assistant' ? 'text-green-400' : 
                            'text-[#a3a3a3]'
                          }`}>
                            {msg.role || 'system'}
                          </span>
                        </div>
                        <div className="mt-2 text-[#e5e5e5] whitespace-pre-wrap font-mono text-xs">
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
                  <div className="mt-3 pl-5 text-sm text-[#737373]">
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
        <div className="p-3 border-t border-[#262626] bg-[#141414]">
          <p className="text-xs text-[#737373] text-center">
            Showing {logs.length} log {logs.length === 1 ? 'entry' : 'entries'}
            {selectedDate && ` for ${selectedDate}`}
          </p>
        </div>
      )}
    </div>
  )
}

