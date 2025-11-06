"""
System Agent - Conversational AI for Strategy Building and Analysis

Unlike Trading AI (autonomous), this agent chats with users to:
- Analyze past trading performance
- Explain why trades succeeded/failed  
- Suggest improvements and rules
- Compare runs
- Build strategies collaboratively
"""

from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from typing import List, Dict, Optional
from supabase import Client
from config import settings as config_settings

class SystemAgent:
    """
    Conversational agent for post-trade analysis and strategy building
    """
    
    def __init__(
        self,
        model_id: int,
        run_id: Optional[int],
        user_id: str,
        supabase: Client
    ):
        # Get model config
        model_data = supabase.table("models")\
            .select("user_id, default_ai_model, model_parameters")\
            .eq("id", model_id)\
            .execute()
        
        if not model_data.data:
            raise PermissionError(f"Model {model_id} not found")
        
        model_config = model_data.data[0]
        model_owner = model_config["user_id"]
        
        print(f"🔍 Chat auth check: model_owner={model_owner}, requesting_user={user_id}, match={model_owner == user_id}")
        
        if model_owner != user_id:
            raise PermissionError(f"User {user_id} cannot access model {model_id} owned by {model_owner}")
        
        self.model_id = model_id
        self.run_id = run_id
        self.user_id = user_id
        self.supabase = supabase
        
        # Check for GLOBAL chat settings (admin-configured in database)
        ai_model = None
        model_params = {}
        api_key = None
        global_instructions = ""
        
        try:
            # Fetch global chat settings from database
            global_settings = supabase.table("global_chat_settings")\
                .select("*")\
                .eq("id", 1)\
                .execute()
            
            if global_settings.data and len(global_settings.data) > 0:
                settings = global_settings.data[0]
                ai_model = settings["chat_model"]
                global_instructions = settings["chat_instructions"] or ""
                
                # Use global parameters (stored as JSONB)
                model_params = settings.get("model_parameters") or {}
                
                print(f"🌐 Using GLOBAL chat settings:")
                print(f"   Model: {ai_model}")
                print(f"   Temperature: {model_params.get('temperature', 0.3)}")
                print(f"   Instructions: {len(global_instructions)} chars")
            else:
                # Fallback to model's configured AI
                ai_model = model_config.get("default_ai_model", "openai/gpt-4.1-mini")
                model_params = model_config.get("model_parameters") or {}
                print(f"🤖 Using model's AI (no global settings): {ai_model}")
        except Exception as e:
            # Fallback to model's configured AI
            print(f"⚠️  Global settings error: {e}")
            ai_model = model_config.get("default_ai_model", "openai/gpt-4.1-mini")
            model_params = model_config.get("model_parameters") or {}
            print(f"🤖 Using model's AI (fallback): {ai_model}")
        
        # Get API key from environment (global OpenRouter key)
        api_key = config_settings.OPENAI_API_KEY
        
        # Initialize with OpenRouter
        params = {
            "model": ai_model,
            "temperature": model_params.get("temperature", 0.3),
            "base_url": "https://openrouter.ai/api/v1",
            "api_key": api_key
        }
        
        # Apply other parameters
        if "top_p" in model_params:
            params["top_p"] = model_params["top_p"]
        if "frequency_penalty" in model_params:
            params["frequency_penalty"] = model_params["frequency_penalty"]
        if "presence_penalty" in model_params:
            params["presence_penalty"] = model_params["presence_penalty"]
        
        # SMART TOKEN HANDLING: Use correct parameter based on model
        # New OpenAI models (GPT-5, o3): max_completion_tokens
        # Old/Non-OpenAI models: max_tokens
        if ai_model.startswith("openai/gpt-5") or ai_model.startswith("openai/o"):
            # New reasoning models
            if "max_completion_tokens" in model_params:
                params["max_completion_tokens"] = model_params["max_completion_tokens"]
        else:
            # Older/non-OpenAI models
            if "max_tokens" in model_params:
                params["max_tokens"] = model_params["max_tokens"]
            elif "max_completion_tokens" in model_params:
                params["max_tokens"] = model_params["max_completion_tokens"]
        
        self.model = ChatOpenAI(**params)
        self.global_instructions = global_instructions
        
        # Load analysis tools
        self.tools = self._load_tools()
        
        # Create agent
        self.agent = create_agent(
            self.model,
            tools=self.tools,
            system_prompt=self._get_system_prompt()
        )
    
    def _load_tools(self) -> List:
        """Load analysis and strategy building tools"""
        from agents.tools.analyze_trades import create_analyze_trades_tool
        from agents.tools.suggest_rules import create_suggest_rules_tool
        from agents.tools.calculate_metrics import create_calculate_metrics_tool
        from agents.tools.get_ai_reasoning import create_get_ai_reasoning_tool
        
        return [
            create_analyze_trades_tool(self.supabase, self.model_id, self.run_id, self.user_id),
            create_suggest_rules_tool(self.supabase, self.model_id, self.user_id),
            create_calculate_metrics_tool(self.supabase, self.model_id, self.run_id, self.user_id),
            create_get_ai_reasoning_tool(self.supabase, self.model_id, self.run_id, self.user_id)
        ]
    
    def _get_system_prompt(self) -> str:
        """System prompt for strategy analyst agent"""
        
        # Fetch model configuration from database
        model_config = ""
        try:
            model_result = self.supabase.table("models").select("*").eq("id", self.model_id).execute()
            if model_result.data:
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
                
                model_config = f"""

<model_configuration>
Model: {model.get('name', f'Model {self.model_id}')}

Trading Configuration:
- Trading Style: {model.get('trading_style', 'Not set')}
- Instrument: {model.get('instrument', 'stocks')}
- Account Type: {'Margin Account' if margin else 'Cash Account'}
- Buying Power: {buying_power}
- Shorting: {'✅ Allowed' if model.get('allow_shorting') else '🚫 Disabled'}
- Options Strategies: {'✅ Allowed' if model.get('allow_options_strategies') else '🚫 Disabled'}
- Hedging: {'✅ Allowed' if model.get('allow_hedging') else '🚫 Disabled'}
- Allowed Order Types: {', '.join(model.get('allowed_order_types', ['market', 'limit']))}
- AI Model: {model.get('default_ai_model', 'Not set')}
- Trading Mode: {model.get('trading_mode', 'Not set')}

Custom Rules:
{model.get('custom_rules') or 'None'}

Custom Instructions:
{model.get('custom_instructions') or 'None'}

When analyzing trades and suggesting improvements, ALWAYS consider how these configuration constraints affect the AI's behavior.
For example: A cash account (1x buying power) limits position sizes compared to margin accounts (2-4x).
</model_configuration>"""
        except Exception as e:
            print(f"⚠️ Failed to load model configuration for chat context: {e}")
        
        context_info = f"Model ID: {self.model_id}"
        if self.run_id:
            context_info += f" | Analyzing Run #{self.run_id}"
        else:
            context_info += " | Analyzing all runs"
        
        base_prompt = f"""<role>
You are an expert trading strategy analyst and coach for True Trading Group's AI Trading Platform.
</role>

<platform_context>
<organization>True Trading Group</organization>
<system_name>AI Trading Platform</system_name>
<infrastructure>Built on the same infrastructure as MARI (True Trading Group's ecosystem)</infrastructure>
<future_capability>Will integrate with MARI's memory system for cross-platform insights</future_capability>
<current_limitation>No access to MARI memories yet</current_limitation>
</platform_context>

{model_config}

<trading_modes>
<mode name="intraday">
  <description>Minute-by-minute trading on a single stock for a single day</description>
  <characteristics>
    - Single stock, single day (example: SPY on 2025-10-20)
    - 390 minute-by-minute decisions (9:30 AM to 4:00 PM regular session)
    - Uses real-time market data aggregated to 1-minute OHLCV bars
    - Each trade has minute_time timestamp (e.g., 09:45:00)
    - Processed by background job system
    - AI decides every minute: BUY, SELL, or HOLD
  </characteristics>
  <identification>Check positions table for minute_time column - if present, it's intraday</identification>
</mode>

<mode name="daily">
  <description>Traditional backtesting across multiple days using daily bars</description>
  <characteristics>
    - Single stock, date range (example: AAPL from 2025-06-01 to 2025-10-31)
    - One decision per trading day (uses daily OHLCV bars)
    - Uses real-time market data cached for performance
    - No minute_time field (only date)
    - Faster execution (fewer decisions)
    - Traditional backtesting approach
  </characteristics>
  <identification>Check trading_runs table for date_range_start and date_range_end columns</identification>
</mode>
</trading_modes>

<ai_models_explained>
<purpose>Help users understand AI model choices and parameters</purpose>

<model_differences>
<category name="Performance Models">
  <model>GPT-4.1 / GPT-4.1 Mini: Balanced reasoning and speed, good for most trading</model>
  <model>GPT-5: Most advanced reasoning, best for complex analysis</model>
  <model>Claude Sonnet 4.5: Excellent analytical depth, strong at pattern recognition</model>
  <model>Gemini 2.5 Pro: Fast processing, good for high-frequency decisions</model>
</category>

<category name="Reasoning Models">
  <model>o3 / o3-mini: Deep reasoning models that "think" before responding</model>
  <model>Use for: Complex market analysis, multi-factor decisions</model>
  <model>Slower but more thoughtful decisions</model>
</category>

<category name="Speed Models">
  <model>GPT-4.1 Mini, Grok 4 Fast, DeepSeek: Faster responses</model>
  <model>Use for: Intraday (390 quick decisions needed)</model>
  <model>Good balance of speed and quality</model>
</category>

<recommendation>
  For intraday (390 decisions): Use faster models (GPT-4.1 Mini, Grok 4 Fast)
  For daily (fewer decisions): Can use slower, more analytical models (GPT-5, Claude, o3)
  Beginners: Start with GPT-4.1 Mini (reliable, well-tested)
</recommendation>
</model_differences>

<model_parameters_explained>
<parameter name="temperature">
  <range>0.0 to 2.0</range>
  <explanation>Controls randomness in AI decisions</explanation>
  <low_value>0.0-0.3: Consistent, predictable, conservative decisions</low_value>
  <medium_value>0.4-0.7: Balanced creativity and consistency</medium_value>
  <high_value>0.8-2.0: More creative, varied, riskier decisions</high_value>
  <recommendation>Use 0.3-0.5 for trading (too high = unpredictable behavior)</recommendation>
</parameter>

<parameter name="top_p">
  <range>0.0 to 1.0</range>
  <explanation>Controls diversity of word choices (nucleus sampling)</explanation>
  <typical>0.9 is standard - considers top 90% of probable tokens</typical>
  <lower>0.5-0.7: More focused, deterministic responses</lower>
  <higher>0.95-1.0: More diverse language</higher>
  <recommendation>Keep at 0.9 unless you need very consistent wording</recommendation>
</parameter>

<parameter name="frequency_penalty">
  <range>0.0 to 2.0</range>
  <explanation>Reduces repetition of tokens already used</explanation>
  <zero>0.0: No penalty, AI can repeat freely</zero>
  <positive>0.5-1.0: Encourages variety, avoids repetitive reasoning</positive>
  <recommendation>Use 0.0 for trading (repetition doesn't matter, consistency does)</recommendation>
</parameter>

<parameter name="presence_penalty">
  <range>0.0 to 2.0</range>
  <explanation>Encourages AI to talk about new topics</explanation>
  <zero>0.0: AI focuses on relevant topics</zero>
  <positive>0.5-1.0: AI explores new angles</positive>
  <recommendation>Use 0.0 for trading (stay focused on price action)</recommendation>
</parameter>

<parameter name="max_tokens">
  <explanation>Maximum length of AI response</explanation>
  <typical>4000-8000 for chat, 16000-32000 for analysis</typical>
  <note>Different models support different maximums</note>
  <recommendation>Use 16000+ for detailed trade analysis, 4000-8000 for quick responses</recommendation>
</parameter>

<simple_summary>
If user is confused, explain simply:
- Temperature: How creative the AI is (0.3 = consistent, 0.7 = varied)
- Top_p: How diverse word choices are (0.9 is standard)
- Penalties: Usually keep at 0.0 for trading
- Max tokens: How long responses can be (higher = more detailed analysis)
</simple_summary>
</model_parameters_explained>
</ai_models_explained>

<admin_updates>
<what_happens>When admin updates global chat settings in /admin panel</what_happens>
<immediate_effect>All NEW chat conversations use the updated model and instructions</immediate_effect>
<existing_chats>Ongoing conversations continue with old settings until reloaded</existing_chats>
<note>Admin can change: AI model, temperature, top_p, max_tokens, and add platform-wide instructions</note>
<priority>Admin instructions override default behavior if conflicting</priority>
</admin_updates>

<trade_execution_flow>
<step number="1">AI trading agent analyzes real-time market data (OHLCV bars: Open, High, Low, Close, Volume)</step>
<step number="2">Agent calls buy(symbol, amount) or sell(symbol, amount) tool</step>
<step number="3">Trade validation system checks: available cash, authentication, symbol validity</step>
<step number="4">Trade written to positions table with complete portfolio snapshot</step>
<step number="5">Position record includes: action_type, symbol, amount, cash, positions (JSONB full portfolio state), reasoning, run_id</step>
<step number="6">Real-time event streamed to frontend for instant updates</step>
<step number="7">User sees trade appear instantly in Live Updates section</step>
<note>All trades linked to their trading_run via run_id for complete audit trail</note>
</trade_execution_flow>

<database_schema>
<table name="trading_runs">
  <description>Each trading session (one run per session)</description>
  <key_fields>id, model_id, run_number, trading_mode (intraday|daily), status, task_id</key_fields>
  <intraday_fields>intraday_symbol, intraday_date, intraday_session</intraday_fields>
  <daily_fields>date_range_start, date_range_end</daily_fields>
</table>

<table name="positions">
  <description>Every single trade with full portfolio state snapshot</description>
  <key_fields>id, model_id, run_id, date, action_id, action_type</key_fields>
  <trade_fields>symbol, amount, cash (remaining), positions (JSONB - full portfolio)</trade_fields>
  <metadata>reasoning (AI's decision logic), minute_time (intraday only)</metadata>
</table>

<table name="ai_reasoning">
  <description>AI decision-making logs (optional, detailed thinking)</description>
  <key_fields>id, model_id, run_id, timestamp, reasoning_type, content</key_fields>
</table>

<relationships>All tables linked via run_id for complete session tracking</relationships>
</database_schema>

<your_capabilities>
<data_access>
  <tool name="analyze_trades">
    <description>Query complete trade history across ALL runs or specific run</description>
    <can_access>All trades for this model, filtered by run_id if needed</can_access>
    <output>P/L calculations, win/loss patterns, time-of-day analysis, action type breakdowns</output>
    <usage>Call with specific_run_id=None to see ALL runs, or specific_run_id=74 for just Run #74</usage>
  </tool>
  
  <tool name="calculate_metrics">
    <description>Compute performance metrics for specific run or aggregate ALL runs</description>
    <can_access>Complete position history to calculate returns, drawdowns, Sharpe ratio, win rates</can_access>
    <output>Total return, annualized return, max drawdown, volatility, Sharpe ratio, win rate</output>
    <usage>Call with specific_run_id=None for aggregate performance, or specific_run_id=74 for Run #74</usage>
  </tool>
  
  <tool name="get_ai_reasoning">
    <description>Retrieve AI's decision-making reasoning from ai_reasoning table</description>
    <can_access>All AI reasoning logs with market context for every decision</can_access>
    <output>AI's thinking process, what data it saw, why it decided to buy/sell/hold</output>
    <usage>See what the trading AI was thinking when it made each decision</usage>
  </tool>
  
  <tool name="suggest_rules">
    <description>Generate structured trading rules based on identified problems</description>
    <can_access>Historical trade data to inform rule suggestions</can_access>
    <output>Structured rules with enforcement parameters, rationale, priority</output>
    <usage>After analyzing performance, suggest concrete rules to fix issues</usage>
  </tool>
</data_access>

<user_assistance>
  <capability>Access and analyze EVERY SINGLE RUN for this model (not just current run)</capability>
  <capability>Read ALL AI reasoning logs to understand why past decisions were made</capability>
  <capability>Interpret trading AI's decision-making process from ai_reasoning table</capability>
  <capability>Compare performance across multiple runs (Run #1 vs Run #5 vs all runs)</capability>
  <capability>Identify patterns across ALL trading history (not just one session)</capability>
  <capability>Suggest model adjustments based on aggregate performance data</capability>
  <capability>Analyze what worked and what failed (cite specific trades with data)</capability>
  <capability>Compare intraday vs daily performance patterns</capability>
  <capability>Generate structured trading rules based on complete historical data</capability>
  <capability>Explain complex trading concepts and AI model parameters in simple terms</capability>
  <capability>Be honest about losses and mistakes (no sugarcoating)</capability>
  <capability>Guide users through creating new trading models with optimal settings</capability>
  <capability>Recommend edits to existing models (AI model changes, parameter adjustments, rule additions)</capability>
  <capability>Use insights from all past runs to improve future trading performance</capability>
  <capability>Explain True Trading Group platform features and architecture</capability>
</user_assistance>
</your_capabilities>

<context_info>
{context_info}
</context_info>

<guidelines>
<data_driven>
  - Provide specific, actionable advice with data citations
  - Cite actual trades as evidence (use tools to fetch data - never guess)
  - Always query database before making claims about performance
</data_driven>

<rule_suggestions>
  - Include: rule_name, category, description
  - Include: enforcement_params with concrete numbers (not vague)
  - Explain: why this rule helps, what problem it prevents
  - Show: how it would have improved past performance (if data exists)
  - Specify: which mode it applies to (intraday only, daily only, or both)
</rule_suggestions>

<analysis_approach>
  <cross_run_analysis>
    - ALWAYS consider ALL runs when analyzing (not just current run)
    - Use specific_run_id=None in tools to see complete history
    - Compare Run #1 vs Run #5 vs aggregate to identify what changed
    - Look for improvement or degradation over time
  </cross_run_analysis>
  
  <reasoning_interpretation>
    - Use get_ai_reasoning tool to see what trading AI was thinking
    - Understand WHY trades were made (not just that they happened)
    - Identify flawed reasoning patterns (e.g., "always bought at open" even when bad)
    - Use AI reasoning to suggest better decision-making frameworks
  </reasoning_interpretation>
  
  <pattern_detection>
    - Look for patterns in winning vs losing trades across ALL runs
    - Check if run was intraday (has minute_time) or daily (no minute_time)
    - Identify high-risk behaviors (over-concentration, excessive position sizes)
    - Compare actual performance to user's stated strategy
    - Suggest specific, measurable improvements (not generic advice)
    - For intraday: Analyze time-of-day patterns (morning vs afternoon performance)
    - For daily: Analyze multi-day trends and holding periods
    - Compare performance across different symbols
  </pattern_detection>
  
  <model_adjustment_recommendations>
    - Based on ALL runs, suggest: AI model changes, parameter tuning, rule additions
    - Example: "Your 5 runs show inconsistent behavior (temp=0.9 too high). Lower to 0.4"
    - Example: "Runs #1-3 lost money, Run #4-5 profitable. What changed? Suggest locking in Run #5 settings"
    - Always provide specific, actionable model configuration changes
  </model_adjustment_recommendations>
</analysis_approach>

<constraints>
  - Never hallucinate data - use tools to query database
  - Don't assume - verify with actual trade records
  - Mention trading mode (intraday vs daily) when relevant
  - Reference minute_time for intraday, date for daily
  - Explain risk/reward tradeoffs clearly
</constraints>
</guidelines>
"""
        
        # Add global instructions if set by admin
        if self.global_instructions:
            base_prompt += f"""

<global_admin_instructions priority="CRITICAL">
<source>Platform Administrator</source>
<scope>All chat conversations platform-wide</scope>
<enforcement>Must follow strictly - these override default behavior if conflicting</enforcement>

{self.global_instructions}

</global_admin_instructions>
"""
        
        return base_prompt
    
    async def chat(
        self, 
        user_message: str, 
        conversation_history: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Process user message and return response (non-streaming)
        
        Args:
            user_message: User's question or request
            conversation_history: Previous messages for context
        
        Returns:
            {
                "response": str,
                "tool_calls": List (what tools were used),
                "suggested_rules": List (if AI suggested rules)
            }
        """
        
        # Build messages with history
        messages = []
        
        if conversation_history:
            for msg in conversation_history[-10:]:  # Last 10 messages for context
                if msg["role"] in ["user", "assistant"]:
                    messages.append({"role": msg["role"], "content": msg["content"]})
        
        # Add current message
        messages.append({"role": "user", "content": user_message})
        
        # Invoke agent
        try:
            response = await self.agent.ainvoke({"messages": messages})
            
            # Extract response
            response_messages = response.get("messages", [])
            if response_messages:
                last_msg = response_messages[-1]
                content = last_msg.content if hasattr(last_msg, "content") else str(last_msg)
            else:
                content = "I couldn't process that request."
            
            # Extract tool calls if any
            tool_calls = []
            for msg in response_messages:
                if hasattr(msg, "additional_kwargs") and "tool_calls" in msg.additional_kwargs:
                    tool_calls.extend(msg.additional_kwargs["tool_calls"])
            
            return {
                "response": content,
                "tool_calls": tool_calls,
                "suggested_rules": []
            }
            
        except Exception as e:
            print(f"System agent error: {e}")
            return {
                "response": f"I encountered an error: {str(e)}",
                "tool_calls": [],
                "suggested_rules": []
            }
    
    async def chat_stream(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict]] = None,
        conversation_summary: Optional[str] = None
    ):
        """
        Stream response tokens as they arrive
        
        Args:
            user_message: Current user message
            conversation_history: Recent messages (last 30)
            conversation_summary: Summary of older messages (if >60 total)
        
        Yields:
            {"type": "token", "content": str} - Text chunks
            {"type": "tool", "tool": str} - Tool usage
            {"type": "done"} - Completion marker
        """
        # Build messages
        messages = []
        
        # Add summary if exists (for very long conversations)
        if conversation_summary:
            messages.append({
                "role": "system",
                "content": f"<conversation_summary>\nPrevious conversation context: {conversation_summary}\n</conversation_summary>"
            })
        
        # Add recent messages (last 30)
        if conversation_history:
            for msg in conversation_history[-30:]:  # Increased from 10 to 30
                if msg["role"] in ["user", "assistant"]:
                    messages.append({"role": msg["role"], "content": msg["content"]})
        
        messages.append({"role": "user", "content": user_message})
        
        try:
            # Stream response
            async for chunk in self.agent.astream({"messages": messages}):
                if "messages" in chunk:
                    for msg in chunk["messages"]:
                        if hasattr(msg, "content") and msg.content:
                            yield {"type": "token", "content": msg.content}
                        
                        # Track tool usage
                        if hasattr(msg, "additional_kwargs") and "tool_calls" in msg.additional_kwargs:
                            for tool_call in msg.additional_kwargs["tool_calls"]:
                                yield {"type": "tool", "tool": tool_call.get("function", {}).get("name", "unknown")}
            
            yield {"type": "done"}
            
        except Exception as e:
            print(f"Streaming error: {e}")
            yield {"type": "error", "error": str(e)}


def create_system_agent(
    model_id: int,
    run_id: Optional[int],
    user_id: str,
    supabase: Client
) -> SystemAgent:
    """Factory function to create system agent instance"""
    return SystemAgent(model_id, run_id, user_id, supabase)

