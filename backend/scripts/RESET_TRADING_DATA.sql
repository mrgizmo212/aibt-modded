-- Reset Trading Data to Zero (Keep Users)
-- This lets you start fresh and build from scratch
-- Run in Supabase SQL Editor

-- ============================================================================
-- WHAT THIS DOES:
-- ✅ Keeps: Users (profiles table) - adam, samerawada92, mperinotti
-- ✅ Keeps: Stock prices (reference data)
-- ❌ Deletes: All models, positions, logs, performance metrics
-- ============================================================================

-- View what will be deleted (BEFORE deletion)
SELECT 
    'Models' as table_name, 
    COUNT(*) as count 
FROM models
UNION ALL
SELECT 'Positions', COUNT(*) FROM positions
UNION ALL
SELECT 'Logs', COUNT(*) FROM logs
UNION ALL
SELECT 'Performance Metrics', COUNT(*) FROM performance_metrics;

-- Expected to show:
-- Models: 7
-- Positions: 306
-- Logs: 359
-- Performance Metrics: 0-1

-- ============================================================================
-- DELETE TRADING DATA (Correct Order - Child tables first!)
-- ============================================================================

-- Step 1: Delete performance metrics (no foreign keys)
DELETE FROM performance_metrics;

-- Step 2: Delete logs (references models)
DELETE FROM logs;

-- Step 3: Delete positions (references models)
DELETE FROM positions;

-- Step 4: Delete models (now safe, no references)
DELETE FROM models;

-- ============================================================================
-- VERIFY CLEAN STATE
-- ============================================================================

-- Check everything is empty
SELECT 
    'Users' as table_name, 
    COUNT(*) as count 
FROM profiles
UNION ALL
SELECT 'Models', COUNT(*) FROM models
UNION ALL
SELECT 'Positions', COUNT(*) FROM positions
UNION ALL
SELECT 'Logs', COUNT(*) FROM logs
UNION ALL
SELECT 'Stock Prices', COUNT(*) FROM stock_prices;

-- Expected result:
-- Users: 3 ✅ (KEPT!)
-- Models: 0 ✅
-- Positions: 0 ✅
-- Logs: 0 ✅  
-- Stock Prices: 10100+ ✅ (KEPT!)

-- ============================================================================
-- NOW YOUR DASHBOARD WILL SHOW:
-- ============================================================================
-- Total Models: 0
-- Running: 0
-- Total Capital: $0
-- Active: 0
--
-- "No models yet" empty state
-- "Create Your First Model" button
--
-- You can now:
-- 1. Create your first model via API or UI
-- 2. Start trading from scratch
-- 3. Watch it populate from zero!
-- ============================================================================

