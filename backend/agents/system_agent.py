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
        # Verify ownership
        model = supabase.table("models").select("user_id").eq("id", model_id).execute()
        if not model.data:
            raise PermissionError(f"Model {model_id} not found")
        
        model_owner = model.data[0]["user_id"]
        print(f"🔍 Chat auth check: model_owner={model_owner}, requesting_user={user_id}, match={model_owner == user_id}")
        
        if model_owner != user_id:
            raise PermissionError(f"User {user_id} cannot access model {model_id} owned by {model_owner}")
        
        self.model_id = model_id
        self.run_id = run_id
        self.user_id = user_id
        self.supabase = supabase
        
        # Initialize LangChain model
        self.model = ChatOpenAI(
            model="gpt-4o",
            temperature=0.3  # Lower for analytical responses
        )
        
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
        
        return [
            create_analyze_trades_tool(self.supabase, self.model_id, self.run_id, self.user_id),
            create_suggest_rules_tool(self.supabase, self.model_id, self.user_id),
            create_calculate_metrics_tool(self.supabase, self.model_id, self.run_id, self.user_id)
        ]
    
    def _get_system_prompt(self) -> str:
        """System prompt for strategy analyst agent"""
        
        context_info = f"Model ID: {self.model_id}"
        if self.run_id:
            context_info += f" | Analyzing Run #{self.run_id}"
        else:
            context_info += " | Analyzing all runs"
        
        return f"""You are an expert trading strategy analyst and coach.

Your role:
1. Help users understand their trading performance
2. Analyze what worked and what didn't work
3. Suggest concrete improvements to their strategy
4. Generate structured rules based on data insights
5. Explain complex trading concepts in simple terms
6. Be honest about losses and mistakes

You have access to tools that query:
- Complete trade history with AI reasoning
- Performance metrics and statistics
- Position snapshots over time
- AI decision logs for every trade

Guidelines:
- Provide specific, actionable advice with data citations
- Cite actual trades as evidence (use tools to get data)
- Suggest rules with concrete parameters
- Explain risk/reward tradeoffs clearly
- Use tools to query data - don't guess or hallucinate

Current context: {context_info}

When analyzing:
- Look for patterns in winning vs losing trades
- Identify high-risk behaviors (over-concentration, excessive risk)
- Compare actual performance to user's stated strategy
- Suggest specific, measurable improvements

When suggesting rules:
- Always include: rule_name, category, description
- Always include: enforcement_params with concrete numbers
- Explain: why this rule helps, what it prevents
- Show: how it would have improved past performance (if data available)
"""
    
    async def chat(
        self, 
        user_message: str, 
        conversation_history: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Process user message and return response
        
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
                "suggested_rules": []  # TODO: Parse suggested rules from content
            }
            
        except Exception as e:
            print(f"System agent error: {e}")
            return {
                "response": f"I encountered an error: {str(e)}",
                "tool_calls": [],
                "suggested_rules": []
            }


def create_system_agent(
    model_id: int,
    run_id: Optional[int],
    user_id: str,
    supabase: Client
) -> SystemAgent:
    """Factory function to create system agent instance"""
    return SystemAgent(model_id, run_id, user_id, supabase)

