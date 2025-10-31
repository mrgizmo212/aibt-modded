'use client'

export default function RunData({ run }: { run: any }) {
  const strategy = run.strategy_snapshot || {}
  
  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">Total Trades</p>
            <p className="text-2xl font-bold">{run.total_trades || run.position_count || 0}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-400">Final Return</p>
            <p className={`text-2xl font-bold ${
              (run.final_return || 0) >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {run.final_return ? `${(run.final_return * 100).toFixed(2)}%` : 'N/A'}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-400">Final Portfolio Value</p>
            <p className="text-xl font-semibold">
              ${run.final_portfolio_value ? run.final_portfolio_value.toFixed(2) : 'N/A'}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-400">Max Drawdown</p>
            <p className="text-xl font-semibold text-red-400">
              {run.max_drawdown_during_run ? `${(run.max_drawdown_during_run * 100).toFixed(2)}%` : 'N/A'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Strategy Used */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Strategy Configuration</h3>
        
        <div className="space-y-4">
          {strategy.default_ai_model && (
            <div>
              <p className="text-sm text-gray-400 mb-1">AI Model</p>
              <p className="text-sm font-mono bg-zinc-950 px-3 py-2 rounded">
                {strategy.default_ai_model}
              </p>
            </div>
          )}
          
          {strategy.custom_rules && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Custom Rules</p>
              <pre className="text-xs bg-zinc-950 px-3 py-2 rounded overflow-x-auto whitespace-pre-wrap">
                {strategy.custom_rules}
              </pre>
            </div>
          )}
          
          {strategy.custom_instructions && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Custom Instructions</p>
              <pre className="text-xs bg-zinc-950 px-3 py-2 rounded overflow-x-auto whitespace-pre-wrap">
                {strategy.custom_instructions}
              </pre>
            </div>
          )}
          
          {strategy.model_parameters && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Model Parameters</p>
              <div className="text-xs bg-zinc-950 px-3 py-2 rounded">
                {Object.entries(strategy.model_parameters).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1">
                    <span className="text-gray-500">{key}:</span>
                    <span className="font-mono">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* AI Reasoning Count */}
      {run.reasoning_count > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">AI Decision Log</h3>
          <p className="text-sm text-gray-400">
            {run.reasoning_count} reasoning entries captured
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Ask the AI about specific decisions to see the reasoning
          </p>
        </div>
      )}
      
      {/* Quick Stats */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Run Number:</span>
            <span className="font-semibold">#{run.run_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Trading Mode:</span>
            <span className="font-semibold capitalize">{run.trading_mode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Positions Recorded:</span>
            <span className="font-semibold">{run.position_count || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">AI Decisions Logged:</span>
            <span className="font-semibold">{run.reasoning_count || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

