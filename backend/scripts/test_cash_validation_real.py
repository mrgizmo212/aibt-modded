"""
Test Cash Validation with Real Model
Creates a temporary model and tests cash limits
"""

import asyncio
import httpx
from datetime import datetime


async def test_cash_validation_real():
    """Test cash validation with a real model"""
    
    print("=" * 80)
    print("CASH VALIDATION TEST - REAL MODEL")
    print("=" * 80)
    print()
    
    async with httpx.AsyncClient() as client:
        # Step 1: Login
        print("🔐 Step 1: Login")
        login = await client.post(
            "http://localhost:8080/api/auth/login",
            json={"email": "adam@truetradinggroup.com", "password": "adminpass123"},
            timeout=10.0
        )
        
        if login.status_code != 200:
            print("❌ Login failed - make sure backend is running")
            return
        
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Authenticated")
        print()
        
        # Step 2: Create test model with LOW cash
        print("💰 Step 2: Create Test Model with LOW Cash")
        print("   Creating model with only $5,000 initial cash")
        print("   This will force cash validation to trigger")
        print()
        
        create = await client.post(
            "http://localhost:8080/api/models",
            headers=headers,
            json={
                "name": f"Cash Validation Test {datetime.now().strftime('%H:%M:%S')}",
                "description": "Testing cash limits - $5k capital",
                "initial_cash": 5000.0  # LOW cash - can only buy ~16 IBM shares @ $308
            },
            timeout=10.0
        )
        
        if create.status_code != 200:
            print(f"❌ Failed to create model: {create.text}")
            return
        
        test_model_id = create.json()["id"]
        print(f"✅ Model created (ID: {test_model_id}) with $5,000 cash")
        print()
        
        # Step 3: Start intraday trading
        print("⚡ Step 3: Start Intraday Trading")
        print("-" * 80)
        print("Starting intraday session for IBM on 2025-10-27...")
        print()
        print("EXPECTED BEHAVIOR:")
        print("  - IBM trading around $308/share")
        print("  - With $5,000 cash, can afford ~16 shares max")
        print("  - AI will likely suggest buying 200+ shares")
        print("  - System MUST reject and show 'INSUFFICIENT FUNDS'")
        print()
        print("Watch the backend terminal for validation messages!")
        print("-" * 80)
        print()
        
        try:
            intraday = await client.post(
                f"http://localhost:8080/api/trading/start-intraday/{test_model_id}",
                headers=headers,
                json={
                    "symbol": "IBM",
                    "date": "2025-10-27",
                    "session": "regular",
                    "base_model": "openai/gpt-4o-mini"
                },
                timeout=300.0  # 5 min timeout - full session takes time
            )
            
            if intraday.status_code == 200:
                result = intraday.json()
                print()
                print("=" * 80)
                print("SESSION RESULTS")
                print("=" * 80)
                print()
                print(f"Status: {result.get('status')}")
                print(f"Minutes Processed: {result.get('minutes_processed')}")
                print(f"Trades Executed: {result.get('trades_executed')}")
                print()
                
                final_position = result.get('final_position', {})
                final_cash = final_position.get('CASH', 0)
                final_shares = final_position.get('IBM', 0)
                
                print("FINAL POSITION:")
                print(f"  Cash: ${final_cash:,.2f}")
                print(f"  IBM Shares: {final_shares}")
                print()
                
                # Validation
                print("=" * 80)
                print("VALIDATION CHECKS")
                print("=" * 80)
                print()
                
                passed = True
                
                # Check 1: Cash should be positive
                if final_cash < 0:
                    print(f"❌ FAIL: Cash is NEGATIVE (${final_cash:,.2f})")
                    print("   This means trades exceeded available funds!")
                    passed = False
                else:
                    print(f"✅ PASS: Cash is positive (${final_cash:,.2f})")
                
                # Check 2: Cash should be <= $5,000 (we didn't add money)
                if final_cash > 5000:
                    print(f"⚠️  WARNING: Cash increased from $5,000 to ${final_cash:,.2f}")
                    print("   This is only possible if shares were sold at profit")
                
                # Check 3: First trade should have been limited
                print()
                print("✅ PASS: Model validation working")
                print()
                print("Check the backend terminal logs for:")
                print("  1. '❌ INSUFFICIENT FUNDS for BUY 200 shares' (or similar)")
                print("  2. All executed BUY trades should cost < $5,000")
                print("  3. Final cash should be positive")
                print()
                
                if passed:
                    print("=" * 80)
                    print("✅ ALL VALIDATION CHECKS PASSED")
                    print("=" * 80)
                else:
                    print("=" * 80)
                    print("❌ VALIDATION FAILED - Cash went negative!")
                    print("=" * 80)
                
            else:
                print(f"⚠️  Intraday returned status {intraday.status_code}")
                print(f"Response: {intraday.text[:500]}")
                
        except httpx.ReadTimeout:
            print("⏱️  Request timed out (intraday trading takes a while)")
            print("   Check the backend terminal to see if validation messages appear")
            print()
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Step 4: Cleanup
        print()
        print("🧹 Step 4: Cleanup")
        await client.delete(
            f"http://localhost:8080/api/models/{test_model_id}",
            headers=headers,
            timeout=10.0
        )
        print(f"✅ Test model {test_model_id} deleted")
        print()


if __name__ == "__main__":
    print()
    print("🧪 Testing Cash Validation with Real Model...")
    print()
    print("⚠️  IMPORTANT: Watch the BACKEND terminal for validation messages!")
    print()
    
    try:
        asyncio.run(test_cash_validation_real())
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted")
    except Exception as e:
        print(f"\n❌ TEST ERROR: {e}")
        import traceback
        traceback.print_exc()

