-- Comprehensive Fixes for All Remaining Issues
-- Run this in Supabase SQL Editor

-- ============================================================================
-- ISSUE 1: Delete Test Models
-- ============================================================================

-- View test models before deletion
SELECT id, signature, user_id, created_at 
FROM models 
WHERE id > 14
ORDER BY id;

-- Delete test models (keeps only real AI models: 8-14)
DELETE FROM models WHERE id > 14;

-- Verify only 7 real models remain
SELECT COUNT(*) as total_models FROM models;
-- Should return: 7

-- ============================================================================
-- ISSUE 3: Add original_ai Field (+ Fix missing updated_at)
-- ============================================================================

-- First, add updated_at column (if missing - trigger needs it!)
ALTER TABLE models ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Now add original_ai column
ALTER TABLE models ADD COLUMN IF NOT EXISTS original_ai TEXT;

-- Populate with signature for existing models
UPDATE models 
SET original_ai = signature 
WHERE original_ai IS NULL;

-- Verify
SELECT id, signature, original_ai, updated_at FROM models ORDER BY id;

-- ============================================================================
-- ISSUE 5: Clear Stale Performance Metrics
-- ============================================================================

-- View current metrics
SELECT model_id, cumulative_return, calculated_at 
FROM performance_metrics;

-- Delete stale metrics (will be recalculated with correct values)
DELETE FROM performance_metrics;

-- Verify cleared
SELECT COUNT(*) FROM performance_metrics;
-- Should return: 0

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check final state
SELECT 
    (SELECT COUNT(*) FROM models) as total_models,
    (SELECT COUNT(*) FROM models WHERE id > 14) as test_models,
    (SELECT COUNT(*) FROM performance_metrics) as cached_metrics;
    
-- Should show:
-- total_models: 7
-- test_models: 0
-- cached_metrics: 0

-- ============================================================================
-- END OF FIXES
-- ============================================================================

