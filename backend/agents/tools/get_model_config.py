"""
Get Model Config Tool - View current model configuration
"""

from langchain.tools import tool
from typing import Dict
from supabase import Client

def create_get_model_config_tool(supabase: Client, model_id: int, user_id: str):
    """Factory to create get_model_config tool"""
    
    # Verify ownership
    model = supabase.table("models").select("user_id").eq("id", model_id).execute()
    if not model.data or model.data[0]["user_id"] != user_id:
        raise PermissionError("Access denied")
    
    @tool
    async def get_model_config() -> str:
        """
        Get current model configuration including custom rules and instructions
        
        Returns:
            JSON string with complete model configuration
        """
        
        # Get full model config
        result = supabase.table("models").select("*").eq("id", model_id).execute()
        
        if not result.data:
            return "Error: Model not found"
        
        model = result.data[0]
        
        # Format response
        config = {
            "model_id": model["id"],
            "name": model["name"],
            "description": model.get("description"),
            "trading_style": model.get("trading_style", "day-trading"),
            "instrument": model.get("instrument", "stocks"),
            "allow_shorting": model.get("allow_shorting", False),
            "margin_account": model.get("margin_account", False),
            "allow_options_strategies": model.get("allow_options_strategies", False),
            "allow_hedging": model.get("allow_hedging", False),
            "allowed_order_types": model.get("allowed_order_types", ["market", "limit"]),
            "initial_cash": model.get("initial_cash", 10000.0),
            "allowed_tickers": model.get("allowed_tickers"),
            "default_ai_model": model.get("default_ai_model"),
            "model_parameters": model.get("model_parameters"),
            "custom_rules": model.get("custom_rules"),
            "custom_instructions": model.get("custom_instructions")
        }
        
        response = "**Current Model Configuration:**\n\n"
        response += f"- **Name:** {config['name']}\n"
        response += f"- **Trading Style:** {config['trading_style']}\n"
        response += f"- **Instrument:** {config['instrument']}\n"
        response += f"- **Margin Account:** {config['margin_account']}\n"
        response += f"- **Allow Shorting:** {config['allow_shorting']}\n"
        response += f"- **Initial Cash:** ${config['initial_cash']:,.2f}\n\n"
        
        if config['custom_rules']:
            response += f"**Current Custom Rules:**\n{config['custom_rules']}\n\n"
        else:
            response += "**Current Custom Rules:** None (no custom rules set)\n\n"
        
        if config['custom_instructions']:
            response += f"**Current Custom Instructions:**\n{config['custom_instructions']}\n\n"
        else:
            response += "**Current Custom Instructions:** None (no custom instructions set)\n\n"
        
        response += "You can update these using the `update_model_rules` tool."
        
        return response
    
    return get_model_config

