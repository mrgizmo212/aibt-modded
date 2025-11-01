"""
Risk Gates - Hard-Coded Safety System
Additional safety layer that CANNOT be disabled by users
Pattern from ttgaibots
"""

from typing import Dict, Tuple, Optional

class RiskGates:
    """
    Hard-coded safety gates that run on EVERY trade
    These provide baseline safety regardless of user rules
    """
    
    def __init__(self, model_id: int, user_profile: Optional[Dict] = None):
        self.model_id = model_id
        self.user_profile = user_profile or {}
    
    def validate_all(
        self,
        action: str,
        symbol: str,
        amount: int,
        price: float,
        portfolio_snapshot: Dict
    ) -> Tuple[bool, Optional[str]]:
        """
        Run all hard-coded safety gates
        
        Args:
            action: 'buy' | 'sell' | 'short' | 'cover'
            symbol: Stock symbol
            amount: Quantity
            price: Price per unit
            portfolio_snapshot: {
                'cash': float,
                'positions': Dict,
                'total_value': float,
                'initial_value': float,
                'daily_pnl': float (optional)
            }
        
        Returns:
            (passed, reason_if_failed)
        """
        
        # ====================================================================
        # GATE 1: Prevent Negative Cash
        # ====================================================================
        if action in ['buy', 'short']:
            cash_after = portfolio_snapshot['cash'] - (amount * price)
            if cash_after < 0:
                return False, f"SAFETY GATE: Would result in negative cash (${cash_after:.2f})"
        
        # ====================================================================
        # GATE 2: Prevent Selling More Than Owned
        # ====================================================================
        if action == 'sell':
            owned = portfolio_snapshot['positions'].get(symbol, 0)
            if amount > owned:
                return False, f"SAFETY GATE: Cannot sell {amount} {symbol}, only own {owned}"
        
        # ====================================================================
        # GATE 3: Prevent Covering More Than Shorted
        # ====================================================================
        if action == 'cover':
            short_key = f"{symbol}_short"
            short_position = portfolio_snapshot['positions'].get(short_key, 0)
            if amount > abs(short_position):
                return False, f"SAFETY GATE: Cannot cover {amount} {symbol}, only short {abs(short_position)}"
        
        # ====================================================================
        # GATE 4: Daily Loss Circuit Breaker (if user profile set)
        # ====================================================================
        if self.user_profile.get('stop_trading_if_daily_loss_exceeds'):
            daily_pnl = portfolio_snapshot.get('daily_pnl', 0)
            max_loss = abs(self.user_profile['stop_trading_if_daily_loss_exceeds'])
            
            if daily_pnl < -max_loss:
                return False, f"CIRCUIT BREAKER: Daily loss ${abs(daily_pnl):.2f} exceeds user limit ${max_loss:.2f}"
        
        # ====================================================================
        # GATE 5: Portfolio Drawdown Limit (25% hard limit)
        # ====================================================================
        initial_value = portfolio_snapshot.get('initial_value', 10000)
        current_value = portfolio_snapshot['total_value']
        
        if initial_value > 0:
            drawdown = (initial_value - current_value) / initial_value
            
            if drawdown > 0.25:  # 25% drawdown hard limit
                return False, f"CIRCUIT BREAKER: Portfolio down {drawdown*100:.1f}% from initial value (25% max allowed)"
        
        # ====================================================================
        # GATE 6: Prevent Extreme Position Sizes (50% hard limit)
        # ====================================================================
        if action in ['buy', 'short']:
            trade_value = amount * price
            total_value = portfolio_snapshot.get('total_value', portfolio_snapshot['cash'])
            extreme_threshold = total_value * 0.50  # 50% hard limit
            
            if trade_value > extreme_threshold:
                return False, f"SAFETY GATE: Single trade of ${trade_value:.2f} would be {trade_value/total_value*100:.1f}% of portfolio (50% max)"
        
        # ====================================================================
        # GATE 7: Minimum Cash Reserve (10% hard limit)
        # ====================================================================
        if action in ['buy', 'short']:
            cash_after = portfolio_snapshot['cash'] - (amount * price)
            total_value = portfolio_snapshot.get('total_value', portfolio_snapshot['cash'])
            min_cash = total_value * 0.10  # 10% minimum
            
            if cash_after < min_cash:
                return False, f"SAFETY GATE: Must maintain minimum 10% cash reserve (${min_cash:.2f}), would have ${cash_after:.2f}"
        
        return True, None  # All gates passed


def create_risk_gates(model_id: int, user_profile: Optional[Dict] = None) -> RiskGates:
    """Factory function to create risk gates"""
    return RiskGates(model_id, user_profile)

