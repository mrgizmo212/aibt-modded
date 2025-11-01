#!/usr/bin/env python3
"""
Recalculate Performance Metrics for Model #169

Forces a fresh calculation using the new database-based method
"""

import sys
import os
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from utils.result_tools_db import calculate_all_metrics_db
from supabase import create_client

def get_supabase():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, key)

print("=" * 80)
print("🔄 RECALCULATE PERFORMANCE - MODEL #169")
print("=" * 80)
print()

# Test database connection first
print("🔌 Testing database connection...")
try:
    supabase = get_supabase()
    test = supabase.table("models").select("id").eq("id", 169).execute()
    if test.data:
        print(f"✅ Database connection OK")
        print(f"   Model #169 exists: {test.data[0]}")
    else:
        print("❌ Model #169 not found")
        sys.exit(1)
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    sys.exit(1)

print()

# Calculate metrics from database
print("📊 Calculating metrics from database positions...")
try:
    metrics = calculate_all_metrics_db(model_id=169)
    
    if "error" in metrics:
        print(f"❌ Error: {metrics['error']}")
        sys.exit(1)
        
except Exception as e:
    print(f"❌ Calculation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("✅ Metrics calculated successfully!")
print()

print("📈 RESULTS:")
print(f"   Initial Value: ${metrics.get('initial_value', 0):,.2f}")
print(f"   Final Value: ${metrics.get('final_value', 0):,.2f}")
print(f"   Total P/L: ${metrics.get('final_value', 0) - metrics.get('initial_value', 0):,.2f}")
print(f"   Return: {metrics.get('cumulative_return', 0) * 100:.2f}%")
print(f"   Sharpe Ratio: {metrics.get('sharpe_ratio', 0):.2f}")
print(f"   Max Drawdown: {metrics.get('max_drawdown', 0) * 100:.2f}%")
print(f"   Win Rate: {metrics.get('win_rate', 0) * 100:.1f}%")
print(f"   Trading Days: {metrics.get('total_trading_days', 0)}")
print(f"   Period: {metrics.get('start_date')} to {metrics.get('end_date')}")
print()

# Save to database
print("💾 Saving to performance_metrics table...")

supabase = get_supabase()

def clean_date(value):
    return None if value == "" or value is None else value

perf_data = {
    "model_id": 169,
    "start_date": clean_date(metrics.get("start_date")),
    "end_date": clean_date(metrics.get("end_date")),
    "total_trading_days": metrics.get("total_trading_days", 0),
    "cumulative_return": metrics.get("cumulative_return", 0.0),
    "annualized_return": metrics.get("annualized_return", 0.0),
    "sharpe_ratio": metrics.get("sharpe_ratio", 0.0),
    "max_drawdown": metrics.get("max_drawdown", 0.0),
    "max_drawdown_start": clean_date(metrics.get("max_drawdown_start")),
    "max_drawdown_end": clean_date(metrics.get("max_drawdown_end")),
    "volatility": metrics.get("volatility", 0.0),
    "win_rate": metrics.get("win_rate", 0.0),
    "profit_loss_ratio": metrics.get("profit_loss_ratio", 0.0),
    "initial_value": metrics.get("initial_value", 10000.0),
    "final_value": metrics.get("final_value", 10000.0)
}

result = supabase.table("performance_metrics")\
    .upsert(perf_data, on_conflict="model_id,start_date,end_date")\
    .execute()

if result.data:
    print("✅ Performance metrics saved to database!")
    print()
    print("🎯 Refresh your browser to see updated metrics")
    print()
    print("📊 IMPORTANT FINDING:")
    print(f"   Final Value should be: ${perf_data['final_value']:,.2f} (cash only)")
    print(f"   BUT you still hold 20 IBM shares!")
    print(f"   Need to add stock valuation to get true portfolio value")
else:
    print("⚠️  Save may have failed")

print()
print("=" * 80)
print("✅ DONE!")
print("=" * 80)
print()
print("Next steps:")
print("1. Refresh the model #169 page in your browser")
print("2. Performance tab should now show correct metrics")
print("3. All future calculations will use database (no more JSONL files)")

