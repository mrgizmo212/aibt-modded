"""
Performance Metrics Calculation - Database Version
Replaces JSONL file reading with Supabase queries

All calculations now use positions table instead of local files
"""

import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

def get_supabase() -> Client:
    """Get Supabase client"""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, key)


def get_available_date_range_db(model_id: int) -> Tuple[str, str]:
    """
    Get available data date range from database
    
    Args:
        model_id: Model ID
    
    Returns:
        Tuple of (earliest_date, latest_date) in YYYY-MM-DD format
    """
    supabase = get_supabase()
    
    # Get min and max dates from positions
    result = supabase.table("positions")\
        .select("date")\
        .eq("model_id", model_id)\
        .order("date", desc=False)\
        .limit(1)\
        .execute()
    
    if not result.data:
        return "", ""
    
    earliest = result.data[0]["date"]
    
    result = supabase.table("positions")\
        .select("date")\
        .eq("model_id", model_id)\
        .order("date", desc=True)\
        .limit(1)\
        .execute()
    
    if not result.data:
        return earliest, earliest
    
    latest = result.data[0]["date"]
    
    return earliest, latest


def get_daily_portfolio_values_db(
    model_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Dict[str, float]:
    """
    Get daily portfolio values from database
    
    Handles both daily and intraday positions:
    - Daily: Uses last position of the day (minute_time IS NULL)
    - Intraday: Uses last minute of the day (MAX minute_time)
    
    Args:
        model_id: Model ID
        start_date: Start date YYYY-MM-DD (optional)
        end_date: End date YYYY-MM-DD (optional)
    
    Returns:
        Dict[date, total_portfolio_value]
    """
    supabase = get_supabase()
    
    # Build query
    query = supabase.table("positions").select("*").eq("model_id", model_id)
    
    if start_date:
        query = query.gte("date", start_date)
    if end_date:
        query = query.lte("date", end_date)
    
    result = query.order("date").order("minute_time", desc=False).execute()
    
    if not result.data:
        return {}
    
    # Group by date and get last position of each day
    daily_values = {}
    current_date = None
    last_position_of_day = None
    
    for pos in result.data:
        pos_date = pos["date"]
        
        # New day encountered
        if pos_date != current_date:
            # Save previous day's final position
            if current_date and last_position_of_day:
                daily_values[current_date] = calculate_portfolio_value_db(last_position_of_day)
            
            current_date = pos_date
            last_position_of_day = pos
        else:
            # Same day, update to latest position
            last_position_of_day = pos
    
    # Don't forget the last day
    if current_date and last_position_of_day:
        daily_values[current_date] = calculate_portfolio_value_db(last_position_of_day)
    
    return daily_values


def calculate_portfolio_value_db(position_record: Dict) -> float:
    """
    Calculate total portfolio value from a position record
    
    Args:
        position_record: Database position record with 'cash' and 'positions' fields
    
    Returns:
        Total portfolio value (cash + stock values)
    """
    from utils.price_tools import get_open_prices
    
    cash = position_record.get("cash", 0.0)
    positions = position_record.get("positions", {})
    date = position_record.get("date")
    
    if not date:
        return cash
    
    # Get stock symbols (exclude CASH)
    symbols = [s for s in positions.keys() if s != 'CASH' and positions[s] > 0]
    
    if not symbols:
        return cash
    
    try:
        # Get prices for this date
        prices = get_open_prices(date, symbols)
        
        # Calculate total value
        total_value = cash
        
        for symbol in symbols:
            shares = positions.get(symbol, 0)
            price_key = f'{symbol}_price'
            price = prices.get(price_key, 0)
            
            if price and shares > 0:
                total_value += shares * price
        
        return total_value
        
    except Exception as e:
        print(f"Warning: Could not calculate stock values: {e}")
        return cash  # Fallback to cash only


def calculate_all_metrics_db(
    model_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Dict:
    """
    Calculate all performance metrics from database
    
    Args:
        model_id: Model ID
        start_date: Start date YYYY-MM-DD (optional)
        end_date: End date YYYY-MM-DD (optional)
    
    Returns:
        Dictionary with all performance metrics
    """
    
    # Get date range if not specified
    if start_date is None or end_date is None:
        earliest, latest = get_available_date_range_db(model_id)
        if not earliest or not latest:
            return _empty_metrics()
        
        if start_date is None:
            start_date = earliest
        if end_date is None:
            end_date = latest
    
    # Get daily portfolio values
    portfolio_values = get_daily_portfolio_values_db(model_id, start_date, end_date)
    
    if not portfolio_values or len(portfolio_values) < 2:
        return _empty_metrics()
    
    # Convert to sorted lists
    dates = sorted(portfolio_values.keys())
    values = [portfolio_values[d] for d in dates]
    
    # Calculate daily returns
    daily_returns = []
    for i in range(1, len(values)):
        if values[i-1] > 0:
            ret = (values[i] - values[i-1]) / values[i-1]
            daily_returns.append(ret)
    
    if not daily_returns:
        return _empty_metrics()
    
    # Convert to numpy array
    returns_array = np.array(daily_returns)
    
    # Calculate metrics
    initial_value = values[0]
    final_value = values[-1]
    cumulative_return = (final_value - initial_value) / initial_value if initial_value > 0 else 0
    
    # Volatility (std of daily returns)
    volatility = float(np.std(returns_array)) if len(returns_array) > 1 else 0.0
    
    # Sharpe Ratio (assuming 0 risk-free rate)
    mean_return = float(np.mean(returns_array))
    sharpe_ratio = (mean_return / volatility * np.sqrt(252)) if volatility > 0 else 0.0
    
    # Max Drawdown
    max_drawdown, dd_start, dd_end = calculate_max_drawdown(values, dates)
    
    # Annualized Return
    trading_days = len(dates)
    years = trading_days / 252.0
    annualized_return = ((final_value / initial_value) ** (1 / years) - 1) if years > 0 and initial_value > 0 else 0.0
    
    # Win/Loss metrics
    wins = sum(1 for r in daily_returns if r > 0)
    losses = sum(1 for r in daily_returns if r < 0)
    total_trades = wins + losses
    win_rate = wins / total_trades if total_trades > 0 else 0.0
    
    # P/L Ratio
    winning_returns = [r for r in daily_returns if r > 0]
    losing_returns = [r for r in daily_returns if r < 0]
    avg_win = float(np.mean(winning_returns)) if winning_returns else 0.0
    avg_loss = float(np.mean(losing_returns)) if losing_returns else 0.0
    pl_ratio = abs(avg_win / avg_loss) if avg_loss != 0 else 0.0
    
    return {
        "portfolio_values": portfolio_values,
        "daily_returns": daily_returns,
        "sharpe_ratio": float(sharpe_ratio),
        "max_drawdown": float(max_drawdown),
        "max_drawdown_start": dd_start,
        "max_drawdown_end": dd_end,
        "cumulative_return": float(cumulative_return),
        "annualized_return": float(annualized_return),
        "volatility": float(volatility),
        "win_rate": float(win_rate),
        "profit_loss_ratio": float(pl_ratio),
        "total_trading_days": trading_days,
        "start_date": start_date,
        "end_date": end_date,
        "initial_value": initial_value,
        "final_value": final_value
    }


def calculate_max_drawdown(values: List[float], dates: List[str]) -> Tuple[float, str, str]:
    """
    Calculate maximum drawdown
    
    Returns:
        (max_drawdown, start_date, end_date)
    """
    if len(values) < 2:
        return 0.0, "", ""
    
    max_dd = 0.0
    dd_start = ""
    dd_end = ""
    
    peak = values[0]
    peak_date = dates[0]
    
    for i, val in enumerate(values):
        if val > peak:
            peak = val
            peak_date = dates[i]
        
        dd = (peak - val) / peak if peak > 0 else 0
        
        if dd > max_dd:
            max_dd = dd
            dd_start = peak_date
            dd_end = dates[i]
    
    return max_dd, dd_start, dd_end


def _empty_metrics() -> Dict:
    """Return empty metrics structure"""
    return {
        "error": "No data available",
        "portfolio_values": {},
        "daily_returns": [],
        "sharpe_ratio": 0.0,
        "max_drawdown": 0.0,
        "max_drawdown_start": "",
        "max_drawdown_end": "",
        "cumulative_return": 0.0,
        "annualized_return": 0.0,
        "volatility": 0.0,
        "win_rate": 0.0,
        "profit_loss_ratio": 0.0,
        "total_trading_days": 0,
        "start_date": "",
        "end_date": "",
        "initial_value": 10000.0,
        "final_value": 10000.0
    }

