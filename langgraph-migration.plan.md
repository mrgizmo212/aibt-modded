# LangGraph Migration - Replace SystemAgent with create_react_agent

## Objective
Replace current broken SystemAgent (using LangChain's create_agent) with LangGraph's create_react_agent for model conversations. This should fix the empty response bug AND upgrade to better architecture.

---

## Why This Approach

**Current Problem:**
- SystemAgent using `create_agent()` produces empty responses
- Only yields `{'type': 'done'}` with no content
- Tools never called

**Solution:**
- Skip debugging old approach
- Replace with LangGraph's `create_react_agent()`
- Modern, maintained, better documented
- Likely fixes bug automatically

---

## Implementation Plan

### Step 1: Install LangGraph

```powershell
cd backend
pip install langgraph
pip freeze > requirements.txt
```

### Step 2: Create New LangGraph Model Agent

**File:** Create `backend/agents/model_agent_langgraph.py`

```python
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage
from typing import List, Dict, Optional
from supabase import Client
from config import settings

def create_model_conversation_agent(
    model_id: int,
    user_id: str,
    supabase: Client
):
    """
    Create LangGraph agent for model conversations
    
    Args:
        model_id: Model ID to analyze
        user_id: User ID (for auth)
        supabase: Supabase client
    
    Returns:
        LangGraph agent with full tool access
    """
    
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
    
    # Get global chat settings
    global_settings = supabase.table("global_chat_settings").select("*").eq("id", 1).execute()
    
    if global_settings.data:
        settings_data = global_settings.data[0]
        ai_model = settings_data["chat_model"]
        model_params = settings_data.get("model_parameters") or {}
        global_instructions = settings_data.get("chat_instructions") or ""
    else:
        ai_model = "openai/gpt-4.1-mini"
        model_params = {"temperature": 0.3, "top_p": 0.9}
        global_instructions = ""
    
    # Create ChatOpenAI (same as before)
    params = {
        "model": ai_model,
        "temperature": model_params.get("temperature", 0.3),
        "base_url": "https://openrouter.ai/api/v1",
        "api_key": settings.OPENAI_API_KEY,
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
    
    # Build system prompt with model context
    model_data = supabase.table("models").select("*").eq("id", model_id).execute()
    
    system_prompt = build_system_prompt(model_id, model_data.data[0] if model_data.data else None, global_instructions)
    
    # Create LangGraph React agent
    print(f"[LangGraph] Creating react agent for model {model_id}")
    print(f"  - Model: {ai_model}")
    print(f"  - Tools: {[t.name for t in tools]}")
    
    agent = create_react_agent(
        chat_model,
        tools,
        # System prompt will be injected via state_modifier
        state_modifier=system_prompt
    )
    
    print(f"[LangGraph] Agent created successfully")
    
    return agent, system_prompt


def build_system_prompt(model_id: int, model_config: dict, global_instructions: str) -> str:
    """Build comprehensive system prompt for model analysis"""
    
    # Calculate buying power
    margin = model_config.get('margin_account', False) if model_config else False
    trading_style = model_config.get('trading_style', 'day-trading') if model_config else 'day-trading'
    
    if margin and trading_style in ['scalping', 'day-trading']:
        buying_power = '4x (day trading margin)'
    elif margin:
        buying_power = '2x (standard margin)'
    else:
        buying_power = '1x (cash account)'
    
    model_name = model_config.get('name', f'Model {model_id}') if model_config else f'Model {model_id}'
    
    prompt = f"""You are an expert trading strategy analyst for True Trading Group's AI Trading Platform.

{global_instructions}

<model_context>
You are analyzing MODEL {model_id}: "{model_name}"

Trading Configuration:
- Trading Style: {model_config.get('trading_style', 'Not set') if model_config else 'Not set'}
- Instrument: {model_config.get('instrument', 'stocks') if model_config else 'stocks'}
- Account Type: {'Margin Account' if margin else 'Cash Account'}
- Buying Power: {buying_power}
- Shorting: {'✅ Allowed' if (model_config.get('allow_shorting') if model_config else False) else '🚫 Disabled'}
- Options: {'✅ Allowed' if (model_config.get('allow_options_strategies') if model_config else False) else '🚫 Disabled'}
- Hedging: {'✅ Allowed' if (model_config.get('allow_hedging') if model_config else False) else '🚫 Disabled'}

Custom Rules:
{model_config.get('custom_rules', 'None') if model_config else 'None'}

Custom Instructions:
{model_config.get('custom_instructions', 'None') if model_config else 'None'}
</model_context>

<model_analysis_mode>
═══════════════════════════════════════════════════════════════
🔍 MODEL-WIDE ANALYSIS MODE - You Have Full Access
═══════════════════════════════════════════════════════════════

Your Tools Give You Access To:

1. **analyze_trades** - Query ALL trades across ALL runs
   - Call with filter_type and specific_run_id parameters
   - Can analyze all runs together or individually
   - Returns patterns, P/L analysis, time-of-day breakdowns

2. **get_ai_reasoning** - Access ALL AI decision logs
   - 380+ reasoning entries across all runs
   - See what the trading AI was thinking at each moment
   - Filter by run or show complete history

3. **calculate_metrics** - Calculate performance metrics
   - Aggregate across ALL runs (specific_run_id=None)
   - OR analyze individual run performance
   - Returns, drawdowns, Sharpe ratio, win rates

4. **suggest_rules** - Generate trading rules
   - Based on complete trading history
   - Learns from all successes and failures
   - Provides actionable recommendations

💡 When User Asks About Reasoning/Decisions:

User: "what was the AI thinking?"
→ USE get_ai_reasoning tool immediately
→ Don't say you don't have access - YOU DO!
→ Show actual decision logs from ai_reasoning table

User: "analyze all trades"
→ USE analyze_trades with specific_run_id=None
→ Shows complete trading history

User: "how did I perform overall?"
→ USE calculate_metrics with specific_run_id=None
→ Aggregate performance across all runs

═══════════════════════════════════════════════════════════════
CRITICAL: You HAVE these tools - USE THEM when asked!
═══════════════════════════════════════════════════════════════
</model_analysis_mode>"""
    
    return prompt
```

### Step 3: Update Backend Endpoint

**File:** `backend/main.py` - `/api/chat/general-stream` endpoint

**Replace SystemAgent import and creation:**

```python
# OLD
from agents.system_agent import SystemAgent
agent = SystemAgent(model_id, run_id=None, user_id, supabase)

# NEW
from agents.model_agent_langgraph import create_model_conversation_agent
agent, system_prompt = create_model_conversation_agent(model_id, user_id, supabase)
```

**Streaming stays the same:**
```python
async for chunk in agent.astream(
    {"messages": messages},
    config={"configurable": {"thread_id": f"model_{model_id}_session_{session['id']}"}}
):
    # Handle chunks (same as current code)
```

### Step 4: Test

**Navigate to:** `/m/184/c/90`

**Send:** "what was the AI thinking?"

**Expected logs:**
```
[LangGraph] Creating react agent for model 184
  - Model: openai/gpt-4.1-mini
  - Tools: ['analyze_trades', 'get_ai_reasoning', 'calculate_metrics', 'suggest_rules']
[LangGraph] Agent created successfully
[DEBUG] Chunk #1: {'type': 'tool', 'tool': 'get_ai_reasoning'}
[DEBUG] Chunk #2: {'type': 'token', 'content': 'According to the AI reasoning logs...'}
✅ Agent stream completed, tools used: ['get_ai_reasoning']
```

---

## Key Differences from Current SystemAgent

### What Changes:

**OLD (LangChain):**
```python
from langchain.agents import create_agent

self.agent = create_agent(
    self.model,
    tools=self.tools,
    system_prompt=prompt
)
```

**NEW (LangGraph):**
```python
from langgraph.prebuilt import create_react_agent

agent = create_react_agent(
    chat_model,
    tools,
    state_modifier=system_prompt  # Different parameter name
)
```

**Benefits:**
- Better maintained
- More reliable
- Better streaming
- Checkpointing built-in
- Proven to work

---

## Migration Steps

1. Create `agents/model_agent_langgraph.py`
2. Test it works independently
3. Update `backend/main.py` to use new agent
4. Remove old SystemAgent usage (keep file for run conversations)
5. Test end-to-end
6. Document
7. Commit

---

## Success Criteria

- [ ] Agent responds (not empty)
- [ ] Tools are called when appropriate
- [ ] Streaming works smoothly
- [ ] Frontend receives responses
- [ ] Tool events display
- [ ] Messages save with tool_calls
- [ ] No errors in logs

---

**Ready to implement - this should fix the bug AND upgrade architecture!**

