-- ============================================================================
-- MIGRATION 013: Structured Rules System
-- ============================================================================
-- Purpose: Move from text blobs to parseable, enforceable rules
-- Date: 2025-10-31
-- Pattern: Adapted from ttgaibots UserRule interface
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.model_rules (
  id SERIAL PRIMARY KEY,
  model_id INT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  
  -- Rule identification
  rule_name TEXT NOT NULL,
  rule_description TEXT NOT NULL,
  
  -- Categorization (for organization and enforcement)
  rule_category TEXT CHECK (rule_category IN (
    'risk',            -- Risk management (position limits, circuit breakers)
    'strategy',        -- Trading strategy rules
    'position_sizing', -- How much to trade per position
    'timing',          -- When to trade (time of day, blackout periods)
    'entry_exit',      -- Entry and exit conditions
    'stop_loss',       -- Stop loss rules
    'screening',       -- Stock selection criteria (use with Finviz)
    'emergency'        -- Circuit breakers and emergency protocols
  )) NOT NULL,
  
  -- Enforcement parameters (STRUCTURED - programmatically enforceable!)
  enforcement_params JSONB,
  -- Examples:
  -- {"max_position_pct": 0.20, "enforcement": "reject_trade"}
  -- {"max_positions": 3, "enforcement": "reject_trade"}
  -- {"min_cash_reserve_pct": 0.20, "enforcement": "reject_trade"}
  -- {"blackout_start": "09:30", "blackout_end": "09:35", "enforcement": "skip_minute"}
  -- {"approved_symbols": ["AAPL", "MSFT"], "enforcement": "whitelist"}
  
  -- Asset scoping (from ttgaibots)
  applies_to_assets TEXT[] DEFAULT ARRAY['equity'],  -- ['equity', 'option', 'crypto', 'future']
  applies_to_symbols TEXT[],  -- Whitelist (NULL = applies to all)
  exclude_symbols TEXT[],     -- Blacklist
  
  -- Management
  priority INT DEFAULT 5,  -- 1=lowest, 10=highest (execution order for rules)
  is_active BOOLEAN DEFAULT true,
  created_by TEXT CHECK (created_by IN ('user', 'ai_suggested', 'template')) DEFAULT 'user',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(model_id, rule_name)
);

-- Indexes
CREATE INDEX idx_rules_model_active ON public.model_rules(model_id, is_active);
CREATE INDEX idx_rules_category ON public.model_rules(model_id, rule_category);
CREATE INDEX idx_rules_priority ON public.model_rules(model_id, priority DESC);

-- Comments
COMMENT ON TABLE public.model_rules IS 'Structured, programmatically enforceable trading rules per model';
COMMENT ON COLUMN public.model_rules.enforcement_params IS 'JSONB with concrete parameters for code enforcement (not advisory)';
COMMENT ON COLUMN public.model_rules.applies_to_assets IS 'Asset classes this rule applies to (equity, option, crypto, future)';
COMMENT ON COLUMN public.model_rules.created_by IS 'Source: user=manually created, ai_suggested=from system agent, template=from strategy template';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.model_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own model rules" ON public.model_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.models
      WHERE models.id = model_rules.model_id
      AND models.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own model rules" ON public.model_rules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.models
      WHERE models.id = model_rules.model_id
      AND models.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own model rules" ON public.model_rules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.models
      WHERE models.id = model_rules.model_id
      AND models.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own model rules" ON public.model_rules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.models
      WHERE models.id = model_rules.model_id
      AND models.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all rules" ON public.model_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- EXAMPLE RULES (Commented - for reference)
-- ============================================================================

-- Example 1: Position size limit (prevents over-concentration)
-- INSERT INTO model_rules (model_id, rule_name, rule_description, rule_category, enforcement_params, priority) VALUES
-- (169, 'Max 20% Per Position', 'No single position can exceed 20% of total portfolio value', 'position_sizing',
--  '{"max_position_pct": 0.20, "enforcement": "reject_trade"}'::jsonb, 9);

-- Example 2: Max open positions
-- INSERT INTO model_rules (model_id, rule_name, rule_description, rule_category, enforcement_params, priority) VALUES
-- (169, 'Max 3 Positions', 'Never hold more than 3 stocks simultaneously', 'risk',
--  '{"max_positions": 3, "enforcement": "reject_trade"}'::jsonb, 8);

-- Example 3: Cash reserve requirement
-- INSERT INTO model_rules (model_id, rule_name, rule_description, rule_category, enforcement_params, priority) VALUES
-- (169, 'Keep 20% Cash Reserve', 'Always maintain at least 20% cash (never go all-in)', 'risk',
--  '{"min_cash_reserve_pct": 0.20, "enforcement": "reject_trade"}'::jsonb, 9);

-- Example 4: Trading hours blackout
-- INSERT INTO model_rules (model_id, rule_name, rule_description, rule_category, enforcement_params, priority) VALUES
-- (169, 'Avoid Opening Volatility', 'No trading in first 5 minutes (9:30-9:35 AM)', 'timing',
--  '{"blackout_start": "09:30", "blackout_end": "09:35", "enforcement": "skip_minute"}'::jsonb, 7);

-- Example 5: Daily loss circuit breaker
-- INSERT INTO model_rules (model_id, rule_name, rule_description, rule_category, enforcement_params, priority) VALUES
-- (169, 'Daily Loss Limit', 'Stop trading if down 3% in a day', 'emergency',
--  '{"max_daily_loss_pct": 0.03, "enforcement": "stop_trading"}'::jsonb, 10);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- After running migration, verify:

-- 1. Tables exist:
-- SELECT table_name, table_type FROM information_schema.tables 
-- WHERE table_name IN ('trading_runs', 'ai_reasoning', 'model_rules');

-- 2. RLS enabled:
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE tablename IN ('trading_runs', 'ai_reasoning', 'model_rules');

-- 3. Policies created:
-- SELECT tablename, policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE tablename IN ('trading_runs', 'ai_reasoning', 'model_rules');

-- ============================================================================
-- END MIGRATION 013
-- ============================================================================

