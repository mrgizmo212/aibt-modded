"""
Get AI Reasoning Tool - For System Agent
Retrieves AI's decision-making reasoning from past trades
"""

from langchain.tools import tool
from typing import Dict, List, Optional
from supabase import Client
import json

def create_get_ai_reasoning_tool(supabase: Client, model_id: int, run_id: Optional[int], user_id: str):
    """Factory to create get_ai_reasoning tool"""
    
    # Verify ownership
    model = supabase.table("models").select("user_id").eq("id", model_id).execute()
    if not model.data or model.data[0]["user_id"] != user_id:
        raise PermissionError("Access denied")
    
    @tool
    async def get_ai_reasoning(
        run_id_filter: Optional[int] = None,
        limit: int = 50
    ) -> str:
        """
        Get AI reasoning logs for trades
        
        Args:
            run_id_filter: Specific run ID to analyze (None = all runs)
            limit: Maximum number of reasoning logs to retrieve
        
        Returns:
            AI reasoning with context about decisions made
        """
        
        # Build query
        print(f"[get_ai_reasoning] Building query:")
        print(f"  - model_id: {model_id}")
        print(f"  - run_id (context): {run_id}")
        print(f"  - run_id_filter (param): {run_id_filter}")
        
        query = supabase.table("ai_reasoning")\
            .select("*")\
            .eq("model_id", model_id)
        
        # Filter by run if specified
        if run_id_filter:
            print(f"  - Filtering by run_id_filter: {run_id_filter}")
            query = query.eq("run_id", run_id_filter)
        elif run_id:
            # Use current run context
            print(f"  - Filtering by context run_id: {run_id}")
            query = query.eq("run_id", run_id)
        else:
            print(f"  - No run_id filter (querying ALL runs)")
        
        # Order by most recent
        query = query.order("timestamp", desc=True).limit(limit)
        
        print(f"[get_ai_reasoning] Executing query...")
        result = query.execute()
        
        print(f"[get_ai_reasoning] Query result: {len(result.data) if result.data else 0} records")
        
        if not result.data:
            print(f"[get_ai_reasoning] ❌ NO DATA RETURNED - RLS issue or query problem")
            return "No AI reasoning logs found. The AI may not have logged decision-making details for these trades."
        
        reasoning_logs = result.data
        
        # Format response
        response = f"Found {len(reasoning_logs)} AI reasoning logs:\n\n"
        
        for i, log in enumerate(reasoning_logs[:10], 1):  # Show first 10
            response += f"{i}. Run #{log.get('run_id', '?')} - {log.get('reasoning_type', 'decision')}\n"
            response += f"   Time: {log.get('timestamp', 'unknown')}\n"
            response += f"   Reasoning: {log.get('content', 'No content')[:200]}...\n"
            
            # Show context if available
            if log.get('context_json'):
                context = log['context_json']
                if isinstance(context, str):
                    context = json.loads(context)
                response += f"   Market Context: {json.dumps(context, indent=2)[:100]}...\n"
            
            response += "\n"
        
        if len(reasoning_logs) > 10:
            response += f"\n(Showing first 10 of {len(reasoning_logs)} logs. Ask for specific run_id for more detail)\n"
        
        return response
    
    return get_ai_reasoning

