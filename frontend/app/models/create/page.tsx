'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { createModel } from '@/lib/api'
import { AVAILABLE_MODELS } from '@/lib/constants'
import { ModelSettings } from '@/components/ModelSettings'

export default function CreateModelPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [initialCash, setInitialCash] = useState('10000')
  const [selectedTickers, setSelectedTickers] = useState<string[]>([])
  const [tickerInput, setTickerInput] = useState('')
  const [useAllStocks, setUseAllStocks] = useState(true)
  const [selectedAIModel, setSelectedAIModel] = useState('openai/gpt-5')
  const [modelParameters, setModelParameters] = useState<Record<string, any>>({})
  const [customRules, setCustomRules] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Popular NASDAQ stocks for quick selection
  const popularTickers = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AMD',
    'NFLX', 'INTC', 'CSCO', 'ADBE', 'AVGO', 'QCOM', 'TXN', 'COST'
  ]
  
  function addTicker(ticker: string) {
    const upperTicker = ticker.toUpperCase().trim()
    if (upperTicker && !selectedTickers.includes(upperTicker)) {
      setSelectedTickers([...selectedTickers, upperTicker])
      setTickerInput('')
    }
  }
  
  function removeTicker(ticker: string) {
    setSelectedTickers(selectedTickers.filter(t => t !== ticker))
  }
  
  function togglePopularTicker(ticker: string) {
    if (selectedTickers.includes(ticker)) {
      removeTicker(ticker)
    } else {
      addTicker(ticker)
    }
  }
  
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
      const model = await createModel({ 
        name, 
        description: description || undefined,
        initial_cash: parseFloat(initialCash),
        allowed_tickers: useAllStocks ? undefined : selectedTickers,
        default_ai_model: selectedAIModel,
        model_parameters: modelParameters,
        custom_rules: customRules || undefined,
        custom_instructions: customInstructions || undefined
      })
      
      // Redirect to the newly created model's detail page
      router.push(`/models/${model.id}`)
    } catch (err) {
      const error = err as Error
      setError(error.message || 'Failed to create model')
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
              
              {/* Initial Cash */}
              <div>
                <label htmlFor="initialCash" className="block text-sm font-medium mb-2">
                  Starting Capital <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400">$</span>
                  <input
                    id="initialCash"
                    type="number"
                    value={initialCash}
                    onChange={(e) => setInitialCash(e.target.value)}
                    required
                    min="1000"
                    max="1000000"
                    step="1000"
                    className="w-full pl-8 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Virtual capital to start trading (min: $1,000, max: $1,000,000)
                </p>
              </div>
              
              {/* Stock Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Stock Universe
                </label>
                
                {/* Toggle: All Stocks vs Custom */}
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={useAllStocks}
                      onChange={() => setUseAllStocks(true)}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm">All NASDAQ 100 (Recommended)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!useAllStocks}
                      onChange={() => setUseAllStocks(false)}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm">Custom Selection</span>
                  </label>
                </div>
                
                {/* Custom Ticker Selection */}
                {!useAllStocks && (
                  <div className="space-y-3">
                    {/* Popular Tickers */}
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Popular stocks:</p>
                      <div className="flex flex-wrap gap-2">
                        {popularTickers.map(ticker => (
                          <button
                            key={ticker}
                            type="button"
                            onClick={() => togglePopularTicker(ticker)}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                              selectedTickers.includes(ticker)
                                ? 'bg-green-600 text-white'
                                : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                            }`}
                          >
                            {ticker}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Manual Input */}
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Add custom ticker:</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tickerInput}
                          onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addTicker(tickerInput)
                            }
                          }}
                          placeholder="e.g., AAPL"
                          maxLength={5}
                          className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm uppercase"
                        />
                        <button
                          type="button"
                          onClick={() => addTicker(tickerInput)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    
                    {/* Selected Tickers */}
                    {selectedTickers.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2">
                          Selected tickers ({selectedTickers.length}):
                        </p>
                        <div className="flex flex-wrap gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-md">
                          {selectedTickers.map(ticker => (
                            <span
                              key={ticker}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded"
                            >
                              {ticker}
                              <button
                                type="button"
                                onClick={() => removeTicker(ticker)}
                                className="hover:text-red-300"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedTickers.length === 0 && (
                      <p className="text-xs text-yellow-500">
                        ⚠ No tickers selected. Please select at least one ticker or use "All NASDAQ 100".
                      </p>
                    )}
                  </div>
                )}
                
                <p className="mt-2 text-xs text-gray-500">
                  {useAllStocks 
                    ? 'AI will analyze and trade across all NASDAQ 100 stocks'
                    : 'AI will only trade the stocks you select'
                  }
                </p>
              </div>
              
              {/* AI Model Selection & Configuration */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Default AI Model <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedAIModel}
                  onChange={(e) => setSelectedAIModel(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <ModelSettings
                    selectedAIModel={selectedAIModel}
                    currentParams={modelParameters}
                    onParamsChange={setModelParameters}
                  />
                </div>
                
                <p className="mt-2 text-xs text-gray-500">
                  Configure AI behavior parameters. You can change these anytime later.
                </p>
              </div>
              
              {/* Custom Rules */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Custom Trading Rules <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  value={customRules}
                  onChange={(e) => setCustomRules(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Example: Only trade tech stocks. Never hold more than 5 positions. Take profit at 10%. Use stop-loss at -5%."
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {customRules.length}/2000 characters • Define specific trading rules the AI must follow
                </p>
              </div>
              
              {/* Custom Instructions */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Custom Instructions <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Example: Focus on value investing. Prefer companies with P/E ratio under 20. Analyze market sentiment before each trade."
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {customInstructions.length}/2000 characters • Provide additional context or strategy guidance
                </p>
              </div>
              
              {/* Rules/Instructions Info */}
              <div className="bg-purple-500/10 border border-purple-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-purple-400">
                    <p className="font-medium mb-1">Custom Rules & Instructions:</p>
                    <ul className="space-y-1 text-purple-300 text-xs">
                      <li>• <strong>No rules/instructions:</strong> AI uses default trading behavior</li>
                      <li>• <strong>With rules:</strong> AI must follow your specific trading rules</li>
                      <li>• <strong>With instructions:</strong> AI considers your strategy guidance</li>
                      <li>• <strong>Both:</strong> AI follows rules AND considers instructions</li>
                    </ul>
                  </div>
                </div>
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
                      <li>• Choose your starting capital amount above</li>
                      <li>• Select which stocks the AI can trade (or use all NASDAQ 100)</li>
                      <li>• Select an AI model (GPT, Claude, etc.) to begin trading</li>
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
                  disabled={loading || !name.trim() || (!useAllStocks && selectedTickers.length === 0)}
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
