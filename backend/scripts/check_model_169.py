#!/usr/bin/env python3
"""
Check Model #169 - What's Actually in the Database

Shows:
1. Model configuration
2. All positions recorded
3. All trades executed
4. Current portfolio state
"""

import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from supabase import create_client

# Get Supabase credentials
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(url, key)

print("=" * 80)
print("🔍 MODEL #169 DATABASE INSPECTION")
print("=" * 80)
print()

# Get model info
model = supabase.table("models").select("*").eq("id", 169).execute()

if not model.data:
    print("❌ Model #169 not found")
    sys.exit(1)

model_data = model.data[0]

print("📋 MODEL CONFIGURATION:")
print(f"   Name: {model_data['name']}")
print(f"   AI Model: {model_data.get('default_ai_model')}")
print(f"   Initial Cash: ${model_data.get('initial_cash', 0):,.2f}")
print(f"   Created: {model_data.get('created_at')}")
print(f"   Parameters: {model_data.get('model_parameters')}")
print()

# Get all positions
positions = supabase.table("positions").select("*").eq("model_id", 169).order("date", desc=False).execute()

print("=" * 80)
print(f"📊 POSITIONS RECORDED: {len(positions.data)} entries")
print("=" * 80)
print()

if positions.data:
    for idx, pos in enumerate(positions.data, 1):
        date = pos.get('date')
        action_id = pos.get('action_id')
        action_type = pos.get('action_type')
        symbol = pos.get('symbol')
        amount = pos.get('amount')
        cash = pos.get('cash', 0)
        portfolio = pos.get('positions', {})
        minute_time = pos.get('minute_time')  # For intraday
        
        print(f"#{idx} - {date} {minute_time or 'EOD'}")
        
        if action_type:
            print(f"   Action: {action_type.upper()} {amount} {symbol}")
        
        print(f"   Cash: ${cash:,.2f}")
        
        # Show holdings
        holdings = {k: v for k, v in portfolio.items() if k != 'CASH' and v > 0}
        if holdings:
            print(f"   Holdings: {holdings}")
        else:
            print(f"   Holdings: None")
        
        print()

else:
    print("⚠️  No positions recorded yet")

# Get all logs
logs = supabase.table("logs").select("*").eq("model_id", 169).order("timestamp", desc=False).execute()

print("=" * 80)
print(f"🤖 AI LOGS: {len(logs.data)} entries")
print("=" * 80)
print()

if logs.data:
    for idx, log in enumerate(logs.data[:5], 1):  # Show first 5
        timestamp = log.get('timestamp')
        log_type = log.get('log_type')
        content = log.get('content', '')
        
        print(f"#{idx} - {timestamp} [{log_type}]")
        print(f"   {content[:100]}...")
        print()
    
    if len(logs.data) > 5:
        print(f"   ... and {len(logs.data) - 5} more logs")
else:
    print("⚠️  No logs recorded yet")

print()

# Calculate current state
print("=" * 80)
print("💰 CURRENT STATE CALCULATION")
print("=" * 80)
print()

if positions.data:
    latest = positions.data[-1]
    latest_portfolio = latest.get('positions', {})
    latest_cash = latest.get('cash', 0)
    
    print(f"Cash: ${latest_cash:,.2f}")
    print(f"Holdings:")
    for symbol, amount in latest_portfolio.items():
        if symbol != 'CASH' and amount > 0:
            print(f"   {symbol}: {amount} shares")
    
    print()
    print(f"Total Spent: ${10000 - latest_cash:,.2f}")
    print()
    
    # Verify it matches what UI shows
    if latest_cash == 3623.46:
        print("✅ MATCHES UI: $3,623.46")
    else:
        print(f"⚠️  MISMATCH: DB shows ${latest_cash:,.2f}, UI shows $3,623.46")

print()
print("=" * 80)

