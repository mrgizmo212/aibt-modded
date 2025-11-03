"""
Synchronous Redis Client for Config Only
Separate from async redis_client to support both sync and async contexts
"""

import httpx
import json
from typing import Optional, Any
from config import settings


class SyncRedisConfig:
    """
    Synchronous Redis client specifically for runtime config
    
    Why synchronous?
    - MCP tools (buy/sell) are synchronous functions
    - Can't use async/await in FastMCP tool decorators
    - Need to read SIGNATURE in subprocess context
    
    Why separate from async redis_client?
    - Async client is for intraday cache (high volume)
    - Config client is for low-volume, cross-process config
    - Different use cases, different performance profiles
    """
    
    def __init__(self):
        """Initialize with Upstash REST API credentials"""
        self.base_url = settings.UPSTASH_REDIS_REST_URL
        self.token = settings.UPSTASH_REDIS_REST_TOKEN
        
        if not self.base_url or not self.token:
            print("⚠️  Upstash Redis not configured - config will use file fallback only")
            self._client = None
            return
        
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Synchronous httpx client (not AsyncClient!)
        # Short timeout since config reads should be fast
        self._client = httpx.Client(
            timeout=5.0,  # 5 second timeout
            headers=self.headers
        )
    
    def close(self):
        """Close the client connection"""
        if self._client:
            self._client.close()
    
    def set(self, key: str, value: Any, ex: int = 3600) -> bool:
        """
        Set config value with TTL
        
        Args:
            key: Redis key (e.g., "config:model-123:SIGNATURE")
            value: Value to store (will be JSON serialized)
            ex: Expiration in seconds (default 1 hour)
        
        Returns:
            True if successful, False otherwise
        """
        if not self._client:
            return False
        
        try:
            # Serialize value to JSON string
            json_str = json.dumps(value) if not isinstance(value, str) else value
            
            # Use SETEX command for automatic expiration
            url = f"{self.base_url}/setex/{key}/{ex}"
            
            response = self._client.post(
                url,
                content=json_str,
                headers={"Content-Type": "text/plain"}
            )
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"  ⚠️  Redis config SET failed for key {key}: {e}")
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get config value
        
        Args:
            key: Redis key
        
        Returns:
            Parsed value or None if not found
        """
        if not self._client:
            return None
        
        try:
            url = f"{self.base_url}/get/{key}"
            
            response = self._client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                result = data.get("result")
                
                if result is None:
                    return None
                
                # Parse JSON if it's a string
                if isinstance(result, str):
                    try:
                        return json.loads(result)
                    except json.JSONDecodeError:
                        return result  # Return as-is if not JSON
                else:
                    return result
            
            return None
            
        except Exception as e:
            print(f"  ⚠️  Redis config GET failed for key {key}: {e}")
            return None
    
    def delete(self, key: str) -> bool:
        """Delete config key"""
        if not self._client:
            return False
        
        try:
            url = f"{self.base_url}/del/{key}"
            response = self._client.post(url)
            return response.status_code == 200
        except Exception as e:
            print(f"  ⚠️  Redis config DELETE failed for key {key}: {e}")
            return False
    
    def ping(self) -> bool:
        """Test connection"""
        if not self._client:
            return False
        
        try:
            url = f"{self.base_url}/ping"
            response = self._client.get(url)
            return response.status_code == 200
        except Exception as e:
            print(f"  ⚠️  Redis config PING failed: {e}")
            return False


# Global synchronous instance for config operations
sync_redis_config = SyncRedisConfig()
