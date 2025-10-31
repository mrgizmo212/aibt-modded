"""
Intraday Trading Agent - Minute-by-Minute Trading Logic
Extends base agent with intraday-specific functionality
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
import asyncio
import json
from pathlib import Path

from intraday_loader import (
    load_intraday_session,
    get_all_symbols_at_minute
)


async def run_intraday_session(
    agent,
    model_id: int,
    user_id: str,
    symbol: str,
    date: str,
    session: str = "regular",
    run_id: Optional[int] = None  # ← NEW: Link trades to run
) -> Dict[str, Any]:
    """
    Run minute-by-minute intraday trading session
    
    Args:
        agent: BaseAgent instance
        model_id: Model ID
        user_id: User ID (for database writes)
        symbol: Stock symbol (single stock for intraday)
        date: Trading date YYYY-MM-DD
        session: 'pre', 'regular', 'after'
    
    Returns:
        Session results
    """
    
    print("=" * 80)
    print(f"INTRADAY TRADING SESSION")
    print("=" * 80)
    print(f"  Model: {model_id}")
    print(f"  Symbol: {symbol}")
    print(f"  Date: {date}")
    print(f"  Session: {session}")
    print()
    
    # Validate model exists before starting
    from supabase import create_client
    from config import settings
    
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    model_check = supabase.table("models").select("id").eq("id", model_id).execute()
    
    if not model_check.data:
        error_msg = f"Model ID {model_id} not found in database"
        print(f"❌ {error_msg}")
        return {"status": "failed", "error": error_msg}
    
    print(f"✅ Model {model_id} verified")
    print()
    
    # Step 1: Pre-load all data into Redis
    print("📥 Step 1: Loading Session Data")
    print("-" * 80)
    
    stats = await load_intraday_session(
        model_id=model_id,
        symbols=[symbol],
        date=date,
        session=session
    )
    
    if symbol not in stats or stats[symbol] == 0:
        print(f"❌ No data loaded for {symbol}")
        return {"status": "failed", "error": "No data available"}
    
    bars_loaded = stats[symbol]
    print(f"✅ Loaded {bars_loaded} minute bars for {symbol}")
    
    # Step 1.5: Create LangChain agent for intraday decisions
    print(f"\n🤖 Creating Intraday Agent")
    print("-" * 80)
    
    from langchain.agents import create_agent
    from trading.agent_prompt import get_intraday_system_prompt
    
    # Create agent with simple prompt (will be customized per minute)
    agent.agent = create_agent(
        agent.model,
        tools=agent.tools,
        system_prompt=f"You are an intraday trader for {symbol}."
    )
    
    print(f"✅ Agent created and ready for decisions")
    
    # Step 2: Load ALL bars from Redis into memory (avoid 391 GET calls)
    print(f"\n📥 Step 2: Loading All Bars from Redis into Memory")
    print("-" * 80)
    
    from intraday_loader import get_minute_bar_from_cache
    
    minutes = _get_session_minutes(date, session)
    print(f"  📊 Expected {len(minutes)} minute bars for {session} session")
    print(f"  🔍 First few minutes: {minutes[:5]}")
    print(f"  🔍 Last few minutes: {minutes[-5:]}")
    
    all_bars = {}  # minute_str -> bar_data
    
    # Load all bars in one batch
    found_count = 0
    missing_count = 0
    for minute in minutes:
        bar = await get_minute_bar_from_cache(model_id, date, symbol, minute)
        if bar:
            all_bars[minute] = bar
            found_count += 1
        else:
            missing_count += 1
            if missing_count <= 3:  # Show first 3 missing
                print(f"  ⚠️  Missing bar for {minute}")
    
    print(f"  ✅ Loaded {len(all_bars)} bars into memory")
    print(f"  ⚠️  Missing {missing_count} bars")
    print(f"  📊 Success rate: {(found_count / len(minutes) * 100):.1f}%")
    
    print(f"\n🕐 Step 3: Minute-by-Minute Trading")
    print("-" * 80)
    print(f"  Trading {len(minutes)} minutes with in-memory data")
    
    # NEW: Initialize rule enforcer and risk gates
    from utils.rule_enforcer import create_rule_enforcer
    from utils.risk_gates import create_risk_gates
    
    enforcer = create_rule_enforcer(supabase, model_id)
    risk_gates = create_risk_gates(model_id)
    
    print(f"  ✅ Rule enforcer loaded ({len(enforcer.rules)} active rules)")
    print(f"  ✅ Risk gates initialized")
    
    trades_executed = 0
    trades_rejected_rules = 0
    trades_rejected_gates = 0
    current_position = {"CASH": agent.initial_cash}
    
    # Step 4: Trade each minute using in-memory bars
    for idx, minute in enumerate(minutes):
        # Get price from memory (no Redis call!)
        bar = all_bars.get(minute)
        
        if not bar:
            continue  # No data for this minute
        
        current_price = bar.get('close', 0)
        
        # Every 10 minutes, show progress
        if idx % 10 == 0:
            print(f"  🕐 Minute {idx+1}/{len(minutes)}: {minute} - {symbol} @ ${current_price:.2f}")
        
        # AI decision (simplified for now - will use actual agent later)
        decision = await _ai_decide_intraday(
            agent,
            minute=minute,
            symbol=symbol,
            current_price=current_price,
            bar=bar,
            current_position=current_position
        )
        
        # Execute decision and show reasoning
        action = decision.get("action")
        reasoning = decision.get("reasoning", "No reasoning provided")
        
        if action == "buy":
            amount = decision.get("amount", 0)
            cost = amount * current_price
            available_cash = current_position.get("CASH", 0)
            
            # NEW: Calculate current portfolio value for validation
            total_value = available_cash + sum(
                current_position.get(s, 0) * current_price 
                for s in current_position if s != 'CASH'
            )
            
            portfolio_snapshot = {
                'cash': available_cash,
                'positions': current_position,
                'total_value': total_value,
                'initial_value': agent.initial_cash
            }
            
            # NEW: Risk Gates (hard-coded safety)
            gates_passed, gate_reason = risk_gates.validate_all(
                action="buy",
                symbol=symbol,
                amount=amount,
                price=current_price,
                portfolio_snapshot=portfolio_snapshot
            )
            
            if not gates_passed:
                print(f"    🛑 RISK GATE BLOCKED: {gate_reason}")
                trades_rejected_gates += 1
                continue
            
            # NEW: Rule Enforcer (user-defined rules)
            rules_passed, rule_reason = enforcer.validate_trade(
                action="buy",
                symbol=symbol,
                amount=amount,
                price=current_price,
                current_position=current_position,
                total_portfolio_value=total_value,
                asset_type='equity',
                current_time=datetime.now()
            )
            
            if not rules_passed:
                print(f"    ❌ RULE VIOLATION: {rule_reason}")
                trades_rejected_rules += 1
                continue
            
            # EXISTING: Cash validation
            if cost > available_cash:
                print(f"    ❌ INSUFFICIENT FUNDS for BUY {amount} shares")
                print(f"       Need: ${cost:,.2f} | Have: ${available_cash:,.2f}")
                print(f"       Skipping trade")
                continue
            
            print(f"    💰 BUY {amount} shares")
            print(f"       Why: {reasoning[:100]}")
            
            # Update position BEFORE recording to database
            current_position["CASH"] -= cost
            current_position[symbol] = current_position.get(symbol, 0) + amount
            
            # Record trade to database
            await _record_intraday_trade(
                model_id=model_id,
                user_id=user_id,
                run_id=run_id,  # ← NEW
                date=date,
                minute=minute,
                action="buy",
                symbol=symbol,
                amount=amount,
                price=current_price,
                position=current_position,
                reasoning=reasoning  # ← NEW
            )
            
            trades_executed += 1
            
        elif action == "sell":
            amount = decision.get("amount", 0)
            current_shares = current_position.get(symbol, 0)
            
            # CRITICAL: Validate sufficient shares
            if amount > current_shares:
                print(f"    ❌ INSUFFICIENT SHARES for SELL {amount}")
                print(f"       Want to sell: {amount} | Own: {current_shares}")
                print(f"       Skipping trade")
                continue
            
            print(f"    💵 SELL {amount} shares")
            print(f"       Why: {reasoning[:100]}")
            
            # Update position BEFORE recording to database
            current_position["CASH"] += amount * current_price
            current_position[symbol] = current_shares - amount
            
            # Record trade to database
            await _record_intraday_trade(
                model_id=model_id,
                user_id=user_id,
                run_id=run_id,  # ← NEW
                date=date,
                minute=minute,
                action="sell",
                symbol=symbol,
                amount=amount,
                price=current_price,
                position=current_position,
                reasoning=reasoning  # ← NEW
            )
            
            trades_executed += 1
        else:
            # HOLD - only show reasoning occasionally
            if idx % 30 == 0:  # Every 30 minutes
                print(f"    📊 HOLD - {reasoning[:80]}")
    
    print(f"\n✅ Session Complete:")
    print(f"   Minutes Processed: {len(minutes)}")
    print(f"   Trades Executed: {trades_executed}")
    print(f"   Trades Rejected (Rules): {trades_rejected_rules}")
    print(f"   Trades Rejected (Safety Gates): {trades_rejected_gates}")
    print(f"   Final Position: {current_position}")
    print("=" * 80)
    
    return {
        "status": "completed",
        "minutes_processed": len(minutes),
        "trades_executed": trades_executed,
        "final_position": current_position
    }


def _get_session_minutes(date: str, session: str) -> List[str]:
    """
    Get list of minute timestamps for a session IN EDT
    
    Args:
        date: YYYY-MM-DD
        session: 'pre', 'regular', 'after'
    
    Returns:
        List of HH:MM strings in EDT (matching Redis cache keys)
    """
    
    if session == "pre":
        # 4:00 AM - 9:29 AM EDT = 329 minutes
        start_hour, start_min = 4, 0
        end_hour, end_min = 9, 29
    elif session == "regular":
        # 9:30 AM - 4:00 PM EDT = 390 minutes
        start_hour, start_min = 9, 30
        end_hour, end_min = 15, 59  # ← FIX: Should be 15:59 not 16:00 (4:00 PM = 16:00 but last minute is 15:59)
    elif session == "after":
        # 4:00 PM - 8:00 PM EDT = 240 minutes
        start_hour, start_min = 16, 0
        end_hour, end_min = 20, 0
    else:
        return []
    
    minutes = []
    current = datetime(2000, 1, 1, start_hour, start_min)
    end = datetime(2000, 1, 1, end_hour, end_min)
    
    while current <= end:
        minutes.append(current.strftime('%H:%M'))
        current += timedelta(minutes=1)
    
    return minutes


async def _ai_decide_intraday(
    agent,
    minute: str,
    symbol: str,
    current_price: float,
    bar: Dict,
    current_position: Dict
) -> Dict[str, Any]:
    """
    AI makes intraday trading decision for current minute
    
    Uses actual LangChain agent with intraday-specific prompt
    
    Args:
        agent: BaseAgent instance
        minute: Current minute HH:MM
        symbol: Stock symbol
        current_price: Current price
        bar: Minute bar with OHLCV
        current_position: Current portfolio
    
    Returns:
        Decision dict with action and amount
    """
    
    # Build intraday prompt
    from trading.agent_prompt import get_intraday_system_prompt
    
    prompt = get_intraday_system_prompt(
        minute=minute,
        symbol=symbol,
        bar=bar,
        position=current_position,
        custom_rules=agent.custom_rules,  # ← NEW: Pass rules
        custom_instructions=agent.custom_instructions  # ← NEW: Pass instructions
    )
    
    # Call AI agent (actual decision making)
    try:
        response = await agent.agent.ainvoke(
            {"messages": [{"role": "user", "content": prompt}]},
            {"recursion_limit": 5}  # Fast decisions for intraday
        )
        
        # Parse AI response
        # LangChain agent returns {"messages": [...]} not {"output": "..."}
        # Get the last AI message content
        messages = response.get("messages", [])
        if messages:
            # Last message is the AI's response
            last_msg = messages[-1]
            if hasattr(last_msg, "content"):
                content = last_msg.content
            else:
                content = str(last_msg)
        else:
            # Fallback: check for "output" key
            content = response.get("output", "HOLD - no data")
        
        # Import regex at function level (not inside if blocks)
        import re
        
        content_upper = content.upper()
        
        # Extract reasoning (text after dash)
        reasoning = content.split(" - ", 1)[1] if " - " in content else content
        
        # NEW: Save AI reasoning to database
        if run_id:
            from services.reasoning_service import save_ai_reasoning
            
            await save_ai_reasoning(
                model_id=agent.model_id,
                run_id=run_id,
                reasoning_type="decision",
                content=reasoning,
                context_json={
                    "minute": minute,
                    "symbol": symbol,
                    "bar": bar,
                    "action": content_upper[:10]  # BUY/SELL/HOLD
                }
            )
        
        # CRITICAL: Check if response STARTS with action, not just contains the word
        # This prevents "HOLD - insufficient cash to buy" from being parsed as BUY
        if content_upper.startswith("BUY") or content_upper.startswith('"BUY'):
            # Extract amount from the response
            match = re.search(r'(\d+)', content_upper)
            amount = int(match.group(1)) if match else 10
            return {"action": "buy", "symbol": symbol, "amount": amount, "reasoning": reasoning}
        elif content_upper.startswith("SELL") or content_upper.startswith('"SELL'):
            # Extract amount from the response
            match = re.search(r'(\d+)', content_upper)
            amount = int(match.group(1)) if match else 5
            return {"action": "sell", "symbol": symbol, "amount": amount, "reasoning": reasoning}
        else:
            return {"action": "hold", "reasoning": reasoning}
    
    except Exception as e:
        print(f"    ⚠️  AI decision failed: {e}, defaulting to HOLD")
        return {"action": "hold"}


async def _record_intraday_trade(
    model_id: int,
    user_id: str,
    run_id: Optional[int],  # ← NEW
    date: str,
    minute: str,
    action: str,
    symbol: str,
    amount: int,
    price: float,
    position: Dict,
    reasoning: Optional[str] = None  # ← NEW
):
    """
    Record intraday trade to database
    
    Args:
        model_id: Model ID
        user_id: User ID (for RLS compliance)
        date: Trading date
        minute: Minute time HH:MM
        action: 'buy' or 'sell'
        symbol: Stock symbol
        amount: Number of shares
        price: Execution price
        position: Current portfolio state
    """
    
    from supabase import create_client
    from config import settings
    
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    
    # Get next action_id for this date
    existing = supabase.table("positions")\
        .select("action_id")\
        .eq("model_id", model_id)\
        .eq("date", date)\
        .order("action_id", desc=True)\
        .limit(1)\
        .execute()
    
    action_id = (existing.data[0]["action_id"] + 1) if existing.data else 1
    
    # Insert intraday trade (RLS works through model_id → models.user_id)
    try:
        supabase.table("positions").insert({
            "model_id": model_id,
            "run_id": run_id,  # ← NEW: Link to run
            "date": date,
            "minute_time": minute + ":00",  # HH:MM:SS format
            "action_id": action_id,
            "action_type": action,
            "symbol": symbol,
            "amount": amount,
            "positions": position,
            "cash": position.get("CASH", 0),
            "reasoning": reasoning[:500] if reasoning else None  # ← NEW: Truncated reasoning
        }).execute()
        
        print(f"    💾 Recorded: {action.upper()} {amount} {symbol} @ ${price:.2f}")
    except Exception as e:
        error_msg = str(e)
        if "positions_model_id_fkey" in error_msg:
            print(f"    ❌ ERROR: model_id={model_id} doesn't exist in models table")
            print(f"       Please create the model first or use a valid model_id")
            raise ValueError(f"Invalid model_id={model_id}. Model must exist in database before trading.") from e
        else:
            print(f"    ❌ ERROR recording trade: {error_msg}")
            raise

