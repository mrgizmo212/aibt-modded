-- Migration: Add trading_style, instrument, and full trading capabilities to models table
-- These fields define the model's strategy, asset type, and what trading actions are allowed

-- Core trading configuration
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS trading_style TEXT DEFAULT 'day-trading' 
  CHECK (trading_style IN ('scalping', 'day-trading', 'swing-trading', 'investing'));

ALTER TABLE public.models ADD COLUMN IF NOT EXISTS instrument TEXT DEFAULT 'stocks'
  CHECK (instrument IN ('stocks', 'options', 'futures', 'crypto', 'forex', 'prediction'));

-- Trading capabilities (what the model is allowed to do)
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS allow_shorting BOOLEAN DEFAULT false;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS allow_options_strategies BOOLEAN DEFAULT false;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS allow_hedging BOOLEAN DEFAULT false;

-- Order types the model can use (supports multiple: market, limit, stop, stop-limit, trailing-stop, bracket)
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS allowed_order_types TEXT[] DEFAULT ARRAY['market', 'limit'];

-- Add comments for documentation
COMMENT ON COLUMN public.models.trading_style IS 'Trading time horizon: scalping (1-5min), day-trading (intraday), swing-trading (2-7 days), investing (long-term)';
COMMENT ON COLUMN public.models.instrument IS 'Asset type to trade (stocks=active, options/futures/crypto/forex/prediction=coming soon)';
COMMENT ON COLUMN public.models.allow_shorting IS 'Enable short selling? Requires margin account when live trading.';
COMMENT ON COLUMN public.models.allow_options_strategies IS 'Enable multi-leg option spreads, straddles, iron condors, etc.';
COMMENT ON COLUMN public.models.allow_hedging IS 'Enable opening hedging positions to reduce risk exposure.';
COMMENT ON COLUMN public.models.allowed_order_types IS 'Order types model can use: market, limit, stop, stop-limit, trailing-stop, bracket, oco';

-- Set safe defaults for existing models (conservative: long-only, basic orders)
UPDATE public.models SET trading_style = 'day-trading' WHERE trading_style IS NULL;
UPDATE public.models SET instrument = 'stocks' WHERE instrument IS NULL;
UPDATE public.models SET allow_shorting = false WHERE allow_shorting IS NULL;
UPDATE public.models SET allow_options_strategies = false WHERE allow_options_strategies IS NULL;
UPDATE public.models SET allow_hedging = false WHERE allow_hedging IS NULL;
UPDATE public.models SET allowed_order_types = ARRAY['market', 'limit'] WHERE allowed_order_types IS NULL;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_models_trading_style ON public.models(trading_style);
CREATE INDEX IF NOT EXISTS idx_models_instrument ON public.models(instrument);

