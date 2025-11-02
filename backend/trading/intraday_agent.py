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

# Import event stream for real-time updates
try:
    from streaming import event_stream
except ImportError:
    event_stream = None


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
    
    # Emit initialization header
    if event_stream:
        await event_stream.emit(model_id, "terminal", {
            "message": f"{'=' * 80}\nINTRADAY TRADING SESSION\n{'=' * 80}\n  Model: {model_id}\n  Symbol: {symbol}\n  Date: {date}\n  Session: {session}\n"
        })
    
    # Validate model exists before starting
    from supabase import create_client
    from config import settings
    
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    model_check = supabase.table("models").select("id").eq("id", model_id).execute()
    
    if not model_check.data:
        error_msg = f"Model ID {model_id} not found in database"
        print(f"❌ {error_msg}")
        if event_stream:
            await event_stream.emit(model_id, "terminal", {"message": f"❌ {error_msg}"})
        return {"status": "failed", "error": error_msg}
    
    print(f"✅ Model {model_id} verified")
    print()
    
    # Emit verification
    if event_stream:
        await event_stream.emit(model_id, "terminal", {
            "message": f"✅ Model {model_id} verified"
        })
        await event_stream.emit(model_id, "status", {
            "message": f"Starting intraday session for {symbol} on {date}"
        })
    
    # Step 1: Pre-load all data into Redis
    print("📥 Step 1: Loading Session Data")
    print("-" * 80)
    
    # Emit data loading event
    if event_stream:
        await event_stream.emit(model_id, "terminal", {
            "message": f"📥 Step 1: Loading Session Data\n{'-' * 80}"
        })
        await event_stream.emit(model_id, "status", {
            "message": f"Loading market data for {symbol}..."
        })
    
    stats = await load_intraday_session(
        model_id=model_id,
        symbols=[symbol],
        date=date,
        session=session
    )
    
    if symbol not in stats or stats[symbol] == 0:
        print(f"❌ No data loaded for {symbol}")
        if event_stream:
            await event_stream.emit(model_id, "terminal", {
                "message": f"❌ No data loaded for {symbol}"
            })
        return {"status": "failed", "error": "No data available"}
    
    bars_loaded = stats[symbol]
    print(f"✅ Loaded {bars_loaded} minute bars for {symbol}")
    
    # Emit data loaded event
    if event_stream:
        await event_stream.emit(model_id, "terminal", {
            "message": f"✅ Loaded {bars_loaded} minute bars for {symbol}"
        })
        await event_stream.emit(model_id, "status", {
            "message": f"Loaded {bars_loaded} minute bars, preparing AI agent..."
        })
    
    # Step 1.5: Create LangChain agent for intraday decisions
    print(f"\n🤖 Creating Intraday Agent")
    print("-" * 80)
    
    if event_stream:
        await event_stream.emit(model_id, "terminal", {
            "message": f"\n🤖 Creating Intraday Agent\n{'-' * 80}"
        })
    
    from langchain.agents import create_agent
    from trading.agent_prompt import get_intraday_system_prompt
    
    # Create agent with simple prompt (will be customized per minute)
    agent.agent = create_agent(
        agent.model,
        tools=agent.tools,
        system_prompt=f"You are an intraday trader for {symbol}."
    )
    
    print(f"✅ Agent created and ready for decisions")
    
    if event_stream:
        await event_stream.emit(model_id, "terminal", {
            "message": f"✅ Agent created and ready for decisions"
        })
    
    # Step 2: Load ALL bars from Redis into memory (avoid 391 GET calls)
    print(f"\n📥 Step 2: Loading All Bars from Redis into Memory")
    print("-" * 80)
    
    if event_stream:
        await event_stream.emit(model_id, "terminal", {
            "message": f"\n📥 Step 2: Loading All Bars from Redis into Memory\n{'-' * 80}"
        })
    
    from intraday_loader import get_minute_bar_from_cache
    
    minutes = _get_session_minutes(date, session)
    print(f"  📊 Expected {len(minutes)} minute bars for {session} session")
    print(f"  🔍 First few minutes: {minutes[:5]}")
    print(f"  🔍 Last few minutes: {minutes[-5:]}")
    
    if event_stream:
        await event_stream.emit(model_id, "terminal", {
            "message": f"  📊 Expected {len(minutes)} minute bars for {session} session"
        })
    
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
                if event_stream and missing_count <= 3:
                    await event_stream.emit(model_id, "terminal", {
                        "message": f"  ⚠️  Missing bar for {minute}"
                    })
    
    print(f"  ✅ Loaded {len(all_bars)} bars into memory")
    
    if event_stream:
        await event_stream.emit(model_id, "terminal", {
            "message": f"  ✅ Loaded {len(all_bars)} bars into memory"
        })
    print(f"  ⚠️  Missing {missing_count} bars")
    print(f"  📊 Success rate: {(found_count / len(minutes) * 100):.1f}%")
    
    print(f"\n🕐 Step 3: Minute-by-Minute Trading")
    print("-" * 80)
    print(f"  Trading {len(minutes)} minutes with in-memory data")
    
    # Emit trading start event
    if event_stream:
        await event_stream.emit(model_id, "status", {
            "message": f"Starting minute-by-minute trading ({len(minutes)} minutes)..."
        })
    
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
    
    # NEW: Track recent rejections for AI learning
    recent_rejections = []  # Last 10 rejections with reasons
    
    # NEW: Track conversation context for strategic decision-making
    conversation_history = []  # AI's decisions + results over time
    
    # Step 4: Trade each minute using in-memory bars
    for idx, minute in enumerate(minutes):
        # Get price from memory (no Redis call!)
        bar = all_bars.get(minute)
        
        if not bar:
            continue  # No data for this minute
        
        current_price = bar.get('close', 0)
        
        # Every 10 minutes, show progress and emit status
        if idx % 10 == 0:
            progress_msg = f"  🕐 Minute {idx+1}/{len(minutes)}: {minute} - {symbol} @ ${current_price:.2f}"
            print(progress_msg)
            # Emit progress update every 10 minutes (not every minute - reduces spam)
            if event_stream and idx > 0:
                await event_stream.emit(model_id, "terminal", {
                    "message": progress_msg
                })
                await event_stream.emit(model_id, "progress", {
                    "message": f"Trading minute {idx+1}/{len(minutes)}: {minute}",
                    "progress": int((idx / len(minutes)) * 100)
                })
        
        # AI decision with full context (rejections + conversation history)
        decision = await _ai_decide_intraday(
            agent,
            minute=minute,
            symbol=symbol,
            current_price=current_price,
            bar=bar,
            current_position=current_position,
            run_id=run_id,
            recent_rejections=recent_rejections,
            conversation_history=conversation_history  # ← NEW: Full context memory
        )
        
        # Execute decision and show reasoning
        action = decision.get("action")
        reasoning = decision.get("reasoning", "No reasoning provided")
        
        # Track this decision for context (before execution to capture intent)
        decision_log = {
            'minute': minute,
            'price': current_price,
            'decision': action.upper() if action else 'HOLD',
            'amount': decision.get('amount', 0),
            'reasoning': reasoning,
            'result': 'pending'  # Will update after execution
        }
        
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
                
                # Track rejection for AI learning
                recent_rejections.append({
                    'minute': minute,
                    'action': 'BUY',
                    'amount': amount,
                    'reason': gate_reason
                })
                # Keep only last 10 rejections
                if len(recent_rejections) > 10:
                    recent_rejections.pop(0)
                
                # Update decision log with result
                decision_log['result'] = f'BLOCKED: {gate_reason[:50]}'
                conversation_history.append(decision_log)
                # Keep last 20 minutes of context
                if len(conversation_history) > 20:
                    conversation_history.pop(0)
                
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
                
                # Track rejection for AI learning
                recent_rejections.append({
                    'minute': minute,
                    'action': 'BUY',
                    'amount': amount,
                    'reason': rule_reason
                })
                # Keep only last 10 rejections
                if len(recent_rejections) > 10:
                    recent_rejections.pop(0)
                
                # Update decision log with result
                decision_log['result'] = f'BLOCKED: {rule_reason[:50]}'
                conversation_history.append(decision_log)
                # Keep last 20 minutes of context
                if len(conversation_history) > 20:
                    conversation_history.pop(0)
                
                continue
            
            # EXISTING: Cash validation
            if cost > available_cash:
                print(f"    ❌ INSUFFICIENT FUNDS for BUY {amount} shares")
                print(f"       Need: ${cost:,.2f} | Have: ${available_cash:,.2f}")
                print(f"       Skipping trade")
                continue
            
            buy_msg = f"    💰 BUY {amount} shares"
            reasoning_msg = f"       Why: {reasoning[:100]}"
            print(buy_msg)
            print(reasoning_msg)
            
            # Emit terminal output
            if event_stream:
                await event_stream.emit(model_id, "terminal", {
                    "message": f"{buy_msg}\n{reasoning_msg}"
                })
            
            # Emit trade event
            if event_stream:
                await event_stream.emit(model_id, "trade", {
                    "action": "buy",
                    "symbol": symbol,
                    "amount": amount,
                    "price": current_price,
                    "message": f"BUY {amount} {symbol} @ ${current_price:.2f}",
                    "reasoning": reasoning[:100]
                })
            
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
            
            # Update decision log with successful trade
            decision_log['result'] = f'✅ EXECUTED: Bought {amount} @ ${current_price:.2f}'
            conversation_history.append(decision_log)
            # Keep last 20 minutes of context
            if len(conversation_history) > 20:
                conversation_history.pop(0)
            
        elif action == "sell":
            amount = decision.get("amount", 0)
            current_shares = current_position.get(symbol, 0)
            
            # CRITICAL: Validate sufficient shares
            if amount > current_shares:
                print(f"    ❌ INSUFFICIENT SHARES for SELL {amount}")
                print(f"       Want to sell: {amount} | Own: {current_shares}")
                print(f"       Skipping trade")
                continue
            
            sell_msg = f"    💵 SELL {amount} shares"
            sell_reasoning_msg = f"       Why: {reasoning[:100]}"
            print(sell_msg)
            print(sell_reasoning_msg)
            
            # Emit terminal output
            if event_stream:
                await event_stream.emit(model_id, "terminal", {
                    "message": f"{sell_msg}\n{sell_reasoning_msg}"
                })
            
            # Emit trade event
            if event_stream:
                await event_stream.emit(model_id, "trade", {
                    "action": "sell",
                    "symbol": symbol,
                    "amount": amount,
                    "price": current_price,
                    "message": f"SELL {amount} {symbol} @ ${current_price:.2f}",
                    "reasoning": reasoning[:100]
                })
            
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
            
            # Update decision log with successful sell
            decision_log['result'] = f'✅ EXECUTED: Sold {amount} @ ${current_price:.2f}'
            conversation_history.append(decision_log)
            # Keep last 20 minutes of context
            if len(conversation_history) > 20:
                conversation_history.pop(0)
            
        else:
            # HOLD - only show reasoning occasionally
            if idx % 30 == 0:  # Every 30 minutes
                print(f"    📊 HOLD - {reasoning[:80]}")
            
            # Track HOLD decisions too (important for context)
            decision_log['result'] = '⏸️  HOLD: No trade'
            conversation_history.append(decision_log)
            # Keep last 20 minutes of context
            if len(conversation_history) > 20:
                conversation_history.pop(0)
    
    # Calculate final portfolio value (CASH + STOCKS)
    final_cash = current_position.get("CASH", 0)
    final_stock_value = 0.0
    
    # Value all stock holdings at current price
    for stock_symbol, shares in current_position.items():
        if stock_symbol != "CASH" and shares > 0:
            # Get final price from last bar
            if all_bars and len(all_bars) > 0:
                last_minute = list(all_bars.keys())[-1]
                last_bar = all_bars[last_minute]
                stock_price = last_bar.get('close', 0) if last_bar else 0
                stock_value = shares * stock_price
                final_stock_value += stock_value
                print(f"   {stock_symbol}: {shares} shares × ${stock_price:.2f} = ${stock_value:.2f}")
    
    total_portfolio_value = final_cash + final_stock_value
    
    completion_summary = f"\n✅ Session Complete:\n   Minutes Processed: {len(minutes)}\n   Trades Executed: {trades_executed}\n   Trades Rejected (Rules): {trades_rejected_rules}\n   Trades Rejected (Safety Gates): {trades_rejected_gates}\n   Final Cash: ${final_cash:,.2f}\n   Final Stock Value: ${final_stock_value:,.2f}"
    
    print(completion_summary)
    
    # Emit terminal completion summary
    if event_stream:
        await event_stream.emit(model_id, "terminal", {
            "message": completion_summary
        })
    final_summary = f"   Total Portfolio Value: ${total_portfolio_value:,.2f}\n{'=' * 80}"
    print(final_summary)
    
    # Emit final summary to terminal
    if event_stream:
        await event_stream.emit(model_id, "terminal", {
            "message": final_summary
        })
    
    # Emit completion event
    if event_stream:
        await event_stream.emit(model_id, "complete", {
            "message": f"Intraday session completed: {trades_executed} trades executed",
            "trades": trades_executed,
            "final_value": total_portfolio_value
        })
    
    return {
        "status": "completed",
        "minutes_processed": len(minutes),
        "trades_executed": trades_executed,
        "final_position": current_position,
        "final_cash": final_cash,
        "final_stock_value": final_stock_value,
        "total_portfolio_value": total_portfolio_value
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
    current_position: Dict,
    run_id: Optional[int] = None,
    recent_rejections: Optional[List] = None,
    conversation_history: Optional[List] = None  # ← NEW: Full context memory
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
        run_id: Optional run ID for linking reasoning
    
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
        custom_rules=agent.custom_rules,
        custom_instructions=agent.custom_instructions
    )
    
    # NEW: Add conversation context so AI builds strategy over time
    context_additions = []
    
    # 1. Recent trading history (last 10 minutes)
    if conversation_history and len(conversation_history) > 0:
        context_additions.append("\n\n📊 YOUR RECENT TRADING ACTIVITY:")
        for entry in conversation_history[-10:]:  # Last 10 minutes
            context_additions.append(
                f"• {entry['minute']}: {entry['decision']} - {entry['result']} | {entry['reasoning'][:60]}..."
            )
    
    # 2. Rejection feedback for sizing adjustments
    if recent_rejections and len(recent_rejections) > 0:
        context_additions.append("\n\n⚠️ RECENT REJECTIONS - ADJUST YOUR SIZING:")
        for rej in recent_rejections[-5:]:  # Last 5 rejections
            context_additions.append(f"• {rej['minute']}: {rej['action']} {rej['amount']} → BLOCKED - {rej['reason']}")
        
        # Calculate max safe amount
        cash = current_position.get('CASH', 10000)
        total_value = cash
        max_safe_trade = total_value * 0.50  # 50% limit
        max_safe_shares = int(max_safe_trade / current_price) if current_price > 0 else 0
        
        context_additions.append(f"\n💡 Max safe: ${max_safe_trade:.0f} (~{max_safe_shares} shares at ${current_price:.2f})")
        context_additions.append(f"   Portfolio: ${total_value:.0f} | 50% limit per trade")
    
    # 3. Strategic guidance
    if len(conversation_history) > 5:
        context_additions.append("\n\n🎯 STRATEGIC REMINDER:")
        context_additions.append("• You don't need to trade every minute")
        context_additions.append("• HOLD when conditions aren't favorable")
        context_additions.append("• Be selective and patient")
        context_additions.append("• Size positions appropriately (risk gate is 50% max)")
    
    if context_additions:
        prompt += "\n".join(context_additions)
    
    # Call AI agent (actual decision making)
    try:
        print(f"    🤖 Calling AI for decision at {minute}...")
        
        # Add timeout wrapper to prevent hanging
        response = await asyncio.wait_for(
            agent.agent.ainvoke(
                {"messages": [{"role": "user", "content": prompt}]},
                {"recursion_limit": 5}  # Fast decisions for intraday
            ),
            timeout=3.0  # 3 second hard limit for fast intraday trading
        )
        
        print(f"    ✅ AI responded in time")
        
        # Parse AI response
        # LangChain agent returns {"messages": [...]} not {"output": "..."}
        # Get the last AI message content
        messages = response.get("messages", [])
        print(f"    📝 Parsing {len(messages)} messages...")
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
        
        print(f"    💭 AI Response: {content[:100]}...")
        
        # NEW: Save AI reasoning to database
        if run_id:
            print(f"    💾 Saving reasoning to database (run_id={run_id})...")
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
            print(f"    ✅ Decision: BUY {amount} shares")
            return {"action": "buy", "symbol": symbol, "amount": amount, "reasoning": reasoning}
        elif content_upper.startswith("SELL") or content_upper.startswith('"SELL'):
            # Extract amount from the response
            match = re.search(r'(\d+)', content_upper)
            amount = int(match.group(1)) if match else 5
            print(f"    ✅ Decision: SELL {amount} shares")
            return {"action": "sell", "symbol": symbol, "amount": amount, "reasoning": reasoning}
        else:
            print(f"    ✅ Decision: HOLD")
            return {"action": "hold", "reasoning": reasoning}
    
    except asyncio.TimeoutError:
        print(f"    ⏱️  AI decision timeout (>30s), defaulting to HOLD")
        return {"action": "hold", "reasoning": "AI timeout - defaulted to hold"}
    
    except Exception as e:
        print(f"    ⚠️  AI decision failed: {e}, defaulting to HOLD")
        return {"action": "hold", "reasoning": f"Error: {str(e)[:100]}"}


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

