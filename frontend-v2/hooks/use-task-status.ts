import { useState, useEffect, useRef } from 'react'
import { getTaskStatus } from '@/lib/api'

interface TaskStatus {
  task_id: string
  state: 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE' | 'REVOKED'
  status?: string
  current?: number
  total?: number
  run_id?: number
  run_number?: number
  result?: any
  error?: string
}

interface UseTaskStatusOptions {
  enabled?: boolean
  pollInterval?: number
  onComplete?: (result: any) => void
  onError?: (error: string) => void
}

export function useTaskStatus(
  taskId: string | null,
  options: UseTaskStatusOptions = {}
) {
  const {
    enabled = true,
    pollInterval = 5000, // Poll every 5 seconds
    onComplete,
    onError
  } = options

  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!taskId || !enabled) {
      return
    }

    const fetchStatus = async () => {
      try {
        setLoading(true)
        const status = await getTaskStatus(taskId)
        setTaskStatus(status)
        setError(null)

        // Call callbacks
        if (status.state === 'SUCCESS' && onComplete) {
          onComplete(status.result)
          // Stop polling after success
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
        } else if (status.state === 'FAILURE' && onError) {
          onError(status.error || 'Task failed')
          // Stop polling after failure
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
        } else if (status.state === 'REVOKED') {
          // Stop polling if revoked
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch task status')
        console.error('Task status error:', err)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchStatus()

    // Set up polling
    intervalRef.current = setInterval(fetchStatus, pollInterval)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [taskId, enabled, pollInterval, onComplete, onError])

  return {
    taskStatus,
    loading,
    error,
    isComplete: taskStatus?.state === 'SUCCESS',
    isFailed: taskStatus?.state === 'FAILURE',
    isRunning: taskStatus?.state === 'PROGRESS',
    isPending: taskStatus?.state === 'PENDING',
    isRevoked: taskStatus?.state === 'REVOKED',
    progress: taskStatus?.current && taskStatus?.total 
      ? Math.round((taskStatus.current / taskStatus.total) * 100)
      : 0
  }
}

