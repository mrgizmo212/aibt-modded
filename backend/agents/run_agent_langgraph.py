"""
LangGraph Run Conversation Agent
Provides full tool access for analyzing ONE specific run in detail
"""

from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from typing import List, Dict, Optional
from supabase import Client
from config import settings as config_settings


def create_run_conversation_agent(
    model_id: int,
    run_id: int,
    user_id: str,
    supabase: Client
):
    """
    Create LangGraph agent for run-specific conversations
    
    Args:
        model_id: Model ID
        run_id: Specific run ID to analyze
        user_id: User ID (for auth and ownership)
        supabase: Supabase client for database access
    
    Returns:
        tuple: (agent, system_prompt) - LangGraph agent instance and prompt used
    """
    
    # Verify ownership
    model_check = supabase.table("models").select("user_id").eq("id", model_id).execute()
    if not model_check.data or model_check.data[0]["user_id"] != user_id:
        raise PermissionError(f"User {user_id} does not own model {model_id}")
    
    # Import existing tools (NO CHANGES to tool files!)
    from agents.tools.analyze_trades import create_analyze_trades_tool
    from agents.tools.get_ai_reasoning import create_get_ai_reasoning_tool
    from agents.tools.calculate_metrics import create_calculate_metrics_tool
    from agents.tools.suggest_rules import create_suggest_rules_tool
    
    # Create tools - run_id specified means focus on THIS run
    tools = [
        create_analyze_trades_tool(supabase, model_id, run_id, user_id),
        create_get_ai_reasoning_tool(supabase, model_id, run_id, user_id),
        create_calculate_metrics_tool(supabase, model_id, run_id, user_id),
        create_suggest_rules_tool(supabase, model_id, user_id)
    ]
    
    print(f"[LangGraph] Loading tools for run {run_id} (model {model_id}): {[t.name for t in tools]}")
    
    # Get global chat settings
    global_settings = supabase.table("global_chat_settings").select("*").eq("id", 1).execute()
    
    if global_settings.data and len(global_settings.data) > 0:
        settings_data = global_settings.data[0]
        ai_model = settings_data["chat_model"]
        model_params = settings_data.get("model_parameters") or {}
        global_instructions = settings_data.get("chat_instructions") or ""
        print(f"[LangGraph] Using GLOBAL chat settings: {ai_model}")
    else:
        ai_model = "openai/gpt-4.1-mini"
        model_params = {"temperature": 0.3, "top_p": 0.9}
        global_instructions = ""
        print(f"[LangGraph] Using default settings: {ai_model}")
    
    # Create ChatOpenAI (same as before - uses OpenRouter)
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
    
    # Build system prompt
    system_prompt = build_run_analysis_prompt(model_id, run_id, user_id, supabase, global_instructions)
    
    # Create LangGraph React agent
    print(f"[LangGraph] Creating react agent for run {run_id} with {len(tools)} tools")
    
    # NOTE: create_react_agent doesn't take state_modifier parameter
    # System prompt will be prepended to messages array in backend/main.py
    agent = create_react_agent(
        chat_model,
        tools
    )
    
    print(f"[LangGraph] ✅ Agent created successfully for run {run_id} (model {model_id})")
    
    return agent, system_prompt


def build_run_analysis_prompt(
    model_id: int,
    run_id: int,
    user_id: str,
    supabase: Client,
    global_instructions: str = ""
) -> str:
    """
    Build comprehensive system prompt for run-specific analysis mode
    
    Includes:
    - Platform context
    - Model configuration
    - Specific run details
    - Tool usage instructions (focused on THIS run)
    """
    
    # Get model configuration
    model_result = supabase.table("models").select("*").eq("id", model_id).execute()
    
    if not model_result.data:
        return "You are a helpful trading assistant."
    
    model = model_result.data[0]
    
    # Calculate buying power
    margin = model.get('margin_account', False)
    trading_style = model.get('trading_style', 'day-trading')
    
    if margin and trading_style in ['scalping', 'day-trading']:
        buying_power = '4x (day trading margin)'
    elif margin:
        buying_power = '2x (standard margin)'
    else:
        buying_power = '1x (cash account)'
    
    # Get specific run details
    run_result = supabase.table("trading_runs")\
        .select("*")\
        .eq("id", run_id)\
        .execute()
    
    run_context = ""
    if run_result.data:
        run = run_result.data[0]
        
        mode = run.get('trading_mode', 'unknown')
        if mode == 'intraday':
            symbol = run.get('intraday_symbol', '?')
            date = run.get('intraday_date', '?')
            mode_info = f"Intraday {symbol} on {date}"
        else:
            start = run.get('date_range_start', '?')
            end = run.get('date_range_end', '?')
            mode_info = f"Daily {start} to {end}"
        
        run_context = f"\n\n<run_context>\nYou are analyzing Run #{run.get('run_number', '?')} ({mode_info})\n\n"
        run_context += f"Status: {run.get('status', 'unknown').upper()}\n"
        
        if run.get('total_trades'):
            run_context += f"Total Trades: {run['total_trades']}\n"
        if run.get('final_return') is not None:
            run_context += f"Final Return: {run['final_return']*100:+.2f}%\n"
        if run.get('final_portfolio_value'):
            run_context += f"Final Portfolio Value: ${run['final_portfolio_value']:,.2f}\n"
        
        run_context += "\n</run_context>"
    
    # Build complete prompt
    prompt = f"""You are an expert trading strategy analyst and coach for True Trading Group's AI Trading Platform.

{global_instructions}

<model_context>
Model: {model.get('name', f'Model {model_id}')}

Trading Configuration:
- AI Model: {model.get('default_ai_model', 'Not set')}
- Trading Mode: {model.get('trading_mode', 'Not set')}
- Trading Style: {trading_style}
- Instrument: {model.get('instrument', 'stocks')}
- Account Type: {'Margin Account' if margin else 'Cash Account'}
- Buying Power: {buying_power}
- Shorting: {'✅ Allowed' if model.get('allow_shorting') else '🚫 Disabled'}
- Options: {'✅ Allowed' if model.get('allow_options_strategies') else '🚫 Disabled'}
- Hedging: {'✅ Allowed' if model.get('allow_hedging') else '🚫 Disabled'}

Custom Rules:
{model.get('custom_rules') or 'None'}

Custom Instructions:
{model.get('custom_instructions') or 'None'}
</model_context>

{run_context}

<tool_usage_instructions>
═══════════════════════════════════════════════════════════════
🛠️ RUN ANALYSIS MODE - Focus on THIS Specific Run
═══════════════════════════════════════════════════════════════

You have 4 powerful tools at your disposal (focused on THIS run):

1. **analyze_trades** - Analyze trades from THIS run
   - Trade-by-trade breakdown
   - Winning vs losing patterns
   - Time-of-day analysis
   - Example: "show me all losing trades"

2. **get_ai_reasoning** - Access AI decision logs from THIS run
   - See what the trading AI was thinking at each minute
   - Understand WHY each trade was made
   - Market context at decision time
   - Example: "what was the AI thinking at 10:30 AM?"

3. **calculate_metrics** - Calculate THIS run's performance
   - Returns, drawdowns, Sharpe ratio
   - Win rate, profit/loss ratio
   - Risk metrics
   - Example: "calculate the Sharpe ratio"

4. **suggest_rules** - Suggest improvements based on THIS run
   - Identify what worked/failed
   - Recommend specific rule additions
   - Pattern-based insights
   - Example: "what went wrong in this run?"

🎯 Key Points:
- Tools are FOCUSED on this specific run only
- USE them actively when analyzing this run's performance
- Don't say "I don't have access" - YOU DO!
- Provide detailed, specific analysis of THIS run's trades and decisions

═══════════════════════════════════════════════════════════════
</tool_usage_instructions>

Be helpful, use your tools, and provide detailed analysis of this specific run based on real data."""
    
    return prompt

