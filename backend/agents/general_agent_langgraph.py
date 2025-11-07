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


def create_model_tool(user_id: str, supabase: Client):
    """Factory to create the create_model tool with user context"""
    
    @tool
    async def create_model(
        name: str,
        description: str = "",
        trading_style: str = "day-trading",
        instrument: str = "stocks",
        allow_shorting: bool = False,
        margin_account: bool = False,
        initial_cash: float = 10000.0,
        custom_rules: str = "",
        custom_instructions: str = ""
    ) -> str:
        """
        Create a new trading model with specified configuration
        
        Args:
            name: Model name (required)
            description: Model description (optional)
            trading_style: "scalping", "day-trading", "swing-trading", "long-term" (default: "day-trading")
            instrument: "stocks", "options", "futures", "crypto" (default: "stocks")
            allow_shorting: Whether to allow short selling (default: False)
            margin_account: Whether to use margin (default: False)
            initial_cash: Starting portfolio value (default: 10000.0)
            custom_rules: Custom trading rules (optional, max 2000 chars)
            custom_instructions: Custom instructions (optional, max 2000 chars)
        
        Returns:
            Success message with new model ID and configuration
        
        Examples:
            - create_model(name="Momentum Trader", trading_style="day-trading")
            - create_model(name="Tech Scalper", trading_style="scalping", custom_rules="Only trade AAPL, TSLA, NVDA")
        """
        
        # Validate inputs
        if not name or len(name) > 100:
            return "Error: Name is required and must be 100 characters or less"
        
        if custom_rules and len(custom_rules) > 2000:
            return "Error: custom_rules must be 2000 characters or less"
        
        if custom_instructions and len(custom_instructions) > 2000:
            return "Error: custom_instructions must be 2000 characters or less"
        
        if trading_style not in ["scalping", "day-trading", "swing-trading", "long-term"]:
            return f"Error: Invalid trading_style. Must be one of: scalping, day-trading, swing-trading, long-term"
        
        # Generate signature
        from services import generate_signature
        signature = generate_signature(name, user_id)
        
        # Prepare model data
        model_data = {
            "user_id": user_id,
            "name": name,
            "signature": signature,
            "description": description,
            "trading_style": trading_style,
            "instrument": instrument,
            "allow_shorting": allow_shorting,
            "margin_account": margin_account,
            "initial_cash": initial_cash,
            "is_active": True,
            "allowed_order_types": ["market", "limit"]
        }
        
        # Add optional fields
        if custom_rules:
            model_data["custom_rules"] = custom_rules
        
        if custom_instructions:
            model_data["custom_instructions"] = custom_instructions
        
        # Create model in database
        try:
            result = supabase.table("models").insert(model_data).execute()
            
            if not result.data:
                return "Error: Failed to create model in database"
            
            new_model = result.data[0]
            model_id = new_model["id"]
            
            response = f"✅ **Model Created Successfully!**\n\n"
            response += f"**Model ID:** {model_id}\n"
            response += f"**Name:** {name}\n"
            response += f"**Trading Style:** {trading_style}\n"
            response += f"**Instrument:** {instrument}\n"
            response += f"**Initial Cash:** ${initial_cash:,.2f}\n"
            response += f"**Margin Account:** {'✅ Yes' if margin_account else '🚫 No'}\n"
            response += f"**Shorting:** {'✅ Allowed' if allow_shorting else '🚫 Disabled'}\n\n"
            
            if custom_rules:
                response += f"**Custom Rules:**\n{custom_rules}\n\n"
            
            if custom_instructions:
                response += f"**Custom Instructions:**\n{custom_instructions}\n\n"
            
            response += f"Your new model is ready! You can now:\n"
            response += f"1. Run a backtest to see how it performs\n"
            response += f"2. Chat with this specific model at `/m/{model_id}/new`\n"
            response += f"3. Edit configuration anytime in the models section\n\n"
            response += f"Navigate to the model to start trading!"
            
            return response
            
        except Exception as e:
            return f"Error creating model: {str(e)}"
    
    return create_model


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
        suggest_model_configuration,
        create_model_tool(user_id, supabase)
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

<platform_capabilities>
═══════════════════════════════════════════════════════════════
🎯 TTG AI Trading Platform - What You CAN and CANNOT Do
═══════════════════════════════════════════════════════════════

✅ WHAT THIS PLATFORM CAN DO:
- Create AI trading models that trade AUTONOMOUSLY using AI decision-making
- Intraday trading: Minute-by-minute decisions (9:30 AM - 4:00 PM)
- Daily trading: End-of-day bar analysis across multiple days
- Custom rules: Define entry/exit conditions, position sizing, risk limits in plain English
- Risk management: Max position size (dollars), max daily loss (dollars), circuit breakers
- Account types: Cash (1x) or Margin (2x standard, 4x day trading)
- Visual strategy builder: Desktop users can drag-and-drop nodes to design strategies
- AI models: Uses OpenRouter (GPT-5, Claude Sonnet 4.5, etc.) for decisions

❌ WHAT THIS PLATFORM CANNOT DO:
- NO custom indicators or Pine Script (not TradingView)
- NO MetaTrader integration or MQL code
- NO manual trade execution (AI makes ALL decisions autonomously)
- NO custom data feeds (uses built-in market data)
- NO backtesting with custom indicators

🔧 PLATFORM-SPECIFIC MODEL FIELDS (These are the ONLY fields you can configure):

**Required:**
- `name`: string (max 100 chars) - Model display name
- `trading_style`: "scalping" | "day-trading" | "swing-trading" | "long-term"
- `instrument`: "stocks" | "options" | "futures" | "crypto"

**Optional:**
- `description`: string - Model description
- `allow_shorting`: boolean (default: false)
- `margin_account`: boolean (default: false) - Enables 2x or 4x leverage
- `initial_cash`: float (default: 10000)
- `custom_rules`: string (max 2000 chars) - Entry/exit conditions, position sizing rules
- `custom_instructions`: string (max 2000 chars) - Strategy guidance and context

**Risk Limits (stored in model_parameters):**
- `max_position_size_dollars`: How much $ per single trade
- `max_daily_loss_dollars`: Daily loss circuit breaker in $

═══════════════════════════════════════════════════════════════
</platform_capabilities>

You have 3 powerful tools:

1. **explain_platform_feature** - Explain platform capabilities
   - Use when users ask "how does this work?"
   - Keep explanations platform-specific (THIS platform, not general trading)

2. **suggest_model_configuration** - Suggest settings based on goals
   - Use when users want recommendations
   - Base suggestions on PLATFORM CAPABILITIES ONLY

3. **create_model** - Actually create a trading model in the database
   - Use when user is ready to create
   - ALWAYS confirm name and settings first
   - Then ACTUALLY CALL THE TOOL to create it

🎯 YOUR PRIMARY GOAL: Help users CREATE MODELS that trade autonomously.

**CRITICAL - When User Wants to Create a Strategy:**

GOOD RESPONSE PATTERN:
"I can create a day trading model for you right now. Here's what I recommend:

- Name: [suggest name based on strategy]
- Trading Style: day-trading
- Margin: Yes (4x buying power)
- Max Position: $2,000
- Max Daily Loss: $500
- Custom Rules: [specific entry/exit conditions]

What should we name this model? Once you confirm, I'll create it immediately using my create_model tool."

Then ACTUALLY USE create_model(name="...", ...) - Don't just explain!

BAD RESPONSE PATTERN:
"Here's a strategy you can code in TradingView Pine Script..."
"You can set up custom indicators in MetaTrader..."
"Use this RSI formula with these parameters..." (we don't support custom formulas)

**Model Creation Flow:**
1. User wants to create strategy
2. YOU suggest configuration (use suggest_model_configuration if needed)
3. YOU ask for model name
4. USER provides name or confirms
5. YOU IMMEDIATELY call create_model tool with all parameters
6. YOU confirm model created and guide to next steps

DO NOT just explain - TAKE ACTION! You have tools - USE THEM!

═══════════════════════════════════════════════════════════════

Be action-oriented, platform-specific, and actually CREATE models when users are ready!"""
    
    # Create LangGraph agent
    agent = create_react_agent(
        chat_model,
        tools
    )
    
    print(f"[LangGraph] ✅ General conversation agent created")
    
    return agent, system_prompt

