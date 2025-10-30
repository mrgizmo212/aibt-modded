"""
MCP Service Manager
Manages lifecycle of MCP trading tools (Math, Search, Trade, Price)
"""

import subprocess
import sys
import time
import signal
from pathlib import Path
from typing import Dict, Optional, Any
import os


class MCPServiceManager:
    """Manages MCP service processes"""
    
    def __init__(self):
        self.services: Dict[str, Dict] = {}
        self.service_configs = {
            'math': {
                'script': 'tool_math.py',
                'port': int(os.getenv('MATH_HTTP_PORT', '8000')),
                'name': 'Math'
            },
            'search': {
                'script': 'tool_jina_search.py',
                'port': int(os.getenv('SEARCH_HTTP_PORT', '8001')),
                'name': 'Search'
            },
            'trade': {
                'script': 'tool_trade.py',
                'port': int(os.getenv('TRADE_HTTP_PORT', '8002')),
                'name': 'Trade'
            },
            'price': {
                'script': 'tool_get_price_local.py',
                'port': int(os.getenv('GETPRICE_HTTP_PORT', '8003')),
                'name': 'Price'
            }
        }
        self.mcp_services_dir = Path(__file__).parent.parent / "mcp_services"
    
    async def start_all_services(self) -> Dict[str, Any]:
        """Start all MCP services"""
        results = {}
        
        for service_id, config in self.service_configs.items():
            result = self.start_service(service_id, config)
            results[service_id] = result
        
        # Wait longer for services to fully initialize
        import asyncio
        print("  Waiting for services to initialize...")
        await asyncio.sleep(5)  # Increased from 2 to 5 seconds
        
        # Verify services are actually responsive
        import httpx
        responsive_count = 0
        for service_id, config in self.service_configs.items():
            if results[service_id].get('status') == 'started':
                try:
                    # Test if service is actually responding
                    response = httpx.get(f"http://localhost:{config['port']}/mcp", timeout=2.0)
                    if response.status_code in [200, 405, 406]:  # Any response means it's alive
                        responsive_count += 1
                        print(f"  ✅ {config['name']} is responsive")
                except:
                    print(f"  ⚠️  {config['name']} process running but not responding yet")
        
        # Check if any services started
        started_count = sum(1 for r in results.values() if r.get('status') == 'started')
        
        return {
            "status": "started" if started_count > 0 else "failed",
            "services": results,
            "count": started_count,
            "responsive": responsive_count
        }
    
    def start_service(self, service_id: str, config: Dict) -> Dict:
        """Start a single MCP service"""
        script_path = self.mcp_services_dir / config['script']
        
        if not script_path.exists():
            print(f"  ❌ Script not found: {script_path}")
            return {
                "status": "error",
                "message": f"Script not found: {script_path}"
            }
        
        try:
            # Start service process with visible output for debugging
            print(f"  Starting {config['name']} on port {config['port']}...")
            process = subprocess.Popen(
                [sys.executable, str(script_path)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=str(self.mcp_services_dir),
                env=os.environ.copy()  # Pass environment variables
            )
            
            # Give it a moment to crash if it's going to
            import time
            time.sleep(0.5)
            
            # Check if still alive
            if process.poll() is not None:
                # Process already exited - get error
                stdout, stderr = process.communicate()
                error_msg = stderr.decode() if stderr else "Process exited immediately"
                print(f"  ❌ {config['name']} failed to start:")
                print(f"     {error_msg[:200]}")
                return {
                    "status": "error",
                    "message": error_msg
                }
            
            self.services[service_id] = {
                'process': process,
                'name': config['name'],
                'port': config['port'],
                'script': config['script']
            }
            
            print(f"  ✅ {config['name']} started (PID: {process.pid})")
            
            return {
                "status": "started",
                "name": config['name'],
                "port": config['port'],
                "pid": process.pid
            }
            
        except Exception as e:
            print(f"  ❌ Error starting {config['name']}: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    async def stop_all_services(self):
        """Stop all MCP services"""
        for service_id, service in self.services.items():
            try:
                print(f"  Stopping {service['name']}...")
                service['process'].terminate()
                service['process'].wait(timeout=2)
                print(f"  ✅ {service['name']} stopped")
            except subprocess.TimeoutExpired:
                print(f"  ⚠️  {service['name']} timeout - force killing")
                service['process'].kill()
                service['process'].wait(timeout=1)
            except Exception as e:
                print(f"  ❌ Error stopping {service_id}: {e}")
        
        self.services.clear()
        print("  All MCP services cleared")
    
    def get_service_status(self, service_id: str) -> Dict:
        """Get status of a service"""
        if service_id not in self.services:
            return {"status": "not_running"}
        
        service = self.services[service_id]
        process = service['process']
        
        if process.poll() is None:
            return {
                "status": "running",
                "name": service['name'],
                "port": service['port'],
                "pid": process.pid
            }
        else:
            return {
                "status": "stopped",
                "name": service['name']
            }
    
    def get_all_status(self) -> Dict:
        """Get status of all services"""
        return {
            service_id: self.get_service_status(service_id)
            for service_id in self.service_configs.keys()
        }


# Global MCP manager instance
mcp_manager = MCPServiceManager()

