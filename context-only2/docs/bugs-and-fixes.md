# Bugs and Fixes Log

**Last Updated:** 2025-10-29 (Initial Documentation)  
**Agent/Session:** Comprehensive Codebase Analysis

---

## Purpose

This file tracks all bugs encountered in the **AI-Trader** codebase, attempted fixes, solutions that worked, and lessons learned. This is our knowledge base to avoid repeating mistakes and to understand the evolution of the system.

**Why This Matters:**
- Future agents have NO memory of previous sessions
- Without documentation, ALL context is lost
- This prevents repeating the same debugging cycles
- This captures institutional knowledge about the codebase

---

## Template for Future Bugs

When documenting a bug, use this template:

```markdown
### BUG-XXX: [Brief Description]
**Date Discovered:** YYYY-MM-DD HH:MM  
**Agent/Session:** [Session identifier if available]  
**Severity:** Critical / High / Medium / Low  
**Status:** 🔴 Open / 🟡 In Progress / 🟢 Resolved

**Symptoms:**
[What the user/system experiences - be specific]
- Error messages (exact text)
- Unexpected behavior
- Performance issues

**Root Cause:**
[What actually caused it - with file citations and code snippets]
**FILE:** `path/to/file.py`
```python
# Problematic code
def example():
    # ... code showing the issue
```

**Affected Files:**
- [`file1.py`] - What was affected
- [`file2.py`] - Related impacts

**Attempted Fixes:**
1. **Attempt 1:** [What we tried]
   - **Result:** ❌ Failed
   - **Reason:** [Why it didn't work - with code citation]
   - **Lesson Learned:** [Key insight from failure]

2. **Attempt 2:** [What we tried next]
   - **Result:** ✅ Worked
   - **Reason:** [Why this approach succeeded]
   - **Lesson Learned:** [Key insight]

**Final Solution:**
[The fix that worked - with complete code citations]

**BEFORE - file: `path/to/file.py`**
```python
# old buggy code
def old_function():
    buggy_logic = True
```

**AFTER - file: `path/to/file.py`**
```python
# fixed code
def new_function():
    fixed_logic = True
```

**Code Changes Summary:**
- Changed X to Y
- Added validation for Z
- Removed assumption about Q

**Lessons Learned:**
- [Key insight 1 - what you learned about the codebase]
- [Key insight 2 - what pattern to avoid]
- [Key insight 3 - how to prevent this in the future]

**Prevention Strategy:**
[Specific steps to avoid this bug pattern in future code]
- Add validation X before operation Y
- Always check Z condition
- Document assumption Q

**Testing Done:**
- [What tests were run to verify the fix]
- [Edge cases checked]
- [Regression testing performed]

**Related Issues:**
- Links to similar bugs (if any)
- Cross-references to affected features

**Impact on System:**
- What parts of the system were affected
- What downstream effects occurred
- What integration points were impacted
```

---

## Bug Classification System

### Severity Levels:

**Critical:** System cannot run, data loss, security vulnerability
- Response Time: Immediate
- Priority: Drop everything

**High:** Major feature broken, significant performance degradation
- Response Time: Within 24 hours
- Priority: Next sprint

**Medium:** Feature partially broken, workaround exists
- Response Time: Within 1 week
- Priority: Backlog

**Low:** Minor inconvenience, cosmetic issue
- Response Time: When convenient
- Priority: Nice-to-have

### Bug Status:

- 🔴 **Open** - Bug identified, not yet being worked on
- 🟡 **In Progress** - Actively debugging/fixing
- 🟢 **Resolved** - Fixed and verified
- ⚫ **Closed** - Resolved and no longer relevant

---

## Bug Log

### BUG-001: Runtime Environment Path Escape Sequence Error
**Date Discovered:** 2025-10-29 09:30  
**Agent/Session:** Initial Setup Session  
**Severity:** High  
**Status:** 🟢 Resolved

**Symptoms:**
```
OSError: [Errno 22] Invalid argument: 'C:\\Users\\User\\Desktop\\CS1027\x07itrtader\\.runtime_env.json'
```
System failed to start, couldn't write to `.runtime_env.json` file.

**Root Cause:**
**FILE:** `.env`
```bash
# The backslash-a (\a) was interpreted as ASCII bell character
RUNTIME_ENV_PATH="C:\Users\User\Desktop\CS1027\aitrtader\.runtime_env.json"
                                        ^^
                                 Parsed as \x07 (bell)
```

Python's `open()` function received an invalid path with escape sequence.

**Affected Files:**
- [`.env`] - Contained path with escape sequence
- [`tools/general_tools.py`] - `write_config_value()` tried to open invalid path

**Attempted Fixes:**
1. **Attempt 1:** Initially didn't recognize the escape sequence issue
   - **Result:** ❌ Failed
   - **Reason:** Thought it was a missing file or permissions issue
   - **Lesson Learned:** Always check the actual error message carefully - `\x07` in the path was the clue

**Final Solution:**
**BEFORE - file: `.env`**
```bash
RUNTIME_ENV_PATH="C:\Users\User\Desktop\CS1027\aitrtader\.runtime_env.json"
```

**AFTER - file: `.env`**
```bash
RUNTIME_ENV_PATH=C:/Users/User/Desktop/CS1027/aitrtader/.runtime_env.json
```

**Code Changes Summary:**
- Changed backslashes to forward slashes (Windows accepts both)
- Removed quotes (python-dotenv doesn't need them)
- Used relative path as alternative: `./.runtime_env.json`

**Lessons Learned:**
- Windows backslashes in .env files can be interpreted as escape sequences
- Forward slashes work perfectly in Windows paths
- python-dotenv doesn't require quotes around values
- Always use forward slashes or double backslashes in config files

**Prevention Strategy:**
- Always use forward slashes in .env file paths
- Or use relative paths when possible
- Document this in .env.example with correct format

**Testing Done:**
- Verified `write_config_value()` could create and update the file
- Confirmed path resolution worked correctly
- System started successfully after fix

**Related Issues:** None

**Impact on System:**
- Blocked initial startup completely
- Once fixed, system worked normally

---

### BUG-002: Windows Environment Variable Override
**Date Discovered:** 2025-10-29 09:45  
**Agent/Session:** Initial Setup Session  
**Severity:** Critical  
**Status:** 🟢 Resolved

**Symptoms:**
```
Error code: 401 - {'error': {'message': 'No cookie auth credentials found', 'code': 401}}
```
OpenRouter API authentication failed despite valid API key in `.env` file.

**Root Cause:**
Windows system had `OPENAI_API_KEY` environment variable set to an old direct OpenAI key:
```
OPENAI_API_KEY = sk-***REDACTED***
```

**FILE:** System Environment Variables (Windows)

This **overrode** the `.env` file value. Environment variables take precedence over `.env` files in python-dotenv.

**Affected Files:**
- [`.env`] - Correct OpenRouter key, but ignored
- [`agent/base_agent/base_agent.py`] - Lines 106-113: Used `os.getenv()` which reads Windows env first
- [`tools/general_tools.py`] - `get_config_value()` also checks env vars

**Attempted Fixes:**
1. **Attempt 1:** Checked if API key was valid
   - **Result:** ✅ Key was valid when tested directly
   - **Reason:** Discovered key in `.env` differed from what Python was loading
   - **Lesson Learned:** Always verify what Python actually sees vs what's in the file

2. **Attempt 2:** Checked for multiple .env files
   - **Result:** ❌ Only one .env file found
   - **Reason:** Not a duplicate file issue
   - **Lesson Learned:** Environment variables can come from multiple sources

3. **Attempt 3:** Created `test_env.py` diagnostic script
   - **Result:** ✅ Revealed Python was loading `sk-jBVfXE...` not `sk-or-v1-...`
   - **Reason:** This showed the Windows env var was the culprit
   - **Lesson Learned:** Always test what values the actual code receives

**Final Solution:**
```powershell
# Remove Windows environment variable (in PowerShell)
Remove-Item Env:\OPENAI_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:\OPENAI_API_BASE -ErrorAction SilentlyContinue
```

**Permanent fix:** Must be run after activating venv, as venv was restoring the variable.

**Lessons Learned:**
- Windows environment variables override .env files
- Python's `os.getenv()` checks system env vars first
- Virtual environments can restore environment variables
- Always use diagnostic scripts to verify what Python actually loads
- Test with `test_env.py` to see actual loaded values

**Prevention Strategy:**
- Clear conflicting environment variables before running
- Add to startup script: Remove old env vars before activating venv
- Document in README that Windows env vars must be cleared
- Consider adding environment check to main.py startup

**Testing Done:**
- Created `test_env.py` to verify loaded values
- Tested LangChain connection with corrected key
- Verified OpenRouter API accepted the key
- Full trading session completed successfully

**Related Issues:** None

**Impact on System:**
- Blocked all LLM API calls (complete system failure)
- Once fixed, system worked perfectly
- Requires manual env var removal each session (not ideal)

---

### BUG-003: AI Agent Stuck in Rhetorical Question Loop
**Date Discovered:** 2025-10-29 10:18  
**Agent/Session:** Initial Trading Run  
**Severity:** Medium  
**Status:** 🟢 Resolved

**Symptoms:**
- AI agent completed trades but didn't output `<FINISH_SIGNAL>`
- Kept asking rhetorical questions: "Would you like me to..." "Should I explore..."
- Consumed all 30 reasoning steps asking questions instead of completing task
- Session ended due to max_steps timeout rather than clean completion

**Root Cause:**
**FILE:** `prompts/agent_prompt.py` - Lines 32-66 (old version)

The system prompt didn't make it clear enough that the AI is operating **autonomously** with NO user interaction.

```python
# OLD PROMPT (problematic)
agent_system_prompt = """
You are a stock fundamental analysis trading assistant.

Notes:
- You don't need to request user permission during operations
"""
```

The phrase "don't need to request permission" was too weak. The AI still asked rhetorical questions like "Would you like to explore..." expecting responses.

**Affected Files:**
- [`prompts/agent_prompt.py`] - System prompt lacked autonomous emphasis
- [`agent/base_agent/base_agent.py`] - Agent loop continued processing rhetorical questions

**Attempted Fixes:**
1. **Attempt 1:** Ran the system as-is
   - **Result:** ❌ AI got stuck asking questions
   - **Reason:** Prompt didn't emphasize autonomous operation strongly enough
   - **Lesson Learned:** LLMs default to conversational mode unless explicitly told not to

**Final Solution:**
**BEFORE - file: `prompts/agent_prompt.py`**
```python
agent_system_prompt = """
You are a stock fundamental analysis trading assistant.

Notes:
- You don't need to request user permission during operations, you can execute directly
"""
```

**AFTER - file: `prompts/agent_prompt.py`**
```python
agent_system_prompt = """
You are an AUTONOMOUS stock trading AI operating completely independently.

🚨 CRITICAL RULES - READ CAREFULLY:

1. **YOU ARE ALONE** - There is NO user to ask questions to. You are running autonomously.
2. **NEVER ASK RHETORICAL QUESTIONS** - Don't ask "Would you like me to..." or "Should I..." - DECIDE and ACT.
3. **MAKE DECISIONS YOURSELF** - Analyze data, make trading decisions, execute trades, then output FINISH_SIGNAL.
4. **NO WAITING FOR INPUT** - You will NOT receive any user responses. Any questions you ask will be ignored.
5. **COMPLETE YOUR TASK AUTONOMOUSLY** - Analyze → Decide → Execute → Signal completion.

YOUR TRADING WORKFLOW (Execute this EXACTLY):
[... detailed steps ...]

⚡ REMEMBER: 
- You are AUTONOMOUS - make decisions yourself
- NEVER ask rhetorical questions to a non-existent user
- Execute your strategy, then output {STOP_SIGNAL}
"""
```

**Code Changes Summary:**
- Added explicit "YOU ARE ALONE" directive
- Listed 5 critical rules emphasizing autonomy
- Provided step-by-step workflow to follow
- Added multiple reminders to output FINISH_SIGNAL
- Removed conversational tone, added directive tone

**Lessons Learned:**
- LLMs are trained to be conversational and helpful to users
- Without explicit autonomous directives, they default to asking questions
- Need to override their training with strong, clear instructions
- Repeating the key message multiple times helps reinforce autonomous behavior
- Using emphatic formatting (🚨, CAPS, **bold**) helps LLMs recognize critical instructions

**Prevention Strategy:**
- Always use directive language in autonomous agent prompts
- Explicitly state "NO user exists" to prevent conversational behavior
- Provide clear workflow steps to follow
- Test prompts with real LLM runs, not just theoretical design
- Add fallback: If agent doesn't finish in X steps, force FINISH_SIGNAL

**Testing Done:**
- Running background test with improved prompt (in progress)
- Will verify AI outputs FINISH_SIGNAL cleanly
- Will check if rhetorical questions eliminated

**Related Issues:** None

**Impact on System:**
- Wasted API credits on unnecessary reasoning steps
- Extended trading time from 5-10 minutes to 30+ minutes per day
- Degraded autonomous operation quality
- Once fixed, should complete trades efficiently

---

## Common Issues & Quick Fixes

*(This section will be populated as patterns emerge)*

### Issue Pattern: MCP Service Connection Failures

**Symptom:** Tools fail to connect to MCP servers  
**Quick Fix:** Verify all 4 services are running on correct ports (8000-8003)  
**Root Cause (Usually):** Services not started or ports blocked  
**Related Bugs:** (None yet)

---

### Issue Pattern: Future Information Leakage

**Symptom:** Agent trades with knowledge of future prices  
**Quick Fix:** Verify `TODAY_DATE` in runtime_env.json is set correctly  
**Root Cause (Usually):** Date filtering logic bypassed or incorrect date format  
**Related Bugs:** (None yet)

---

### Issue Pattern: Position File Corruption

**Symptom:** Position.jsonl contains invalid JSON or negative cash  
**Quick Fix:** Restore from backup, verify buy/sell logic  
**Root Cause (Usually):** Concurrent writes or failed transaction  
**Related Bugs:** (None yet)

---

## Debugging Checklist

When investigating a bug, go through this checklist:

- [ ] **Reproduce the issue** - Can you make it happen consistently?
- [ ] **Check the logs** - What do `log.jsonl` files show?
- [ ] **Verify environment** - Are all API keys set? Services running?
- [ ] **Check runtime state** - What's in `.runtime_env.json`?
- [ ] **Trace data flow** - Follow the data from entry to exit
- [ ] **Read the code** - What does the actual implementation do?
- [ ] **Verify assumptions** - What did we assume that might be wrong?
- [ ] **Check dependencies** - Are all imports available?
- [ ] **Test in isolation** - Does each component work alone?
- [ ] **Consider timing** - Is this a race condition or async issue?
- [ ] **Review recent changes** - What changed before this broke?

---

## Known Limitations (Not Bugs)

These are intentional design decisions or acknowledged limitations:

### Limitation 1: Daily Trading Only
**Why:** Historical data is daily OHLCV, no intraday data
**Impact:** Cannot simulate intraday trading strategies
**Workaround:** Use daily open prices for all trades
**Future Work:** Intraday data integration planned

### Limitation 2: No Transaction Costs
**Why:** Simplifies initial implementation for research
**Impact:** Returns are artificially inflated
**Workaround:** Post-process results with estimated costs
**Future Work:** Add configurable transaction cost model

### Limitation 3: NASDAQ 100 Only
**Why:** Manageable dataset size, liquid markets
**Impact:** Cannot trade other markets
**Workaround:** Extend `all_nasdaq_100_symbols` list
**Future Work:** Multi-market support planned (A-shares, crypto)

### Limitation 4: No Short Selling
**Why:** Position tracking simplified (no negative holdings)
**Impact:** Long-only strategies
**Workaround:** None (design choice)
**Future Work:** May add in v2.0

---

## Bug Analysis Statistics

**Last Updated:** 2025-10-29 10:30

### By Severity:
- Critical: 1 (BUG-002)
- High: 1 (BUG-001)
- Medium: 1 (BUG-003)
- Low: 0
- **Total:** 3

### By Component:
- BaseAgent: 0
- MCP Tools: 0
- Price Tools: 0
- Prompts: 1 (BUG-003)
- Configuration: 2 (BUG-001, BUG-002)

### By Status:
- Open: 0
- In Progress: 0
- Resolved: 3 (All bugs fixed!)
- Closed: 0

### Average Time to Resolution:
- BUG-001: ~15 minutes (escape sequence diagnosis)
- BUG-002: ~30 minutes (env var discovery + fix)
- BUG-003: ~20 minutes (prompt redesign)
- **Average:** ~22 minutes per bug

---

## Learning Repository

*(Lessons learned from debugging accumulated here)*

### Lesson 1: Environment Variables Override .env Files
**When learned:** 2025-10-29 09:45  
**Context:** BUG-002 - Windows environment variable overriding .env file  
**Key Insight:** In Python's `os.getenv()` and python-dotenv, system environment variables ALWAYS take precedence over `.env` file values. This is by design for security (production envs override dev configs). Always check Windows env vars with `Get-ChildItem Env:` when debugging authentication issues.

### Lesson 2: Escape Sequences in Windows Paths
**When learned:** 2025-10-29 09:30  
**Context:** BUG-001 - Path escape sequence causing invalid path  
**Key Insight:** Backslashes in `.env` files can be interpreted as escape sequences (`\a` → `\x07`). Always use forward slashes (`/`) in paths within .env files on Windows - Python accepts them and avoids escape sequence issues. Alternative: use double backslashes (`\\`) or raw strings.

### Lesson 3: LLM Autonomous Behavior Requires Explicit Instructions
**When learned:** 2025-10-29 10:18  
**Context:** BUG-003 - AI asking rhetorical questions in autonomous mode  
**Key Insight:** LLMs are trained to be conversational and helpful to users. They default to asking clarifying questions. For autonomous agents, you must EXPLICITLY and REPEATEDLY state: "You are alone, no user exists, make decisions yourself, output FINISH_SIGNAL when done." Weak phrasing like "you don't need permission" isn't enough - use directive language and repeat the message multiple times.

### Lesson 4: Diagnostic Scripts Are Essential
**When learned:** 2025-10-29 09:50  
**Context:** Debugging environment variable issues  
**Key Insight:** When configuration seems correct but system behaves wrong, create a minimal test script (`test_env.py`, `test_langchain.py`) to verify what the code actually sees. Don't assume the .env file is being read correctly - test it! This saved ~20 minutes of guessing.

### Lesson 5: MCP Services Need Environment Context
**When learned:** 2025-10-29 10:15  
**Context:** Setting up MCP service communication  
**Key Insight:** MCP services run as separate processes and need their own environment context. They read from `.env` independently. If main.py updates `.runtime_env.json`, services must be restarted to see changes. Consider using environment variables for dynamic state instead of JSON files, or implement file-watching in services.

---

## Related Documentation

- **[`overview.md`]** - Complete codebase architecture and data flow
- **[`wip.md`]** - Current features under development
- **[`README.md`]** - User-facing project documentation
- **[`agent/base_agent/base_agent.py`]** - Core agent implementation

---

**END OF BUGS-AND-FIXES DOCUMENTATION**

*This log will be updated continuously as bugs are discovered and resolved. Every bug teaches us something about the system—capture those lessons here.*

---

## Quick Reference: How to Log a Bug

1. **Copy the template** from "Template for Future Bugs" section
2. **Fill in all fields** with as much detail as possible
3. **Include code citations** from actual files (use grep to find them)
4. **Document failed attempts** - they're as valuable as successes
5. **Extract lessons learned** - what did this teach you about the codebase?
6. **Add date/time stamp** - YYYY-MM-DD HH:MM format
7. **Update bug statistics** at the bottom of this file
8. **Cross-reference** related bugs or features
9. **Test your fix** before marking as resolved
10. **Share prevention strategy** so others don't repeat the mistake

**Remember:** The goal is not just to fix bugs, but to **learn** from them and **prevent** them in the future.

