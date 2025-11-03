"""
Celery tasks for trading operations
"""

import asyncio
from typing import Dict, Any
from celery_app import celery_app
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
    base_model: str
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
        
        # Create trading run
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

