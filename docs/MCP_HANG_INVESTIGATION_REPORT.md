# MCP Service Hang - Complete Investigation Report

**Date:** 2025-10-30  
**Issue:** Backend hangs at "Step 1/30", requires force kill  
**Analysis:** Deep code investigation, no assumptions

---

## INVESTIGATION #1: MCP Service Startup Code Deep Dive

### Exact Hang Point

**Line [179] from [backend/trading/base_agent.py]:**

```python
# Line 176-180
self.client = MultiServerMCPClient(self.mcp_config)

# Get tools  ← THIS LINE HANGS
self.tools = await self.client.get_tools()
print(f"✅ Loaded {len(self.tools)} MCP tools")
```

**What it's waiting for:**

The `MultiServerMCPClient.get_tools()` method attempts to:
1. Connect to each MCP service via SSE (Server-Sent Events)
2. Send `tools/list` request
3. Wait for response with available tools
4. Aggregate tools from all 4 services (Math, Search, Trade, Price)

**The method is waiting for SSE responses from:**
- http://localhost:8000/mcp (Math)
- http://localhost:8001/mcp (Search)
- http://localhost:8002/mcp (Trade)
- http://localhost:8003/mcp (Price)

---

### Timeout Configuration

**OpenRouter API Timeout:**
```python
# backend/trading/base_agent.py, line 204
ChatOpenAI(
    ...
    timeout=30,  # 30 seconds for AI completions
    ...
)
```

**MCP Client Timeout:**
```python
# backend/trading/base_agent.py, line 176
self.client = MultiServerMCPClient(self.mcp_config)
# NO TIMEOUT PARAMETER - Uses library default (likely 60-300 seconds)
```

**MCP Health Check Timeout:**
```python
# backend/trading/mcp_manager.py, line 64
httpx.get(f"http://localhost:{config['port']}/mcp", timeout=2.0)
# 2 second timeout for health check
```

**Agent Executor Timeout:**
```python
# backend/trading/base_agent.py, line 242-245
await self.agent.ainvoke(
    {"messages": message}, 
    {"recursion_limit": 100}  # No timeout parameter - can run forever
)
```

**CRITICAL FINDING:** The `get_tools()` call has **NO EXPLICIT TIMEOUT** configured.

---

### WHY IT HANGS - Code-Based Analysis

**Verified Facts:**

1. **MCP Services Show PIDs** (from terminal output):
   ```
   ✅ Math started (PID: 19436)
   ✅ Search started (PID: 26380)
   ✅ Trade started (PID: 39728)
   ✅ Price started (PID: 36768)
   ```

2. **Processes Started But Ports Not Listening:**
   - Command: `Get-NetTCPConnection -LocalPort 8000,8001,8002,8003`
   - Result: Empty (no listening ports)
   - **Conclusion:** Processes exist but aren't serving HTTP

3. **MCP Service Structure:**
```python
# backend/mcp_services/tool_math.py, lines 18-20
if __name__ == "__main__":
    port = int(os.getenv("MATH_HTTP_PORT", "8000"))
    mcp.run(transport="streamable-http", port=port)
```

4. **Service Startup Method:**
```python
# backend/trading/mcp_manager.py, lines 95-101
process = subprocess.Popen(
    [sys.executable, str(script_path)],
    stdout=subprocess.PIPE,  ← Output is captured, not displayed
    stderr=subprocess.PIPE,  ← Errors are captured, not displayed
    cwd=str(self.mcp_services_dir),
    env=os.environ.copy()
)
```

**THE HANG SEQUENCE:**

```
1. MCP Manager starts 4 processes via subprocess.Popen
   → Processes spawn (get PIDs)
   
2. Processes try to run mcp.run(transport="streamable-http", port=X)
   → Something fails silently (stderr captured, not shown)
   → Processes crash or hang before binding ports
   
3. Health check runs (2 second timeout)
   → httpx.get() fails, prints warning
   → But startup continues anyway
   
4. AI agent tries to connect via MultiServerMCPClient
   → Attempts SSE connection to ports 8000-8003
   → Ports aren't listening
   → Connection hangs waiting for non-existent server
   
5. No timeout on get_tools()
   → Waits indefinitely
   → Eventually httpx.ReadTimeout (default ~300 seconds)
   → But interrupted by Ctrl+C first
```

---

## INVESTIGATION #2: MCP Service Health Check

### Port Status Verification

**Command Run:**
```powershell
Get-NetTCPConnection -LocalPort 8000,8001,8002,8003
```

**Result:** Empty (no connections)

**Meaning:** Despite PIDs existing, **NO PORTS ARE LISTENING**

---

### Process Status

**From Terminal Output:**
```
Starting Math on port 8000...
✅ Math started (PID: 19436)

Starting Search on port 8001...
✅ Search started (PID: 26380)

Starting Trade on port 8002...
✅ Trade started (PID: 39728)

Starting Price on port 8003...
✅ Price started (PID: 36768)

Waiting for services to initialize...
✅ Math is responsive  ← Health check passed??
✅ Search is responsive
⚠️ Trade process running but not responding yet
⚠️ Price process running but not responding yet
```

**Contradiction:** Health check says "responsive" but ports aren't listening!

**Explanation:**
```python
# backend/trading/mcp_manager.py, lines 62-69
try:
    response = httpx.get(f"http://localhost:{config['port']}/mcp", timeout=2.0)
    if response.status_code in [200, 405, 406]:  # Any response means it's alive
        responsive_count += 1
        print(f"  ✅ {config['name']} is responsive")
except:
    print(f"  ⚠️  {config['name']} process running but not responding yet")
```

**This means:**
- Math DID respond with status code (200/405/406) within 2 seconds
- Search DID respond
- Trade did NOT respond (exception caught)
- Price did NOT respond (exception caught)

**But then why can't AI agent connect?**

Possible: Services were responsive at health check (5 seconds after start), but crashed shortly after.

---

## ROOT CAUSE HYPOTHESIS (Code-Based)

**Theory:**

1. **MCP services start successfully** (Math and Search bind ports)
2. **Health check passes** at 5-second mark
3. **Startup continues**, AI agent initializes
4. **Before AI connects**, services crash or become unresponsive
5. **AI tries to connect** (line 176) and hangs
6. **No timeout** allows infinite wait

**Why Services Might Crash:**

Looking at tool code:
```python
# tool_trade.py, lines 45-47
signature = get_config_value("SIGNATURE")
if signature is None:
    raise ValueError("SIGNATURE environment variable is not set")
```

**On first call**, if SIGNATURE isn't set, service crashes. But this happens during tool execution, not startup.

**Alternative:** Services might be listening but not responding to SSE requests properly.

---

## CRITICAL QUESTIONS REMAINING

1. **Are MCP service processes still alive when agent tries to connect?**
   - Need to check process status at time of hang
   
2. **Why does health check pass but connection fails?**
   - Different endpoints? Different protocols?
   - Health check uses HTTP GET, agent uses SSE
   
3. **What are the actual errors in MCP service stderr?**
   - stdout/stderr are captured (line 97-98) but never displayed
   - Need to see what errors services are logging

---

## NEXT INVESTIGATION NEEDED

**Before any code changes, need to:**

1. **Capture MCP service logs**
   - Modify mcp_manager to print stdout/stderr
   - See actual error messages

2. **Test MCP services manually**
   - Run `python tool_math.py` standalone
   - See if it actually binds port 8000
   - Check for errors

3. **Add timeout to get_tools()**
   - Only AFTER understanding why services fail
   - Don't mask the real problem

---

**END OF INVESTIGATION #1-2**

**Status:** Need to see MCP service error output before proceeding.
**Recommendation:** Modify mcp_manager to display service stderr, then analyze actual errors.

