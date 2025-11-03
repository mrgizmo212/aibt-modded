-- Migration: Add task_id to trading_runs for Celery task tracking
-- Date: 2025-11-03
-- Purpose: Enable stop functionality by storing Celery task ID

-- Add task_id column to trading_runs table
ALTER TABLE public.trading_runs 
ADD COLUMN IF NOT EXISTS task_id TEXT;

-- Add index for faster task_id lookups
CREATE INDEX IF NOT EXISTS idx_trading_runs_task_id 
ON public.trading_runs(task_id);

-- Add index for finding active runs by model_id
CREATE INDEX IF NOT EXISTS idx_trading_runs_active 
ON public.trading_runs(model_id, status) 
WHERE status IN ('pending', 'running');

-- Add comment
COMMENT ON COLUMN public.trading_runs.task_id IS 'Celery task ID for background job tracking and cancellation';

