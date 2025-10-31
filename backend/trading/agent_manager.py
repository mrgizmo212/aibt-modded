"""
AI Agent Manager
Manages lifecycle of AI trading agents (start/stop/status)
"""

import asyncio
import json
import os
from pathlib import Path
from typing import Dict, Optional, Any
from datetime import datetime
import sys

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from trading.base_agent import BaseAgent
from trading.agent_prompt import all_nasdaq_100_symbols
from services import create_model, create_position, create_log

# Import event stream for real-time updates
try:
    from streaming import event_stream
except ImportError:
    event_stream = None


class AgentManager:
    """Manages running AI trading agents"""
    
    def __init__(self):
        self.running_agents: Dict[int, Dict[str, Any]] = {}  # {model_id: agent_info}
        self.agent_tasks: Dict[int, asyncio.Task] = {}  # {model_id: task}
    
    async def start_agent(
        self,
        model_id: int,
        user_id: str,
        model_signature: str,
        basemodel: str,
        start_date: str,
        end_date: str,
        initial_cash: float = 10000.0,
        max_steps: int = 30
    ) -> Dict[str, Any]:
        """
        Start AI trading agent
        
        Args:
            model_id: Database model ID
            user_id: Owner user ID
            model_signature: Model signature (e.g., openai-gpt-5)
            basemodel: OpenRouter model name
            start_date: Trading start date
            end_date: Trading end date
            initial_cash: Starting capital
            max_steps: Max reasoning steps per day
        
        Returns:
            Agent status info
        """
        # Check if already running
        if model_id in self.running_agents:
            return {
                "status": "already_running",
                "model_id": model_id,
                "started_at": self.running_agents[model_id]["started_at"]
            }
        
        # Set model ID in environment for multi-user isolation
        os.environ["CURRENT_MODEL_ID"] = str(model_id)
        
        # Create agent instance
        agent = BaseAgent(
            signature=model_signature,
            basemodel=basemodel,
            stock_symbols=all_nasdaq_100_symbols,
            log_path="./data/agent_data",  # Will write to DB instead
            max_steps=max_steps,
            initial_cash=initial_cash,
            init_date=start_date,
            model_id=model_id  # Pass model_id for streaming
        )
        
        # Store agent info
        self.running_agents[model_id] = {
            "model_id": model_id,
            "user_id": user_id,
            "signature": model_signature,
            "basemodel": basemodel,
            "start_date": start_date,
            "end_date": end_date,
            "started_at": datetime.now().isoformat(),
            "status": "initializing",
            "agent": agent
        }
        
        # Start agent in background
        task = asyncio.create_task(
            self._run_agent(model_id, agent, start_date, end_date)
        )
        self.agent_tasks[model_id] = task
        
        return {
            "status": "started",
            "model_id": model_id,
            "started_at": self.running_agents[model_id]["started_at"]
        }
    
    async def _run_agent(self, model_id: int, agent: BaseAgent, start_date: str, end_date: str):
        """Run agent in background"""
        try:
            # Update status
            self.running_agents[model_id]["status"] = "running"
            
            # Emit initializing event
            if event_stream:
                await event_stream.emit(model_id, "status", {"message": "Initializing AI agent..."})
            
            # Initialize agent
            await agent.initialize()
            
            if event_stream:
                await event_stream.emit(model_id, "status", {"message": "Starting trading session..."})
            
            # Run trading
            await agent.run_date_range(start_date, end_date)
            
            # Mark complete
            self.running_agents[model_id]["status"] = "completed"
            self.running_agents[model_id]["completed_at"] = datetime.now().isoformat()
            
            if event_stream:
                await event_stream.emit(model_id, "complete", {"message": "Trading session completed"})
            
        except Exception as e:
            # Mark failed
            self.running_agents[model_id]["status"] = "failed"
            self.running_agents[model_id]["error"] = str(e)
            
            if event_stream:
                await event_stream.emit(model_id, "error", {"message": str(e)})
    
    async def stop_agent(self, model_id: int) -> Dict[str, Any]:
        """Stop running agent"""
        if model_id not in self.running_agents:
            return {"status": "not_running", "model_id": model_id}
        
        # Cancel task
        if model_id in self.agent_tasks:
            self.agent_tasks[model_id].cancel()
            del self.agent_tasks[model_id]
        
        # Update status
        agent_info = self.running_agents[model_id]
        agent_info["status"] = "stopped"
        agent_info["stopped_at"] = datetime.now().isoformat()
        
        return {
            "status": "stopped",
            "model_id": model_id,
            "duration": agent_info.get("started_at")
        }
    
    def get_agent_status(self, model_id: int) -> Optional[Dict[str, Any]]:
        """Get status of agent"""
        if model_id not in self.running_agents:
            return None
        
        info = self.running_agents[model_id].copy()
        # Remove agent object from response
        info.pop("agent", None)
        return info
    
    def get_all_running_agents(self) -> Dict[int, Dict[str, Any]]:
        """Get status of all running agents"""
        return {
            model_id: self.get_agent_status(model_id)
            for model_id in self.running_agents.keys()
        }


# Global agent manager instance
agent_manager = AgentManager()

