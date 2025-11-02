"""
LIVE TEST: Both Endpoints Actually Execute

Tests BOTH daily and intraday endpoints to prove:
1. Daily endpoint works immediately
2. Intraday endpoint has data issues
3. Mode selector gives user the working option
"""

import os
import sys
import asyncio
import httpx
from pathlib import Path
from datetime import datetime, timedelta

backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from dotenv import load_dotenv
load_dotenv(backend_path / ".env")

print("=" * 80)
print("LIVE TEST: Daily vs Intraday Endpoints")
print("=" * 80)
print()

# Login to get token
print("Logging in to get auth token...")
print()

async def login():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8080/api/auth/login",
            headers={"Content-Type": "application/json"},
            json={
                "email": "adam@truetradinggroup.com",
                "password": "adminpass123"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Logged in as: {data['user']['email']}")
            return data['access_token']
        else:
            print(f"❌ Login failed: {response.status_code}")
            return None

token = asyncio.run(login())

if not token:
    print("\n❌ Could not get auth token")
    print("   Make sure backend is running!")
    sys.exit(1)

print(f"✅ Got auth token")
print()

MODEL_ID = 169

# Helper function
def get_recent_trading_date(days_back: int) -> str:
    """Calculate recent trading date skipping weekends"""
    date = datetime.now()
    trading_days = 0
    
    while trading_days < days_back:
        date = date - timedelta(days=1)
        if date.weekday() < 5:  # Mon-Fri
            trading_days += 1
    
    return date.strftime('%Y-%m-%d')

# ============================================================================
# TEST 1: DAILY ENDPOINT
# ============================================================================

async def test_daily_endpoint():
    print("=" * 80)
    print("TEST 1: Daily Endpoint")
    print("=" * 80)
    print()
    
    start_date = get_recent_trading_date(3)
    end_date = get_recent_trading_date(1)
    
    print(f"Calling: POST /api/trading/start/{MODEL_ID}")
    print(f"Body:")
    print(f"  base_model: 'openai/gpt-4.1-mini'")
    print(f"  start_date: '{start_date}'")
    print(f"  end_date: '{end_date}'")
    print()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"http://localhost:8080/api/trading/start/{MODEL_ID}",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                json={
                    "base_model": "openai/gpt-4.1-mini",
                    "start_date": start_date,
                    "end_date": end_date
                },
                timeout=10.0
            )
            
            print(f"Response: {response.status_code}")
            
            if response.status_code == 200:
                print(f"✅ SUCCESS!")
                result = response.json()
                print(f"   Status: {result.get('status')}")
                print(f"   Daily endpoint works!")
                print()
                print(f"Now check backend terminal for:")
                print(f"  'Running date range: {start_date} to {end_date}'")
                return True
            else:
                print(f"❌ FAILED: {response.status_code}")
                print(f"   {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

# ============================================================================
# TEST 2: INTRADAY ENDPOINT
# ============================================================================

async def test_intraday_endpoint():
    print("\n" + "=" * 80)
    print("TEST 2: Intraday Endpoint")
    print("=" * 80)
    print()
    
    intraday_date = get_recent_trading_date(1)
    
    print(f"Calling: POST /api/trading/start-intraday/{MODEL_ID}")
    print(f"Body:")
    print(f"  base_model: 'openai/gpt-4.1-mini'")
    print(f"  symbol: 'AAPL'")
    print(f"  date: '{intraday_date}'")
    print(f"  session: 'regular'")
    print()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"http://localhost:8080/api/trading/start-intraday/{MODEL_ID}",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                json={
                    "base_model": "openai/gpt-4.1-mini",
                    "symbol": "AAPL",
                    "date": intraday_date,
                    "session": "regular"
                },
                timeout=120.0  # Longer timeout for data loading
            )
            
            print(f"Response: {response.status_code}")
            
            if response.status_code == 200:
                print(f"✅ SUCCESS!")
                result = response.json()
                print(f"   Status: {result.get('status')}")
                print(f"   Minutes processed: {result.get('minutes_processed')}")
                print(f"   Trades executed: {result.get('trades_executed')}")
                print(f"   Intraday endpoint works!")
                print()
                print(f"Check backend terminal for:")
                print(f"  'INTRADAY TRADING SESSION'")
                print(f"  'Fetching AAPL trades for {intraday_date}'")
                return True
            else:
                print(f"❌ FAILED: {response.status_code}")
                print(f"   {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

# ============================================================================
# RUN TESTS
# ============================================================================

async def run_all_tests():
    daily_works = await test_daily_endpoint()
    
    print("\n" + "-" * 80)
    print("Waiting 5 seconds before testing intraday...")
    print("-" * 80)
    await asyncio.sleep(5)
    
    intraday_works = await test_intraday_endpoint()
    
    # ============================================================================
    # VERDICT
    # ============================================================================
    
    print("\n" + "=" * 80)
    print("FINAL VERDICT")
    print("=" * 80)
    print()
    
    print(f"Daily Endpoint: {'✅ WORKS' if daily_works else '❌ FAILED'}")
    print(f"Intraday Endpoint: {'✅ WORKS' if intraday_works else '❌ FAILED'}")
    print()
    
    if daily_works and intraday_works:
        print("✅ BOTH MODES WORK!")
        print("   Adding mode selector gives users both options")
    elif daily_works and not intraday_works:
        print("✅ DAILY WORKS, INTRADAY HAS ISSUES")
        print("   Mode selector gives users the working Daily option")
        print("   This is WHY the mode selector is the fix!")
    elif not daily_works and intraday_works:
        print("⚠️  INTRADAY WORKS, DAILY HAS ISSUES")
        print("   Unexpected - daily should be simpler")
    else:
        print("❌ BOTH FAILED")
        print("   Check backend is running and token is valid")
    
    print()
    print("=" * 80)

# Execute
asyncio.run(run_all_tests())

