'use client'

import { useEffect, useState } from 'react'
import { fetchModelPerformance } from '@/lib/api'

interface PerformanceMetricsProps {
  modelId: number
}

export function PerformanceMetrics({ modelId }: PerformanceMetricsProps) {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadMetrics()
  }, [modelId])

  async function loadMetrics() {
    try {
      const data = await fetchModelPerformance(modelId)
      setMetrics(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load performance metrics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-zinc-900 rounded-lg"></div>
        <div className="h-32 bg-zinc-900 rounded-lg"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-6">
        <p className="text-yellow-500 text-sm">
          {error}
        </p>
      </div>
    )
  }

  if (!metrics || !metrics.metrics) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-8 text-center">
        <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-400 text-sm">
          No performance data yet. Start trading to generate metrics.
        </p>
      </div>
    )
  }

  const m = metrics.metrics
  
  // Calculate profit/loss
  const profitLoss = m.final_value - m.initial_value
  const profitLossPercent = ((profitLoss / m.initial_value) * 100)
  const isProfit = profitLoss >= 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Return */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Total Return</p>
            {isProfit ? (
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            )}
          </div>
          <p className={`text-3xl font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
            {isProfit ? '+' : ''}{profitLossPercent.toFixed(2)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ${profitLoss.toFixed(2)} {isProfit ? 'profit' : 'loss'}
          </p>
        </div>

        {/* Sharpe Ratio */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Sharpe Ratio</p>
          <p className="text-3xl font-bold">
            {m.sharpe_ratio?.toFixed(2) || 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Risk-adjusted return
          </p>
        </div>

        {/* Max Drawdown */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Max Drawdown</p>
          <p className="text-3xl font-bold text-red-500">
            {(m.max_drawdown * 100).toFixed(2)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Worst peak-to-trough
          </p>
        </div>

        {/* Win Rate */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Win Rate</p>
          <p className="text-3xl font-bold text-blue-500">
            {(m.win_rate * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Winning trades
          </p>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">Detailed Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Portfolio Value */}
          <div>
            <p className="text-sm text-gray-400 mb-1">Initial Value</p>
            <p className="text-xl font-semibold text-gray-300">
              ${m.initial_value.toLocaleString()}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-400 mb-1">Final Value</p>
            <p className="text-xl font-semibold">
              ${m.final_value.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-1">Total P/L</p>
            <p className={`text-xl font-semibold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {isProfit ? '+' : ''}${profitLoss.toFixed(2)}
            </p>
          </div>

          {/* Returns */}
          <div>
            <p className="text-sm text-gray-400 mb-1">Cumulative Return</p>
            <p className="text-xl font-semibold">
              {(m.cumulative_return * 100).toFixed(2)}%
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-1">Annualized Return</p>
            <p className="text-xl font-semibold">
              {(m.annualized_return * 100).toFixed(2)}%
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-1">Volatility</p>
            <p className="text-xl font-semibold">
              {(m.volatility * 100).toFixed(2)}%
            </p>
          </div>

          {/* Trading Stats */}
          <div>
            <p className="text-sm text-gray-400 mb-1">Trading Days</p>
            <p className="text-xl font-semibold">
              {m.total_trading_days}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-1">P/L Ratio</p>
            <p className="text-xl font-semibold">
              {m.profit_loss_ratio?.toFixed(2) || 'N/A'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-1">Period</p>
            <p className="text-sm font-semibold text-gray-300">
              {metrics.start_date} to {metrics.end_date}
            </p>
          </div>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk Metrics */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-md font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Risk Analysis
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Max Drawdown</span>
              <span className="text-sm font-semibold text-red-500">
                {(m.max_drawdown * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Volatility</span>
              <span className="text-sm font-semibold">
                {(m.volatility * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Sharpe Ratio</span>
              <span className="text-sm font-semibold">
                {m.sharpe_ratio?.toFixed(2) || 'N/A'}
              </span>
            </div>
            {m.max_drawdown_start && m.max_drawdown_end && (
              <div className="pt-2 border-t border-zinc-800">
                <p className="text-xs text-gray-500">Drawdown Period:</p>
                <p className="text-xs text-gray-400">
                  {m.max_drawdown_start} → {m.max_drawdown_end}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Win/Loss Stats */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-md font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Trading Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Win Rate</span>
              <span className="text-sm font-semibold text-green-500">
                {(m.win_rate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Loss Rate</span>
              <span className="text-sm font-semibold text-red-500">
                {((1 - m.win_rate) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">P/L Ratio</span>
              <span className="text-sm font-semibold">
                {m.profit_loss_ratio?.toFixed(2) || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total Days</span>
              <span className="text-sm font-semibold">
                {m.total_trading_days}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

