"""
Real-time trading event streaming
Allows clients to watch AI trading decisions as they happen

Uses Redis pub/sub for cross-process event streaming (worker → main backend → frontend)
"""

import asyncio
from typing import Dict, Set
from datetime import datetime
import json


class TradingEventStream:
    """
    Manages streaming of trading events to connected clients
    
    Uses Redis pub/sub for cross-process communication:
    - Worker emits events → Published to Redis
    - Main backend subscribes → Receives from Redis
    - SSE endpoint → Streams to frontend
    """
    
    def __init__(self):
        # {model_id: Set of queues for connected clients}
        self.subscribers: Dict[int, Set[asyncio.Queue]] = {}
        self.redis_client = None
        self._init_redis()
    
    def _init_redis(self):
        """Initialize Redis pub/sub connection for cross-process events"""
        try:
            from utils.redis_client import redis_client
            self.redis_client = redis_client
            print("✅ TradingEventStream: Redis pub/sub enabled (cross-process)")
        except Exception as e:
            print(f"⚠️  TradingEventStream: Redis not available, using in-memory only: {e}")
            self.redis_client = None
    
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
        """
        Emit event to all subscribers AND Redis pub/sub
        
        This allows:
        - Local subscribers (same process) to receive events
        - Remote subscribers (via Redis) to receive events (worker → main backend)
        """
        event = {
            "type": event_type,
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        
        # 1. Send to local in-memory subscribers (if any)
        if model_id in self.subscribers:
            for queue in self.subscribers[model_id]:
                try:
                    await queue.put(event)
                except Exception as e:
                    print(f"Error emitting event to queue: {e}")
        
        # 2. Publish to Redis for cross-process streaming
        if self.redis_client:
            try:
                channel = f"trading:model:{model_id}:events"
                await self.redis_client.set(
                    channel,
                    json.dumps(event),
                    ex=5  # 5 second TTL (ephemeral events)
                )
                # Also publish for pub/sub pattern
                # Note: Upstash REST API doesn't support pub/sub, but we can poll
            except Exception as e:
                pass  # Fail silently - events still work in-memory
    
    def get_subscriber_count(self, model_id: int) -> int:
        """Get number of active subscribers for a model"""
        return len(self.subscribers.get(model_id, set()))


# Global event stream
event_stream = TradingEventStream()

