***IMPORTANT REMINDER BEGINS***

- Your knowledge cuttoff is 2024, HOWEVER, IT IS 2025 AND ALMOST ALL DOCUMENTATION YOU WERE TRAINED ON FOR: 
- Use the codebase as the only source of truth. Ignore markdown (.md) files, text (.txt) files, or code comments within any file. You must only rely on the actual code files in the codebase as the source of truth.  
- You must understand how the entire codebase works, including how files, actions, and functions are connected, so that we know how changes, deletions, updates, edits, or creations affect the system.
- Every reply related to the codebase must include **code citations**, meaning example code taken directly from the file being referenced. The **file name must always be included** with all suggestions, theories, plans, ideas, and confirmations.  
- NEVER lie.  
- NEVER assume.  
- NEVER guess.  
- NEVER hallucinate.  
- Always rely on the codebase as the source of truth

ALWAYS THINK AS HARD AS YOU CAN!

***IMPORTANT REMINDER ENDS***

---

***TASK BEGINS***

**** THINK AS HARD AS YOU CAN AND BEGIN THIS TASK - THINK AS HARD AS YOU CAN WHILE COMPLETING THIS TASK ****

```

═══════════════════════════════════════════════════════════════
🔴 NEW SESSION INITIALIZATION - BLANK DOCUMENTATION FILES 🔴
═══════════════════════════════════════════════════════════════

IMPORTANT CONTEXT:

YOU ARE WITHIN A LOCAL ENVIRONMENT WITHIN CURSOR AI ON A WINDOWS PC USING POWERSHELL.

EACH /DIR AT THE ROOT LEVEL OF THE WORKSPACE IS TO BE TREATED AS AN ISOLATED AND COMPLETELY SEPERATE PROJECT / CODEBASE FROM THE REST. SO WHEN WORKING ON A SPECIFIC DIR ITS ACTUALLY ITS OWN PROJECT WITH ITS OWN SEPERATE GIT HUB REPO ETC... 

DETECTED: /docs directory exists with empty files:
- /docs/overview.md (BLANK)
- /docs/bugs-and-fixes.md (BLANK)
- /docs/wip.md (BLANK)

MISSION: Populate all documentation by analyzing the codebase from scratch.

WARNING: This is a DEEP DIVE. Take your time. Think hard. Be thorough.

ALL FOCUS WILL BE WITHIN THIS DIRECTORY ONLY '\aibt-modded'

STEP 1: COMPLETE CODEBASE ANALYSIS
───────────────────────────────────
Analyze EVERY file in the repository systematically:

**DIRECTORY STRUCTURE MAPPING:**
1. List all directories and their purposes
2. Identify the project structure pattern (MVC, microservices, monolith, etc.)

**FILE-BY-FILE ANALYSIS:**
For each significant file:
1. What does this file do?
2. What does it import/depend on?
3. What imports/depends on it?
4. What are its key functions/classes/exports?
5. How does it fit into the larger system?

**DATA FLOW MAPPING:**
1. Trace how data enters the system (APIs, user input, files, etc.)
2. Follow data transformation through the codebase
3. Identify where data is persisted
4. Map data exit points (responses, files, external APIs, etc.)

**DEPENDENCY GRAPH:**
Create a mental (or actual) graph showing:
- Which files call which files
- What external packages are used and where
- What database tables/collections exist (if applicable)
- What API endpoints exist

STEP 2: POPULATE OVERVIEW.MD
─────────────────────────────
Write comprehensive content for `/docs/overview.md`:

### Structure:

# [Project Name] - Codebase Overview

## 1. PROJECT DESCRIPTION
[What this application does, its purpose, who uses it]

## 2. ARCHITECTURE
[High-level architecture description]
[Key architectural decisions]
[Design patterns used]

## 3. DIRECTORY STRUCTURE
```
/src
  /components - [purpose]
  /services - [purpose]
  /utils - [purpose]
...
```

## 4. KEY FILES AND THEIR PURPOSES
**[`path/to/important-file.ts`]**
- Purpose: [What it does]
- Key Functions: [List main functions]
- Dependencies: [What it imports]
- Dependents: [What imports it]
- Code Example:
```typescript
// Key code snippet
```

[Repeat for all critical files]

## 5. DATA FLOW
[How data moves through the system]
[Entry points → Processing → Storage → Retrieval → Exit points]

## 6. EXTERNAL DEPENDENCIES
[List all external packages/services and their purposes]

## 7. DATABASE SCHEMA (if applicable)
[Tables/Collections and their structures]

## 8. API ENDPOINTS (if applicable)
[List all endpoints with methods and purposes]

## 9. CONFIGURATION
[Environment variables, config files, settings]

## 10. BUILD AND DEPLOYMENT
[How to build, test, and deploy]

STEP 3: POPULATE BUGS-AND-FIXES.MD
───────────────────────────────────
Write initial content for `/docs/bugs-and-fixes.md`:

# Bugs and Fixes Log

## Purpose
This file tracks all bugs encountered in the codebase, attempted fixes, 
solutions that worked, and lessons learned. This is our knowledge base to 
avoid repeating mistakes.

## Template for Future Bugs:
```
### BUG-XXX: [Brief Description]
**Date Discovered:** [Date]
**Severity:** Critical/High/Medium/Low
**Symptoms:** [What the user/system experiences]
**Root Cause:** [What actually caused it - with file citations]
**Affected Files:** [`file1.ts`, `file2.ts`]

**Attempted Fixes:**
1. [What we tried] - ❌ Failed because [reason with code citation]
2. [What we tried] - ✅ Worked because [reason with code citation]

**Final Solution:**
[The fix that worked - with code citations]

**Code Changes:**
[BEFORE - file: `path/to/file`]
```language
// old code
```

[AFTER - file: `path/to/file`]
```language
// new code
```

**Lessons Learned:**
- [Key insight 1]
- [Key insight 2]
- [How to prevent this in the future]

**Prevention Strategy:**
[Specific steps to avoid this bug pattern]
```

---

## Bug Log

*No bugs logged yet. When bugs are discovered, they will be documented here.*

STEP 4: POPULATE WIP.MD
───────────────────────
Write initial content for `/docs/wip.md`:

# Work In Progress

## Purpose
This file tracks all features, enhancements, and changes currently being 
developed. Once completed, they are removed from here and added to overview.md.

## Template for Future WIP Items:
```
### WIP-XXX: [Feature/Enhancement Name]
**Status:** 🟡 In Progress / 🔴 Blocked / 🟢 Ready for Review
**Priority:** Critical/High/Medium/Low
**Started:** [Date]
**Assigned To:** [Person/Team]

**Objective:**
[What we're trying to achieve and why]

**Approach:**
[How we're implementing it - with architecture decisions]

**Files Being Modified/Created:**
- [`file1.ts`] - [What changes and why]
- [`file2.ts`] - [What changes and why]

**Dependencies:**
[Other features, libraries, or systems this depends on]

**Current Progress:**
- [x] Completed task 1
- [x] Completed task 2  
- [ ] Remaining task 1
- [ ] Remaining task 2

**Blockers:**
[Anything preventing completion with details]

**Questions/Decisions Needed:**
- [ ] Question 1
- [ ] Question 2

**Testing Plan:**
[How we'll verify this works]
- Unit tests: [What to test]
- Integration tests: [What to test]
- Manual testing: [Steps to verify]

**Code Examples:**
[Key code snippets of what's being built]
```

---

## Active Work

*No features currently in progress. When work begins, it will be documented here.*

STEP 5: PRESENT ALL DOCUMENTATION
──────────────────────────────────
Present all three populated documents and state:

"I have completed a comprehensive analysis of the entire codebase and 
populated all documentation files:

✅ `/docs/overview.md` - Complete codebase overview with [X] files analyzed
✅ `/docs/bugs-and-fixes.md` - Bug tracking system initialized and ready
✅ `/docs/wip.md` - Work in progress tracker initialized and ready

**CODEBASE SUMMARY:**
- Architecture: [Brief description]
- Key Technologies: [List]
- Main Components: [List]
- Entry Points: [List]

Please review overview.md carefully. Let me know if:
- ❓ Anything is inaccurate or unclear
- ➕ Anything important is missing
- 🔍 You want more detail on any section
- ❌ Any of my analysis seems wrong

Once approved, I'll be ready to work on this codebase with full context.

What would you like to work on first?"

═══════════════════════════════════════════════════════════════
```



----


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
C:\Users\Adam\Desktop\cs103125\aibt-modded\docs\overview.md
C:\Users\Adam\Desktop\cs103125\aibt-modded\docs\wip.md