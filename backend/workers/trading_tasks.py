"""
Celery tasks for trading operations
"""

import asyncio
from typing import Dict, Any

# Import celery_app at module level (after celery_app.py has initialized)
from celery_app import celery_app

# Import services
from services import TradingService, get_supabase, get_model_by_id, create_trading_run, complete_trading_run
from trading.intraday_agent import run_intraday_session
from trading.base_agent import BaseAgent


@celery_app.task(bind=True, name='workers.run_intraday_trading')
def run_intraday_trading(
    self,
    model_id: int,
    user_id: str,
    symbol: str,
    date: str,
    session: str,
    base_model: str,
    run_id: int = None
) -> Dict[str, Any]:
    """
    Background task for intraday trading session
    
    Args:
        self: Celery task instance (for progress updates)
        model_id: Database model ID
        user_id: User ID (for verification)
        symbol: Stock ticker
        date: Trading date (YYYY-MM-DD)
        session: Trading session ('regular', 'pre', 'after')
        base_model: AI model to use
    
    Returns:
        Dict with results or error
    """
    
    try:
        # Update state: STARTED
        self.update_state(
            state='PROGRESS',
            meta={
                'status': 'Initializing trading session...',
                'current': 0,
                'total': 390,
                'model_id': model_id,
                'symbol': symbol,
                'date': date
            }
        )
        
        # Get model from database
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        model = loop.run_until_complete(get_model_by_id(model_id, user_id))
        
        if not model:
            return {
                'status': 'error',
                'error': 'Model not found or access denied'
            }
        
        # Get run details (run was already created in main.py)
        if not run_id:
            # Fallback: create run if not provided
            run = loop.run_until_complete(create_trading_run(
                model_id=model_id,
                trading_mode="intraday",
                strategy_snapshot={
                    "custom_rules": model.get("custom_rules"),
                    "custom_instructions": model.get("custom_instructions"),
                    "model_parameters": model.get("model_parameters"),
                    "default_ai_model": model.get("default_ai_model")
                },
                intraday_symbol=symbol,
                intraday_date=date,
                intraday_session=session
            ))
            run_id = run["id"]
            run_number = run["run_number"]
        else:
            # Run already created, just get run_number
            from services import get_run_by_id
            run = loop.run_until_complete(get_run_by_id(model_id, run_id, user_id))
            run_number = run["run_number"] if run else "?"
        
        print(f"🚀 Celery Task: Starting Run #{run_number} (intraday: {symbol} on {date})")
        
        # Update state: Loading data
        self.update_state(
            state='PROGRESS',
            meta={
                'status': f'Loading market data for {symbol}...',
                'current': 5,
                'total': 390,
                'run_id': run_id,
                'run_number': run_number
            }
        )
        
        # Create TradingService
        supabase = get_supabase()
        trading_service = TradingService(supabase)
        
        # Create agent
        agent = BaseAgent(
            signature=model["signature"],
            basemodel=base_model,
            stock_symbols=[symbol],
            max_steps=10,
            initial_cash=model.get("initial_cash", 10000.0),
            model_id=model_id,
            custom_rules=model.get("custom_rules"),
            custom_instructions=model.get("custom_instructions"),
            model_parameters=model.get("model_parameters"),
            trading_service=trading_service
        )
        
        # Update state: Initializing agent
        self.update_state(
            state='PROGRESS',
            meta={
                'status': 'Initializing AI agent...',
                'current': 10,
                'total': 390,
                'run_id': run_id,
                'run_number': run_number
            }
        )
        
        # Initialize agent
        loop.run_until_complete(agent.initialize())
        
        # Update state: Trading started
        self.update_state(
            state='PROGRESS',
            meta={
                'status': f'Trading session started (Run #{run_number})',
                'current': 15,
                'total': 390,
                'run_id': run_id,
                'run_number': run_number
            }
        )
        
        # Run intraday session
        result = loop.run_until_complete(run_intraday_session(
            agent=agent,
            model_id=model_id,
            user_id=user_id,
            symbol=symbol,
            date=date,
            session=session,
            run_id=run_id,
            celery_task=self  # Pass task for progress updates
        ))
        
        # Complete run with metrics
        initial_value = model.get("initial_cash", 10000.0)
        final_total_value = result.get("total_portfolio_value", result.get("final_position", {}).get("CASH", initial_value))
        final_return = ((final_total_value - initial_value) / initial_value) if initial_value > 0 else 0.0
        max_drawdown = max(0, (initial_value - final_total_value) / initial_value) if initial_value > 0 else 0.0
        
        loop.run_until_complete(complete_trading_run(run_id, {
            "total_trades": result.get("trades_executed", 0),
            "final_portfolio_value": final_total_value,
            "final_return": final_return,
            "max_drawdown": max_drawdown
        }))
        
        print(f"✅ Celery Task: Run #{run_number} completed")
        
        loop.close()
        
        return {
            'status': 'completed',
            'run_id': run_id,
            'run_number': run_number,
            **result
        }
        
    except Exception as e:
        print(f"❌ Celery Task Error: {e}")
        
        # Update state: FAILURE
        self.update_state(
            state='FAILURE',
            meta={
                'status': f'Error: {str(e)}',
                'error': str(e)
            }
        )
        
        return {
            'status': 'error',
            'error': str(e)
        }


@celery_app.task(bind=True, name='workers.run_daily_backtest')
def run_daily_backtest(
    self,
    model_id: int,
    user_id: str,
    symbol: str,
    start_date: str,
    end_date: str,
    base_model: str,
    run_id: int = None
) -> Dict[str, Any]:
    """
    Background task for daily backtest (single stock, date range, daily bars)
    
    Similar to intraday but uses daily OHLCV bars instead of minute ticks
    """
    try:
        self.update_state(
            state='PROGRESS',
            meta={
                'status': 'Initializing daily backtest...',
                'current': 0,
                'total': 100,
                'model_id': model_id,
                'symbol': symbol
            }
        )
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        model = loop.run_until_complete(get_model_by_id(model_id, user_id))
        
        if not model:
            return {'status': 'error', 'error': 'Model not found'}
        
        # Get/create run
        if not run_id:
            run = loop.run_until_complete(create_trading_run(
                model_id=model_id,
                trading_mode="daily",
                strategy_snapshot={
                    "custom_rules": model.get("custom_rules"),
                    "custom_instructions": model.get("custom_instructions"),
                    "model_parameters": model.get("model_parameters")
                },
                date_range_start=start_date,
                date_range_end=end_date
            ))
            run_id = run["id"]
            run_number = run["run_number"]
        else:
            from services import get_run_by_id
            run = loop.run_until_complete(get_run_by_id(model_id, run_id, user_id))
            run_number = run["run_number"] if run else "?"
        
        print(f"🚀 Celery Task: Daily Backtest Run #{run_number} ({symbol}: {start_date} to {end_date})")
        
        supabase = get_supabase()
        trading_service = TradingService(supabase)
        
        # Create agent
        agent = BaseAgent(
            signature=model["signature"],
            basemodel=base_model,
            stock_symbols=[symbol],
            max_steps=30,
            initial_cash=model.get("initial_cash", 10000.0),
            model_id=model_id,
            custom_rules=model.get("custom_rules"),
            custom_instructions=model.get("custom_instructions"),
            model_parameters=model.get("model_parameters"),
            trading_service=trading_service
        )
        
        # Set run_id so trades link
        agent._current_run_id = run_id
        
        self.update_state(
            state='PROGRESS',
            meta={
                'status': 'Initializing AI agent...',
                'current': 20,
                'total': 100,
                'run_id': run_id
            }
        )
        
        loop.run_until_complete(agent.initialize())
        
        self.update_state(
            state='PROGRESS',
            meta={
                'status': f'Running backtest ({symbol})...',
                'current': 40,
                'total': 100
            }
        )
        
        # Fetch daily bars from Polygon
        from daily_loader import fetch_daily_bars_polygon
        
        bars = loop.run_until_complete(fetch_daily_bars_polygon(symbol, start_date, end_date))
        
        if not bars:
            return {'status': 'error', 'error': 'No data available from Polygon'}
        
        print(f"  📊 Processing {len(bars)} trading days")
        
        # Run daily backtest
        loop.run_until_complete(agent.run_date_range(start_date, end_date))
        
        # Get actual final position
        from utils.price_tools import get_latest_position
        final_position, _ = get_latest_position(end_date, model["signature"])
        
        initial_value = model.get("initial_cash", 10000.0)
        final_cash = final_position.get("CASH", initial_value)
        final_return = ((final_cash - initial_value) / initial_value) if initial_value > 0 else 0.0
        
        loop.run_until_complete(complete_trading_run(run_id, {
            "total_trades": 0,  # Calculated from position changes
            "final_return": final_return,
            "final_portfolio_value": final_cash
        }))
        
        print(f"✅ Celery Task: Daily Backtest Run #{run_number} completed")
        
        loop.close()
        
        return {
            'status': 'completed',
            'run_id': run_id,
            'run_number': run_number
        }
        
    except Exception as e:
        print(f"❌ Daily Backtest Error: {e}")
        
        self.update_state(
            state='FAILURE',
            meta={'status': f'Error: {str(e)}', 'error': str(e)}
        )
        
        return {'status': 'error', 'error': str(e)}

