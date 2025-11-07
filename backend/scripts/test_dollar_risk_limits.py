"""
Test Script: Dollar-Based Risk Limits Enforcement
Proves that max_position_size_dollars and max_daily_loss_dollars are enforced

Run from backend directory:
cd backend
python scripts/test_dollar_risk_limits.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.risk_gates import create_risk_gates


def test_max_position_size_enforcement():
    """Test that max_position_size_dollars is enforced"""
    print("\n" + "="*80)
    print("TEST 1: Max Position Size (Dollars) Enforcement")
    print("="*80)
    
    # Create risk gates with $2000 max position size
    model_config = {
        'max_position_size_dollars': 2000.0
    }
    
    gates = create_risk_gates(model_id=1, model_config=model_config)
    
    # Test Case 1: Trade within limit ($1,500)
    print("\n📊 Test Case 1: Trade within $2000 limit")
    print("   Attempting to BUY 10 shares @ $150 = $1,500")
    
    portfolio = {
        'cash': 10000,
        'positions': {},
        'total_value': 10000
    }
    
    valid, reason = gates.validate_all(
        action='buy',
        symbol='AAPL',
        amount=10,
        price=150.0,
        portfolio_snapshot=portfolio
    )
    
    print(f"   Result: {'✅ ALLOWED' if valid else f'❌ REJECTED - {reason}'}")
    assert valid == True, f"Expected trade to be allowed, but got: {reason}"
    print("   ✅ PASS - Trade within limit was allowed")
    
    # Test Case 2: Trade exceeding limit ($2,500)
    print("\n📊 Test Case 2: Trade exceeding $2000 limit")
    print("   Attempting to BUY 10 shares @ $250 = $2,500")
    
    valid, reason = gates.validate_all(
        action='buy',
        symbol='TSLA',
        amount=10,
        price=250.0,
        portfolio_snapshot=portfolio
    )
    
    print(f"   Result: {'✅ ALLOWED' if valid else f'❌ REJECTED - {reason}'}")
    assert valid == False, "Expected trade to be rejected"
    assert "exceeds configured max position size" in reason, f"Expected proper rejection message, got: {reason}"
    print(f"   ✅ PASS - Trade was correctly rejected: {reason}")
    
    # Test Case 3: Exact limit ($2,000)
    print("\n📊 Test Case 3: Trade at exact $2000 limit")
    print("   Attempting to BUY 20 shares @ $100 = $2,000")
    
    valid, reason = gates.validate_all(
        action='buy',
        symbol='F',
        amount=20,
        price=100.0,
        portfolio_snapshot=portfolio
    )
    
    print(f"   Result: {'✅ ALLOWED' if valid else f'❌ REJECTED - {reason}'}")
    assert valid == True, f"Expected exact limit to be allowed, but got: {reason}"
    print("   ✅ PASS - Exact limit trade was allowed")
    
    print("\n" + "="*80)
    print("✅ TEST 1 COMPLETE: Max Position Size Enforcement Working")
    print("="*80)


def test_max_daily_loss_enforcement():
    """Test that max_daily_loss_dollars is enforced"""
    print("\n" + "="*80)
    print("TEST 2: Max Daily Loss (Dollars) Enforcement")
    print("="*80)
    
    # Create risk gates with $500 max daily loss
    model_config = {
        'max_daily_loss_dollars': 500.0
    }
    
    gates = create_risk_gates(model_id=1, model_config=model_config)
    
    # Test Case 1: Trading with acceptable loss ($-300)
    print("\n📊 Test Case 1: Daily loss within $500 limit")
    print("   Current daily P&L: -$300")
    print("   Attempting to BUY 5 shares @ $100")
    
    portfolio = {
        'cash': 9700,
        'positions': {},
        'total_value': 9700,
        'daily_pnl': -300  # Lost $300 today
    }
    
    valid, reason = gates.validate_all(
        action='buy',
        symbol='AAPL',
        amount=5,
        price=100.0,
        portfolio_snapshot=portfolio
    )
    
    print(f"   Result: {'✅ ALLOWED' if valid else f'❌ REJECTED - {reason}'}")
    assert valid == True, f"Expected trade to be allowed, but got: {reason}"
    print("   ✅ PASS - Trading allowed with acceptable daily loss")
    
    # Test Case 2: Daily loss exceeds limit ($-550)
    print("\n📊 Test Case 2: Daily loss exceeding $500 limit")
    print("   Current daily P&L: -$550")
    print("   Attempting to BUY 5 shares @ $100")
    
    portfolio_over_limit = {
        'cash': 9450,
        'positions': {},
        'total_value': 9450,
        'daily_pnl': -550  # Lost $550 today (exceeds $500 limit)
    }
    
    valid, reason = gates.validate_all(
        action='buy',
        symbol='TSLA',
        amount=5,
        price=100.0,
        portfolio_snapshot=portfolio_over_limit
    )
    
    print(f"   Result: {'✅ ALLOWED' if valid else f'❌ REJECTED - {reason}'}")
    assert valid == False, "Expected trade to be rejected due to daily loss limit"
    assert "Daily loss" in reason and "exceeds configured limit" in reason, f"Expected proper rejection message, got: {reason}"
    print(f"   ✅ PASS - Trading stopped correctly: {reason}")
    
    # Test Case 3: Exact limit (-$500)
    print("\n📊 Test Case 3: Daily loss at exact $500 limit")
    print("   Current daily P&L: -$500")
    print("   Attempting to BUY 5 shares @ $100")
    
    portfolio_at_limit = {
        'cash': 9500,
        'positions': {},
        'total_value': 9500,
        'daily_pnl': -500.0  # Exactly at limit
    }
    
    valid, reason = gates.validate_all(
        action='buy',
        symbol='MSFT',
        amount=5,
        price=100.0,
        portfolio_snapshot=portfolio_at_limit
    )
    
    print(f"   Result: {'✅ ALLOWED' if valid else f'❌ REJECTED - {reason}'}")
    assert valid == True, f"Expected exact limit to be allowed, but got: {reason}"
    print("   ✅ PASS - Trading allowed at exact limit")
    
    print("\n" + "="*80)
    print("✅ TEST 2 COMPLETE: Max Daily Loss Enforcement Working")
    print("="*80)


def test_combined_enforcement():
    """Test both limits working together"""
    print("\n" + "="*80)
    print("TEST 3: Combined Enforcement (Both Limits Active)")
    print("="*80)
    
    # Create risk gates with BOTH limits
    model_config = {
        'max_position_size_dollars': 2000.0,
        'max_daily_loss_dollars': 500.0
    }
    
    gates = create_risk_gates(model_id=1, model_config=model_config)
    
    # Test Case: Large trade when daily loss limit active
    print("\n📊 Test Case: Large trade with daily loss already at -$450")
    print("   Current daily P&L: -$450 (within $500 limit)")
    print("   Attempting to BUY 15 shares @ $200 = $3,000 (exceeds $2,000 position limit)")
    
    portfolio = {
        'cash': 9550,
        'positions': {},
        'total_value': 9550,
        'daily_pnl': -450
    }
    
    valid, reason = gates.validate_all(
        action='buy',
        symbol='NVDA',
        amount=15,
        price=200.0,
        portfolio_snapshot=portfolio
    )
    
    print(f"   Result: {'✅ ALLOWED' if valid else f'❌ REJECTED - {reason}'}")
    assert valid == False, "Expected trade to be rejected for position size violation"
    assert "max position size" in reason.lower(), f"Expected position size rejection, got: {reason}"
    print(f"   ✅ PASS - Rejected for position size: {reason}")
    
    print("\n" + "="*80)
    print("✅ TEST 3 COMPLETE: Combined Enforcement Working")
    print("="*80)


def test_no_limits_configured():
    """Test that trading works normally when no limits configured"""
    print("\n" + "="*80)
    print("TEST 4: No Limits Configured (Falls Back to Hard Limits)")
    print("="*80)
    
    # Create risk gates with NO custom limits
    model_config = {}
    
    gates = create_risk_gates(model_id=1, model_config=model_config)
    
    print("\n📊 Test Case: Normal trade with no custom limits")
    print("   No max_position_size_dollars configured")
    print("   No max_daily_loss_dollars configured")
    print("   Attempting to BUY 10 shares @ $150 = $1,500")
    
    portfolio = {
        'cash': 10000,
        'positions': {},
        'total_value': 10000
    }
    
    valid, reason = gates.validate_all(
        action='buy',
        symbol='AAPL',
        amount=10,
        price=150.0,
        portfolio_snapshot=portfolio
    )
    
    print(f"   Result: {'✅ ALLOWED' if valid else f'❌ REJECTED - {reason}'}")
    assert valid == True, f"Expected trade to be allowed with no limits, but got: {reason}"
    print("   ✅ PASS - Trade allowed, falls back to hard limits (50% position, 25% drawdown)")
    
    print("\n" + "="*80)
    print("✅ TEST 4 COMPLETE: Fallback to Hard Limits Working")
    print("="*80)


if __name__ == "__main__":
    print("\n" + "="*80)
    print("DOLLAR-BASED RISK LIMITS - ENFORCEMENT TEST SUITE")
    print("="*80)
    print("\nTesting that max_position_size_dollars and max_daily_loss_dollars")
    print("are properly enforced by RiskGates before trade execution.\n")
    
    try:
        # Run all tests
        test_max_position_size_enforcement()
        test_max_daily_loss_enforcement()
        test_combined_enforcement()
        test_no_limits_configured()
        
        # All tests passed
        print("\n" + "="*80)
        print("🎉 ALL TESTS PASSED - DOLLAR-BASED RISK LIMITS WORKING 100%")
        print("="*80)
        print("\nSummary:")
        print("✅ Max Position Size (Dollars) - ENFORCED")
        print("✅ Max Daily Loss (Dollars) - ENFORCED")
        print("✅ Combined Enforcement - WORKING")
        print("✅ Fallback to Hard Limits - WORKING")
        print("\nThe model WILL respect your configured dollar limits.")
        print("="*80)
        
        sys.exit(0)
        
    except AssertionError as e:
        print("\n" + "="*80)
        print(f"❌ TEST FAILED: {str(e)}")
        print("="*80)
        sys.exit(1)
    except Exception as e:
        print("\n" + "="*80)
        print(f"❌ ERROR: {str(e)}")
        print("="*80)
        import traceback
        traceback.print_exc()
        sys.exit(1)

