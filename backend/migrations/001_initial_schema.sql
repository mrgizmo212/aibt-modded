-- AI-Trader Database Schema
-- Created: 2025-10-29
-- Description: Initial schema for AI trading platform with auth and RLS

-- ============================================================================
-- PROFILES TABLE (Extends Supabase Auth)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    'user',  -- Default role
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- AI MODELS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.models (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  signature TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, signature)
);

-- Add RLS
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

-- Users can view own models
CREATE POLICY "Users can view own models" ON public.models
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own models
CREATE POLICY "Users can insert own models" ON public.models
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own models
CREATE POLICY "Users can update own models" ON public.models
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete own models
CREATE POLICY "Users can delete own models" ON public.models
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all models
CREATE POLICY "Admins can view all models" ON public.models
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- POSITIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.positions (
  id BIGSERIAL PRIMARY KEY,
  model_id INT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  action_id INT NOT NULL,
  action_type TEXT CHECK (action_type IN ('buy', 'sell', 'no_trade')),
  symbol TEXT,
  amount INT,
  positions JSONB NOT NULL,
  cash DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(model_id, date, action_id)
);

-- Indexes for performance
CREATE INDEX idx_positions_model_date ON public.positions(model_id, date DESC);
CREATE INDEX idx_positions_date ON public.positions(date DESC);

-- Add RLS
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Users can view positions for their own models
CREATE POLICY "Users can view own positions" ON public.positions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.models
      WHERE models.id = positions.model_id
      AND models.user_id = auth.uid()
    )
  );

-- Admins can view all positions
CREATE POLICY "Admins can view all positions" ON public.positions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.logs (
  id BIGSERIAL PRIMARY KEY,
  model_id INT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  signature TEXT NOT NULL,
  messages JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_logs_model_date ON public.logs(model_id, date DESC);
CREATE INDEX idx_logs_timestamp ON public.logs(timestamp DESC);

-- Add RLS
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Users can view logs for their own models
CREATE POLICY "Users can view own logs" ON public.logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.models
      WHERE models.id = logs.model_id
      AND models.user_id = auth.uid()
    )
  );

-- Admins can view all logs
CREATE POLICY "Admins can view all logs" ON public.logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- STOCK PRICES TABLE (Public data - no RLS needed)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_prices (
  id SERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  open DECIMAL(10,4),
  high DECIMAL(10,4),
  low DECIMAL(10,4),
  close DECIMAL(10,4),
  volume BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(symbol, date)
);

-- Indexes for performance
CREATE INDEX idx_stock_prices_symbol_date ON public.stock_prices(symbol, date DESC);
CREATE INDEX idx_stock_prices_date ON public.stock_prices(date DESC);

-- Stock prices are public (everyone can read, only admins can write)
ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stock prices" ON public.stock_prices
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert stock prices" ON public.stock_prices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- PERFORMANCE METRICS TABLE (Cached calculations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id SERIAL PRIMARY KEY,
  model_id INT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_trading_days INT NOT NULL,
  cumulative_return DECIMAL(10,6),
  annualized_return DECIMAL(10,6),
  sharpe_ratio DECIMAL(10,6),
  max_drawdown DECIMAL(10,6),
  max_drawdown_start DATE,
  max_drawdown_end DATE,
  volatility DECIMAL(10,6),
  win_rate DECIMAL(10,6),
  profit_loss_ratio DECIMAL(10,6),
  initial_value DECIMAL(12,2),
  final_value DECIMAL(12,2),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(model_id, start_date, end_date)
);

-- Indexes
CREATE INDEX idx_metrics_model ON public.performance_metrics(model_id);

-- Add RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Users can view metrics for their own models
CREATE POLICY "Users can view own metrics" ON public.performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.models
      WHERE models.id = performance_metrics.model_id
      AND models.user_id = auth.uid()
    )
  );

-- Admins can view all metrics
CREATE POLICY "Admins can view all metrics" ON public.performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for models
CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON public.models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase Auth';
COMMENT ON TABLE public.models IS 'AI trading models owned by users';
COMMENT ON TABLE public.positions IS 'Trading position history (private per user)';
COMMENT ON TABLE public.logs IS 'AI trading decision logs (private per user)';
COMMENT ON TABLE public.stock_prices IS 'NASDAQ 100 stock price data (public)';
COMMENT ON TABLE public.performance_metrics IS 'Cached performance calculations';

COMMENT ON COLUMN public.profiles.role IS 'user or admin - determines access level';
COMMENT ON COLUMN public.models.signature IS 'Unique identifier for the AI model (e.g., openai-gpt-5)';
COMMENT ON COLUMN public.positions.positions IS 'JSONB containing all stock holdings and cash';
COMMENT ON COLUMN public.logs.messages IS 'JSONB containing AI reasoning messages';

-- ============================================================================
-- END OF INITIAL SCHEMA
-- ============================================================================

