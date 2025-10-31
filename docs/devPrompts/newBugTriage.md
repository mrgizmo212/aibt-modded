# BUG FIX WORKFLOW PROMPT

***IMPORTANT REMINDER BEGINS***

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

***BUG FIX TASK BEGINS***

**** THINK AS HARD AS YOU CAN - BE 100% CERTAIN BEFORE DIAGNOSING ****

```

═══════════════════════════════════════════════════════════════
🔴 BUG FIX WORKFLOW - SYSTEMATIC DIAGNOSIS 🔴
═══════════════════════════════════════════════════════════════

IMPORTANT CONTEXT:

YOU ARE WITHIN A LOCAL ENVIRONMENT WITHIN CURSOR AI ON A WINDOWS PC USING POWERSHELL.

EACH /DIR AT THE ROOT LEVEL OF THE WORKSPACE IS TO BE TREATED AS AN ISOLATED AND COMPLETELY SEPERATE PROJECT / CODEBASE FROM THE REST. SO WHEN WORKING ON A SPECIFIC DIR ITS ACTUALLY ITS OWN PROJECT WITH ITS OWN SEPERATE GIT HUB REPO ETC... 

ALL FOCUS WILL BE WITHIN THIS DIRECTORY ONLY '\aibt-modded'

PREREQUISITES: 
✅ Documentation has been verified and is accurate
✅ You understand the codebase structure
✅ You have read /docs/overview.md

═══════════════════════════════════════════════════════════════

## USER INPUT SECTION (Fill this out)

**BUG ID:** BUG-XXX

**SEVERITY:** [Critical / High / Medium / Low]

**BUG DESCRIPTION:**
[Describe what's happening - what the user sees/experiences]




**AFFECTED PATHS/FILES (if known):**
- `path/to/file1.ext`
- `path/to/file2.ext`




**STEPS TO REPRODUCE:**
1. [Step 1]
2. [Step 2]
3. [Step 3]




**EXPECTED BEHAVIOR:**
[What should happen]




**ACTUAL BEHAVIOR:**
[What actually happens]




**ADDITIONAL CONTEXT:**
[Error messages, logs, screenshots descriptions, etc.]




═══════════════════════════════════════════════════════════════

## AI AGENT WORKFLOW

STEP 1: TRIAGE & DOCUMENTATION
────────────────────────────────

YOU ARE NOW A TRIAGE NURSE. First, document this bug properly.

Update `/docs/bugs-and-fixes.md` with initial triage entry:

```markdown
### BUG-XXX: [Brief Description]
**Date/Time Discovered:** YYYY-MM-DD HH:MM
**Date/Time Fixed:** [Not yet fixed]
**Agent/Session:** [Your session ID if available]
**Severity:** [Critical/High/Medium/Low]

**Symptoms:**
[What the user/system experiences - copy from user input above]

**Reproduction Steps:**
1. [Copy from user input]
2. [Copy from user input]
3. [Copy from user input]

**Expected vs Actual:**
- **Expected:** [Copy from user input]
- **Actual:** [Copy from user input]

**Initial Triage Assessment:**
- **Suspected Area:** [Which part of system - based on description]
- **Suspected Type:** [Logic error / Null reference / Race condition / etc.]
- **Priority Level:** [Justification for severity rating]

**Investigation Status:** 🔍 IN PROGRESS
```

**Triage Assessment Questions:**
1. Based on symptoms, which system component is likely affected?
2. Is this a UI issue, backend issue, integration issue, or data issue?
3. What type of error does this sound like?
4. How urgent is this? Does it block critical functionality?

**State your triage assessment:**
```
TRIAGE ASSESSMENT:
- Suspected component: [Component name]
- Suspected subsystem: [Specific subsystem]
- Error type hypothesis: [What kind of error]
- Urgency justification: [Why this severity]
```

═══════════════════════════════════════════════════════════════

STEP 2: CODE INVESTIGATION - FIND THE EVIDENCE
───────────────────────────────────────────────

Now, systematically search for code that could cause this issue.

**INVESTIGATION STRATEGY:**

**A. Start with User-Provided Paths (if any)**
If user provided file paths:
1. Open each file
2. Search for relevant functions/logic
3. Cite actual code
4. Look for obvious issues

**B. Trace from Entry Point**
Based on symptoms, identify entry point:
1. Where does this user action/process start?
2. Cite the entry point code
3. Follow the execution path
4. Note each file involved

**C. Search for Error-Related Patterns**
Search codebase for:
- Error messages mentioned by user
- Function names related to symptoms
- Variables related to the issue
- Related API calls or database queries

**D. Check Dependencies**
- What files import the suspected files?
- What functions call the suspected functions?
- What external APIs are involved?

**INVESTIGATION LOG:**

Document EVERY step of your investigation:

```
INVESTIGATION LOG:

**Step 1: Checked Entry Point**
- File: `path/to/file.ext`
- Function: `functionName()`
- Code:
```language
[actual code citation]
```
- Finding: [What you found - with reasoning]
- Next step: [Where to look next]

**Step 2: Traced Execution Path**
- From: `file1.ext:functionA()` → To: `file2.ext:functionB()`
- Code in file2.ext:
```language
[actual code citation]
```
- Finding: [What you found]
- Suspicion level: [High/Medium/Low]

**Step 3: Checked Related Functions**
- File: `path/to/file.ext`
- Function: `relatedFunction()`
- Code:
```language
[actual code citation]
```
- Finding: [What you found]

[Continue for all investigation steps...]

**Files Examined:**
- ✅ `file1.ext` - No issues found
- ⚠️ `file2.ext` - Suspicious code found
- ❌ `file3.ext` - PROBLEM IDENTIFIED
```

**CRITICAL: For EACH file you examine, cite actual code.**

═══════════════════════════════════════════════════════════════

STEP 3: ROOT CAUSE ANALYSIS - BE 100% CERTAIN
──────────────────────────────────────────────

This is THE MOST IMPORTANT STEP.

You must determine WHY this bug happens and be ABSOLUTELY CERTAIN.

**ROOT CAUSE DETERMINATION PROCESS:**

**A. Identify the Problematic Code**

**FILE:** `path/to/problematic-file.ext`
**FUNCTION/SECTION:** `functionName()` (around lines X-Y)
**THE CODE:**
```language
[CITE THE ACTUAL PROBLEMATIC CODE]
```

**B. Explain EXACTLY Why This Causes the Bug**

DO NOT GUESS. Be specific and certain.

```
ROOT CAUSE EXPLANATION:

**What the code does:**
[Explain what this code is supposed to do]

**What's wrong:**
[Explain the specific flaw/error/oversight]

**Why this causes the observed symptoms:**
[Connect the code flaw to user's symptoms - be specific]

**Evidence from code:**
1. [Evidence point 1 with code citation]
2. [Evidence point 2 with code citation]
3. [Evidence point 3 with code citation]

**Why I am 100% certain:**
[Explain your certainty - trace the logic completely]
```

**C. Trace the Complete Failure Path**

Show the EXACT path from code flaw to user symptom:

```
FAILURE PATH TRACE:

1. User action: [What user does]
   ↓
2. Entry point: `file1.ext:function1()`
   Code: [citation]
   ↓
3. Calls: `file2.ext:function2()`
   Code: [citation]
   ↓
4. **FAILURE POINT**: `file3.ext:problematicFunction()`
   Code: [citation showing the bug]
   Problem: [Exactly what goes wrong here]
   ↓
5. Result: [How this manifests as user symptom]
```

**D. Verify Your Hypothesis**

Test your root cause theory:

```
HYPOTHESIS VERIFICATION:

**My hypothesis:** [State your root cause theory]

**Test 1: Code Logic Analysis**
- If [condition], then [code does X]
- The bug occurs when [specific condition]
- Code citation proving this: [citation]
- ✅ Hypothesis holds

**Test 2: Execution Path Validation**
- Traced path: [A → B → C → BUG]
- Each step verified with code: [citations]
- ✅ Path confirmed

**Test 3: Alternative Explanations Ruled Out**
- Could it be [alternative 1]? NO, because [code citation]
- Could it be [alternative 2]? NO, because [code citation]
- ✅ Only explanation is my hypothesis

**CERTAINTY LEVEL:** [Only state 100% if truly certain]
```

**E. Identify All Affected Scenarios**

When does this bug occur?

```
BUG OCCURRENCE CONDITIONS:

**Always happens when:**
- [Condition 1] - Code: [citation]
- [Condition 2] - Code: [citation]

**Never happens when:**
- [Condition that prevents it] - Code: [citation]

**Edge cases:**
- [Special case 1] - Code: [citation]
- [Special case 2] - Code: [citation]
```

═══════════════════════════════════════════════════════════════

STEP 4: IMPACT ANALYSIS
────────────────────────

Before proposing a fix, understand the full impact.

**SYSTEM-WIDE IMPACT ASSESSMENT:**

```
IMPACT ANALYSIS:

**Directly Affected:**
- File: `path/to/file.ext`
- Functions: [list with code citations]
- Data: [what data is corrupted/affected]

**Indirectly Affected:**
- What calls the buggy code: [list files with citations]
- What depends on buggy code: [list with citations]
- Downstream effects: [what else breaks as a result]

**User Impact:**
- Who experiences this: [which users/scenarios]
- What they can't do: [blocked functionality]
- Data at risk: [any data loss/corruption risk]
- Workarounds available: [if any]
```

═══════════════════════════════════════════════════════════════

STEP 5: PRESENT DIAGNOSIS REPORT
─────────────────────────────────

Compile your findings into a comprehensive report:

---

# BUG DIAGNOSIS REPORT: BUG-XXX

**Date/Time:** YYYY-MM-DD HH:MM
**Bug Severity:** [Critical/High/Medium/Low]
**Diagnosis Confidence:** [State 100% only if absolutely certain]

---

## EXECUTIVE SUMMARY

**Bug:** [One-line description]
**Root Cause:** [One-line explanation]
**Location:** `path/to/file.ext` in `functionName()` function
**Fix Complexity:** [Simple / Moderate / Complex]

---

## DETAILED ROOT CAUSE

### The Problematic Code

**FILE:** `path/to/file.ext` (around lines X-Y)
```language
[FULL CODE CITATION of problematic section]
```

### Why This Causes the Bug

[Detailed explanation with evidence]

### Complete Failure Path

[Step-by-step trace from user action to symptom]

### Verification of Root Cause

[How you verified this is definitely the cause]

---

## AFFECTED COMPONENTS

**Direct:**
- [List with code citations]

**Indirect:**
- [List with code citations]

---

## PROPOSED FIX APPROACH

**Strategy:** [High-level fix approach]

**Changes Required:**
1. **File:** `path/to/file.ext`
   **Current code:**
   ```language
   [problematic code]
   ```
   
   **Proposed change:**
   ```language
   [fixed code]
   ```
   
   **Why this fixes it:** [Explanation]

2. [Additional changes if needed]

**Potential Side Effects:**
- [What else might this change affect]
- [How to mitigate]

**Testing Required:**
- [How to verify fix works]
- [What edge cases to test]

---

## PREVENTION STRATEGY

**How to prevent this pattern in future:**
- [Lesson learned]
- [Pattern to avoid]
- [Better approach]

---

## CONFIDENCE ASSESSMENT

**My certainty level:** [X]%

**Reasoning:**
- ✅ Code path fully traced
- ✅ Root cause verified against symptoms
- ✅ Alternative explanations ruled out
- ✅ All evidence points to same conclusion

**If less than 100% certain, what's uncertain:**
- [State any remaining doubts]
- [What additional investigation would resolve doubts]

---

**END OF DIAGNOSIS REPORT**

═══════════════════════════════════════════════════════════════

STEP 6: UPDATE DOCUMENTATION
─────────────────────────────

Update `/docs/bugs-and-fixes.md` with complete diagnosis:

Add to the initial triage entry:

```markdown
**Root Cause:**
[Your root cause explanation with file citations]

**Affected Files:**
- [`file1.ext`] - [How it's affected]
- [`file2.ext`] - [How it's affected]

**Code Evidence:**

[BEFORE - file: `path/to/file.ext`]
```language
[problematic code]
```

**Analysis:**
[Why this is wrong and causes the bug]

**Diagnosis Confidence:** 100% ✅

**Proposed Fix:** [Brief description - full fix plan in report above]

**Investigation Status:** ✅ DIAGNOSED - Ready for fix approval
```

═══════════════════════════════════════════════════════════════

STEP 7: PRESENT TO USER
────────────────────────

State:

"**BUG DIAGNOSIS COMPLETE: BUG-XXX**

**Root Cause Identified:** ✅

**Location:** `path/to/file.ext` in `functionName()`

**Confidence:** [X]%

**Summary:**
[One paragraph explaining what's wrong and why it causes the symptoms]

**Proposed Fix:**
[One paragraph describing the fix approach]

**I have:**
✅ Traced the complete execution path
✅ Identified the exact problematic code
✅ Verified the root cause with code evidence
✅ Ruled out alternative explanations
✅ Assessed system-wide impact
✅ Updated `/docs/bugs-and-fixes.md` with diagnosis

**Next Steps:**
A) Review my diagnosis report above
B) Approve proposed fix approach
C) Request clarification on any findings
D) Request additional investigation if confidence < 100%

What would you like to do?"

═══════════════════════════════════════════════════════════════

## CRITICAL RULES FOR BUG DIAGNOSIS

1. **NEVER GUESS** - If uncertain, say so and investigate more
2. **ALWAYS CITE CODE** - Every claim needs code evidence
3. **BE 100% CERTAIN** - Don't propose fixes until you're sure of root cause
4. **TRACE COMPLETELY** - Follow execution path from start to failure
5. **RULE OUT ALTERNATIVES** - Consider other explanations, eliminate them
6. **VERIFY YOUR HYPOTHESIS** - Test your theory against the code
7. **DOCUMENT EVERYTHING** - Update bugs-and-fixes.md thoroughly
8. **CONSIDER SIDE EFFECTS** - Think about what else might break

**If you cannot be 100% certain of root cause:**
- State your confidence level honestly
- Explain what would increase confidence
- Do NOT proceed to fixing until certain

```

- ANY NEW MARKDOWN FILES THAT YOU WANT TO CREATE CAN BE DONE IN C:\Users\Adam\Desktop\cs103125\aibt-modded\docs\tempDocs AND WILL BE USED TO UPDATE THE FILES BELOW:

ANY MARKDOWN YOU CREATE DATE IT... THAT DIR IS FOR YOU

C:\Users\Adam\Desktop\cs103125\aibt-modded\docs\bugs-and-fixes.md
C:\Users\Adam\Desktop\cs103125\aibt-modded\docs\overview.md
C:\Users\Adam\Desktop\cs103125\aibt-modded\docs\wip.md

***BUG FIX TASK ENDS***