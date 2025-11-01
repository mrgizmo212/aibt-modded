"""
Quick Test: See Actual Proxy Response Structure
"""

import asyncio
import httpx
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import settings
from dotenv import load_dotenv

load_dotenv()

async def main():
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.POLYGON_PROXY_URL}/polygon/stocks/trades/AAPL",
            headers={"x-custom-key": settings.POLYGON_PROXY_KEY},
            params={
                "timestamp.gte": 1761571800000000000,
                "timestamp.lte": 1761575400000000000,
                "limit": 10  # Just 10 trades
            },
            timeout=10.0
        )
        
        data = response.json()
        
        print("=" * 80)
        print("RAW PROXY RESPONSE STRUCTURE")
        print("=" * 80)
        print(json.dumps(data, indent=2))
        print("=" * 80)

if __name__ == "__main__":
    asyncio.run(main())

