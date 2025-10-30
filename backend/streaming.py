"""
Real-time trading event streaming
Allows clients to watch AI trading decisions as they happen
"""

import asyncio
from typing import Dict, Set
from datetime import datetime
import json


class TradingEventStream:
    """Manages streaming of trading events to connected clients"""
    
    def __init__(self):
        # {model_id: Set of queues for connected clients}
        self.subscribers: Dict[int, Set[asyncio.Queue]] = {}
    
    def subscribe(self, model_id: int) -> asyncio.Queue:
        """Subscribe to trading events for a model"""
        queue = asyncio.Queue()
        
        if model_id not in self.subscribers:
            self.subscribers[model_id] = set()
        
        self.subscribers[model_id].add(queue)
        return queue
    
    def unsubscribe(self, model_id: int, queue: asyncio.Queue):
        """Unsubscribe from trading events"""
        if model_id in self.subscribers:
            self.subscribers[model_id].discard(queue)
            
            # Clean up empty sets
            if not self.subscribers[model_id]:
                del self.subscribers[model_id]
    
    async def emit(self, model_id: int, event_type: str, data: Dict):
        """Emit event to all subscribers of a model"""
        if model_id not in self.subscribers:
            return
        
        event = {
            "type": event_type,
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        
        # Send to all subscribers
        for queue in self.subscribers[model_id]:
            try:
                await queue.put(event)
            except Exception as e:
                print(f"Error emitting event: {e}")
    
    def get_subscriber_count(self, model_id: int) -> int:
        """Get number of active subscribers for a model"""
        return len(self.subscribers.get(model_id, set()))


# Global event stream
event_stream = TradingEventStream()

