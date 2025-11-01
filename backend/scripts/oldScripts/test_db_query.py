#!/usr/bin/env python3
"""
Simple test: Can we query positions for model #169?
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from supabase import create_client

# Get credentials
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

print(f"🔌 Connecting to Supabase...")
print(f"   URL: {url}")
print(f"   Key: {'*' * 20}{key[-4:] if key else 'MISSING'}")
print()

try:
    supabase = create_client(url, key)
    print("✅ Client created")
    print()
    
    # Test 1: Can we query at all?
    print("Test 1: Simple count query")
    result = supabase.table("positions").select("*", count="exact").eq("model_id", 169).execute()
    print(f"   Count: {result.count}")
    print(f"   Data rows: {len(result.data) if result.data else 0}")
    print()
    
    # Test 2: Get just dates
    print("Test 2: Get dates only")
    result = supabase.table("positions").select("date").eq("model_id", 169).limit(5).execute()
    print(f"   Rows returned: {len(result.data) if result.data else 0}")
    if result.data:
        print(f"   Sample dates: {[r['date'] for r in result.data[:5]]}")
        print(f"   Date type: {type(result.data[0]['date'])}")
    print()
    
    # Test 3: Get ordered by date
    print("Test 3: Get earliest date")
    result = supabase.table("positions").select("date").eq("model_id", 169).order("date", desc=False).limit(1).execute()
    print(f"   Rows returned: {len(result.data) if result.data else 0}")
    if result.data:
        print(f"   Earliest date: {result.data[0]['date']}")
        print(f"   Type: {type(result.data[0]['date'])}")
    else:
        print("   ❌ No data returned!")
    print()
    
    # Test 4: Get all positions
    print("Test 4: Get all 30 positions")
    result = supabase.table("positions").select("date, minute_time, cash, positions").eq("model_id", 169).execute()
    print(f"   Rows returned: {len(result.data) if result.data else 0}")
    if result.data:
        print(f"   First record: {result.data[0]}")
        print(f"   Last record: {result.data[-1]}")
    print()
    
    print("=" * 80)
    print("✅ All tests complete!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

