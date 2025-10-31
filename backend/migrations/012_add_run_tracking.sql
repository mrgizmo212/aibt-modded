-- ============================================================================
-- MIGRATION 012: Run Tracking & AI Reasoning
-- ============================================================================
-- Purpose: Enable run-based organization and complete audit trail
-- Date: 2025-10-31
-- Pattern: Adapted from ttgaibots session_number concept
-- ============================================================================

-- TRADING RUNS TABLE
-- Groups trades by session/run for comparison and analysis
CREATE TABLE IF NOT EXISTS public.trading_runs (
  id SERIAL PRIMARY KEY,
  model_id INT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  run_number INT NOT NULL,
  
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  
  -- Status tracking
  status TEXT CHECK (status IN ('running', 'completed', 'stopped', 'failed')) DEFAULT 'running',
  
  -- Trading mode
  trading_mode TEXT CHECK (trading_mode IN ('daily', 'intraday')) NOT NULL,
  
  -- Strategy snapshot (what rules/params were used for this run)
  strategy_snapshot JSONB,
  
  -- For daily trading sessions:
  date_range_start DATE,
  date_range_end DATE,
  
  -- For intraday trading sessions:
  intraday_symbol TEXT,
  intraday_date DATE,
  intraday_session TEXT CHECK (intraday_session IN ('pre', 'regular', 'after')),
  
  -- Results (updated when run completes):
  total_trades INT DEFAULT 0,
  final_return DECIMAL(10,6),
  final_portfolio_value DECIMAL(12,2),
  max_drawdown_during_run DECIMAL(10,6),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(model_id, run_number)
);

-- Indexes for performance
CREATE INDEX idx_runs_model_status ON public.trading_runs(model_id, status);
CREATE INDEX idx_runs_started ON public.trading_runs(started_at DESC);
CREATE INDEX idx_runs_mode ON public.trading_runs(trading_mode);

-- Comments
COMMENT ON TABLE public.trading_runs IS 'Trading sessions/runs - enables comparison and strategy iteration';
COMMENT ON COLUMN public.trading_runs.run_number IS 'Auto-incrementing run number per model (1, 2, 3, ...)';
COMMENT ON COLUMN public.trading_runs.strategy_snapshot IS 'Snapshot of rules/params used (for replay and comparison)';
COMMENT ON COLUMN public.trading_runs.intraday_symbol IS 'For intraday: which symbol was traded (e.g., IBM)';
COMMENT ON COLUMN public.trading_runs.intraday_date IS 'For intraday: which date was replayed (e.g., 2025-10-29)';

-- ============================================================================
-- AI REASONING TABLE
-- ============================================================================
-- Separate from logs - tracks AI thought process
-- Pattern from ttgaibots: plan, analysis, decision, reflection

CREATE TABLE IF NOT EXISTS public.ai_reasoning (
  id BIGSERIAL PRIMARY KEY,
  model_id INT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  run_id INT REFERENCES public.trading_runs(id) ON DELETE CASCADE,
  
  timestamp TIMESTAMPTZ NOT NULL,
  
  -- Type of reasoning (ttgaibots enum)
  reasoning_type TEXT CHECK (reasoning_type IN (
    'plan',        -- What AI intends to do
    'analysis',    -- Market assessment  
    'decision',    -- Why it chose this specific trade
    'reflection'   -- Post-session review
  )) NOT NULL,
  
  content TEXT NOT NULL,
  
  -- Context data (what AI was looking at)
  context_json JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reasoning_run ON public.ai_reasoning(run_id, timestamp DESC);
CREATE INDEX idx_reasoning_type ON public.ai_reasoning(model_id, reasoning_type);
CREATE INDEX idx_reasoning_timestamp ON public.ai_reasoning(timestamp DESC);

-- Comments
COMMENT ON TABLE public.ai_reasoning IS 'AI thought process - separate from trade execution';
COMMENT ON COLUMN public.ai_reasoning.reasoning_type IS 'plan=intent, analysis=market view, decision=trade rationale, reflection=session review';
COMMENT ON COLUMN public.ai_reasoning.context_json IS 'Market data, indicators, signals AI was considering';

-- ============================================================================
-- LINK EXISTING TABLES TO RUNS
-- ============================================================================

-- Add run_id to positions (NULLABLE for backwards compatibility)
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS run_id INT REFERENCES public.trading_runs(id) ON DELETE SET NULL;

-- Add run_id to logs (NULLABLE for backwards compatibility)  
ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS run_id INT REFERENCES public.trading_runs(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_positions_run ON public.positions(run_id) WHERE run_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_run ON public.logs(run_id) WHERE run_id IS NOT NULL;

-- Update reasoning column comment (was added manually)
COMMENT ON COLUMN public.positions.reasoning IS 'Quick reasoning snapshot (truncated to 500 chars). Full reasoning in ai_reasoning table.';

-- ============================================================================
-- ROW LEVEL SECURITY (Multi-User Isolation)
-- ============================================================================

-- trading_runs: Users can only see/manage runs for models they own
ALTER TABLE public.trading_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own runs" ON public.trading_runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.models
      WHERE models.id = trading_runs.model_id
      AND models.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own runs" ON public.trading_runs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.models
      WHERE models.id = trading_runs.model_id
      AND models.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own runs" ON public.trading_runs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.models
      WHERE models.id = trading_runs.model_id
      AND models.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all runs" ON public.trading_runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ai_reasoning: Users can only see reasoning for models they own
ALTER TABLE public.ai_reasoning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reasoning" ON public.ai_reasoning
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.models
      WHERE models.id = ai_reasoning.model_id
      AND models.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own reasoning" ON public.ai_reasoning
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.models
      WHERE models.id = ai_reasoning.model_id
      AND models.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all reasoning" ON public.ai_reasoning
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES (Run these after migration)
-- ============================================================================

-- Check tables exist:
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'trading_runs';
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'ai_reasoning';

-- Check columns added:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'positions' AND column_name = 'run_id';

-- Check RLS enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('trading_runs', 'ai_reasoning');

-- ============================================================================
-- END MIGRATION 012
-- ============================================================================

