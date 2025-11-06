"""
Business Logic Layer - Database Services
Handles all database operations with Supabase
"""

import json
import re
from pathlib import Path
from typing import List, Dict, Optional, Any
from datetime import date, datetime
from supabase import create_client, Client
from config import settings
import sys

# Add utils to path
sys.path.insert(0, str(Path(__file__).parent))

from utils.result_tools import (
    calculate_all_metrics,
    get_daily_portfolio_values,
    get_available_date_range
)
from utils.result_tools_db import (
    calculate_all_metrics_db,
    get_daily_portfolio_values_db,
    get_available_date_range_db
)

# Import path for services subdirectory
import sys
from pathlib import Path
services_path = Path(__file__).parent / "services"
sys.path.insert(0, str(services_path))

# NEW: Run tracking, reasoning, and chat services
from run_service import (
    create_trading_run,
    complete_trading_run,
    fail_trading_run,
    get_model_runs,
    get_run_by_id,
    get_active_run
)
from reasoning_service import (
    save_ai_reasoning,
    get_reasoning_for_run,
    get_recent_reasoning,
    get_reasoning_by_type
)
from chat_service import (
    get_or_create_chat_session,
    save_chat_message,
    get_chat_messages
)


# ============================================================================
# SUPABASE CLIENT
# ============================================================================

def get_supabase() -> Client:
    """
    Get Supabase client with service role key (bypasses RLS for admin operations)
    Creates fresh client each time to avoid connection pool issues
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def get_supabase_anon() -> Client:
    """
    Get Supabase client with anon key (respects RLS)
    Creates fresh client each time to avoid connection pool issues
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


# ============================================================================
# USER/PROFILE SERVICES
# ============================================================================

async def get_user_profile(user_id: str) -> Optional[Dict]:
    """Get user profile by ID"""
    supabase = get_supabase()
    
    result = supabase.table("profiles").select("*").eq("id", user_id).execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]
    return None


async def get_all_users() -> List[Dict]:
    """Admin only: Get all user profiles"""
    supabase = get_supabase()
    
    result = supabase.table("profiles").select("*").order("created_at", desc=True).execute()
    
    return result.data if result.data else []


async def update_user_role(user_id: str, new_role: str) -> Dict:
    """Admin only: Update user role"""
    supabase = get_supabase()
    
    result = supabase.table("profiles").update({"role": new_role}).eq("id", user_id).execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]
    return {}


# ============================================================================
# MODEL SERVICES
# ============================================================================

async def get_user_models(user_id: str) -> List[Dict]:
    """Get all models for a specific user"""
    supabase = get_supabase()
    
    result = supabase.table("models").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    
    return result.data if result.data else []


async def get_all_models_admin() -> List[Dict]:
    """Admin only: Get all models across all users"""
    supabase = get_supabase()
    
    result = supabase.table("models").select("*, profiles(email)").order("created_at", desc=True).execute()
    
    return result.data if result.data else []


async def get_model_by_id(model_id: int, user_id: str) -> Optional[Dict]:
    """Get model by ID (checks ownership)"""
    supabase = get_supabase()
    
    result = supabase.table("models").select("*").eq("id", model_id).eq("user_id", user_id).execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]
    return None


def generate_signature(name: str, user_id: str) -> str:
    """
    Generate a unique signature (slug) from model name
    
    Args:
        name: Model name
        user_id: User ID to check uniqueness
        
    Returns:
        Unique signature string
    """
    # Convert to lowercase and replace spaces/special chars with hyphens
    base_signature = re.sub(r'[^\w\s-]', '', name.lower())
    base_signature = re.sub(r'[-\s]+', '-', base_signature).strip('-')
    
    # Ensure not empty
    if not base_signature:
        base_signature = 'model'
    
    # Check uniqueness and append number if needed
    supabase = get_supabase()
    signature = base_signature
    counter = 1
    
    while True:
        # Check if signature exists for this user
        result = supabase.table("models").select("id").eq("user_id", user_id).eq("signature", signature).execute()
        
        if not result.data or len(result.data) == 0:
            # Signature is unique
            return signature
        
        # Try with number suffix
        counter += 1
        signature = f"{base_signature}-{counter}"


async def create_model(
    user_id: str, 
    name: str, 
    description: Optional[str] = None,
    trading_style: Optional[str] = 'day-trading',
    instrument: Optional[str] = 'stocks',
    allow_shorting: Optional[bool] = False,
    margin_account: Optional[bool] = False,
    allow_options_strategies: Optional[bool] = False,
    allow_hedging: Optional[bool] = False,
    allowed_order_types: Optional[List[str]] = None,
    initial_cash: float = 10000.0, 
    allowed_tickers: Optional[List[str]] = None,
    default_ai_model: Optional[str] = None,
    model_parameters: Optional[Dict] = None,
    custom_rules: Optional[str] = None,
    custom_instructions: Optional[str] = None
) -> Dict:
    """
    Create new AI model with auto-generated signature
    
    Args:
        user_id: User ID
        name: Model name
        description: Optional description
        initial_cash: Starting capital amount (defaults to $10,000)
        allowed_tickers: Optional list of allowed stock tickers (if None, trades all NASDAQ 100)
        default_ai_model: Default AI model to use (e.g., 'openai/gpt-5')
        model_parameters: AI model parameters (temperature, verbosity, etc.)
        custom_rules: Optional custom trading rules
        custom_instructions: Optional custom instructions
        
    Returns:
        Created model dict
    """
    supabase = get_supabase()
    
    # Auto-generate unique signature from name
    signature = generate_signature(name, user_id)
    
    # Prepare insert data
    insert_data = {
        "user_id": user_id,
        "name": name,
        "signature": signature,
        "description": description,
        "trading_style": trading_style,
        "instrument": instrument,
        "allow_shorting": allow_shorting,
        "margin_account": margin_account,
        "allow_options_strategies": allow_options_strategies,
        "allow_hedging": allow_hedging,
        "allowed_order_types": allowed_order_types or ['market', 'limit'],
        "initial_cash": initial_cash,
        "is_active": True
    }
    
    # Add optional fields if provided
    if allowed_tickers is not None:
        insert_data["allowed_tickers"] = allowed_tickers
    
    if default_ai_model is not None:
        insert_data["default_ai_model"] = default_ai_model
    
    if model_parameters is not None:
        insert_data["model_parameters"] = model_parameters
    
    if custom_rules is not None:
        insert_data["custom_rules"] = custom_rules
    
    if custom_instructions is not None:
        insert_data["custom_instructions"] = custom_instructions
    
    result = supabase.table("models").insert(insert_data).execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]
    return {}


async def update_model(
    model_id: int, 
    user_id: str, 
    name: str, 
    description: Optional[str] = None,
    trading_style: Optional[str] = None,
    instrument: Optional[str] = None,
    allow_shorting: Optional[bool] = None,
    margin_account: Optional[bool] = None,
    allow_options_strategies: Optional[bool] = None,
    allow_hedging: Optional[bool] = None,
    allowed_order_types: Optional[List[str]] = None,
    allowed_tickers: Optional[List[str]] = None,
    default_ai_model: Optional[str] = None,
    model_parameters: Optional[Dict] = None,
    custom_rules: Optional[str] = None,
    custom_instructions: Optional[str] = None
) -> Optional[Dict]:
    """
    Update AI model (checks ownership)
    
    Args:
        model_id: Model ID
        user_id: User ID
        name: New name
        description: New description
        allowed_tickers: Optional list of allowed stock tickers
        default_ai_model: Default AI model to use
        model_parameters: AI model parameters configuration
        custom_rules: Optional custom trading rules
        custom_instructions: Optional custom instructions
        
    Returns:
        Updated model dict or None
    """
    # Verify ownership first
    model = await get_model_by_id(model_id, user_id)
    if not model:
        return None
    
    supabase = get_supabase()
    
    # Prepare update data
    update_data = {
        "name": name,
        "description": description
    }
    
    # Add optional fields if provided
    if trading_style is not None:
        update_data["trading_style"] = trading_style
    
    if instrument is not None:
        update_data["instrument"] = instrument
    
    if allow_shorting is not None:
        update_data["allow_shorting"] = allow_shorting
    
    if margin_account is not None:
        update_data["margin_account"] = margin_account
    
    if allow_options_strategies is not None:
        update_data["allow_options_strategies"] = allow_options_strategies
    
    if allow_hedging is not None:
        update_data["allow_hedging"] = allow_hedging
    
    if allowed_order_types is not None:
        update_data["allowed_order_types"] = allowed_order_types
    
    if allowed_tickers is not None:
        update_data["allowed_tickers"] = allowed_tickers
    
    if default_ai_model is not None:
        update_data["default_ai_model"] = default_ai_model
    
    if model_parameters is not None:
        update_data["model_parameters"] = model_parameters
    
    if custom_rules is not None:
        update_data["custom_rules"] = custom_rules
    
    if custom_instructions is not None:
        update_data["custom_instructions"] = custom_instructions
    
    result = supabase.table("models").update(update_data).eq("id", model_id).eq("user_id", user_id).execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]
    return None


async def delete_model(model_id: int, user_id: str) -> bool:
    """
    Delete AI model (checks ownership, cascades to positions/logs via DB)
    
    Args:
        model_id: Model ID
        user_id: User ID
        
    Returns:
        True if deleted successfully
    """
    # Verify ownership first
    model = await get_model_by_id(model_id, user_id)
    if not model:
        return False
    
    supabase = get_supabase()
    
    result = supabase.table("models").delete().eq("id", model_id).eq("user_id", user_id).execute()
    
    return True  # Supabase cascades delete to positions/logs


# ============================================================================
# POSITION SERVICES
# ============================================================================

async def get_model_positions(model_id: int, user_id: str) -> List[Dict]:
    """Get all positions for a model (checks ownership)"""
    # First verify ownership
    model = await get_model_by_id(model_id, user_id)
    if not model:
        return []
    
    supabase = get_supabase()
    
    result = supabase.table("positions").select("*").eq("model_id", model_id).order("date", desc=True).order("action_id", desc=False).execute()
    
    return result.data if result.data else []


async def get_latest_position(model_id: int, user_id: str) -> Optional[Dict]:
    """Get latest position for a model with calculated total value"""
    supabase = get_supabase()
    
    # Verify ownership
    model = await get_model_by_id(model_id, user_id)
    if not model:
        return None
    
    result = supabase.table("positions").select("*").eq("model_id", model_id).order("date", desc=True).order("id", desc=True).limit(2).execute()
    
    if result.data and len(result.data) > 0:
        position_data = result.data[0]
        prev_position = result.data[1] if len(result.data) > 1 else None
        
        # Calculate total value including stocks
        positions_dict = position_data.get("positions", {})
        cash = position_data.get("cash", 0) or positions_dict.get("CASH", 0)
        date_str = str(position_data.get("date", ""))
        minute_time = position_data.get("minute_time")
        
        # Calculate stock values
        stocks_value = 0.0
        
        # For intraday: derive price from trade
        if minute_time and prev_position:
            action_type = position_data.get("action_type")
            symbol = position_data.get("symbol")
            amount = position_data.get("amount")
            
            print(f"🔍 Intraday position detected:")
            print(f"   Minute: {minute_time}")
            print(f"   Action: {action_type} {amount} {symbol}")
            print(f"   Has prev: {prev_position is not None}")
            
            if action_type and symbol and amount and amount > 0:
                prev_cash = prev_position.get("cash", 0)
                cash_change = abs(cash - prev_cash)
                trade_price = cash_change / amount if amount > 0 else 0
                
                print(f"   Price derived: ${trade_price:.2f}")
                print(f"   Holdings: {positions_dict}")
                
                # Value all holdings at this price
                for sym, shares in positions_dict.items():
                    if sym != 'CASH' and shares > 0:
                        stock_val = shares * trade_price
                        stocks_value += stock_val
                        print(f"   {sym}: {shares} × ${trade_price:.2f} = ${stock_val:.2f}")
            else:
                print(f"   ⚠️ Missing data for price calculation")
        else:
            # For daily: use stock_prices table
            try:
                from utils.price_tools import get_open_prices
                symbols = [s for s in positions_dict.keys() if s != 'CASH']
                if symbols and date_str:
                    prices = get_open_prices(date_str, symbols)
                    
                    for symbol, shares in positions_dict.items():
                        if symbol != 'CASH' and shares > 0:
                            price_key = f'{symbol}_price'
                            price = prices.get(price_key, 0)
                            if price:
                                stocks_value += shares * price
            except Exception as e:
                print(f"Warning: Could not get prices for model {model_id}: {e}")
        
        total_value = cash + stocks_value
        
        # Add calculated fields
        position_data['model_name'] = model.get('signature', f'model-{model_id}')
        position_data['cash'] = cash
        position_data['stocks_value'] = stocks_value
        position_data['total_value'] = total_value
        
        return position_data
    return None


async def create_position(model_id: int, position_data: Dict) -> Dict:
    """Insert new position record"""
    supabase = get_supabase()
    
    result = supabase.table("positions").insert(position_data).execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]
    return {}


# ============================================================================
# LOG SERVICES
# ============================================================================

async def get_model_logs(model_id: int, user_id: str, trade_date: Optional[str] = None) -> List[Dict]:
    """Get logs for a model, optionally filtered by date"""
    # Verify ownership
    model = await get_model_by_id(model_id, user_id)
    if not model:
        return []
    
    supabase = get_supabase()
    
    query = supabase.table("logs").select("*").eq("model_id", model_id)
    
    if trade_date:
        query = query.eq("date", trade_date)
    
    result = query.order("timestamp", desc=False).execute()
    
    return result.data if result.data else []


async def create_log(model_id: int, log_data: Dict) -> Dict:
    """Insert new log entry"""
    supabase = get_supabase()
    
    result = supabase.table("logs").insert(log_data).execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]
    return {}


# ============================================================================
# STOCK PRICE SERVICES
# ============================================================================

async def get_stock_prices(symbol: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict]:
    """Get stock prices (public data)"""
    supabase = get_supabase()
    
    query = supabase.table("stock_prices").select("*")
    
    if symbol:
        query = query.eq("symbol", symbol)
    if start_date:
        query = query.gte("date", start_date)
    if end_date:
        query = query.lte("date", end_date)
    
    result = query.order("date", desc=True).execute()
    
    return result.data if result.data else []


async def create_stock_price(price_data: Dict) -> Dict:
    """Insert stock price (admin only)"""
    supabase = get_supabase()
    
    result = supabase.table("stock_prices").insert(price_data).execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]
    return {}


# ============================================================================
# PERFORMANCE METRICS SERVICES
# ============================================================================

async def get_model_performance(model_id: int, user_id: str) -> Optional[Dict]:
    """Get performance metrics for a model"""
    # Verify ownership
    model = await get_model_by_id(model_id, user_id)
    if not model:
        return None
    
    supabase = get_supabase()
    
    result = supabase.table("performance_metrics").select("*").eq("model_id", model_id).order("end_date", desc=True).limit(1).execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]
    return None


async def calculate_and_cache_performance(model_id: int, model_signature: str) -> Dict:
    """Calculate performance metrics and cache in database"""
    # Use database-based calculation (not JSONL files)
    metrics = calculate_all_metrics_db(model_id)
    
    if "error" in metrics:
        return metrics
    
    supabase = get_supabase()
    
    # Fetch model configuration for context
    model_result = supabase.table("models").select("trading_style, margin_account").eq("id", model_id).execute()
    
    if model_result.data and len(model_result.data) > 0:
        trading_style = model_result.data[0].get("trading_style", "day-trading")
        margin_account = model_result.data[0].get("margin_account", False)
        
        # Calculate leverage used
        if not margin_account:
            leverage_used = 1.0
        elif trading_style in ['scalping', 'day-trading']:
            leverage_used = 4.0  # Day trading margin
        else:
            leverage_used = 2.0  # Standard margin
    else:
        trading_style = "day-trading"
        margin_account = False
        leverage_used = 1.0
    
    # Helper function to convert empty strings to None for date fields
    def clean_date(value):
        """Convert empty strings to None for PostgreSQL date columns"""
        return None if value == "" or value is None else value
    
    # Prepare data for database
    perf_data = {
        "model_id": model_id,
        "start_date": clean_date(metrics.get("start_date")),
        "end_date": clean_date(metrics.get("end_date")),
        "total_trading_days": metrics.get("total_trading_days", 0),
        "cumulative_return": metrics.get("cumulative_return", 0.0),
        "annualized_return": metrics.get("annualized_return", 0.0),
        "sharpe_ratio": metrics.get("sharpe_ratio", 0.0),
        "max_drawdown": metrics.get("max_drawdown", 0.0),
        "max_drawdown_start": clean_date(metrics.get("max_drawdown_start")),
        "max_drawdown_end": clean_date(metrics.get("max_drawdown_end")),
        "volatility": metrics.get("volatility", 0.0),
        "win_rate": metrics.get("win_rate", 0.0),
        "profit_loss_ratio": metrics.get("profit_loss_ratio", 0.0),
        "initial_value": metrics.get("initial_value", 10000.0),
        "final_value": metrics.get("final_value", 10000.0),
        # NEW: Add context for proper comparison
        "trading_style": trading_style,
        "margin_account": margin_account,
        "leverage_used": leverage_used
    }
    
    # Upsert (insert or update if exists)
    result = supabase.table("performance_metrics").upsert(perf_data).execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]
    return perf_data


# ============================================================================
# LEADERBOARD SERVICES (Admin Only)
# ============================================================================

async def get_admin_leaderboard() -> List[Dict]:
    """Admin only: Get leaderboard of all models across all users"""
    supabase = get_supabase()
    
    # Join models, performance_metrics, and profiles
    result = supabase.table("models").select(
        "id, signature, user_id, profiles(email), performance_metrics(cumulative_return, sharpe_ratio, max_drawdown, final_value, total_trading_days)"
    ).execute()
    
    if not result.data:
        return []
    
    # Format for leaderboard
    leaderboard = []
    for item in result.data:
        metrics = item.get("performance_metrics", [])
        if metrics and len(metrics) > 0:
            latest_metrics = metrics[0]  # Most recent
            
            leaderboard.append({
                "model_id": item["id"],
                "model_name": item["signature"],
                "user_id": item["user_id"],
                "user_email": item.get("profiles", {}).get("email", "unknown"),
                "cumulative_return": latest_metrics.get("cumulative_return", 0.0),
                "sharpe_ratio": latest_metrics.get("sharpe_ratio", 0.0),
                "max_drawdown": latest_metrics.get("max_drawdown", 0.0),
                "final_value": latest_metrics.get("final_value", 10000.0),
                "trading_days": latest_metrics.get("total_trading_days", 0)
            })
    
    # Sort by cumulative return (descending)
    leaderboard.sort(key=lambda x: x["cumulative_return"], reverse=True)
    
    # Add ranks
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1
    
    return leaderboard


# ============================================================================
# SYSTEM STATS (Admin Only)
# ============================================================================

async def get_system_stats() -> Dict:
    """Admin only: Get system-wide statistics"""
    supabase = get_supabase()
    
    # Count users
    users_result = supabase.table("profiles").select("id, role", count="exact").execute()
    total_users = users_result.count or 0
    
    admin_count = len([u for u in users_result.data if u.get("role") == "admin"]) if users_result.data else 0
    user_count = total_users - admin_count
    
    # Count models
    models_result = supabase.table("models").select("id", count="exact").execute()
    total_models = models_result.count or 0
    active_models = total_models  # Assume all active for now
    
    # Count positions
    positions_result = supabase.table("positions").select("id", count="exact").execute()
    total_positions = positions_result.count or 0
    
    # Count logs
    logs_result = supabase.table("logs").select("id", count="exact").execute()
    total_logs = logs_result.count or 0
    
    return {
        "total_users": total_users,
        "admin_count": admin_count,
        "user_count": user_count,
        "total_models": total_models,
        "active_models": active_models,
        "total_positions": total_positions,
        "total_logs": total_logs
    }

