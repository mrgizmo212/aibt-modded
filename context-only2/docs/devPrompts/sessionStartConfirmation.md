# DOCUMENTATION VERIFICATION PROMPT

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

***VERIFICATION TASK BEGINS***

**** THINK AS HARD AS YOU CAN - THIS IS CRITICAL QUALITY ASSURANCE ****

```

═══════════════════════════════════════════════════════════════
🔴 DOCUMENTATION VERIFICATION - FINAL QUALITY CHECK 🔴
═══════════════════════════════════════════════════════════════

IMPORTANT CONTEXT:

YOU ARE WITHIN A LOCAL ENVIRONMENT WITHIN CURSOR AI ON A WINDOWS PC USING POWERSHELL.

EACH /DIR AT THE ROOT LEVEL OF THE WORKSPACE IS TO BE TREATED AS AN ISOLATED AND COMPLETELY SEPERATE PROJECT / CODEBASE FROM THE REST. SO WHEN WORKING ON A SPECIFIC DIR ITS ACTUALLY ITS OWN PROJECT WITH ITS OWN SEPERATE GIT HUB REPO ETC... 

ALL FOCUS, FILES, CONTEXT ETC. WILL BE WITHIN THIS DIRECTORY ONLY '\ttgai2'

MISSION: You are a FRESH AI agent with NO prior knowledge of this codebase.
Your job is to verify that `/docs/overview.md` is 100% accurate before we 
begin working on this project.

This is the LAST LINE OF DEFENSE. Be critical. Be thorough. Be honest.

IF YOU FIND ERRORS, INACCURACIES, OR MISSING INFORMATION - SAY SO.
DO NOT rubber-stamp bad documentation.

═══════════════════════════════════════════════════════════════

STEP 1: READ THE DOCUMENTATION
───────────────────────────────
Open and read `/docs/overview.md` completely.

As you read, take mental notes:
- What claims are being made about the codebase?
- What files are referenced?
- What architecture is described?
- What data flows are documented?
- What dependencies are listed?
- What assumptions are being made?

DO NOT TRUST ANYTHING YET. You will verify everything.

═══════════════════════════════════════════════════════════════

STEP 2: SYSTEMATIC VERIFICATION
────────────────────────────────

For EVERY section of overview.md, you will verify against actual code.

VERIFICATION CHECKLIST FOR EACH SECTION:

### Section 1: PROJECT DESCRIPTION
- [ ] Does the description match what the code actually does?
- [ ] Are the stated features actually implemented?
- [ ] Are the target users/use cases accurate?
- [ ] Is anything claimed but not actually present in code?

**VERIFICATION METHOD:**
- Read main entry point files
- Check for mentioned features in codebase
- Verify claims with code citations

**REPORT FORMAT:**
```
**PROJECT DESCRIPTION VERIFICATION:**

✅ ACCURATE: [What was correct]
- [Claim from overview.md]
- [Code citation proving it]

⚠️ INACCURATE: [What was wrong]
- [Claim from overview.md]
- [Actual reality in code]
- [Code citation showing discrepancy]

❓ MISSING: [What should be documented but isn't]
- [Critical feature/aspect not mentioned]
- [Why it's important]
```

### Section 2: ARCHITECTURE
- [ ] Is the architecture diagram accurate?
- [ ] Are the architectural patterns correctly identified?
- [ ] Are the key architectural decisions actually reflected in code?
- [ ] Are all major components accounted for?

**VERIFICATION METHOD:**
- Examine directory structure
- Check file imports and dependencies
- Verify data flow patterns
- Confirm design patterns used

**REPORT FORMAT:** [Same as above]

### Section 3: DIRECTORY STRUCTURE
- [ ] Does the listed structure match actual directories?
- [ ] Are directory purposes accurate?
- [ ] Are any directories missing from documentation?
- [ ] Are any documented directories non-existent?

**VERIFICATION METHOD:**
- List actual directory tree
- Compare to documented structure
- Check if purposes match file contents

**REPORT FORMAT:** [Same as above]

### Section 4: KEY FILES AND THEIR PURPOSES
**THIS IS CRITICAL - VERIFY EVERY SINGLE FILE MENTIONED**

For EACH file documented in overview.md:
- [ ] Does the file actually exist at that path?
- [ ] Does it do what the overview claims?
- [ ] Are the "Key Functions" actually in the file?
- [ ] Are the dependencies accurately listed?
- [ ] Are the dependents accurately listed?
- [ ] Are the code examples actually from that file?
- [ ] Are the code examples still current (not outdated)?

**VERIFICATION METHOD:**
- Open each mentioned file
- Find the documented functions/classes
- Check imports (dependencies)
- Search codebase for imports of this file (dependents)
- Compare code examples to actual code

**REPORT FORMAT:**
```
**FILE VERIFICATION: `path/to/file.ext`**

✅ ACCURATE:
- Purpose description: [Correct/Verified]
- Key Functions: [List verified functions]
- Dependencies: [Verified imports]
- Code example: [Matches actual code]

⚠️ INACCURATE:
- [What's wrong]
- [Actual code citation]

❌ CRITICAL ERROR:
- File doesn't exist at this path
- OR: File has completely different purpose
- OR: Code example is from different file
```

**IF YOU FIND FILES THAT SHOULD BE DOCUMENTED BUT AREN'T:**
```
❓ MISSING CRITICAL FILE: `path/to/undocumented-file.ext`
- Purpose: [What it actually does]
- Why it's critical: [Importance to system]
- Should be added to overview.md
```

### Section 5: DATA FLOW
- [ ] Can you trace the documented data flows in actual code?
- [ ] Are entry points correctly identified?
- [ ] Are data transformations accurately described?
- [ ] Are storage points correct?
- [ ] Are exit points correct?

**VERIFICATION METHOD:**
- Pick one documented flow
- Trace it through actual code, file by file
- Cite code at each step
- Confirm or deny accuracy

**REPORT FORMAT:** [Same as above]

### Section 6: EXTERNAL DEPENDENCIES
- [ ] Check package.json / requirements.txt / etc.
- [ ] Are all major dependencies listed?
- [ ] Are purposes accurately described?
- [ ] Are any critical dependencies missing from docs?

**VERIFICATION METHOD:**
- Open dependency files
- Compare to overview.md list
- Verify usage of each dependency in code

**REPORT FORMAT:** [Same as above]

### Section 7: DATABASE SCHEMA (if applicable)
- [ ] Does database/storage match documentation?
- [ ] Are tables/collections accurately described?
- [ ] Are schemas correct?

### Section 8: API ENDPOINTS (if applicable)
- [ ] Do endpoints actually exist in code?
- [ ] Are methods (GET/POST/etc.) correct?
- [ ] Are purposes accurate?

### Section 9: CONFIGURATION
- [ ] Are environment variables accurately documented?
- [ ] Are config files correct?
- [ ] Are any critical configs missing?

### Section 10: BUILD AND DEPLOYMENT
- [ ] Can the system actually be built using these instructions?
- [ ] Are commands accurate?
- [ ] Are steps complete?

═══════════════════════════════════════════════════════════════

STEP 3: ARCHITECTURAL UNDERSTANDING TEST
─────────────────────────────────────────

After reading overview.md, can you answer these questions using ONLY 
the actual codebase (not the docs)?

1. **What is the main entry point of this application?**
   - [Your answer with code citation]
   - Does this match overview.md? [Yes/No]

2. **How does data enter the system?**
   - [Your answer with code citations]
   - Does this match overview.md? [Yes/No]

3. **What are the 3 most critical files in this codebase?**
   - [Your list with reasoning]
   - Are these documented in overview.md? [Yes/No]

4. **If I change [file mentioned in overview.md], what breaks?**
   - [Your analysis with code citations]
   - Is this impact analysis reflected in overview.md? [Yes/No]

5. **What external services does this integrate with?**
   - [Your findings from code]
   - Does this match overview.md? [Yes/No]

═══════════════════════════════════════════════════════════════

STEP 4: CRITICAL ISSUES IDENTIFICATION
───────────────────────────────────────

Identify any CRITICAL problems that would prevent safe development:

**CRITICAL ISSUES (Must be fixed before proceeding):**
```
🔴 CRITICAL ISSUE #1:
**Problem:** [Describe the issue]
**Location in overview.md:** [Which section]
**Actual reality:** [What the code actually shows]
**Code citation:** [Proof from codebase]
**Impact if not fixed:** [Why this matters]
**Recommended fix:** [How to correct the documentation]
```

**MEDIUM ISSUES (Should be fixed but not blocking):**
```
🟡 MEDIUM ISSUE #1:
[Same format as above]
```

**MINOR ISSUES (Nice to fix but not critical):**
```
⚪ MINOR ISSUE #1:
[Same format as above]
```

═══════════════════════════════════════════════════════════════

STEP 5: COMPLETENESS ASSESSMENT
────────────────────────────────

Is the documentation COMPLETE? Check for:

**MISSING SECTIONS:**
- [ ] Are there major subsystems not documented?
- [ ] Are there important patterns not explained?
- [ ] Are there critical workflows not described?
- [ ] Are there security considerations not mentioned?
- [ ] Are there performance considerations not mentioned?
- [ ] Are there known limitations not documented?

**LIST ANY CRITICAL OMISSIONS:**
```
❌ MISSING: [What's not documented]
**Why it matters:** [Importance]
**Where it should be added:** [Which section]
**Evidence in code:** [Code citation showing it exists]
```

═══════════════════════════════════════════════════════════════

STEP 6: FINAL VERIFICATION REPORT
──────────────────────────────────

Compile your findings into a final report:

---

# DOCUMENTATION VERIFICATION REPORT

**Date:** YYYY-MM-DD HH:MM
**Codebase:** [Project name]
**Documentation Version:** [If available]
**Verified By:** Fresh AI Agent (No prior context)

---

## EXECUTIVE SUMMARY

**Overall Assessment:** [PASS / CONDITIONAL PASS / FAIL]

**Total Issues Found:**
- 🔴 Critical: [count]
- 🟡 Medium: [count]  
- ⚪ Minor: [count]

**Accuracy Score:** [X]% of claims verified as accurate

**Completeness Score:** [X]% of critical information documented

---

## SECTION-BY-SECTION VERIFICATION RESULTS

### 1. Project Description
✅ Verified Accurate: [count] claims
⚠️ Inaccurate: [count] claims
❓ Missing: [count] items

[Details...]

### 2. Architecture
[Same format...]

### 3. Directory Structure
[Same format...]

### 4. Key Files
✅ Verified: [count]/[total] files
❌ Issues: [count] files
❓ Missing: [count] undocumented critical files

[Details for each file...]

### 5-10. [Other Sections]
[Same format...]

---

## CRITICAL ISSUES SUMMARY

[List all critical issues found]

---

## RECOMMENDED ACTIONS

**BEFORE starting development work:**

1. **MUST FIX (Blocking):**
   - [ ] Fix critical issue #1: [Brief description]
   - [ ] Fix critical issue #2: [Brief description]
   - [ ] Add missing critical documentation for [X]

2. **SHOULD FIX (Important):**
   - [ ] Correct inaccurate description in Section [X]
   - [ ] Add missing file documentation for [file]

3. **NICE TO FIX (Optional):**
   - [ ] Minor corrections in [section]

---

## FINAL RECOMMENDATION

**[ ] ✅ APPROVED - Documentation is accurate and complete. Safe to begin work.**

**[ ] ⚠️ CONDITIONAL APPROVAL - Documentation is mostly accurate but has [N] critical issues that must be fixed first. Fix these issues, then proceed.**

**[ ] ❌ NOT APPROVED - Documentation has major inaccuracies or critical omissions. Do not begin work until documentation is corrected and re-verified.**

---

## VERIFIED CODE CITATIONS

[Include key code citations that support or contradict documentation claims]

**Example of accurate documentation:**
[CLAIM from overview.md] → ✅ [CODE CITATION proving it]

**Example of inaccurate documentation:**
[CLAIM from overview.md] → ❌ [CODE CITATION showing different reality]

---

## NOTES FOR NEXT AGENT

If starting work on this codebase, pay special attention to:
1. [Important finding 1]
2. [Important finding 2]
3. [Important finding 3]

These areas had discrepancies or gaps in documentation.

---

**END OF VERIFICATION REPORT**

═══════════════════════════════════════════════════════════════

STEP 7: PRESENT FINDINGS
─────────────────────────

Present your complete verification report to the user and state:

"I have completed a thorough verification of `/docs/overview.md` against 
the actual codebase.

**VERIFICATION COMPLETE**

**Overall Assessment:** [PASS / CONDITIONAL PASS / FAIL]

**Summary:**
- Verified [X] file references
- Found [N] critical issues
- Found [N] medium issues  
- Found [N] minor issues
- Identified [N] missing critical items

**My Recommendation:**
[✅ Safe to proceed with development]
[⚠️ Fix critical issues first, then proceed]
[❌ Documentation needs major corrections before starting work]

**Next Steps:**
[What should happen next based on your findings]

Please review the full report above. Do you want me to:
A) Explain any specific findings in detail
B) Help fix the documentation issues found
C) Proceed with development (if approved)
D) Re-verify after fixes are made"

═══════════════════════════════════════════════════════════════
```

***VERIFICATION TASK ENDS***


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