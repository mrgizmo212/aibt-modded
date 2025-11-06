"""
LangGraph Model Conversation Agent
Replaces old SystemAgent with modern LangGraph create_react_agent
Provides full tool access for analyzing model history across ALL runs
"""

from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from typing import List, Dict, Optional
from supabase import Client
from config import settings as config_settings


def create_model_conversation_agent(
    model_id: int,
    user_id: str,
    supabase: Client
):
    """
    Create LangGraph agent for model conversations
    
    Args:
        model_id: Model ID to analyze
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
    
    # Create tools - run_id=None means access ALL runs
    tools = [
        create_analyze_trades_tool(supabase, model_id, None, user_id),
        create_get_ai_reasoning_tool(supabase, model_id, None, user_id),
        create_calculate_metrics_tool(supabase, model_id, None, user_id),
        create_suggest_rules_tool(supabase, model_id, user_id)
    ]
    
    print(f"[LangGraph] Loading tools for model {model_id}: {[t.name for t in tools]}")
    
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
    system_prompt = build_model_analysis_prompt(model_id, user_id, supabase, global_instructions)
    
    # Create LangGraph React agent
    print(f"[LangGraph] Creating react agent with {len(tools)} tools")
    
    # NOTE: create_react_agent doesn't take state_modifier parameter
    # System prompt will be prepended to messages array in backend/main.py
    agent = create_react_agent(
        chat_model,
        tools
    )
    
    print(f"[LangGraph] ✅ Agent created successfully for model {model_id}")
    
    return agent, system_prompt


def build_model_analysis_prompt(
    model_id: int,
    user_id: str,
    supabase: Client,
    global_instructions: str = ""
) -> str:
    """
    Build comprehensive system prompt for model analysis mode
    
    Includes:
    - Platform context
    - Model configuration
    - Run summary
    - Tool usage instructions
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
    
    # Get run summary
    runs_result = supabase.table("trading_runs")\
        .select("id, run_number, status, trading_mode, total_trades, final_return, final_portfolio_value, intraday_symbol, intraday_date")\
        .eq("model_id", model_id)\
        .order("run_number", desc=True)\
        .limit(10)\
        .execute()
    
    run_summary = ""
    if runs_result.data:
        runs = runs_result.data
        run_summary = f"\n\n<run_summary>\nThis model has completed {len(runs)} run(s):\n\n"
        
        for run in runs:
            mode = run.get('trading_mode', 'unknown')
            if mode == 'intraday':
                symbol = run.get('intraday_symbol', '?')
                date = run.get('intraday_date', '?')
                run_summary += f"- Run #{run['run_number']} (ID: {run['id']}): {run['status'].upper()} | Intraday {symbol} on {date}"
            else:
                run_summary += f"- Run #{run['run_number']} (ID: {run['id']}): {run['status'].upper()} | Daily mode"
            
            if run.get('total_trades'):
                run_summary += f" | {run['total_trades']} trades"
            if run.get('final_return') is not None:
                run_summary += f" | {run['final_return']*100:+.2f}% return"
            
            run_summary += "\n"
        
        run_summary += "</run_summary>"
    
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

{run_summary}

<tool_usage_instructions>
═══════════════════════════════════════════════════════════════
🛠️ YOUR TOOLS - Use Them Actively
═══════════════════════════════════════════════════════════════

You have 4 powerful tools at your disposal:

1. **analyze_trades** - For trade analysis
   - When asked about trades, performance patterns, winning/losing trades
   - Can filter by run or analyze all runs together
   - Example: "show me all losing trades"

2. **get_ai_reasoning** - For decision analysis
   - When asked "what was the AI thinking", "why did it decide", "reasoning"
   - DEFAULT: Call with NO run_id_filter (gets ALL reasoning across ALL runs)
   - Then you can analyze and present relevant entries
   - Only use run_id_filter if user explicitly says "in run ID 85" or similar
   - "What was the AI thinking on the last run?" → NO FILTER, query all, then focus on most recent in response

3. **calculate_metrics** - For performance metrics
   - When asked about returns, Sharpe ratio, drawdowns, win rates
   - Can calculate for specific run or aggregate
   - Example: "what's my overall performance?"

4. **suggest_rules** - For improvement suggestions
   - When asked for recommendations, improvements, rules
   - Based on complete trading history
   - Example: "what rules should I add?"

🎯 Key Points:
- USE tools proactively when questions relate to their domain
- Don't say "I don't have access" - YOU DO!
- Don't ask user to navigate elsewhere - answer HERE
- **DEFAULT BEHAVIOR:** Query ALL runs (no filters), then analyze results
  - User: "what was the AI thinking?" → Query ALL runs, show relevant reasoning
  - User: "analyze trades" → Query ALL runs, present insights
- Only use specific run_id_filter if user explicitly mentions a database ID
- You can filter/focus in your RESPONSE based on what user asked
- Synthesize insights from complete history

═══════════════════════════════════════════════════════════════
</tool_usage_instructions>

Be helpful, use your tools, and provide actionable insights based on real data.

<ultimate_purpose>
═══════════════════════════════════════════════════════════════
🎯 YOUR ULTIMATE PURPOSE - The Bigger Picture
═══════════════════════════════════════════════════════════════

You are not just analyzing past performance - you are BUILDING a production trading bot.

Every conversation you have is accumulating knowledge:
- What strategies work vs fail
- What rules should be enforced
- What parameters are optimal
- What patterns lead to profit vs loss

CONSIDER THE COMPLETE HISTORY:
- This is NOT the first conversation about this model
- Previous conversations may have identified patterns you should build on
- Users have likely discussed rules, improvements, and insights before
- Each chat adds to the cumulative knowledge base
- Don't repeat what was already discussed - BUILD ON IT
- Reference previous insights when relevant
- Track evolution: "Last time we identified X, now we see Y"

EVENTUALLY, this model will be COMPILED into a deployable trading bot:
1. All conversations analyzed
2. All runs synthesized
3. Best rules extracted
4. Optimal parameters identified
5. XML trading prompt generated
6. Production bot deployed to trade real money

When suggesting rules, think:
- "This rule will be in the production bot"
- "This will affect real trading decisions"
- "This needs to be precise, actionable, and proven"

Your insights don't just educate - they BUILD the bot that will trade autonomously.

Every pattern you identify, every rule you suggest, every learning you extract
contributes to the final compiled bot configuration.

Make your recommendations count - they're building blocks for production deployment.

LEARNING ACROSS SESSIONS:
- Look at the conversation history above - what has been discussed before?
- Have rules already been suggested? Don't repeat them.
- Has user expressed preferences? Honor them.
- Build on previous insights, don't start from scratch each time.
- This is an ITERATIVE learning process across many conversations.

═══════════════════════════════════════════════════════════════
</ultimate_purpose>"""
    
    return prompt

