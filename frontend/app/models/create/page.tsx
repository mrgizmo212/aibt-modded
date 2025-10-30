'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { createModel } from '@/lib/api'

export default function CreateModelPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Redirect if not authenticated
  if (!authLoading && !user) {
    router.push('/login')
    return null
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const model = await createModel({ name, description: description || undefined })
      
      // Redirect to the newly created model's detail page
      router.push(`/models/${model.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create model')
    } finally {
      setLoading(false)
    }
  }
  
  if (authLoading) {
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
            <a href="/dashboard" className="text-sm text-gray-400 hover:text-white">
              ← Back to Dashboard
            </a>
            <span className="text-sm text-gray-400">{user?.email}</span>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Create New AI Model</h2>
            <p className="text-gray-400">
              Set up a new AI trading model. The model will start with $10,000 in virtual capital.
            </p>
          </div>
          
          {/* Form Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Model Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Model Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., My Tech Portfolio"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Choose a descriptive name for your trading model
                </p>
              </div>
              
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Optional: Describe your trading strategy, goals, or focus areas..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  {description.length}/500 characters
                </p>
              </div>
              
              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-400">
                    <p className="font-medium mb-1">How it works:</p>
                    <ul className="space-y-1 text-blue-300">
                      <li>• Your model starts with $10,000 virtual capital</li>
                      <li>• Select an AI model (GPT, Claude, etc.) to begin trading</li>
                      <li>• AI analyzes 100 NASDAQ stocks and makes trading decisions</li>
                      <li>• View real-time portfolio value and trading history</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Model'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Additional Info */}
          <div className="mt-6 p-4 bg-zinc-950/50 border border-zinc-800 rounded-lg">
            <p className="text-sm text-gray-400">
              <span className="text-gray-300 font-medium">Note:</span> After creating your model, 
              you'll be able to start trading by selecting an AI model (GPT-5, Claude 4.5, Gemini 2.5, etc.) 
              and specifying a date range for backtesting.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
