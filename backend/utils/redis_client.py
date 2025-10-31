"""
Upstash Redis Client - Serverless key-value cache
Used for intraday trading data and session state
"""

import httpx
from typing import Optional, Dict, Any
import json
from config import settings


class UpstashRedis:
    """
    Upstash Redis client using REST API
    
    Serverless, edge-optimized, perfect for intraday trading cache
    """
    
    def __init__(self):
        self.base_url = settings.UPSTASH_REDIS_REST_URL
        self.token = settings.UPSTASH_REDIS_REST_TOKEN
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    async def set(self, key: str, value: Any, ex: Optional[int] = None) -> bool:
        """
        Set key-value pair with optional TTL
        
        Args:
            key: Redis key
            value: Value to store (will be JSON serialized)
            ex: Expiration in seconds (TTL)
        
        Returns:
            True if successful
        """
        # Serialize value to JSON string
        json_str = json.dumps(value) if not isinstance(value, str) else value
        
        if ex:
            # Use SETEX command for keys with TTL
            url = f"{self.base_url}/setex/{key}/{ex}"
        else:
            # Use SET command for keys without TTL
            url = f"{self.base_url}/set/{key}"
        
        async with httpx.AsyncClient() as client:
            # Send as raw text body (Upstash stores it as-is)
            response = await client.post(
                url, 
                headers={**self.headers, "Content-Type": "text/plain"}, 
                content=json_str,  # Raw text, not JSON payload
                timeout=15.0  # Longer timeout for Upstash REST
            )
            return response.status_code == 200
    
    async def get(self, key: str) -> Optional[Any]:
        """
        Get value by key
        
        Args:
            key: Redis key
        
        Returns:
            Parsed JSON value or None if not found
        """
        url = f"{self.base_url}/get/{key}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers, timeout=15.0)  # Longer timeout for Upstash REST
            
            if response.status_code == 200:
                data = response.json()
                result = data.get("result")
                
                if result is None:
                    return None
                
                # Result from Upstash is the raw string we stored
                # Parse it as JSON
                if isinstance(result, str):
                    try:
                        return json.loads(result)
                    except json.JSONDecodeError:
                        return result  # Return as string if not JSON
                else:
                    return result  # Already parsed
            
            return None
    
    async def delete(self, key: str) -> bool:
        """Delete key"""
        url = f"{self.base_url}/del/{key}"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=self.headers, timeout=5.0)
            return response.status_code == 200
    
    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        url = f"{self.base_url}/exists/{key}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers, timeout=5.0)
            
            if response.status_code == 200:
                data = response.json()
                return data.get("result", 0) == 1
            
            return False
    
    async def ping(self) -> bool:
        """Test connection"""
        url = f"{self.base_url}/ping"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers, timeout=5.0)
                return response.status_code == 200
        except:
            return False


# Global instance
redis_client = UpstashRedis()

