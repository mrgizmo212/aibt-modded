"""
Analyze Trades Tool - For System Agent
Queries and analyzes trade history
"""

from langchain.tools import tool
from typing import Dict, List, Optional
from supabase import Client

def create_analyze_trades_tool(supabase: Client, model_id: int, run_id: Optional[int], user_id: str):
    """Factory to create analyze_trades tool with context"""
    
    # Verify ownership once at tool creation
    model = supabase.table("models").select("user_id").eq("id", model_id).execute()
    if not model.data or model.data[0]["user_id"] != user_id:
        raise PermissionError("Access denied")
    
    @tool
    async def analyze_trades(
        filter_type: str = "all",
        criteria: Optional[str] = None
    ) -> str:
        """
        Analyze trades for patterns and insights
        
        Args:
            filter_type: "all" | "winning" | "losing" | "by_time"
            criteria: Optional additional filtering
        
        Returns:
            Analysis summary with statistics and patterns
        """
        
        # Build query (RLS will filter automatically)
        query = supabase.table("positions").select("*").eq("model_id", model_id)
        
        if run_id:
            query = query.eq("run_id", run_id)
        
        result = query.order("date").order("minute_time").execute()
        
        if not result.data or len(result.data) < 2:
            return "Not enough trades to analyze (need at least 2)."
        
        trades = result.data
        
        # Calculate trade-by-trade P/L
        trade_pnl = []
        for i in range(1, len(trades)):
            prev_cash = trades[i-1]["cash"]
            curr_cash = trades[i]["cash"]
            
            # Simple P/L = cash change
            pnl = curr_cash - prev_cash
            
            trade_pnl.append({
                "trade": trades[i],
                "pnl": pnl,
                "is_winner": pnl > 0
            })
        
        # Apply filters
        filtered = trade_pnl
        if filter_type == "winning":
            filtered = [t for t in trade_pnl if t["is_winner"]]
        elif filter_type == "losing":
            filtered = [t for t in trade_pnl if not t["is_winner"]]
        
        # Calculate statistics
        winners = [t for t in trade_pnl if t["is_winner"]]
        losers = [t for t in trade_pnl if not t["is_winner"]]
        
        avg_win = sum(t["pnl"] for t in winners) / len(winners) if winners else 0
        avg_loss = sum(t["pnl"] for t in losers) / len(losers) if losers else 0
        total_pnl = sum(t["pnl"] for t in trade_pnl)
        win_rate = len(winners) / len(trade_pnl) if trade_pnl else 0
        
        # Calculate win/loss ratio (fix f-string error)
        if avg_loss != 0:
            win_loss_ratio = f"{abs(avg_win/avg_loss):.2f}"
        else:
            win_loss_ratio = "N/A (no losses)"
        
        # Build analysis
        analysis = f"""Trade Analysis Results:

📊 Statistics:
Total Trades: {len(trade_pnl)}
Winners: {len(winners)} ({win_rate*100:.1f}%)
Losers: {len(losers)} ({(1-win_rate)*100:.1f}%)

💰 Performance:
Average Winner: ${avg_win:.2f}
Average Loser: ${avg_loss:.2f}
Win/Loss Ratio: {win_loss_ratio}
Total P/L: ${total_pnl:.2f}

🔍 Patterns Identified:
"""
        
        # Pattern analysis
        if len(winners) > len(losers) and total_pnl < 0:
            analysis += "⚠️ MORE WINNERS THAN LOSERS BUT STILL LOST MONEY\n"
            analysis += "   → Your losses are too large relative to wins\n"
            analysis += "   → Recommendation: Add stop-loss rule to cut losses earlier\n\n"
        
        # Time-of-day analysis (if intraday)
        if trades[0].get("minute_time"):
            morning = [t for t in trade_pnl if t["trade"].get("minute_time", "00:00") < "12:00"]
            afternoon = [t for t in trade_pnl if t["trade"].get("minute_time", "00:00") >= "12:00"]
            
            if morning and afternoon:
                morning_pnl = sum(t["pnl"] for t in morning)
                afternoon_pnl = sum(t["pnl"] for t in afternoon)
                
                analysis += f"📅 Time-of-Day Performance:\n"
                analysis += f"   Morning (before noon): ${morning_pnl:.2f} ({len(morning)} trades)\n"
                analysis += f"   Afternoon: ${afternoon_pnl:.2f} ({len(afternoon)} trades)\n"
                
                if abs(morning_pnl) > abs(afternoon_pnl) * 2:
                    best_period = "morning" if morning_pnl > afternoon_pnl else "afternoon"
                    analysis += f"   → Best performance in {best_period}\n\n"
        
        # Action type analysis
        buys = [t for t in trade_pnl if t["trade"].get("action_type") == "buy"]
        sells = [t for t in trade_pnl if t["trade"].get("action_type") == "sell"]
        
        if buys and sells:
            # Note: This is simplified - actual P/L attribution is complex
            analysis += f"📈 Trade Types:\n"
            analysis += f"   Buys: {len(buys)} trades\n"
            analysis += f"   Sells: {len(sells)} trades\n\n"
        
        return analysis
    
    return analyze_trades

