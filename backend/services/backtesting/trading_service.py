"""
Trading Service - Backtesting Execution Layer
Replaces MCP trade subprocess with internal service

FIXES: SIGNATURE subprocess isolation issue by querying database directly
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional
from supabase import Client


class TradingService:
    """
    Internal trading execution service for backtesting
    
    Replaces MCP tool_trade.py subprocess with direct database access.
    Fixes SIGNATURE issue by querying Supabase instead of relying on 
    subprocess environment variables.
    
    Features:
    - Database signature lookup (no subprocess isolation)
    - File-based position tracking (same as current)
    - Full validation (cash, shares, prices)
    - Error handling and logging
    
    Future:
    - Can extend for options, shorts, multi-leg strategies
    - Can add database position storage
    - Can integrate with live trading service
    """
    
    def __init__(self, supabase_client: Client):
        """
        Initialize TradingService
        
        Args:
            supabase_client: Supabase client instance for database access
        """
        self.supabase = supabase_client
        self.project_root = Path(__file__).parent.parent.parent
    
    def execute_trade(
        self,
        action: str,
        symbol: str,
        amount: int,
        model_id: int,
        date: str,
        execution_source: str = "ai"
    ) -> Dict[str, Any]:
        """
        Execute trade (buy or sell)
        
        Args:
            action: "buy" or "sell"
            symbol: Stock ticker (e.g., "AAPL", "IBM")
            amount: Number of shares
            model_id: Database model ID
            date: Trading date (YYYY-MM-DD)
            execution_source: "ai" or "manual" (for future collaborative trading)
        
        Returns:
            Dict with new position or error
        
        Raises:
            ValueError: Invalid parameters
        """
        if action == "buy":
            return self.buy(symbol, amount, model_id, date, execution_source)
        elif action == "sell":
            return self.sell(symbol, amount, model_id, date, execution_source)
        else:
            raise ValueError(f"Invalid action: {action}. Must be 'buy' or 'sell'")
    
    def buy(
        self,
        symbol: str,
        amount: int,
        model_id: int,
        date: str,
        execution_source: str = "ai"
    ) -> Dict[str, Any]:
        """
        Execute buy order
        
        Steps:
        1. Get signature from database (FIXES subprocess isolation!)
        2. Get current position and action ID
        3. Get stock price for the date
        4. Validate sufficient cash
        5. Execute trade (update position)
        6. Write to position.jsonl file
        7. Return new position
        
        Args:
            symbol: Stock ticker
            amount: Number of shares to buy
            model_id: Database model ID
            date: Trading date (YYYY-MM-DD)
            execution_source: "ai" or "manual"
        
        Returns:
            New position dict or error dict
        """
        # Step 1: Get signature from DATABASE (NO subprocess issue!)
        signature = self._get_signature(model_id)
        if not signature:
            return {
                "error": f"Model {model_id} not found",
                "model_id": model_id
            }
        
        print(f"  🔑 Signature for model {model_id}: {signature}")
        
        # Step 2: Get current position and action ID
        from utils.price_tools import get_latest_position
        
        try:
            current_position, current_action_id = get_latest_position(date, signature)
        except Exception as e:
            print(f"  ❌ Error getting position: {e}")
            return {
                "error": f"Could not get current position: {str(e)}",
                "symbol": symbol,
                "date": date
            }
        
        # Step 3: Get stock price for the date
        from utils.price_tools import get_open_prices
        
        try:
            prices = get_open_prices(date, [symbol])
            current_price = prices.get(f'{symbol}_price')
            
            if current_price is None:
                return {
                    "error": f"Symbol {symbol} not found! This action will not be allowed.",
                    "symbol": symbol,
                    "date": date
                }
        except Exception as e:
            print(f"  ❌ Error getting price: {e}")
            return {
                "error": f"Could not get price for {symbol}: {str(e)}",
                "symbol": symbol,
                "date": date
            }
        
        # Step 4: Validate sufficient cash
        cost = current_price * amount
        cash_available = current_position.get("CASH", 0)
        cash_left = cash_available - cost
        
        if cash_left < 0:
            return {
                "error": "Insufficient cash! This action will not be allowed.",
                "required_cash": cost,
                "cash_available": cash_available,
                "symbol": symbol,
                "date": date,
                "price": current_price
            }
        
        # Step 5: Execute trade - update position
        new_position = current_position.copy()
        new_position["CASH"] = cash_left
        new_position[symbol] = new_position.get(symbol, 0) + amount
        
        # Step 6: Write to position.jsonl file
        position_file_path = self.project_root / "data" / "agent_data" / signature / "position" / "position.jsonl"
        
        # Ensure directory exists
        position_file_path.parent.mkdir(parents=True, exist_ok=True)
        
        trade_record = {
            "date": date,
            "id": current_action_id + 1,
            "this_action": {
                "action": "buy",
                "symbol": symbol,
                "amount": amount
            },
            "positions": new_position,
            "metadata": {
                "price": current_price,
                "cost": cost,
                "execution_source": execution_source
            }
        }
        
        try:
            with open(position_file_path, "a") as f:
                f.write(json.dumps(trade_record) + "\n")
            
            print(f"  ✅ BUY executed: {amount} {symbol} @ ${current_price:.2f} (cost: ${cost:.2f})")
            print(f"  💰 New cash: ${cash_left:.2f} (was ${cash_available:.2f})")
            
        except Exception as e:
            print(f"  ❌ Error writing position file: {e}")
            return {
                "error": f"Trade executed but could not save: {str(e)}",
                "symbol": symbol,
                "date": date
            }
        
        # Step 7: Also write to DATABASE for frontend
        try:
            self.supabase.table("positions").insert({
                "model_id": model_id,
                "date": date,
                "minute_time": None,  # For intraday, could track minute
                "action_id": current_action_id + 1,
                "action_type": "buy",
                "symbol": symbol,
                "quantity": amount,
                "price": current_price,
                "cost": cost,
                "cash_after": cash_left,
                "reasoning": f"{execution_source} buy"
            }).execute()
            
            print(f"  💾 Saved to database")
            
        except Exception as e:
            print(f"  ⚠️  Database write failed (file write succeeded): {e}")
            # Don't fail the trade if DB write fails
        
        # Step 8: Return new position
        return new_position
    
    def sell(
        self,
        symbol: str,
        amount: int,
        model_id: int,
        date: str,
        execution_source: str = "ai"
    ) -> Dict[str, Any]:
        """
        Execute sell order
        
        Steps:
        1. Get signature from database
        2. Get current position and action ID
        3. Get stock price for the date
        4. Validate position exists and sufficient shares
        5. Execute trade (update position)
        6. Write to position.jsonl file
        7. Return new position
        
        Args:
            symbol: Stock ticker
            amount: Number of shares to sell
            model_id: Database model ID
            date: Trading date (YYYY-MM-DD)
            execution_source: "ai" or "manual"
        
        Returns:
            New position dict or error dict
        """
        # Step 1: Get signature from DATABASE
        signature = self._get_signature(model_id)
        if not signature:
            return {
                "error": f"Model {model_id} not found",
                "model_id": model_id
            }
        
        print(f"  🔑 Signature for model {model_id}: {signature}")
        
        # Step 2: Get current position and action ID
        from utils.price_tools import get_latest_position
        
        try:
            current_position, current_action_id = get_latest_position(date, signature)
        except Exception as e:
            print(f"  ❌ Error getting position: {e}")
            return {
                "error": f"Could not get current position: {str(e)}",
                "symbol": symbol,
                "date": date
            }
        
        # Step 3: Get stock price for the date
        from utils.price_tools import get_open_prices
        
        try:
            prices = get_open_prices(date, [symbol])
            current_price = prices.get(f'{symbol}_price')
            
            if current_price is None:
                return {
                    "error": f"Symbol {symbol} not found! This action will not be allowed.",
                    "symbol": symbol,
                    "date": date
                }
        except Exception as e:
            print(f"  ❌ Error getting price: {e}")
            return {
                "error": f"Could not get price for {symbol}: {str(e)}",
                "symbol": symbol,
                "date": date
            }
        
        # Step 4: Validate position exists and sufficient shares
        if symbol not in current_position:
            return {
                "error": f"No position for {symbol}! This action will not be allowed.",
                "symbol": symbol,
                "date": date
            }
        
        current_shares = current_position.get(symbol, 0)
        if current_shares < amount:
            return {
                "error": "Insufficient shares! This action will not be allowed.",
                "have": current_shares,
                "want_to_sell": amount,
                "symbol": symbol,
                "date": date
            }
        
        # Step 5: Execute trade - update position
        new_position = current_position.copy()
        new_position[symbol] -= amount
        
        # Remove symbol from position if now zero
        if new_position[symbol] == 0:
            del new_position[symbol]
        
        # Add proceeds to cash
        proceeds = current_price * amount
        new_position["CASH"] = new_position.get("CASH", 0) + proceeds
        
        # Step 6: Write to position.jsonl file
        position_file_path = self.project_root / "data" / "agent_data" / signature / "position" / "position.jsonl"
        
        trade_record = {
            "date": date,
            "id": current_action_id + 1,
            "this_action": {
                "action": "sell",
                "symbol": symbol,
                "amount": amount
            },
            "positions": new_position,
            "metadata": {
                "price": current_price,
                "proceeds": proceeds,
                "execution_source": execution_source
            }
        }
        
        try:
            with open(position_file_path, "a") as f:
                f.write(json.dumps(trade_record) + "\n")
            
            print(f"  ✅ SELL executed: {amount} {symbol} @ ${current_price:.2f} (proceeds: ${proceeds:.2f})")
            print(f"  💰 New cash: ${new_position['CASH']:.2f}")
            
        except Exception as e:
            print(f"  ❌ Error writing position file: {e}")
            return {
                "error": f"Trade executed but could not save: {str(e)}",
                "symbol": symbol,
                "date": date
            }
        
        # Step 7: Also write to DATABASE for frontend
        try:
            self.supabase.table("positions").insert({
                "model_id": model_id,
                "date": date,
                "minute_time": None,
                "action_id": current_action_id + 1,
                "action_type": "sell",
                "symbol": symbol,
                "quantity": amount,
                "price": current_price,
                "proceeds": proceeds,
                "cash_after": new_position["CASH"],
                "reasoning": f"{execution_source} sell"
            }).execute()
            
            print(f"  💾 Saved to database")
            
        except Exception as e:
            print(f"  ⚠️  Database write failed (file write succeeded): {e}")
            # Don't fail the trade if DB write fails
        
        # Step 8: Return new position
        return new_position
    
    def _get_signature(self, model_id: int) -> Optional[str]:
        """
        Get model signature from database
        
        This is the CORE FIX for the SIGNATURE subprocess isolation issue!
        Instead of reading from subprocess environment (which doesn't work),
        we query the database directly (same process, no isolation).
        
        Args:
            model_id: Database model ID
        
        Returns:
            Model signature or None if not found
        """
        try:
            result = self.supabase.table("models")\
                .select("signature")\
                .eq("id", model_id)\
                .single()\
                .execute()
            
            if result.data:
                return result.data["signature"]
            else:
                print(f"  ⚠️  Model {model_id} not found in database")
                return None
                
        except Exception as e:
            print(f"  ❌ Error querying database for model {model_id}: {e}")
            return None
    
    def get_tradeable_symbols(self, model_id: int) -> list:
        """
        Get list of symbols user can trade with this model
        
        Future: Can add allowlist validation here
        
        Args:
            model_id: Database model ID
        
        Returns:
            List of allowed ticker symbols
        """
        try:
            result = self.supabase.table("models")\
                .select("allowed_tickers")\
                .eq("id", model_id)\
                .single()\
                .execute()
            
            if result.data:
                return result.data.get("allowed_tickers", [])
            return []
            
        except Exception as e:
            print(f"  ⚠️  Could not get tradeable symbols: {e}")
            return []

