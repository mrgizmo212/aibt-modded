# TASK EXECUTION & IMPLEMENTATION PROMPT

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

***TASK EXECUTION BEGINS***

**** THINK AS HARD AS YOU CAN - PLAN THOROUGHLY, EXECUTE CAREFULLY ****

VERIFY THAT THIS IS NOT HAPPENING NOW

Option 1: Redis Config (Proper Fix)
Store SIGNATURE in Redis instead of file
Redis is shared across all processes
Already analyzed in previous tempDocs
Most reliable for production

---

Option 2: Pass SIGNATURE as Parameter
Modify MCP tools to accept SIGNATURE directly
No cross-process config lookup
More code changes but cleanest

VERIFY THIS IS NOT HAPPENING NOW 
WHY WOULD IT GO HERE? IT'S IN SUPABASE? DOES IT NEED TO BE IN BOTH? I AM ASKING BECAUSE I DONT KNOW 
EVERYTHING WE DO WE MUCH ENSURE ITS 100% MCP COMPLIANT WITH THE JUNE 18, 2025 UPDATE! @MCP Specification https://modelcontextprotocol.io/specification/2025-06-18/changelog 
https://modelcontextprotocol.io/specification/2025-06-18/basic/transports   WE USE Streamable HTTP
---

Option 3: Environment Variable (Quick Test)
Set SIGNATURE as Render env var
Only works for single model (loses multi-user)
Just to confirm if that's the issue

I DONT UNDERSTAND WHAT WOULD BE SET HERE AND WHY 


```

═══════════════════════════════════════════════════════════════
🔴 TASK EXECUTION & IMPLEMENTATION 🔴
═══════════════════════════════════════════════════════════════

IMPORTANT CONTEXT:

YOU ARE WITHIN A LOCAL ENVIRONMENT WITHIN CURSOR AI ON A WINDOWS PC USING POWERSHELL.

EACH /DIR AT THE ROOT LEVEL OF THE WORKSPACE IS TO BE TREATED AS AN ISOLATED AND COMPLETELY SEPERATE PROJECT / CODEBASE FROM THE REST. SO WHEN WORKING ON A SPECIFIC DIR ITS ACTUALLY ITS OWN PROJECT WITH ITS OWN SEPERATE GIT HUB REPO ETC... 

ALL FOCUS WILL BE WITHIN THIS DIRECTORY ONLY '\aibt-modded'

PREREQUISITES: 
✅ Documentation has been verified and is accurate
✅ You have full context of the codebase
✅ You have read /docs/overview.md
✅ You understand the architecture and data flows

═══════════════════════════════════════════════════════════════

## USER INPUT SECTION (Fill this out)

**TASK ID:** TASK-XXX

**TASK TYPE:** 


WE NEED TO GO THROUGH EACH AND EVERY FEATURE AND CONSIDER WHAT IS NEEDED, HOW WE WILL DO IT FRONT END AND BACKEND WITHOUT BREAKING ANYTHING! 

WE WILL TES LOCALLY SO WE CAN UPGRADE ALEMBIC HEAD BUT I DONT WANT TO MESS UP PRODUCTION AND WERE USING THE PRODUCTION DB IN THE ENV AND IT NEEDS TO STAY THERE. WE NEED TO CONSIDER EDGE CASES AND ALL IN BETWEEN!




**TASK DESCRIPTION:**
[Describe what needs to be accomplished]




**GOAL/OBJECTIVE:**
[What should the end result be?]




**SUCCESS CRITERIA:**
[How do we know this is complete and working?]
1. [Criterion 1]
2. [Criterion 2]
3. [Criterion 3]




**CONSTRAINTS/REQUIREMENTS:**
[Any technical requirements, performance needs, compatibility requirements, etc.]




**RELATED DOCUMENTATION:**
[Reference any WIP items, bug reports, brainstorming sessions, etc.]
- WIP-XXX: [Link or reference]
- BUG-XXX: [Link or reference]




═══════════════════════════════════════════════════════════════

## AI AGENT WORKFLOW

STEP 1: CONTEXT VERIFICATION
─────────────────────────────

Before starting, verify your context is current.

**VERIFICATION CHECKLIST:**

```
CONTEXT VERIFICATION:

**Documentation Status:**
- [ ] `/docs/overview.md` - Last updated: [date from file]
- [ ] Overview matches current code: [Quick spot check 2-3 key files]
- [ ] No major changes since last verification

**Related WIP Items:**
- [ ] Checked `/docs/wip.md` for related work
- [ ] No conflicting tasks in progress
- [ ] Dependencies satisfied (if any)

**Related Bugs:**
- [ ] Checked `/docs/bugs-and-fixes.md` for related issues
- [ ] No active bugs that would interfere with this task
- [ ] Aware of known pitfalls in affected areas

**External Integrations:**
- [ ] Checked `/docs/projects-for-context-only/` (if applicable)
- [ ] No integration conflicts anticipated

**My Understanding:**
I understand:
✅ What this task requires
✅ Where in the codebase this lives
✅ How this fits into the overall system
✅ What could break if done wrong
```

**If any verification fails, STOP and update context first.**

═══════════════════════════════════════════════════════════════

STEP 2: TASK ANALYSIS
──────────────────────

Understand the task deeply before planning.

**REQUIREMENTS ANALYSIS:**

```
WHAT NEEDS TO BE DONE:

**Core Functionality:**
1. [Requirement 1]
   - Acceptance criteria: [specific]
   - Related code: `path/to/file.ext` [citation]
   
2. [Requirement 2]
   - Acceptance criteria: [specific]
   - Related code: `path/to/file.ext` [citation]
   
3. [Requirement 3]
   [Same format...]

**Edge Cases to Handle:**
1. [Edge case 1] - Code location: `file.ext` [citation]
2. [Edge case 2] - Code location: `file.ext` [citation]
3. [Edge case 3] - Code location: `file.ext` [citation]

**Non-Functional Requirements:**
- Performance: [any performance needs]
- Security: [any security considerations]
- Scalability: [any scalability needs]
- Compatibility: [browser/version/platform requirements]
```

**AFFECTED CODEBASE AREAS:**

```
COMPONENTS THAT WILL BE MODIFIED:

**Primary Files:**
1. **`path/to/primary-file.ext`**
   - Current purpose: [what it does now]
   - Current code (relevant section):
   ```language
   [citation of code that will change]
   ```
   - What needs to change: [specific changes]
   - Why: [reasoning]

2. **`path/to/another-file.ext`**
   [Same format...]

**Secondary Files (Dependencies):**
1. **`path/to/dependency.ext`**
   - Imports primary file: [citation]
   - Affected by changes how: [explanation]
   - Needs modification: [Yes/No - if yes, what]

**Tertiary Files (Indirect Impact):**
1. **`path/to/indirect.ext`**
   - Why affected: [explanation with code citation]
   - Action needed: [none / monitor / update]
```

═══════════════════════════════════════════════════════════════

STEP 3: IMPACT ANALYSIS
────────────────────────

Understand EVERYTHING this task affects.

**SYSTEM-WIDE IMPACT ASSESSMENT:**

```
IMPACT ANALYSIS:

**Direct Impact:**
Files that will be directly modified:
1. `file1.ext` - [what changes and why]
2. `file2.ext` - [what changes and why]
3. `file3.ext` - [what changes and why]

**Ripple Effects:**
1. **Data Flow Changes:**
   - Current flow: [A → B → C] with citations
   - New flow: [A → B → X → C] with explanation
   - Impact: [what this means for the system]

2. **Function Call Chain Changes:**
   - What calls this: [`file.ext:function()`] - [citation]
   - Will still work?: [Yes/No with reasoning]
   - Needs update?: [Yes/No - if yes, what]

3. **State Management Changes:**
   - Current state structure: [citation from store/state file]
   - New state needed: [what to add/modify]
   - Components using this state: [list with citations]

4. **API/Interface Changes:**
   - Current signature: [citation]
   - New signature: [what changes]
   - Breaking change?: [Yes/No]
   - Migration path: [if breaking, how to handle]

**External Integration Impact:**
- [ ] Check if any external projects affected (if applicable)
- [ ] Impact on: [external system name]
- [ ] Action needed: [update integration docs, notify, etc.]

**Performance Impact:**
- Expected change: [better/worse/neutral]
- Reasoning: [based on what the code will do]
- Monitoring needed: [what to watch]

**Security Impact:**
- New attack surface: [Yes/No - explanation]
- Authentication/Authorization affected: [Yes/No]
- Data exposure risk: [assessment]

**Testing Impact:**
- Existing tests affected: [which ones and why]
- New tests needed: [what must be tested]

**Documentation Impact:**
- `/docs/overview.md` needs update: [Yes/No - what sections]
- `/docs/wip.md` needs update: [Yes during, remove after]
- External integration docs: [Yes/No]
```

**RISK ASSESSMENT:**

```
POTENTIAL RISKS:

🔴 HIGH RISK:
1. [Risk 1]
   - Why dangerous: [explanation with code evidence]
   - Likelihood: [High/Medium/Low]
   - Mitigation: [how to prevent]
   - Rollback plan: [how to undo if needed]

🟡 MEDIUM RISK:
1. [Risk 1]
   [Same format...]

🟢 LOW RISK:
1. [Risk 1]
   [Same format...]
```

═══════════════════════════════════════════════════════════════

STEP 4: DETAILED IMPLEMENTATION PLAN
─────────────────────────────────────

**🔴 CRITICAL: NO CODE CHANGES UNTIL THIS PLAN IS APPROVED BY USER**

Create comprehensive, step-by-step implementation plan.

**IMPLEMENTATION PLAN:**

```
═══════════════════════════════════════════════════════════════
IMPLEMENTATION PLAN: TASK-XXX
═══════════════════════════════════════════════════════════════

**Approach:** [High-level strategy]

**Why This Approach:**
[Reasoning for chosen approach vs alternatives]

**Estimated Complexity:** [Low/Medium/High/Very High]
**Estimated Impact:** [X files to modify, Y files to create, Z functions affected]

───────────────────────────────────────────────────────────────
PHASE 1: PREPARATION
───────────────────────────────────────────────────────────────

**Step 1.1: Create/Update Type Definitions (if applicable)**

**File:** `path/to/types.ts` (existing/new)
**Action:** [Create / Modify]

**Current code (if modifying):**
```language
[citation]
```

**Changes needed:**
```language
[exact new code to add]
```

**Reasoning:** [why these types are needed]

───

**Step 1.2: [Next preparation step]**
[Same detailed format...]

───────────────────────────────────────────────────────────────
PHASE 2: CORE IMPLEMENTATION
───────────────────────────────────────────────────────────────

**Step 2.1: Modify Primary Component/Service**

**File:** `path/to/primary-file.ext`
**Current relevant code:**
```language
[citation of section to modify - around lines X-Y or function name]
```

**Required changes:**

**Change 1: [Brief description]**
**Location:** `functionName()` function (around lines X-Y)

**BEFORE:**
```language
[exact current code]
```

**AFTER:**
```language
[exact new code]
```

**Why this change:** [explanation]
**What this affects:** [downstream impacts with citations]

**Change 2: [Brief description]**
[Same format...]

───

**Step 2.2: Update Dependent Component**

**File:** `path/to/dependent.ext`
**Why it needs updating:** [explanation with code citation showing dependency]

**Current code:**
```language
[citation]
```

**Changes needed:**
```language
[exact new code]
```

───

**Step 2.3: [Next core step]**
[Same detailed format...]

───────────────────────────────────────────────────────────────
PHASE 3: INTEGRATION & WIRING
───────────────────────────────────────────────────────────────

**Step 3.1: Connect Components**

**Integration Point 1:**
- **File:** `path/to/file.ext`
- **Function:** `integrationFunction()`
- **Current code:**
  ```language
  [citation]
  ```
- **Add/Modify:**
  ```language
  [exact integration code]
  ```
- **Why:** [explanation]

[Repeat for all integration points...]

───────────────────────────────────────────────────────────────
PHASE 4: ERROR HANDLING & EDGE CASES
───────────────────────────────────────────────────────────────

**Step 4.1: Add Error Handling**

**Locations requiring error handling:**
1. `file.ext:function()` - [what errors to catch]
2. `file.ext:function()` - [what errors to catch]

**Error Handling Code:**
```language
[exact error handling implementation]
```

**Step 4.2: Handle Edge Cases**

**Edge Case 1:** [Description]
- **Code location:** `file.ext` [citation]
- **Current handling:** [what happens now]
- **New handling:** [code to add]

[Repeat for all edge cases...]

───────────────────────────────────────────────────────────────
PHASE 5: TESTING & VERIFICATION
───────────────────────────────────────────────────────────────

**Step 5.1: Unit Testing (if applicable)**
- Files needing tests: [list]
- Test coverage: [what to test]
- Test file location: `path/to/test.spec.ext`

**Step 5.2: Integration Testing**
- Test scenario 1: [how to test]
- Test scenario 2: [how to test]
- Expected results: [what should happen]

**Step 5.3: Manual Verification**
1. [Step-by-step manual test procedure]
2. [Expected outcome at each step]
3. [How to verify success]

───────────────────────────────────────────────────────────────
PHASE 6: DOCUMENTATION & CLEANUP
───────────────────────────────────────────────────────────────

**Step 6.1: Update Overview.md**
- Section to update: [which section]
- Changes needed: [what to document]

**Step 6.2: Update WIP.md**
- Mark as complete
- Move details to overview.md

**Step 6.3: Update External Integration Docs (if applicable)**
- File: `/docs/projects-for-context-only/connection-overview.md`
- Changes: [what integration points changed]

═══════════════════════════════════════════════════════════════

**ROLLBACK PLAN:**

If something goes wrong, here's how to revert:

**Step 1:** Revert file changes in reverse order:
1. Revert `file3.ext` to: [citation of original code]
2. Revert `file2.ext` to: [citation of original code]
3. Revert `file1.ext` to: [citation of original code]

**Step 2:** Clear any state/cache if applicable
**Step 3:** Verify system works as before

═══════════════════════════════════════════════════════════════

**ALTERNATIVES CONSIDERED:**

**Alternative Approach 1:** [Description]
- **Pros:** [advantages]
- **Cons:** [disadvantages]
- **Why not chosen:** [reasoning]

**Alternative Approach 2:** [Description]
[Same format...]

═══════════════════════════════════════════════════════════════

**PLAN CONFIDENCE:** [High/Medium/Low]

**Reasoning for confidence level:**
[Why you're confident or what uncertainties exist]

═══════════════════════════════════════════════════════════════

**FILES SUMMARY:**
- Files to CREATE: [X] - [list]
- Files to MODIFY: [Y] - [list]
- Files to DELETE: [Z] - [list]
- Files INDIRECTLY AFFECTED: [A] - [list]

**TOTAL IMPACT:** [X+Y+Z+A] files touched

═══════════════════════════════════════════════════════════════
END OF IMPLEMENTATION PLAN
═══════════════════════════════════════════════════════════════
```

═══════════════════════════════════════════════════════════════

STEP 5: UPDATE WIP.MD WITH PLAN
────────────────────────────────

Before requesting approval, update `/docs/wip.md`:

```markdown
### WIP-XXX: [Task Name]
**Status:** 🟡 PLANNED (Awaiting Approval)
**Priority:** [Critical/High/Medium/Low]
**Started:** YYYY-MM-DD HH:MM
**Last Updated:** YYYY-MM-DD HH:MM

**Objective:**
[Task description from user input]

**Success Criteria:**
[Copy from user input]

**Implementation Plan:**
See detailed plan in current session - [X] phases, [Y] steps total

**Files To Be Modified:**
- [`file1.ext`] - [Changes] - Lines X-Y / function name
- [`file2.ext`] - [Changes] - Lines X-Y / function name
- New file: [`file3.ext`] - [Purpose]

**Estimated Impact:**
- Files modified: [X]
- Files created: [Y]
- Functions affected: [Z]
- Complexity: [Low/Medium/High]

**Risks Identified:**
- 🔴 [High risk item with mitigation]
- 🟡 [Medium risk item with mitigation]

**Current Progress:**
- [x] Context verified
- [x] Task analyzed
- [x] Impact assessed
- [x] Implementation plan created
- [ ] Plan approved
- [ ] Implementation started
- [ ] Testing complete
- [ ] Documentation updated

**Approval Status:** 🔴 AWAITING USER APPROVAL

**Notes:**
[Any important considerations or decisions made during planning]
```

═══════════════════════════════════════════════════════════════

STEP 6: REQUEST APPROVAL
─────────────────────────

Present plan to user and request approval.

**🔴 STOP - NO CODE CHANGES UNTIL APPROVED 🔴**

State:

"**IMPLEMENTATION PLAN READY: TASK-XXX**

**Task:** [Brief description]

**Plan Summary:**
- **Phases:** [X]
- **Steps:** [Y] total
- **Files Impacted:** [Z] files
- **Complexity:** [Low/Medium/High/Very High]
- **Risks:** [X high, Y medium, Z low]

**Approach:**
[One paragraph describing the high-level approach]

**Key Changes:**
1. `primary-file.ext` - [Brief description of main change]
2. `secondary-file.ext` - [Brief description]
3. [Additional key changes...]

**Confidence Level:** [High/Medium/Low]

**I have:**
✅ Analyzed the task requirements thoroughly
✅ Identified all affected code with citations
✅ Assessed system-wide impact
✅ Created detailed step-by-step implementation plan
✅ Identified and mitigated risks
✅ Planned rollback procedure
✅ Updated `/docs/wip.md` with plan

**The complete implementation plan is detailed above.**

**🔴 I WILL NOT MAKE ANY CODE CHANGES UNTIL YOU APPROVE THIS PLAN 🔴**

**Please review the plan and:**
A) **APPROVE** - Proceed with implementation as planned
B) **REQUEST CHANGES** - Modify the approach
C) **CLARIFY** - Ask questions about any part of the plan
D) **REJECT** - Choose a different approach

What is your decision?"

**⏸️ PAUSE HERE AND WAIT FOR USER APPROVAL ⏸️**

═══════════════════════════════════════════════════════════════

STEP 7: EXECUTE IMPLEMENTATION (Only After Approval)
─────────────────────────────────────────────────────

**⚠️ ONLY PROCEED IF USER APPROVED THE PLAN ⚠️**

Now execute the plan step-by-step.

**EXECUTION PROTOCOL:**

For EACH step in the plan:

1. **State what you're doing**
2. **Show the code change**
3. **Explain why this works**
4. **Update WIP.md progress**
5. **Verify step completed**
6. **Move to next step**

**EXECUTION LOG:**

```
EXECUTION LOG: TASK-XXX
Started: YYYY-MM-DD HH:MM

═══════════════════════════════════════════════════════════════
PHASE 1: PREPARATION
═══════════════════════════════════════════════════════════════

**Step 1.1: [Description]**
⏳ IN PROGRESS...

**Action taken:**
Modified `path/to/file.ext`

**Code change:**
```language
[exact code added/modified]
```

**Verification:**
✅ Code syntax correct
✅ Imports resolved
✅ No obvious errors

**WIP.md updated:** ✅ (marked step 1.1 complete)

**Time:** YYYY-MM-DD HH:MM
**Status:** ✅ COMPLETE

───

**Step 1.2: [Description]**
⏳ IN PROGRESS...

[Same format for every step...]

═══════════════════════════════════════════════════════════════
PHASE 2: CORE IMPLEMENTATION
═══════════════════════════════════════════════════════════════

[Continue for all phases and steps...]

═══════════════════════════════════════════════════════════════
```

**After EVERY step, update `/docs/wip.md`:**

```markdown
**Current Progress:**
- [x] Context verified
- [x] Task analyzed
- [x] Impact assessed
- [x] Implementation plan created
- [x] Plan approved by user
- [x] Phase 1: Preparation - COMPLETE
- [x] Step 1.1 - COMPLETE
- [x] Step 1.2 - COMPLETE
- [ ] Phase 2: Core Implementation - IN PROGRESS
- [x] Step 2.1 - COMPLETE
- [ ] Step 2.2 - IN PROGRESS
- [ ] Step 2.3 - NOT STARTED
[etc...]
```

**Progress Updates:**
After completing each PHASE (not every step), provide brief update:

"**PROGRESS UPDATE:**
Phase [X] of [Y] complete.
- ✅ [Phase name] completed
- ⏳ Starting [next phase name]
- Files modified so far: [X]
- No issues encountered / Issue encountered: [description if any]"

═══════════════════════════════════════════════════════════════

STEP 8: TESTING & VERIFICATION
───────────────────────────────

After implementation complete, test thoroughly.

**TESTING CHECKLIST:**

```
TESTING RESULTS:

**Unit Tests (if applicable):**
- [ ] All new tests pass
- [ ] All existing tests still pass
- [ ] Test coverage adequate

**Integration Tests:**
**Test 1:** [Description]
- Steps taken: [what you tested]
- Expected result: [what should happen]
- Actual result: [what happened]
- Status: ✅ PASS / ❌ FAIL

**Test 2:** [Description]
[Same format...]

**Manual Verification:**
**Scenario 1:** [User workflow]
- Steps: [1, 2, 3...]
- Result: [what happened]
- Success criteria met: ✅ Yes / ❌ No

[Repeat for all scenarios...]

**Edge Case Testing:**
**Edge Case 1:** [Description]
- How tested: [procedure]
- Handled correctly: ✅ Yes / ❌ No
- Code handling it: [citation]

[Repeat for all edge cases...]

**Regression Testing:**
- [ ] Existing feature 1 still works
- [ ] Existing feature 2 still works
- [ ] No unintended side effects observed

**Performance Testing:**
- Before: [baseline if applicable]
- After: [current performance]
- Impact: [better/worse/neutral]

**OVERALL TEST STATUS:** ✅ ALL PASS / ⚠️ ISSUES FOUND / ❌ FAILED
```

**If tests fail:**

```
TEST FAILURE ANALYSIS:

**What failed:** [Description]
**Expected:** [What should have happened]
**Actual:** [What actually happened]
**Why it failed:** [Root cause with code citation]
**Fix applied:** [What was changed]
**Retest result:** [Pass/Fail]

[Document in bugs-and-fixes.md if significant]
```

═══════════════════════════════════════════════════════════════

STEP 9: DOCUMENTATION UPDATE
─────────────────────────────

Update all relevant documentation.

**DOCUMENTATION UPDATES:**

```
DOCUMENTATION UPDATED:

**1. `/docs/overview.md`**

**Section Updated:** [Section name]
**Date/Time:** YYYY-MM-DD HH:MM

**Changes Made:**
- Added description of [new feature]
- Updated data flow diagram to show [change]
- Added [file.ext] to key files section

**New Content Added:**
[Brief excerpt or description of what was added]

───

**2. `/docs/wip.md`**

**Action:** Marked WIP-XXX as COMPLETE
**Date/Time:** YYYY-MM-DD HH:MM

**Entry moved to overview.md:** ✅

───

**3. `/docs/projects-for-context-only/connection-overview.md`** (if applicable)

**Changes Made:** [If external integration affected]
**Date/Time:** YYYY-MM-DD HH:MM

───

**4. Code Comments** (if significant)

**Files with new comments:**
- `file1.ext` - Added explanation of [complex logic]
- `file2.ext` - Added TODO note for [future consideration]
```

═══════════════════════════════════════════════════════════════

STEP 10: FINAL COMPLETION REPORT
─────────────────────────────────

Compile complete report of what was accomplished.

---

# TASK COMPLETION REPORT: TASK-XXX

**Date/Time Completed:** YYYY-MM-DD HH:MM
**Task Type:** [New Feature / Enhancement / etc.]
**Status:** ✅ COMPLETE

---

## EXECUTIVE SUMMARY

**Task:** [One-line description]
**Goal:** [What we aimed to achieve]
**Result:** [What was delivered]

**Success Criteria Met:**
- ✅ [Criterion 1]
- ✅ [Criterion 2]
- ✅ [Criterion 3]

---

## IMPLEMENTATION SUMMARY

**Approach Used:**
[Brief description of approach taken]

**Files Changed:**
- **Created:** [X] files
  - `new-file1.ext` - [Purpose]
  - `new-file2.ext` - [Purpose]
  
- **Modified:** [Y] files
  - `modified-file1.ext` - [What changed]
  - `modified-file2.ext` - [What changed]
  
- **Deleted:** [Z] files
  - [If any]

**Total Lines Changed:** [+X / -Y] (if known)

---

## CODE CHANGES SUMMARY

**Key Change 1:**
**File:** `path/to/file.ext`
**Function:** `functionName()`

**BEFORE:**
```language
[relevant old code]
```

**AFTER:**
```language
[relevant new code]
```

**Why:** [Explanation]
**Impact:** [What this affects]

---

**Key Change 2:**
[Same format...]

---

## TESTING RESULTS

**All Tests:** ✅ PASSED

**Test Coverage:**
- Unit tests: [X] passed
- Integration tests: [Y] passed
- Manual tests: [Z] scenarios verified
- Edge cases: [A] handled correctly

**No regressions detected.**

---

## CHALLENGES & LEARNINGS

**Challenges Encountered:**
1. **Challenge:** [What was difficult]
   **Solution:** [How it was solved]
   **Code:** [Citation showing solution]
   **Lesson:** [What was learned]

2. [Additional challenges...]

**Key Learnings:**
- [Learning 1 about this codebase]
- [Learning 2 about this pattern]
- [Learning 3 to apply in future]

**For Future Tasks:**
- [Pattern to follow]
- [Pattern to avoid]
- [Consideration for next time]

---

## IMPACT ASSESSMENT (POST-IMPLEMENTATION)

**Actual Impact:**
- Files touched: [X] (planned: [Y])
- Functions affected: [A] (planned: [B])
- Complexity: [As expected / Higher / Lower than planned]

**Performance Impact:**
[Better / Worse / Neutral - with evidence if measured]

**No Breaking Changes:** ✅ Confirmed

---

## DOCUMENTATION UPDATED

✅ `/docs/overview.md` - Updated with new feature details
✅ `/docs/wip.md` - WIP-XXX marked complete and removed
✅ `/docs/bugs-and-fixes.md` - [If bugs were fixed during implementation]
✅ External integration docs - [If applicable]

---

## RECOMMENDATIONS

**Follow-up Tasks:**
- [ ] [Optional enhancement that could be done]
- [ ] [Monitoring to set up]
- [ ] [Performance optimization opportunity]

**Related Work:**
- [Other tasks that could benefit from this]
- [Features that could now be implemented]

---

**END OF TASK COMPLETION REPORT**

═══════════════════════════════════════════════════════════════

STEP 11: PRESENT TO USER
─────────────────────────

State:

"**TASK COMPLETE: TASK-XXX ✅**

**Summary:**
[One paragraph describing what was accomplished]

**What Changed:**
- Created: [X] files
- Modified: [Y] files
- Functions affected: [Z]

**Testing:**
✅ All tests passed
✅ No regressions
✅ Success criteria met

**Documentation:**
✅ All docs updated with date/time stamps

**Key Learnings:**
1. [Learning 1]
2. [Learning 2]

**I have updated:**
✅ `/docs/overview.md` - Added details about [new feature]
✅ `/docs/wip.md` - Marked WIP-XXX as complete
✅ [Other docs if applicable]

**The task is complete and ready for use.**

**Next Steps:**
A) Review the implementation and completion report above
B) Test the changes yourself
C) Request any adjustments or refinements
D) Move on to next task

What would you like to do?"

═══════════════════════════════════════════════════════════════

## CRITICAL RULES FOR TASK EXECUTION

1. **NO CODE UNTIL APPROVED** - Create plan first, get approval, then code
2. **EXECUTE STEP-BY-STEP** - Follow the plan sequentially
3. **CITE EVERYTHING** - Every code change must be cited
4. **UPDATE WIP.MD CONSTANTLY** - After every major step
5. **TEST THOROUGHLY** - Don't skip verification
6. **LEARN FROM PROCESS** - Document challenges and learnings
7. **UPDATE ALL DOCS** - Keep documentation synchronized
8. **BE HONEST** - If something doesn't work, say so immediately

**If implementation fails or gets stuck:**
- STOP immediately
- Document what went wrong in bugs-and-fixes.md
- Analyze why the plan failed
- Propose revised approach
- Do NOT continue blindly

**Remember: Quality over speed. Take time to do it right.**

```

***TASK EXECUTION ENDS***

- ANY NEW MARKDOWN FILES THAT YOU WANT TO CREATE CAN BE DONE IN C:\Users\Adam\Desktop\cs103125\aibt-modded\docs\tempDocs AND WILL BE USED TO UPDATE THE FILES BELOW:

ANY MARKDOWN YOU CREATE DATE IT... THAT DIR IS FOR YOU

C:\Users\Adam\Desktop\cs103125\aibt-modded\docs\bugs-and-fixes.md
C:\Users\Adam\Desktop\cs103125\aibt-modded\docs\overview.md
C:\Users\Adam\Desktop\cs103125\aibt-modded\docs\wip.md