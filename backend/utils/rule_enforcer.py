"""
Rule Enforcement Engine
Validates trades against structured rules before execution
Pattern from ttgaibots risk gates
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime
from supabase import Client

class RuleEnforcer:
    """
    Enforces structured trading rules programmatically
    
    Usage:
        enforcer = RuleEnforcer(supabase, model_id)
        is_valid, reason = enforcer.validate_trade(
            action="buy",
            symbol="AAPL",
            amount=10,
            price=150.00,
            current_position={"CASH": 5000, "AAPL": 10},
            total_portfolio_value=10000.00
        )
        
        if not is_valid:
            reject_trade(reason)
    """
    
    def __init__(self, supabase: Client, model_id: int):
        self.supabase = supabase
        self.model_id = model_id
        self.rules = self._load_active_rules()
    
    def _load_active_rules(self) -> List[Dict]:
        """Load active rules from database, sorted by priority"""
        result = self.supabase.table("model_rules")\
            .select("*")\
            .eq("model_id", self.model_id)\
            .eq("is_active", True)\
            .order("priority", desc=True)\
            .execute()
        
        return result.data or []
    
    def validate_trade(
        self,
        action: str,
        symbol: str,
        amount: int,
        price: float,
        current_position: Dict,
        total_portfolio_value: float,
        asset_type: str = 'equity',
        current_time: Optional[datetime] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate trade against all active rules
        
        Args:
            action: 'buy' | 'sell' | 'short' | 'cover'
            symbol: Stock symbol
            amount: Number of shares/contracts
            price: Price per share
            current_position: Current portfolio state
            total_portfolio_value: Total portfolio value
            asset_type: 'equity' | 'option' | 'crypto' | 'future'
            current_time: Time of trade (for timing rules)
        
        Returns:
            (is_valid, rejection_reason)
        """
        
        for rule in self.rules:
            # Check if rule applies to this asset type
            applies_to = rule.get("applies_to_assets", ['equity'])
            if asset_type not in applies_to:
                continue
            
            # Check symbol whitelist
            if rule.get("applies_to_symbols") and symbol not in rule["applies_to_symbols"]:
                continue
            
            # Check symbol blacklist
            if rule.get("exclude_symbols") and symbol in rule["exclude_symbols"]:
                return False, f"Rule '{rule['rule_name']}': Symbol {symbol} is on exclusion list"
            
            # Get enforcement parameters
            params = rule.get("enforcement_params", {})
            category = rule["rule_category"]
            
            # ====================================================================
            # POSITION SIZING RULES
            # ====================================================================
            if category == "position_sizing":
                max_position_pct = params.get("max_position_pct")
                if max_position_pct and action in ['buy', 'short']:
                    trade_value = amount * price
                    max_allowed = total_portfolio_value * max_position_pct
                    
                    if trade_value > max_allowed:
                        return False, f"Rule '{rule['rule_name']}': Trade value ${trade_value:.2f} exceeds {max_position_pct*100}% limit (${max_allowed:.2f})"
            
            # ====================================================================
            # RISK MANAGEMENT RULES
            # ====================================================================
            elif category == "risk":
                # Max positions check
                max_positions = params.get("max_positions")
                if max_positions and action in ['buy', 'short']:
                    current_positions = len([s for s in current_position if s != 'CASH' and current_position[s] > 0])
                    if current_positions >= max_positions:
                        return False, f"Rule '{rule['rule_name']}': Already at max {max_positions} open positions"
                
                # Min cash reserve check
                min_cash_reserve_pct = params.get("min_cash_reserve_pct")
                if min_cash_reserve_pct and action in ['buy', 'short']:
                    cash_after = current_position.get("CASH", 0) - (amount * price)
                    min_required = total_portfolio_value * min_cash_reserve_pct
                    
                    if cash_after < min_required:
                        return False, f"Rule '{rule['rule_name']}': Would violate {min_cash_reserve_pct*100}% cash reserve (need ${min_required:.2f}, would have ${cash_after:.2f})"
                
                # Max trades per session
                max_trades = params.get("max_trades_per_session")
                if max_trades:
                    # This would need to be tracked during session
                    # For now, just a placeholder for the check
                    pass
            
            # ====================================================================
            # TIMING RULES
            # ====================================================================
            elif category == "timing":
                if current_time:
                    # Blackout periods (no trading during these times)
                    blackout_start = params.get("blackout_start")
                    blackout_end = params.get("blackout_end")
                    
                    if blackout_start and blackout_end:
                        current_time_only = current_time.time()
                        start_time = datetime.strptime(blackout_start, "%H:%M").time()
                        end_time = datetime.strptime(blackout_end, "%H:%M").time()
                        
                        if start_time <= current_time_only <= end_time:
                            return False, f"Rule '{rule['rule_name']}': Trading not allowed during {blackout_start}-{blackout_end}"
            
            # ====================================================================
            # SCREENING RULES
            # ====================================================================
            elif category == "screening":
                # Stock must be on approved list (from Finviz/screening)
                approved_symbols = params.get("approved_symbols", [])
                if approved_symbols and symbol not in approved_symbols:
                    return False, f"Rule '{rule['rule_name']}': Symbol {symbol} not on approved screening list"
                
                # Check required screening passed
                requires_screening = params.get("requires_screening", False)
                if requires_screening:
                    # Would need to verify symbol passed screening
                    # Placeholder for now
                    pass
        
        return True, None  # All rules passed!


def create_rule_enforcer(supabase: Client, model_id: int) -> RuleEnforcer:
    """Factory function to create rule enforcer"""
    return RuleEnforcer(supabase, model_id)

