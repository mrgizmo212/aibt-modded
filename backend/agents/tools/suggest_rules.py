"""
Suggest Rules Tool - For System Agent
Generates structured rule recommendations based on problems
"""

from langchain.tools import tool
from typing import Dict, Optional
from supabase import Client
import json

def create_suggest_rules_tool(supabase: Client, model_id: int, user_id: str):
    """Factory to create suggest_rules tool"""
    
    # Verify ownership
    model = supabase.table("models").select("user_id").eq("id", model_id).execute()
    if not model.data or model.data[0]["user_id"] != user_id:
        raise PermissionError("Access denied")
    
    @tool
    async def suggest_rules(problem: str) -> str:
        """
        Suggest structured rules to solve a trading problem
        
        Args:
            problem: Issue to solve (e.g., "prevent large drawdowns", "avoid overtrading")
        
        Returns:
            Structured rule suggestions with parameters
        """
        
        suggestions = []
        problem_lower = problem.lower()
        
        # Pattern matching for common problems
        if "drawdown" in problem_lower or "loss" in problem_lower or "risk" in problem_lower:
            suggestions.append({
                "rule_name": "Max Position Size Limit",
                "rule_category": "position_sizing",
                "rule_description": "No single position can exceed 20% of total portfolio value",
                "enforcement_params": {
                    "max_position_pct": 0.20,
                    "enforcement": "reject_trade"
                },
                "rationale": "Prevents over-concentration that causes large drawdowns. Your Oct 29 run had 90%+ in one stock.",
                "priority": 9,
                "applies_to_assets": ["equity"]
            })
            
            suggestions.append({
                "rule_name": "Minimum Cash Reserve",
                "rule_category": "risk",
                "rule_description": "Always maintain at least 20% cash reserve (never go all-in)",
                "enforcement_params": {
                    "min_cash_reserve_pct": 0.20,
                    "enforcement": "reject_trade"
                },
                "rationale": "Ensures liquidity and protects against margin calls. You had only $257 cash at one point (2.5% of portfolio).",
                "priority": 8,
                "applies_to_assets": ["equity"]
            })
        
        if "over" in problem_lower and "trad" in problem_lower:
            suggestions.append({
                "rule_name": "Max Trades Per Session",
                "rule_category": "risk",
                "rule_description": "Limit to maximum 15 trades per intraday session",
                "enforcement_params": {
                    "max_trades_per_session": 15,
                    "enforcement": "stop_trading"
                },
                "rationale": "Prevents overtrading that erodes profits through fees and poor decisions. You made 30 trades in 1.5 hours.",
                "priority": 7,
                "applies_to_assets": ["equity"]
            })
        
        if "volatil" in problem_lower or "timing" in problem_lower or "open" in problem_lower:
            suggestions.append({
                "rule_name": "Avoid Opening Volatility",
                "rule_category": "timing",
                "rule_description": "No trading in first 5 minutes after market open (9:30-9:35 AM)",
                "enforcement_params": {
                    "blackout_start": "09:30",
                    "blackout_end": "09:35",
                    "enforcement": "skip_minute"
                },
                "rationale": "Opening minutes have widest spreads and most volatility. Wait for price discovery.",
                "priority": 6,
                "applies_to_assets": ["equity"]
            })
            
            suggestions.append({
                "rule_name": "Close Before Market Close",
                "rule_category": "timing",
                "rule_description": "Close all positions by 3:55 PM (avoid after-hours risk)",
                "enforcement_params": {
                    "close_all_by": "15:55",
                    "enforcement": "force_liquidate"
                },
                "rationale": "Prevents overnight exposure and gap risk for intraday strategies.",
                "priority": 8,
                "applies_to_assets": ["equity"]
            })
        
        if "max" in problem_lower and "position" in problem_lower:
            suggestions.append({
                "rule_name": "Max Open Positions",
                "rule_category": "risk",
                "rule_description": "Never hold more than 3 positions simultaneously",
                "enforcement_params": {
                    "max_positions": 3,
                    "enforcement": "reject_trade"
                },
                "rationale": "Forces focus and prevents over-diversification with small account.",
                "priority": 7,
                "applies_to_assets": ["equity"]
            })
        
        # Format response
        if not suggestions:
            return "I couldn't identify specific rules for that problem. Can you be more specific about what went wrong?"
        
        response = f"Based on '{problem}', I suggest these rules:\n\n"
        
        for i, rule in enumerate(suggestions, 1):
            response += f"{i}. **{rule['rule_name']}** (Category: {rule['rule_category']})\n"
            response += f"   Description: {rule['rule_description']}\n"
            response += f"   Parameters: {json.dumps(rule['enforcement_params'], indent=6)}\n"
            response += f"   Why it helps: {rule['rationale']}\n"
            response += f"   Priority: {rule['priority']}/10\n\n"
        
        response += "To add these rules, I can create them in the database. Would you like me to add any of these?"
        
        return response
    
    return suggest_rules

