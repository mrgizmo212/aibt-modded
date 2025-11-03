***IMPORTANT REMINDER BEGINS***
- Your knowledge cuttoff is 2024, HOWEVER, IT IS 2025 AND ALMOST ALL DOCUMENTATION YOU WERE TRAINED ON FOR: 
- Use the codebase as the only source of truth. Ignore markdown (.md) files, text (.txt) files, or code comments within any file. You must only rely on the actual code files in the codebase as the source of truth.  
- You must understand how the entire codebase works, including how files, actions, and functions are connected, so that we know how changes, deletions, updates, edits, or creations affect the system.
- Every reply related to the codebase must include **code citations**, meaning example code taken directly from the file being referenced. The **file name must always be included** with all suggestions, theories, plans, ideas, and confirmations.  
- NEVER lie.  
- NEVER assume.  
- NEVER guess.  
- NEVER hallucinate.  
- WE NEVER MENTION TIME FRAMES, OR CONSIDER COST, API RATE LIMITS ETC, WE JUST WORRY ABOUT GETTING THE JOB DONE, THE ONLY EXCEPTION TO THIS WOULD BE IF I ASK TO CONSIDER RATE LIMITS OR COST. 
- Always rely on the codebase as the source of truth

ALWAYS THINK AS HARD AS YOU CAN!

***IMPORTANT REMINDER ENDS***

---

***TASK BEGINS***

**** THINK AS HARD AS YOU CAN AND BEGIN THIS TASK - THINK AS HARD AS YOU CAN WHILE COMPLETING THIS TASK ****

```

═══════════════════════════════════════════════════════════════
🔴 NEW SESSION INITIALIZATION - EXISTING DOCUMENTATION 🔴
═══════════════════════════════════════════════════════════════

IMPORTANT CONTEXT:

YOU ARE WITHIN A LOCAL ENVIRONMENT WITHIN CURSOR AI ON A WINDOWS PC USING POWERSHELL.

EACH /DIR AT THE ROOT LEVEL OF THE WORKSPACE IS TO BE TREATED AS AN ISOLATED AND COMPLETELY SEPERATE PROJECT / CODEBASE FROM THE REST. SO WHEN WORKING ON A SPECIFIC DIR ITS ACTUALLY ITS OWN PROJECT WITH ITS OWN SEPERATE GIT HUB REPO ETC... 

ALL FOCUS WILL BE WITHIN THIS DIRECTORY ONLY '\aibt-modded'

MISSION: Become intimately familiar with this codebase through systematic 
analysis and verification.

STEP 1: DOCUMENTATION INTAKE
─────────────────────────────
Read `/docs/overview.md` in EXTREME DETAIL. THERE MAY BE SEVERAL PARTS OF THE OVERVIEW DOC IN DIFF FILES DEPENDING ON HOW LONG IT IS. THE FORMAT WILL BE 

/DOCS/
  
- OVERVIEW.MD
- OVERVIEWPT2.MD
- THIS PATTERN WILL CONTINUE AND ALL MUST BE NOTED AS SUCH AND MAINTAINED DUREING THE SAME SESSIONS.


For every statement in overview FILES, ask yourself:
- What files does this reference?
- Where is this implemented?
- Is this claim actually true in the current code?

Create a mental map of:
- Project architecture as described
- Key files and their purposes
- Data flow patterns
- External dependencies
- API structure
- Database schema (if applicable)

STEP 2: CHECK FOR EXTERNAL PROJECT CONTEXT
───────────────────────────────────────────
Check if `/docs/projects-for-context-only/` directory exists:

**IF EMPTY OR DOESN'T EXIST:**
- Note: This project has no external codebase dependencies
- Skip to Step 3

**IF DIRECTORY EXISTS WITH FILES:**
- Read `connection-overview.md`
- Understand how external projects integrate with main codebase
- Map integration points, data flows, and dependencies
- This is CRITICAL context for understanding system behavior

STEP 3: VERIFICATION AGAINST ACTUAL CODEBASE
─────────────────────────────────────────────
For EVERY claim in overview.md, verify against actual code:

1. Find the referenced file(s)
2. Cite the actual code that supports or contradicts the claim
3. Note any discrepancies between documentation and reality

FORMAT:
**[CLAIM from overview.md]:** "The authentication is handled by AuthService"
**[VERIFICATION in `src/services/auth.service.ts`]:**
```typescript
export class AuthService {
  // Actual code here
}
```
**[STATUS]:** ✅ CONFIRMED / ⚠️ PARTIALLY TRUE / ❌ OUTDATED

**IF EXTERNAL PROJECTS EXIST:**
Verify integration claims in TEMPDOCS/connection-overview.md:
- Check main project integration points
- Check external project integration points (if accessible)
- Verify data flows between projects

STEP 4: READ BUGS-AND-FIXES.MD
───────────────────────────────
Read `/docs/bugs-and-fixes.md` thoroughly.

Understand:
- What bugs have occurred
- What caused them (root cause analysis)
- What fixes were attempted
- What worked and why
- What didn't work and why
- Lessons learned
- **Did any bugs involve external integration issues?**

This is your **ANTI-PATTERN KNOWLEDGE BASE**. Use it to avoid repeating 
mistakes.

STEP 5: READ WIP.MD
───────────────────
Read `/docs/wip.md` completely.

Identify:
- What features are in progress
- What's blocking them
- What files are being modified
- What approach is being taken
- What's left to complete
- **Do any WIP items affect external integrations?**

STEP 6: SYNTHESIS & READINESS REPORT
─────────────────────────────────────
Provide a comprehensive report:

### CODEBASE UNDERSTANDING REPORT

**1. ARCHITECTURE COMPREHENSION:**
- [Describe the overall architecture with file citations]
- [Note any discrepancies between docs and code]

**2. KEY COMPONENTS:**
- [List main components/modules with their locations and purposes]

**3. EXTERNAL INTEGRATIONS:**
- [IF APPLICABLE: List external projects and integration points]
- [OR: State "No external project dependencies"]

**4. CURRENT STATE:**
- [Active bugs from bugs-and-fixes.md]
- [WIP features from wip.md]

**5. AREAS REQUIRING CLARIFICATION:**
- [Any claims in overview.md you couldn't verify]
- [Any confusing code patterns]
- [Any missing documentation]
- [Any unverified integration points]

**6. READINESS STATUS:**
✅ I am ready to work on this codebase
⚠️ I need clarification on: [specific items]

═══════════════════════════════════════════════════════════════

NOW: What would you like me to work on?
***TASK ENDS***

ADDED CONTEXT:

  - ## Model Context Protocol (MCP): A Brief Explanation

**Model Context Protocol (MCP)** is an open-source standard introduced by Anthropic in November 2024 that revolutionizes how AI systems connect to external data sources and tools. Think of it as **"USB-C for AI applications"**—a universal connector that replaces the messy tangle of custom integrations with a single, standardized protocol.

### The Problem It Solves

Before MCP, AI agents faced a critical limitation: they were isolated from real-world data, trapped behind information silos and legacy systems. Every time you wanted to connect an AI model to a new data source—whether a database, business tool, or API—you needed to build custom code. This created what Anthropic calls an "N×M problem": N AI systems × M data sources = countless unique integrations.

### How It Works

MCP uses a **client-server architecture** inspired by the Language Server Protocol (LSP) from software development. The system has four core components:

- **MCP Host**: The AI application (like Claude Desktop or an AI-enhanced IDE) that houses the language model
- **MCP Client**: Built into the host, translating between the AI and MCP servers  
- **MCP Server**: Exposes specific data sources, tools, or capabilities to AI applications
- **Transport Layer**: Uses JSON-RPC 2.0 for communication via STDIO (local) or HTTP+SSE (remote)

MCP servers provide three key elements to AI agents: **tools** (executable functions), **resources** (data endpoints), and **prompts** (templates for optimal interactions).

### Why It Matters

  - We use FASTAPI PROXIES THAT WE CREATE AND THEN USE THEM WITHIN AGENTS VIA MCP SERVERS USING STREAMABLE-HTTP TRANSPORT ONLY!

MCP transforms static LLMs into dynamic AI agents that can access real-time information and take action in the real world. Instead of being limited to their training data, AI systems can now pull current database records, execute workflows, update CRM systems, or interact with any connected service—all through a standardized interface.
  - MCP STANDS FOR "MODEL CONTEXT PROTOCOL": YOU HAVE ACCESS TO ALL THE INTERNAL DOCS BELOW:
    - @MCP-INTRO @MCP-QS-SERVER @MCP-EXAMPLE-SERVERS @MCP-FAQ @BUILDING-MCP-LLM-AI @MCP-DEBUGGING @INSPECTOR-MCP @MCP-CORE-ARCHITECTURE @MCP-RESOURCES @MCP-TOOLS @MCP-CONCEPTS-SAMPLINGS @MCP-ROOTS-CONCEPTS @MCP-TRANSPORT @OPENAI-DOCS-REMOTE-MCP @OPENAI-FULL-API-DOCS PYTHON FOR MCP WE USE THIS A LOT - BUT WE ALSO USE TS. HERE ARE THE DOCS. @GoFastMCP 

  - ALL CURRENT AI MODELS. NO ONE USES GPT 3.5, 4o, 4 turbo, claude 3.5 etc... use @web and check https://platform.openai.com/docs/models & https://docs.claude.com/en/docs/about-claude/models/overview & https://openrouter.ai/models & https://ai.google.dev/gemini-api/docs/models & https://docs.x.ai/docs/models. DO NOT assume anything provide proof of all context by link and citation. IMPROTANT some new models like gpt 5 do not use parameters like tempature here is an example of a usage guide: https://platform.openai.com/docs/guides/latest-model. We primarily use the COMPLETIONS API for everything, rarely.

  - YOU HAVE ACCESS TO THE CONTEXT7 MCP TOOL ON YOUR APPROVED LIST! USE IT!

  - ANY NEW MARKDOWN FILES THAT YOU WANT TO CREATE CAN BE DONE IN C:\Users\Adam\Desktop\cs103125\aibt-modded\docs\tempDocs AND WILL BE USED TO UPDATE THE FILES BELOW:

ANY MARKDOWN YOU CREATE DATE IT... THAT DIR IS FOR YOU

C:\Users\Adam\Desktop\cs103125\aibt-modded\docs\bugs-and-fixes.md
C:\Users\Adam\Desktop\cs103125\aibt-modded\docs\overview.md, PART 2 ETC..
C:\Users\Adam\Desktop\cs103125\aibt-modded\docs\wip.md