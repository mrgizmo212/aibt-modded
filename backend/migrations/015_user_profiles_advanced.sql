-- ============================================================================
-- MIGRATION 015: User Trading Profiles & Advanced Trading Support
-- ============================================================================
-- Purpose: Add comprehensive risk parameters and multi-asset trading
-- Date: 2025-10-31
-- Pattern: From ttgaibots UserProfile
-- ============================================================================

-- USER TRADING PROFILES
-- Global risk parameters at user level (applied across all models)
CREATE TABLE IF NOT EXISTS public.user_trading_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Trading style classification
  trading_experience TEXT CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'intermediate',
  risk_tolerance TEXT CHECK (risk_tolerance IN ('very_conservative', 'conservative', 'moderate', 'aggressive', 'very_aggressive')) DEFAULT 'moderate',
  trading_style TEXT CHECK (trading_style IN ('day_trading', 'swing_trading', 'position_trading', 'long_term', 'mixed')) DEFAULT 'mixed',
  
  -- Risk parameters (user-level defaults)
  max_position_size_percent DECIMAL(5,2) DEFAULT 20.0,
  max_open_positions INT DEFAULT 5,
  max_loss_per_day DECIMAL(10,2),
  max_loss_per_week DECIMAL(10,2),
  stop_trading_if_daily_loss_exceeds DECIMAL(10,2),
  min_cash_reserve_percent DECIMAL(5,2) DEFAULT 20.0,
  
  -- Trading hours
  trading_hours_start TIME DEFAULT '09:30:00',
  trading_hours_end TIME DEFAULT '16:00:00',
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Asset preferences
  use_options BOOLEAN DEFAULT false,
  use_short_selling BOOLEAN DEFAULT false,
  preferred_sectors TEXT[],
  avoided_sectors TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_user_profile ON public.user_trading_profiles(user_id);

COMMENT ON TABLE public.user_trading_profiles IS 'User-level trading preferences and risk parameters (defaults for all models)';
COMMENT ON COLUMN public.user_trading_profiles.max_position_size_percent IS 'Default max % of portfolio per position (can be overridden per model)';
COMMENT ON COLUMN public.user_trading_profiles.stop_trading_if_daily_loss_exceeds IS 'Circuit breaker: Stop all trading if daily loss exceeds this amount';

-- ============================================================================
-- EXPAND POSITIONS TABLE FOR ADVANCED TRADING
-- ============================================================================

-- Expand action_type for short selling (beyond buy/sell)
ALTER TABLE public.positions DROP CONSTRAINT IF EXISTS positions_action_type_check;
ALTER TABLE public.positions ADD CONSTRAINT positions_action_type_check 
  CHECK (action_type IN ('buy', 'sell', 'short', 'cover', 'no_trade'));

-- Add position type classification
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS position_type TEXT
  CHECK (position_type IN ('stock_long', 'stock_short', 'option_call', 'option_put', 'future', 'crypto'));

-- Add option-specific details
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS option_details JSONB;
-- Example: {"underlying": "AAPL", "expiration": "2025-12-19", "strike": 150.00, "option_type": "call", "contracts": 2, "position_intent": "buy_to_open"}

-- Add order tracking
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS order_status TEXT
  CHECK (order_status IN ('submitted', 'filled', 'partial', 'failed', 'cancelled'));

-- Indexes for advanced trading
CREATE INDEX IF NOT EXISTS idx_positions_type ON public.positions(model_id, position_type) WHERE position_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_positions_order ON public.positions(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_positions_status ON public.positions(order_status) WHERE order_status IS NOT NULL;

-- Comments
COMMENT ON COLUMN public.positions.position_type IS 'Asset class and direction (stock_long, stock_short, option_call, option_put, future, crypto)';
COMMENT ON COLUMN public.positions.option_details IS 'Option-specific data: underlying, expiration, strike, greeks, position_intent';
COMMENT ON COLUMN public.positions.order_id IS 'Broker order ID for tracking (from Alpaca, SnapTrade, etc.)';
COMMENT ON COLUMN public.positions.order_status IS 'Order lifecycle status from broker';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.user_trading_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.user_trading_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_trading_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_trading_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.user_trading_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- After running, verify:
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'user_trading_profiles';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'positions' AND column_name IN ('position_type', 'option_details', 'order_id', 'order_status');
-- SELECT conname FROM pg_constraint WHERE conname LIKE '%action_type%';

-- ============================================================================
-- END MIGRATION 015
-- ============================================================================

