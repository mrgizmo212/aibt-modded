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
    session: str = "regular"
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
    all_bars = {}  # minute_str -> bar_data
    
    # Load all bars in one batch
    for minute in minutes:
        bar = await get_minute_bar_from_cache(model_id, date, symbol, minute)
        if bar:
            all_bars[minute] = bar
    
    print(f"  ✅ Loaded {len(all_bars)} bars into memory (no more Redis calls needed)")
    
    print(f"\n🕐 Step 3: Minute-by-Minute Trading")
    print("-" * 80)
    print(f"  Trading {len(minutes)} minutes with in-memory data")
    
    trades_executed = 0
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
            print(f"    💰 BUY {decision.get('amount', 0)} shares")
            print(f"       Why: {reasoning[:100]}")
            
            # Record trade to database
            await _record_intraday_trade(
                model_id=model_id,
                user_id=user_id,
                date=date,
                minute=minute,
                action="buy",
                symbol=symbol,
                amount=decision.get("amount", 0),
                price=current_price,
                position=current_position
            )
            
            trades_executed += 1
            current_position["CASH"] -= decision.get("amount", 0) * current_price
            current_position[symbol] = current_position.get(symbol, 0) + decision.get("amount", 0)
            
        elif action == "sell":
            print(f"    💵 SELL {decision.get('amount', 0)} shares")
            print(f"       Why: {reasoning[:100]}")
            
            # Record trade to database
            await _record_intraday_trade(
                model_id=model_id,
                user_id=user_id,
                date=date,
                minute=minute,
                action="sell",
                symbol=symbol,
                amount=decision.get("amount", 0),
                price=current_price,
                position=current_position
            )
            
            trades_executed += 1
            current_position["CASH"] += decision.get("amount", 0) * current_price
            current_position[symbol] = current_position.get(symbol, 0) - decision.get("amount", 0)
        else:
            # HOLD - only show reasoning occasionally
            if idx % 30 == 0:  # Every 30 minutes
                print(f"    📊 HOLD - {reasoning[:80]}")
    
    print(f"\n✅ Session Complete:")
    print(f"   Minutes Processed: {len(minutes)}")
    print(f"   Trades Executed: {trades_executed}")
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
    Get list of minute timestamps for a session
    
    Args:
        date: YYYY-MM-DD
        session: 'pre', 'regular', 'after'
    
    Returns:
        List of HH:MM strings
    """
    
    if session == "pre":
        # 4:00 AM - 9:29 AM ET = 329 minutes
        start_hour, start_min = 4, 0
        end_hour, end_min = 9, 29
    elif session == "regular":
        # 9:30 AM - 4:00 PM ET = 390 minutes
        start_hour, start_min = 9, 30
        end_hour, end_min = 16, 0
    elif session == "after":
        # 4:01 PM - 8:00 PM ET = 239 minutes
        start_hour, start_min = 16, 1
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
        position=current_position
    )
    
    # Call AI agent (actual decision making)
    try:
        response = await agent.agent.ainvoke(
            {"messages": [{"role": "user", "content": prompt}]},
            {"recursion_limit": 5}  # Fast decisions for intraday
        )
        
        # DEBUG: Log actual response structure
        print(f"    🔍 DEBUG - Response keys: {list(response.keys())}")
        print(f"    🔍 DEBUG - Full response: {response}")
        
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
        
        content_upper = content.upper()
        
        # Extract reasoning (text after dash)
        reasoning = content.split(" - ", 1)[1] if " - " in content else content
        
        if "BUY" in content_upper:
            # Extract amount
            import re
            match = re.search(r'(\d+)', content_upper)
            amount = int(match.group(1)) if match else 10
            return {"action": "buy", "symbol": symbol, "amount": amount, "reasoning": reasoning}
        elif "SELL" in content_upper:
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
    date: str,
    minute: str,
    action: str,
    symbol: str,
    amount: int,
    price: float,
    position: Dict
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
    
    # Insert intraday trade (RLS requires user_id)
    supabase.table("positions").insert({
        "model_id": model_id,
        "user_id": user_id,  # ← CRITICAL: RLS enforcement
        "date": date,
        "minute_time": minute + ":00",  # HH:MM:SS format
        "action_id": action_id,
        "action_type": action,
        "symbol": symbol,
        "amount": amount,
        "positions": position,
        "cash": position.get("CASH", 0)
    }).execute()
    
    print(f"    💾 Recorded: {action.upper()} {amount} {symbol} @ ${price:.2f}")

