"""
Configuration Validator
Validates trades against model configuration before execution
"""

from typing import Dict, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from trading.base_agent import BaseAgent


def validate_trade_config(trade: Dict, agent: 'BaseAgent') -> Dict:
    """
    Validate trade against model configuration
    
    Args:
        trade: {
            "action": "BUY" | "SELL" | "SHORT",
            "symbol": str,
            "quantity": int,
            "order_type": str (default: "market"),
            "price": float,
            "instrument": str (default: "stocks")
        }
        agent: BaseAgent instance with configuration
    
    Returns:
        {
            "valid": bool,
            "error": str (if invalid),
            "rule_violated": str (if invalid)
        }
    """
    
    # 1. Validate Instrument
    trade_instrument = trade.get("instrument", "stocks")
    if trade_instrument != agent.instrument:
        return {
            "valid": False,
            "error": f"Instrument '{trade_instrument}' not allowed. Model configured for {agent.instrument} only.",
            "rule_violated": "instrument"
        }
    
    # 2. Validate Shorting
    action = trade.get("action", "").upper()
    if action in ["SHORT", "SELL_SHORT"]:
        if not agent.allow_shorting:
            return {
                "valid": False,
                "error": "Short selling is disabled for this model. You can only go long (BUY shares).",
                "rule_violated": "allow_shorting"
            }
        
        if not agent.margin_account:
            return {
                "valid": False,
                "error": "Short selling requires a margin account. Current account is cash only.",
                "rule_violated": "margin_account"
            }
        
        # Validate margin requirements for short
        quantity = trade.get("quantity", 0)
        price = trade.get("price", 0)
        short_value = quantity * price
        margin_required = short_value * 0.5  # 50% margin requirement
        
        # Get current buying power
        current_cash = trade.get("current_cash", agent.initial_cash)
        buying_power = current_cash * agent.buying_power_multiplier
        
        if margin_required > buying_power:
            return {
                "valid": False,
                "error": f"Insufficient margin for short. Need ${margin_required:,.2f}, have ${buying_power:,.2f} buying power.",
                "rule_violated": "margin_requirement"
            }
    
    # 3. Validate Order Type
    order_type = trade.get("order_type", "market").lower()
    allowed_types_lower = [ot.lower() for ot in agent.allowed_order_types]
    
    if order_type not in allowed_types_lower:
        return {
            "valid": False,
            "error": f"Order type '{order_type}' not allowed. Allowed types: {', '.join(agent.allowed_order_types)}",
            "rule_violated": "allowed_order_types"
        }
    
    # 4. Validate Options Strategies (future - when implemented)
    is_multi_leg = trade.get("strategy_type") in ["spread", "straddle", "iron_condor", "butterfly"]
    if is_multi_leg and not agent.allow_options_strategies:
        return {
            "valid": False,
            "error": "Multi-leg option strategies are disabled for this model. Single-leg only.",
            "rule_violated": "allow_options_strategies"
        }
    
    # 5. Validate Hedging (future - when implemented)
    is_hedge = trade.get("is_hedge", False) or trade.get("hedge_for_position_id")
    if is_hedge and not agent.allow_hedging:
        return {
            "valid": False,
            "error": "Hedging is disabled for this model. Each position must be directional only.",
            "rule_violated": "allow_hedging"
        }
    
    # All validations passed
    return {"valid": True}


async def log_config_rejection(
    trade: Dict,
    validation_result: Dict,
    model_id: int,
    minute: str,
    run_id: Optional[int] = None
):
    """
    Log configuration validation rejection to database
    
    Args:
        trade: The rejected trade
        validation_result: Validation result with error
        model_id: Model ID
        minute: Current trading minute
        run_id: Optional run ID
    """
    from config import settings
    from supabase import create_client
    import json
    
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    
    # Parse minute to get date and time
    if ' ' in minute:
        trade_date, minute_time = minute.split()
    else:
        trade_date = minute
        minute_time = None
    
    log_entry = {
        "model_id": model_id,
        "run_id": run_id,
        "log_type": "config_violation",
        "trade_date": trade_date,
        "minute_time": minute_time,
        "message": f"CONFIG VIOLATION: {validation_result['error']}",
        "metadata": json.dumps({
            "attempted_trade": trade,
            "rule_violated": validation_result.get("rule_violated"),
            "error": validation_result["error"]
        })
    }
    
    try:
        supabase.table("logs").insert(log_entry).execute()
        print(f"    📝 Config violation logged to database")
    except Exception as e:
        print(f"    ⚠️ Failed to log rejection: {e}")

