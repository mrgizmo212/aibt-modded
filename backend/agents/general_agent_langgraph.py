"""
LangGraph General Conversation Agent
For helping users understand platform and build models
"""

from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from typing import List, Dict, Optional
from supabase import Client
from config import settings as config_settings


# Define tools for general conversations (model building help)
@tool
def explain_platform_feature(feature: str) -> str:
    """
    Explain platform features and capabilities
    
    Args:
        feature: Feature name (e.g., "intraday trading", "model creation", "runs")
    
    Returns:
        Explanation of the feature
    """
    
    explanations = {
        "intraday trading": "Intraday trading involves making trades within a single day based on minute-by-minute data. The AI analyzes 390 minutes of market data (9:30 AM - 4:00 PM) and makes BUY/SELL/HOLD decisions each minute.",
        "daily trading": "Daily trading uses end-of-day bars across multiple days. The AI analyzes daily OHLCV data and makes one decision per trading day.",
        "model creation": "Models are AI trading configurations with specific rules, parameters, and strategies. Create a model to define how your AI should trade.",
        "runs": "Runs are trading sessions where your model executes trades. Each run tracks performance, decisions, and can be analyzed afterwards.",
        "AI reasoning logs": "Every decision the AI makes is logged with reasoning. You can review what the AI was thinking and why it chose to buy/sell/hold.",
    }
    
    feature_lower = feature.lower()
    for key in explanations:
        if key in feature_lower:
            return explanations[key]
    
    return f"Platform feature documentation for '{feature}' - The AI Trading Platform allows you to create AI models, run backtests, and analyze trading performance. Ask about specific features!"


@tool
def suggest_model_configuration(trading_goal: str, experience_level: str = "beginner") -> str:
    """
    Suggest model configuration based on user's goals
    
    Args:
        trading_goal: User's goal (e.g., "make money intraday", "learn swing trading")
        experience_level: "beginner", "intermediate", "advanced"
    
    Returns:
        Recommended model configuration
    """
    
    if "intraday" in trading_goal.lower() or "day trad" in trading_goal.lower():
        return """For intraday trading, I recommend:
        
- Trading Mode: Intraday
- Trading Style: Day Trading or Scalping
- AI Model: GPT-4.1 Mini (fast decisions)
- Temperature: 0.3-0.4 (consistent decisions)
- Custom Rules: 
  * Don't trade first 10 minutes (avoid volatility)
  * Be flat by end of day (no overnight risk)
  * Max position size 50% of portfolio
- Account Type: Consider margin if you have experience (4x buying power for day trading)

Start with paper trading to test the strategy!"""
    
    elif "swing" in trading_goal.lower():
        return """For swing trading, I recommend:
        
- Trading Mode: Daily
- Trading Style: Swing Trading
- AI Model: Claude Sonnet 4.5 or GPT-5 (better analysis for multi-day holds)
- Temperature: 0.5-0.6 (balanced creativity)
- Custom Rules:
  * Hold positions 2-10 days
  * Use stop-loss at -5%
  * Take profit at +10%
- Account Type: Cash account is fine (less leverage needed)

Swing trading requires patience - focus on trend following!"""
    
    else:
        return """I can help you configure a trading model! Tell me:
- What's your trading style preference? (intraday, daily, swing, scalping)
- What's your experience level?
- What's your risk tolerance?
- Do you want to focus on specific stocks or diversify?

I'll suggest the best configuration for your goals!"""


def create_general_conversation_agent(
    user_id: str,
    supabase: Client
):
    """
    Create LangGraph agent for general platform conversations
    
    Args:
        user_id: User ID
        supabase: Supabase client
    
    Returns:
        tuple: (agent, system_prompt)
    """
    
    # Tools for general conversations
    tools = [
        explain_platform_feature,
        suggest_model_configuration
    ]
    
    print(f"[LangGraph] Creating general conversation agent with {len(tools)} tools")
    
    # Get global settings
    global_settings = supabase.table("global_chat_settings").select("*").eq("id", 1).execute()
    
    if global_settings.data and len(global_settings.data) > 0:
        settings_data = global_settings.data[0]
        ai_model = settings_data["chat_model"]
        model_params = settings_data.get("model_parameters") or {}
        global_instructions = settings_data.get("chat_instructions") or ""
    else:
        ai_model = "openai/gpt-4.1-mini"
        model_params = {"temperature": 0.3, "top_p": 0.9}
        global_instructions = ""
    
    # Create ChatOpenAI
    params = {
        "model": ai_model,
        "temperature": model_params.get("temperature", 0.3),
        "base_url": "https://openrouter.ai/api/v1",
        "api_key": config_settings.OPENAI_API_KEY,
        "default_headers": {
            "HTTP-Referer": "https://aibt.truetradinggroup.com",
            "X-Title": "AIBT AI Trading Platform"
        }
    }
    
    if "top_p" in model_params:
        params["top_p"] = model_params["top_p"]
    
    # Smart token handling
    if ai_model.startswith("openai/gpt-5") or ai_model.startswith("openai/o"):
        if "max_completion_tokens" in model_params:
            params["max_completion_tokens"] = model_params["max_completion_tokens"]
    else:
        if "max_tokens" in model_params:
            params["max_tokens"] = model_params["max_tokens"]
    
    chat_model = ChatOpenAI(**params)
    
    # Build system prompt for general conversations
    system_prompt = f"""You are a helpful assistant for True Trading Group's AI Trading Platform.

{global_instructions}

You help users:
- Understand the platform and its features
- Learn about trading concepts (intraday vs daily, etc.)
- Create and configure trading models
- Get started with the platform

You have tools to:
- Explain platform features in detail
- Suggest model configurations based on user goals

Be friendly, educational, and guide users through the platform.
When users want to build a model, use suggest_model_configuration tool to provide tailored recommendations."""
    
    # Create LangGraph agent
    agent = create_react_agent(
        chat_model,
        tools
    )
    
    print(f"[LangGraph] ✅ General conversation agent created")
    
    return agent, system_prompt

