"""
Upstash Redis Client - Serverless key-value cache
Used for intraday trading data and session state
"""

import httpx
from typing import Optional, Dict, Any
import json
import asyncio
from config import settings


class UpstashRedis:
    """
    Upstash Redis client using REST API with persistent connection pool
    
    Serverless, edge-optimized, perfect for intraday trading cache.
    Uses a single persistent httpx client to avoid repeated TLS handshakes.
    """
    
    def __init__(self):
        self.base_url = settings.UPSTASH_REDIS_REST_URL
        self.token = settings.UPSTASH_REDIS_REST_TOKEN
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Persistent client with connection pooling
        # limits=max_connections=20 prevents overwhelming the server
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0, connect=10.0),  # 30s total, 10s connect
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
            http2=True  # Enable HTTP/2 for better multiplexing
        )
    
    async def close(self):
        """Close the persistent client (call on shutdown)"""
        await self._client.aclose()
    
    async def _request_with_retry(self, method: str, url: str, **kwargs) -> httpx.Response:
        """
        Make HTTP request with exponential backoff retry
        
        Args:
            method: HTTP method (GET/POST)
            url: Request URL
            **kwargs: Additional request parameters
            
        Returns:
            Response object
        """
        max_retries = 3
        base_delay = 0.5  # Start with 500ms
        
        for attempt in range(max_retries):
            try:
                if method.upper() == "GET":
                    response = await self._client.get(url, **kwargs)
                else:
                    response = await self._client.post(url, **kwargs)
                
                # Return on success or non-retryable status
                if response.status_code < 500:
                    return response
                
                # Server error - retry with backoff
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    await asyncio.sleep(delay)
                else:
                    return response
                    
            except (httpx.TimeoutException, httpx.ConnectTimeout) as e:
                # Connection timeout - retry with backoff
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    print(f"  ⚠️ Redis timeout (attempt {attempt + 1}/{max_retries}), retrying in {delay}s...")
                    await asyncio.sleep(delay)
                else:
                    raise  # Re-raise on final attempt
            
            except Exception as e:
                # Other errors - don't retry
                raise
        
        # Should never reach here, but just in case
        raise Exception("Max retries exceeded")
    
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
        try:
            # Serialize value to JSON string
            json_str = json.dumps(value) if not isinstance(value, str) else value
            
            if ex:
                # Use SETEX command for keys with TTL
                url = f"{self.base_url}/setex/{key}/{ex}"
            else:
                # Use SET command for keys without TTL
                url = f"{self.base_url}/set/{key}"
            
            # Use persistent client with retry logic
            response = await self._request_with_retry(
                "POST",
                url, 
                headers={**self.headers, "Content-Type": "text/plain"}, 
                content=json_str
            )
            return response.status_code == 200
            
        except Exception as e:
            print(f"  ❌ Redis SET failed for key {key}: {e}")
            return False
    
    async def get(self, key: str) -> Optional[Any]:
        """
        Get value by key
        
        Args:
            key: Redis key
        
        Returns:
            Parsed JSON value or None if not found
        """
        try:
            url = f"{self.base_url}/get/{key}"
            
            response = await self._request_with_retry(
                "GET",
                url,
                headers=self.headers
            )
            
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
            
        except Exception as e:
            print(f"  ❌ Redis GET failed for key {key}: {e}")
            return None
    
    async def delete(self, key: str) -> bool:
        """Delete key"""
        try:
            url = f"{self.base_url}/del/{key}"
            
            response = await self._request_with_retry(
                "POST",
                url,
                headers=self.headers
            )
            return response.status_code == 200
            
        except Exception as e:
            print(f"  ❌ Redis DELETE failed for key {key}: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        try:
            url = f"{self.base_url}/exists/{key}"
            
            response = await self._request_with_retry(
                "GET",
                url,
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("result", 0) == 1
            
            return False
            
        except Exception as e:
            print(f"  ❌ Redis EXISTS failed for key {key}: {e}")
            return False
    
    async def ping(self) -> bool:
        """Test connection"""
        try:
            url = f"{self.base_url}/ping"
            
            response = await self._request_with_retry(
                "GET",
                url,
                headers=self.headers
            )
            return response.status_code == 200
            
        except Exception as e:
            print(f"  ❌ Redis PING failed: {e}")
            return False


# Global instance with persistent connection pool
redis_client = UpstashRedis()

