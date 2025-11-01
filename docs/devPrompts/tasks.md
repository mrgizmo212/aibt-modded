```markdown
***IMPORTANT REMINDER BEGINS***
- Your knowledge cutoff is 2024, HOWEVER, IT IS 2025 AND ALMOST ALL DOCUMENTATION YOU WERE TRAINED ON IS OUTDATED
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

***TASK EXECUTION BEGINS***

**** THINK AS HARD AS YOU CAN - PLAN THOROUGHLY, EXECUTE CAREFULLY ****

═══════════════════════════════════════════════════════════════
🔴 TASK EXECUTION & IMPLEMENTATION 🔴
═══════════════════════════════════════════════════════════════

IMPORTANT CONTEXT:

YOU ARE WITHIN A LOCAL ENVIRONMENT WITHIN CURSOR AI ON A WINDOWS PC USING POWERSHELL.

EACH /DIR AT THE ROOT LEVEL OF THE WORKSPACE IS TO BE TREATED AS AN ISOLATED AND COMPLETELY SEPARATE PROJECT / CODEBASE FROM THE REST. SO WHEN WORKING ON A SPECIFIC DIR IT'S ACTUALLY ITS OWN PROJECT WITH ITS OWN SEPARATE GITHUB REPO ETC... 

ALL FOCUS WILL BE WITHIN THIS DIRECTORY ONLY: '\branches\aibt-modded\'

PREREQUISITES CONFIRMATION:
✅ Initialization complete and verified
✅ Documentation verified as accurate
✅ You have full context of the codebase
✅ You have read /docs/overview.md (and all parts)
✅ You have read /docs/bugs-and-fixes.md
✅ You have read /docs/wip.md
✅ You understand the architecture and data flows
✅ Verification agent has approved your understanding

🔴 YOU ARE NOW READY TO EXECUTE TASKS 🔴

═══════════════════════════════════════════════════════════════
CRITICAL EXECUTION REMINDERS
═══════════════════════════════════════════════════════════════

**BEFORE STARTING ANY TASK:**

⏱️ **NO TIME PRESSURE** - You have infinite time to get this right
📂 **CHECK /TEMPDOCS** - Read previous session context first
🧠 **THINK AS HARD AS YOU CAN** - Deploy maximum cognitive intensity
✅ **VERIFY AGAINST CODE** - Cite actual code for everything
🧪 **PROVE WITH TEST SCRIPTS** - Bugs and fixes both need 100% verified scripts
🌊 **CONSIDER SYSTEM-WIDE IMPACTS** - Every change affects the entire system
📚 **UPDATE DOCUMENTATION** - After every change with date/time stamps
💾 **LEAVE CONTEXT** - Document in /tempDocs for next session
🧹 **STAY ORGANIZED** - Clean docs, archive scripts, maintain structure
🔗 **CHECK EXTERNAL INTEGRATIONS** - If applicable to this task
💻 **GIT COMMIT WHEN COMPLETE** - Provide PowerShell command at end

═══════════════════════════════════════════════════════════════

## TASK INPUT SECTION

**TASK ID:** TASK-[XXX]

**TASK TYPE:** [Select one]
- [ ] New Feature Implementation
- [ ] Bug Fix
- [ ] Enhancement/Improvement
- [ ] Refactoring
- [ ] Database Migration
- [ ] API Integration
- [ ] Performance Optimization
- [ ] Security Fix
- [ ] Documentation Update
- [ ] Testing/Coverage
- [ ] Other: _______________

**TASK DESCRIPTION:**
[Detailed description of what needs to be accomplished]



---TASK DESCRIPTION BEGINS---











---TASK DESCRIPTION ENDS---


**SUCCESS CRITERIA:**
[How do we know this is complete and working correctly?]
1. [Criterion 1 - must be specific and measurable]
2. [Criterion 2 - must be specific and measurable]
3. [Criterion 3 - must be specific and measurable]

**CONSTRAINTS/REQUIREMENTS:**
[Technical requirements, limitations, compatibility needs]
- Database: [Any DB constraints, migrations, production DB considerations]
- API: [Rate limits, authentication, external services]
- Performance: [Speed requirements, optimization needs]
- Security: [Authentication, authorization, data protection]
- Compatibility: [Browsers, versions, platforms]
- Dependencies: [External packages, services, integrations]

**SPECIAL CONSIDERATIONS:**
- [ ] Production database in use - BE CAREFUL
- [ ] Alembic migrations needed - test locally first
- [ ] External API integration affected
- [ ] Breaking changes possible - need migration path
- [ ] Performance sensitive operation
- [ ] Security sensitive operation
- [ ] User-facing changes - UX considerations
- [ ] Multi-service coordination required

**RELATED DOCUMENTATION:**
- WIP-XXX: [Reference if continuing existing work]
- BUG-XXX: [Reference if fixing known bug]
- Related Tasks: [Any dependent or related tasks]
- External Projects: [If affects external integrations]

═══════════════════════════════════════════════════════════════

## AI AGENT EXECUTION WORKFLOW

═══════════════════════════════════════════════════════════════
STEP 1: PRE-TASK CONTEXT CHECK
═══════════════════════════════════════════════════════════════

**🔴 MANDATORY: DO THIS BEFORE ANALYZING THE TASK**

```
PRE-TASK CONTEXT VERIFICATION:

**1. /tempDocs Check:**
Status: [EXISTS WITH CONTENT / EMPTY / DOESN'T EXIST]

Previous Session Findings:
- [List files in /tempDocs]
- [Summarize any relevant previous work]
- [Note any ongoing investigations]
- [Reference any active bugs/issues]

Action: [CONTINUING PREVIOUS WORK / STARTING FRESH]

**2. Documentation Currency Check:**
Last verified: [Date from last verification]
Time since verification: [Days/hours]

Quick spot check (2-3 key files):
- `key-file-1.ext` - Last modified: [check file]
  - Documentation accurate: ✅ / ⚠️ / ❌
  
- `key-file-2.ext` - Last modified: [check file]
  - Documentation accurate: ✅ / ⚠️ / ❌

Documentation status: ✅ CURRENT / ⚠️ NEEDS UPDATE / ❌ OUTDATED

**3. Related Work Check:**

WIP Items in /docs/wip.md:
- [List any related WIP items]
- Conflicts with current task: YES / NO
- Can continue existing work: YES / NO / N/A

Known Bugs in /docs/bugs-and-fixes.md:
- [List any related bugs]
- Affects this task: YES / NO
- Need to fix first: YES / NO

Test Scripts in /scripts:
- Relevant existing tests: [list]
- Coverage for this area: [Good / Partial / None]

**4. External Integration Check:**
External projects exist: YES / NO
If YES:
- Integration points relevant to task: [list]
- Need to coordinate changes: YES / NO

**5. Readiness Assessment:**
✅ / ❌ I have current context from /tempDocs
✅ / ❌ I have verified documentation is current
✅ / ❌ I have checked for conflicting WIP
✅ / ❌ I have reviewed related bugs
✅ / ❌ I understand external integration impacts
✅ / ❌ I am ready to analyze this task

**IF ANY ❌ ABOVE: STOP and resolve before proceeding**
```

═══════════════════════════════════════════════════════════════
STEP 2: DEEP TASK ANALYSIS
═══════════════════════════════════════════════════════════════

**Now that context is verified, analyze the task deeply.**

```
COMPREHENSIVE TASK ANALYSIS:

**TASK DECOMPOSITION:**

**What needs to be done (Core Requirements):**

1. **Requirement 1:** [Specific requirement]
   - Acceptance Criteria: [Exactly what "done" looks like]
   - Current State: [What exists now - cite code]
     File: `path/to/file.ext` - function/section
     ```language
     [current code citation]
     ```
   - Desired State: [What it should become]
   - Gap: [What's missing/broken/needs change]

2. **Requirement 2:** [Specific requirement]
   [Same detailed format...]

3. **Requirement 3:** [Specific requirement]
   [Same detailed format...]

**Frontend Considerations (if applicable):**
- Components affected: [list with file paths]
- UI/UX changes needed: [describe]
- State management: [what state changes needed]
- API calls: [what endpoints used/modified]
- User interaction flow: [how user experiences this]
- Responsive design: [considerations]
- Accessibility: [considerations]

**Backend Considerations (if applicable):**
- API endpoints affected: [list with file paths]
- Database changes needed: [schema, migrations, queries]
- Business logic changes: [what processing changes]
- Authentication/Authorization: [any changes needed]
- Data validation: [what needs validation]
- Error handling: [what errors to handle]
- Background jobs: [if async processing needed]

**Database Considerations (CRITICAL):**
⚠️ Production database in use - BE EXTREMELY CAREFUL
- Schema changes needed: [describe]
- Alembic migration required: YES / NO
- Migration strategy: [how to migrate safely]
- Rollback plan: [how to undo if needed]
- Data migration: [any data transformations needed]
- Indexes needed: [for performance]
- Testing migration locally: [strategy]

**Edge Cases to Handle:**

1. **Edge Case 1:** [Describe scenario]
   - Current handling: [What happens now - cite code]
     File: `path/to/file.ext`
     ```language
     [code showing current behavior]
     ```
   - Required handling: [What should happen]
   - Test strategy: [How to verify it works]

2. **Edge Case 2:** [Describe scenario]
   [Same detailed format...]

3. **Edge Case 3:** [Describe scenario]
   [Same detailed format...]

**Non-Functional Requirements:**
- Performance: [Any speed/load requirements]
- Security: [Any security considerations]
- Scalability: [How should this scale]
- Maintainability: [Code quality standards]
- Testability: [How to test this]
- Observability: [Logging/monitoring needed]

**User Experience Flow:**
[If user-facing]
1. User does [action]
2. System responds with [response]
3. User sees [result]
4. Edge case: If [condition], then [alternative flow]

**API Contract Changes (if applicable):**
Current API: [Cite current endpoint/schema]
New API: [What changes]
Breaking: YES / NO
If breaking: [Migration path for clients]
```

═══════════════════════════════════════════════════════════════
STEP 3: COMPREHENSIVE IMPACT ANALYSIS
═══════════════════════════════════════════════════════════════

**🔴 CRITICAL: Map EVERY impact before changing ANY code**

```
SYSTEM-WIDE IMPACT ASSESSMENT:

**1. DIRECT IMPACT ANALYSIS**

**Files That Will Be Directly Modified:**

**Primary File 1:** `path/to/file-1.ext`
- Current Purpose: [What it does now]
- Current Code (relevant sections):
  ```language
  [citation of code to be modified - function/section name]
  ```
- Required Changes: [Specific modifications needed]
- Why Changing: [Reasoning]
- Complexity: [Low / Medium / High]

**Primary File 2:** `path/to/file-2.ext`
[Same detailed format...]

**New Files To Create:**

**New File 1:** `path/to/new-file.ext`
- Purpose: [Why creating this]
- Contents: [What will be in it]
- Integration point: [How it connects to existing code]
- Dependencies: [What it requires]

**2. RIPPLE EFFECT ANALYSIS**

**Downstream Dependencies (What imports/uses modified files):**

**Dependent 1:** `path/to/dependent-1.ext`
- Imports: [What it imports from modified files - cite code]
  ```language
  [import statement and usage]
  ```
- How affected: [Specific impact]
- Needs modification: YES / NO
- If YES: [What changes needed]

**Dependent 2:** `path/to/dependent-2.ext`
[Same format...]

**Function Call Chain Impact:**

Modified Function: `file.ext:modifiedFunction()`
Currently called by:
1. `caller-1.ext:callerFunc()` - Line X / function name
   - Call site:
     ```language
     [code showing how it calls modified function]
     ```
   - Will still work: YES / NO / NEEDS UPDATE
   - If needs update: [What to change]

2. `caller-2.ext:callerFunc()` - Line X / function name
   [Same format...]

**3. DATA FLOW ANALYSIS**

**Current Data Flow:**
```
[Source] → [Transformation 1] → [Transformation 2] → [Destination]
`file-a.ext:funcA()` → `file-b.ext:funcB()` → `file-c.ext:funcC()` → `file-d.ext:funcD()`
```

Cite each step with code:
1. **Source:** `file-a.ext:funcA()`
   ```language
   [code showing data origin]
   ```

2. **Transform:** `file-b.ext:funcB()`
   ```language
   [code showing transformation]
   ```
   
[Continue for all steps...]

**New Data Flow:**
```
[Source] → [NEW STEP] → [Transformation 2] → [Destination]
```

**Changes Explained:**
- Added: [New step with reasoning]
- Removed: [What's no longer needed]
- Modified: [What's different]

**Data Structure Changes:**

**Current Structure:**
```language
[code showing current data structure - interface/type/class]
```

**New Structure:**
```language
[code showing new data structure]
```

**Breaking Changes:** YES / NO
**Migration Path:** [If breaking, how to migrate]

**4. STATE MANAGEMENT ANALYSIS**

**Current State:**
Location: `path/to/state-file.ext`
```language
[code showing current state structure]
```

**Changes Needed:**
- Add: [New state properties]
- Modify: [Changed properties]
- Remove: [Deprecated properties]

**Components Using This State:**
1. `component-1.ext` - [How it uses state - cite code]
2. `component-2.ext` - [How it uses state - cite code]

**State Update Impact:**
- Will existing components break: YES / NO
- Migration needed: YES / NO

**5. API/INTERFACE ANALYSIS**

**Current API Signature:**
```language
[function/endpoint signature with types]
```

**New API Signature:**
```language
[modified signature]
```

**Breaking Change:** YES / NO
**Reason:** [Why this change is/isn't breaking]

**If Breaking:**
- Deprecation strategy: [How to deprecate old API]
- Migration period: [How long to support both]
- Client migration guide: [Steps for API consumers]

**6. DATABASE IMPACT ANALYSIS**

⚠️ **CRITICAL: Production database in use**

**Current Schema:**
```sql
[relevant table definitions]
```

**Required Changes:**
- Add columns: [list with types]
- Modify columns: [list changes]
- Add tables: [list new tables]
- Add indexes: [for performance]
- Add constraints: [foreign keys, etc.]

**Alembic Migration:**
Required: YES / NO

**Migration Strategy:**
1. Create migration locally
2. Test on local database copy
3. Verify data integrity
4. Test rollback procedure
5. [Additional steps...]

**Migration Code (if needed):**
```python
# Location: alembic/versions/XXXX_description.py
def upgrade():
    # [migration code]
    pass

def downgrade():
    # [rollback code]
    pass
```

**Data Migration Needed:** YES / NO
If YES:
- What data to migrate: [describe]
- How to migrate: [strategy]
- Data validation: [how to verify]

**Rollback Plan:**
1. [Step to revert DB changes]
2. [Step to verify data integrity]
3. [Step to restore service]

**7. EXTERNAL INTEGRATION IMPACT**

External Projects Affected: YES / NO

If YES:
**External Project:** [Name]
- Integration point: `file.ext:function()`
- How affected: [specific impact]
- Coordination needed: YES / NO
- Documentation update: [what needs updating]

**8. PERFORMANCE IMPACT ANALYSIS**

**Current Performance:**
- Operation: [what we're measuring]
- Baseline: [current speed/load]
- Bottleneck: [if known]

**Expected Impact:**
- Change: [Better / Worse / Neutral]
- Reasoning: [Why - based on code changes]
- Monitoring: [What to watch]

**If Performance Degradation Expected:**
- Acceptable: YES / NO
- Mitigation: [How to address]
- Alternative approach: [If needed]

**9. SECURITY IMPACT ANALYSIS**

**Authentication/Authorization:**
- Changes needed: YES / NO
- What changes: [describe]
- Security level maintained: YES / NO

**Data Exposure:**
- New data exposed: YES / NO
- What data: [describe]
- Protection: [how it's protected]

**New Attack Surface:**
- Created: YES / NO
- Type: [describe threat]
- Mitigation: [how addressed]

**Input Validation:**
- New inputs: [list]
- Validation: [how validated]
- Sanitization: [how sanitized]

**10. TESTING IMPACT**

**Existing Tests Affected:**
- Test file: `path/to/test.spec.ext`
- Tests that will break: [list]
- Why breaking: [reason]
- Fix needed: [what to update]

**New Tests Required:**
- Unit tests: [what to test]
- Integration tests: [what to test]
- E2E tests: [what to test]
- Edge case tests: [what to test]

**Test Scripts Needed:**
- `verify-bug-[name].py` - IF fixing a bug
- `prove-fix-[name].py` - IF implementing a fix
- `test-[feature].py` - IF new feature
```

═══════════════════════════════════════════════════════════════
STEP 4: RISK ASSESSMENT
═══════════════════════════════════════════════════════════════

```
COMPREHENSIVE RISK ANALYSIS:

**🔴 CRITICAL/HIGH RISKS:**

**Risk 1:** [Describe risk]
- **Category:** [Data Loss / Breaking Change / Performance / Security / Other]
- **Why Dangerous:** [Explanation with code evidence]
  File: `path/to/file.ext`
  ```language
  [code showing risk]
  ```
- **Likelihood:** HIGH / MEDIUM / LOW
- **Impact:** CRITICAL / HIGH / MEDIUM / LOW
- **Mitigation Strategy:**
  1. [Specific action to prevent]
  2. [Specific action to prevent]
- **Rollback Plan:**
  1. [How to undo if risk materializes]
  2. [How to recover]
- **Monitoring:** [How to detect if risk occurs]

**Risk 2:** [Describe risk]
[Same detailed format...]

**🟡 MEDIUM RISKS:**

**Risk 1:** [Describe risk]
[Same format but medium severity...]

**🟢 LOW RISKS:**

**Risk 1:** [Describe risk]
- **Category:** [type]
- **Why:** [brief explanation]
- **Likelihood:** LOW
- **Impact:** LOW
- **Mitigation:** [simple prevention]

**SPECIAL RISKS FOR THIS PROJECT:**

**Database Risk (CRITICAL):**
⚠️ Production database in use
- Risk: [Specific DB risk]
- Prevention: Test all migrations locally first
- Rollback: Have downgrade migration ready

**External Integration Risk:**
- Risk: [Breaking external connections]
- Prevention: [Coordination strategy]
- Fallback: [Alternative if integration breaks]

**OVERALL RISK LEVEL:** 🔴 HIGH / 🟡 MEDIUM / 🟢 LOW

**Risk Acceptance:**
Based on risks identified, this task is:
✅ SAFE TO PROCEED (with mitigations)
⚠️ PROCEED WITH CAUTION (elevated risk)
❌ TOO RISKY (need different approach)
```

═══════════════════════════════════════════════════════════════
STEP 5: DETAILED IMPLEMENTATION PLAN
═══════════════════════════════════════════════════════════════

**🔴 CRITICAL: NO CODE CHANGES UNTIL THIS PLAN IS APPROVED BY USER**

```
═══════════════════════════════════════════════════════════════
IMPLEMENTATION PLAN: TASK-[XXX]
═══════════════════════════════════════════════════════════════

**Generated:** YYYY-MM-DD HH:MM
**Task:** [Brief description]

**APPROACH OVERVIEW:**
[2-3 paragraphs describing the high-level strategy, why this approach was chosen, and what the implementation will achieve]

**WHY THIS APPROACH:**
[Detailed reasoning for chosen approach]
- Advantage 1: [specific benefit]
- Advantage 2: [specific benefit]
- Addresses requirement: [which requirement]
- Mitigates risk: [which risks]

**ALTERNATIVES CONSIDERED:**

**Alternative 1:** [Description]
- **Pros:** [advantages]
- **Cons:** [disadvantages]
- **Why Not Chosen:** [specific reasoning]

**Alternative 2:** [Description]
[Same format...]

**COMPLEXITY ASSESSMENT:**
- **Technical Complexity:** LOW / MEDIUM / HIGH / VERY HIGH
- **Risk Level:** LOW / MEDIUM / HIGH / CRITICAL
- **Testing Complexity:** LOW / MEDIUM / HIGH
- **Time Estimate:** [Conceptual - phases not hours]

**IMPACT SUMMARY:**
- Files to CREATE: [X]
- Files to MODIFY: [Y]
- Files to DELETE: [Z]
- Functions/Methods affected: [A]
- Database tables affected: [B]
- API endpoints affected: [C]
- External integrations affected: [D]

**TOTAL SYSTEM IMPACT:** [X+Y+Z+A+B+C+D] touchpoints

═══════════════════════════════════════════════════════════════
PHASE 0: PRE-IMPLEMENTATION SETUP
═══════════════════════════════════════════════════════════════

**Step 0.1: Update WIP.md with plan**

**File:** `/docs/wip.md`
**Action:** Add task entry

**Content to add:**
```markdown
### WIP-[XXX]: [Task Name]
**Status:** 🟡 PLANNED (Awaiting Approval)
**Priority:** [Critical/High/Medium/Low]
**Started:** YYYY-MM-DD HH:MM
**Last Updated:** YYYY-MM-DD HH:MM

**Objective:** [From task description]

**Implementation Plan:** [X] phases, [Y] total steps
See detailed plan in session [session reference]

**Files Impacted:** [count]
**Risk Level:** [level]
**Testing Strategy:** [brief description]

**Progress:**
- [x] Context verified
- [x] Task analyzed
- [x] Impact assessed
- [x] Risks identified
- [x] Plan created
- [ ] Plan approved
- [ ] Implementation started
```

**Step 0.2: Create /tempDocs session file**

**File:** `/docs/tempDocs/YYYY-MM-DD-task-[XXX]-session.md`
**Action:** Create investigation/session tracking file

**Purpose:** Document progress, findings, issues as we go

───────────────────────────────────────────────────────────────

**Step 0.3: Create test script placeholders (if applicable)**

**If fixing a bug:**
**File:** `/scripts/verify-bug-[name].py`
**Purpose:** Prove bug exists before fixing

**If implementing fix:**
**File:** `/scripts/prove-fix-[name].py`
**Purpose:** Prove fix works with 100% success

═══════════════════════════════════════════════════════════════
PHASE 1: FOUNDATION & TYPES
═══════════════════════════════════════════════════════════════

**Step 1.1: [First foundational step]**

**File:** `path/to/file.ext`
**Action:** CREATE / MODIFY
**Complexity:** LOW / MEDIUM / HIGH

**Current State (if modifying):**
```language
[exact current code - function/section name]
```

**Changes Required:**
```language
[exact new code to add/modify]
```

**Reasoning:**
[Why this change is needed, how it fits into overall plan]

**Dependencies:**
- Requires: [What must exist first]
- Enables: [What this allows]

**Verification:**
- [ ] Code syntax correct
- [ ] Imports resolved
- [ ] Types correct (if TypeScript)
- [ ] No obvious errors

───────────────────────────────────────────────────────────────

**Step 1.2: [Next foundational step]**
[Same detailed format...]

───────────────────────────────────────────────────────────────

[Continue for all foundation steps...]

═══════════════════════════════════════════════════════════════
PHASE 2: DATABASE CHANGES (if applicable)
═══════════════════════════════════════════════════════════════

⚠️ **CRITICAL: Production database in use - EXTREME CAUTION**

**Step 2.1: Create Alembic migration (LOCAL TESTING ONLY)**

**File:** `alembic/versions/XXXX_[description].py`
**Action:** CREATE

**Migration Code:**
```python
"""[Description of migration]

Revision ID: [auto-generated]
Revises: [previous revision]
Create Date: YYYY-MM-DD HH:MM

"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # [Detailed upgrade code]
    # Add comments explaining each change
    pass

def downgrade():
    # [Detailed downgrade code]
    # Critical for rollback
    pass
```

**Testing Strategy:**
1. Test on local database copy FIRST
2. Verify schema changes correct
3. Verify data integrity preserved
4. Test rollback (downgrade) works
5. Document any issues found

**Verification Checklist:**
- [ ] Migration runs without errors locally
- [ ] Schema matches expected state
- [ ] No data loss
- [ ] Indexes created correctly
- [ ] Constraints work as expected
- [ ] Downgrade successfully rolls back
- [ ] Application works with new schema

**Risk Mitigation:**
- Backup strategy: [How to backup before migration]
- Rollback verified: [Tested downgrade()]
- Data validation: [How to verify data integrity]

───────────────────────────────────────────────────────────────

**Step 2.2: Update database models**

**File:** `path/to/models.py`
**Current Model:**
```python
[current model code]
```

**Updated Model:**
```python
[new model code with changes]
```

**Changes:**
- Added fields: [list]
- Modified fields: [list]
- Relationships: [any changes]

**Affects:**
- Queries in: [`file1.py`, `file2.py`]
- Serializers in: [`file3.py`]
- Will need updates: [list affected code]

═══════════════════════════════════════════════════════════════
PHASE 3: BACKEND IMPLEMENTATION
═══════════════════════════════════════════════════════════════

**Step 3.1: [Backend change 1]**

**File:** `path/to/backend-file.py`
**Function:** `functionName()`
**Complexity:** LOW / MEDIUM / HIGH

**Current Code:**
```python
[citation - function name / line range]
```

**Required Changes:**

**Change A: [Specific modification]**
```python
[exact new code]
```
**Why:** [reasoning]
**Affects:** [what depends on this]

**Change B: [Specific modification]**
[Same format...]

**Error Handling Added:**
```python
try:
    # [operation]
except SpecificException as e:
    # [handling]
    logger.error(f"[context]: {str(e)}")
    raise CustomException("[message]")
```

**Edge Cases Handled:**
1. [Edge case 1] - [How handled in code]
2. [Edge case 2] - [How handled in code]

**Verification:**
- [ ] Logic correct
- [ ] Error handling comprehensive
- [ ] Edge cases covered
- [ ] Performance acceptable
- [ ] Security maintained

───────────────────────────────────────────────────────────────

**Step 3.2: [API endpoint changes]**

**File:** `path/to/routes.py`
**Endpoint:** `POST /api/endpoint`

**Current Signature:**
```python
@router.post("/endpoint")
async def endpoint_name(
    param1: Type1,
    param2: Type2
) -> ResponseType:
    # [current implementation]
```

**New Signature:**
```python
@router.post("/endpoint")
async def endpoint_name(
    param1: Type1,
    param2: Type2,
    new_param: NewType  # ADDED
) -> NewResponseType:  # MODIFIED
    # [new implementation]
```

**Breaking Change:** YES / NO
**If YES:** 
- Migration path: [how clients migrate]
- Versioning: [API version strategy]
- Deprecation: [timeline and communication]

**Request Validation:**
```python
# [validation code]
```

**Response Format:**
```python
# [response structure]
```

───────────────────────────────────────────────────────────────

[Continue for all backend steps...]

═══════════════════════════════════════════════════════════════
PHASE 4: FRONTEND IMPLEMENTATION
═══════════════════════════════════════════════════════════════

**Step 4.1: [Frontend change 1]**

**File:** `path/to/component.tsx`
**Component:** `ComponentName`
**Complexity:** LOW / MEDIUM / HIGH

**Current Code:**
```typescript
[citation - component structure]
```

**Required Changes:**

**UI Changes:**
- Add: [New UI elements]
- Modify: [Changed UI elements]
- Remove: [Deprecated UI elements]

**State Changes:**
```typescript
// Current state
const [state, setState] = useState<CurrentType>(initial);

// New state
const [state, setState] = useState<NewType>(newInitial);
const [newState, setNewState] = useState<Type>(initial);  // ADDED
```

**API Integration:**
```typescript
// New API call
const { data, error, isLoading } = useQuery({
  queryKey: ['key'],
  queryFn: async () => {
    const response = await api.endpoint(params);
    return response.data;
  }
});
```

**User Interaction Flow:**
1. User [action]
2. Component [response]
3. API [call]
4. UI [update]
5. Edge case: [handling]

**Responsive Design:**
- Desktop: [behavior]
- Tablet: [behavior]
- Mobile: [behavior]

**Accessibility:**
- ARIA labels: [added]
- Keyboard navigation: [supported]
- Screen reader: [considered]

───────────────────────────────────────────────────────────────

**Step 4.2: [State management changes]**

**File:** `path/to/store.ts`

**Current State Structure:**
```typescript
[current state]
```

**New State Structure:**
```typescript
[new state]
```

**Actions/Reducers:**
```typescript
// New action
const newAction = (payload: Type) => {
  // [implementation]
};
```

**Components Affected:**
1. `Component1` - Uses `state.field` - [needs update]
2. `Component2` - Uses `state.field` - [needs update]

───────────────────────────────────────────────────────────────

[Continue for all frontend steps...]

═══════════════════════════════════════════════════════════════
PHASE 5: INTEGRATION & WIRING
═══════════════════════════════════════════════════════════════

**Step 5.1: Connect backend and frontend**

**Integration Point 1: [Description]**

**Backend:** `path/to/backend.py:function()`
**Frontend:** `path/to/frontend.tsx:Component`

**Connection Code (Frontend):**
```typescript
[API call code connecting to backend]
```

**Data Flow:**
1. Frontend triggers: [action]
2. API called: [endpoint]
3. Backend processes: [function]
4. Response returned: [data structure]
5. Frontend updates: [UI change]

**Error Handling:**
```typescript
// [error handling code]
```

───────────────────────────────────────────────────────────────

**Step 5.2: [Additional integration points]**
[Same format...]

═══════════════════════════════════════════════════════════════
PHASE 6: EDGE CASE HANDLING
═══════════════════════════════════════════════════════════════

**Step 6.1: Handle edge case: [Description]**

**Scenario:** [Describe edge case condition]

**Current Behavior:**
```language
[code showing what happens now]
```
**Problem:** [Why this is wrong/insufficient]

**New Behavior:**
```language
[code showing new handling]
```
**Why Better:** [Explanation]

**Testing:**
- Test input: [specific input that triggers edge case]
- Expected output: [what should happen]
- Verification: [how to confirm it works]

───────────────────────────────────────────────────────────────

[Repeat for all edge cases...]

═══════════════════════════════════════════════════════════════
PHASE 7: ERROR HANDLING & RESILIENCE
═══════════════════════════════════════════════════════════════

**Step 7.1: Add comprehensive error handling**

**Location 1:** `path/to/file.ext:function()`

**Errors to Catch:**
1. **Error Type:** `ExceptionName`
   **When:** [When this occurs]
   **Handling:**
   ```language
   try:
       # [operation]
   except ExceptionName as e:
       logger.error(f"[Context]: {str(e)}")
       # [specific handling]
       raise CustomError("[User-friendly message]")
   ```

2. **Error Type:** [Another error]
   [Same format...]

**Fallback Behavior:**
- If [error condition]: [What system does]
- User sees: [What user experiences]
- Logging: [What gets logged]

───────────────────────────────────────────────────────────────

**Step 7.2: Add retry logic (if applicable)**
```language
[retry implementation code]
```

───────────────────────────────────────────────────────────────

**Step 7.3: Add graceful degradation (if applicable)**
[How system continues with reduced functionality]

═══════════════════════════════════════════════════════════════
PHASE 8: TESTING IMPLEMENTATION
═══════════════════════════════════════════════════════════════

**Step 8.1: Create/Update unit tests**

**Test File:** `path/to/test-file.spec.ext`

**Test 1: [Test name]**
```language
describe('[Component/Function]', () => {
  it('should [behavior]', () => {
    // Arrange
    const input = [test input];
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe([expected]);
  });
});
```

**Test 2: [Edge case test]**
```language
it('should handle [edge case]', () => {
  // [test code]
});
```

**Test Coverage Goal:**
- Happy path: ✅
- Edge cases: ✅
- Error conditions: ✅
- Boundary conditions: ✅

───────────────────────────────────────────────────────────────

**Step 8.2: Create integration test script**

**File:** `/scripts/test-[feature].py`

**Purpose:** End-to-end test of feature

**Test Script:**
```python
"""
Integration test for [feature]
Tests the complete flow from [start] to [end]
"""

def test_happy_path():
    """Test normal operation"""
    # [test code]
    assert result == expected, "Happy path failed"
    
def test_edge_case_1():
    """Test [edge case]"""
    # [test code]
    assert result == expected, "Edge case 1 failed"

def test_error_handling():
    """Test error conditions"""
    # [test code]
    assert error_handled, "Error handling failed"

if __name__ == "__main__":
    print("Running integration tests...")
    test_happy_path()
    test_edge_case_1()
    test_error_handling()
    print("✅ All integration tests passed")
```

───────────────────────────────────────────────────────────────

**Step 8.3: Bug verification script (if fixing bug)**

**File:** `/scripts/verify-bug-[name].py`

**Purpose:** PROVE the bug exists before fixing

```python
"""
Verify bug: [description]
This script reproduces the bug 100% of the time
Expected: [What should happen]
Actual: [What actually happens - the bug]
"""

def reproduce_bug():
    # [Steps to reproduce]
    result = trigger_bug_condition()
    
    # This should fail (proving bug exists)
    assert result == expected, "BUG NOT FOUND (unexpected!)"
    
    # If we get here, bug is NOT reproduced
    # This should fail initially
    print("❌ BUG REPRODUCED - needs fix")
    return True

if __name__ == "__main__":
    bug_exists = reproduce_bug()
    if bug_exists:
        print("✅ Bug verification successful")
        print("Proceed with fix implementation")
```

───────────────────────────────────────────────────────────────

**Step 8.4: Fix verification script (if implementing fix)**

**File:** `/scripts/prove-fix-[name].py`

**Purpose:** PROVE the fix works 100%

```python
"""
Prove fix: [description]
This script verifies the fix resolves the bug completely
Tests:
1. Bug no longer occurs
2. Normal operation works
3. Edge cases handled
"""

def test_bug_fixed():
    """Test that bug no longer occurs"""
    result = previously_buggy_operation()
    assert result == expected, "Bug still exists!"
    print("✅ Test 1 PASS: Bug is fixed")

def test_normal_operation():
    """Test normal use case"""
    result = normal_operation()
    assert result == expected, "Normal operation broken!"
    print("✅ Test 2 PASS: Normal operation works")

def test_edge_cases():
    """Test edge cases"""
    result = edge_case_operation()
    assert result == expected, "Edge case not handled!"
    print("✅ Test 3 PASS: Edge cases handled")

if __name__ == "__main__":
    print("Testing fix...")
    test_bug_fixed()
    test_normal_operation()
    test_edge_cases()
    print("\n✅ 100% SUCCESS - FIX VERIFIED")
    print("Safe to proceed with deployment")
```

═══════════════════════════════════════════════════════════════
PHASE 9: DOCUMENTATION & CLEANUP
═══════════════════════════════════════════════════════════════

**Step 9.1: Update /docs/overview.md**

**Section to Update:** [Section name in overview.md]
**Date/Time:** YYYY-MM-DD HH:MM

**Content to Add:**
```markdown
### [Feature/Component Name]
**Location:** `path/to/main/file.ext`
**Purpose:** [What this does]
**Last Updated:** YYYY-MM-DD HH:MM

**Overview:**
[Description of feature/change]

**Key Files:**
- `file1.ext` - [Purpose]
- `file2.ext` - [Purpose]

**How It Works:**
[Technical explanation with code references]

**API Endpoints (if applicable):**
- `POST /api/endpoint` - [Purpose]
  - Request: [structure]
  - Response: [structure]

**Database Schema (if applicable):**
[Relevant schema information]

**Integration Points:**
- Connects to: [Other components]
- Used by: [Other components]

**Edge Cases Handled:**
1. [Edge case] - [How handled]
2. [Edge case] - [How handled]
```

───────────────────────────────────────────────────────────────

**Step 9.2: Update /docs/wip.md**

**Action:** Mark WIP-[XXX] as COMPLETE
**Move details to overview.md:** ✅

**Updated Entry:**
```markdown
### WIP-[XXX]: [Task Name]
**Status:** ✅ COMPLETE
**Completed:** YYYY-MM-DD HH:MM
**Duration:** [Conceptual phases completed]

**Result:** Successfully implemented [description]

**Final State:**
- Files created: [X]
- Files modified: [Y]
- Tests added: [Z]
- All success criteria met: ✅

**Moved to:** `/docs/overview.md` section [section name]
```

───────────────────────────────────────────────────────────────

**Step 9.3: Update /docs/bugs-and-fixes.md (if fixing bug)**

**Date/Time:** YYYY-MM-DD HH:MM

**Entry to Add:**
```markdown
### BUG-[XXX]: [Bug Name]
**Status:** ✅ FIXED
**Severity:** [Critical/High/Medium/Low]
**Discovered:** YYYY-MM-DD
**Fixed:** YYYY-MM-DD HH:MM

**Symptom:**
[What the bug looked like to users]

**Root Cause:**
[Technical explanation with code citation]
File: `path/to/file.ext` - function name
```language
[problematic code]
```

**Why It Happened:**
[Underlying reason - assumption, edge case, etc.]

**Fix Applied:**
File: `path/to/file.ext` - function name
```language
[fixed code]
```

**Why This Works:**
[Explanation of solution]

**Test Scripts:**
- Verification: `/scripts/verify-bug-[name].py` - ✅ Reproduced bug
- Proof: `/scripts/prove-fix-[name].py` - ✅ 100% success

**Lesson Learned:**
[What we learned from this - CRITICAL]
- [Specific lesson 1]
- [Specific lesson 2]
- [Pattern to follow in future]

**Prevention Strategy:**
[How to avoid this type of bug in future]
```

───────────────────────────────────────────────────────────────

**Step 9.4: Update external integration docs (if applicable)**

**File:** `/docs/projects-for-context-only/connection-overview.md`
**Date/Time:** YYYY-MM-DD HH:MM

**Updates:**
[If any integration points changed]

───────────────────────────────────────────────────────────────

**Step 9.5: Clean up /tempDocs**

**Action:** Summarize and clean

**Keep:**
- Key findings summary
- Important decisions made
- Lessons learned

**Remove:**
- Detailed investigation notes (move relevant parts to official docs)
- Temporary analysis files
- Duplicate information

**Final /tempDocs state:**
- `/docs/tempDocs/YYYY-MM-DD-task-[XXX]-summary.md` (keep)
- All other task-specific files (remove)

═══════════════════════════════════════════════════════════════
ROLLBACK PLAN (If Something Goes Wrong)
═══════════════════════════════════════════════════════════════

**If implementation fails or causes problems:**

**Step 1: Stop immediately**
- Don't make more changes
- Document what went wrong

**Step 2: Revert changes in reverse order**

**File:** `last-file-modified.ext`
**Revert to:**
```language
[original code before changes]
```

**File:** `second-to-last-modified.ext`
[Continue in reverse order...]

**Step 3: Database rollback (if applicable)**
```bash
# Run downgrade migration
alembic downgrade -1
```

**Verify:**
- Schema reverted: ✅ / ❌
- Data intact: ✅ / ❌
- Application functional: ✅ / ❌

**Step 4: Clear cache/state (if applicable)**
- Clear browser cache
- Reset application state
- Restart services

**Step 5: Verify system works as before**
- Test critical paths
- Verify no data loss
- Confirm user experience normal

**Step 6: Document failure**
Add to `/docs/bugs-and-fixes.md`:
- What was attempted
- What went wrong
- Why it failed
- What was learned
- Different approach needed

═══════════════════════════════════════════════════════════════
PLAN CONFIDENCE & RISK ASSESSMENT
═══════════════════════════════════════════════════════════════

**CONFIDENCE LEVEL:** HIGH / MEDIUM / LOW

**Reasoning:**
[Why confident or what uncertainties exist]
- Certainty about: [aspects you're sure about]
- Uncertainty about: [aspects that need validation]
- Assumptions made: [any assumptions]

**Risk Level:** 🔴 HIGH / 🟡 MEDIUM / 🟢 LOW

**Critical Risks:**
[Any risks that could cause serious problems]

**Mitigation Effectiveness:**
[How well risks are mitigated]

**Recommendation:**
✅ SAFE TO PROCEED
⚠️ PROCEED WITH CAUTION
❌ TOO RISKY - NEED DIFFERENT APPROACH

═══════════════════════════════════════════════════════════════
IMPLEMENTATION SUMMARY
═══════════════════════════════════════════════════════════════

**Total Phases:** [X]
**Total Steps:** [Y]

**Files Impact:**
- CREATE: [X] files
- MODIFY: [Y] files
- DELETE: [Z] files

**Testing:**
- Unit tests: [count]
- Integration tests: [count]
- Test scripts: [count]

**Documentation:**
- overview.md: [sections to update]
- wip.md: [entry to add/update]
- bugs-and-fixes.md: [if applicable]
- External docs: [if applicable]

**Estimated Complexity:** LOW / MEDIUM / HIGH / VERY HIGH

═══════════════════════════════════════════════════════════════
END OF IMPLEMENTATION PLAN
═══════════════════════════════════════════════════════════════
```

═══════════════════════════════════════════════════════════════
STEP 6: PRESENT PLAN & REQUEST APPROVAL
═══════════════════════════════════════════════════════════════

**🔴 MANDATORY: STOP HERE AND WAIT FOR APPROVAL 🔴**

Present to user:

```
═══════════════════════════════════════════════════════════════
🔴 IMPLEMENTATION PLAN READY: TASK-[XXX] 🔴
═══════════════════════════════════════════════════════════════

**Task:** [Brief description]

**PLAN SUMMARY:**

**Complexity:** [LOW / MEDIUM / HIGH / VERY HIGH]
**Risk Level:** [LOW / MEDIUM / HIGH]
**Confidence:** [HIGH / MEDIUM / LOW]

**Implementation Breakdown:**
- **Phases:** [X] major phases
- **Steps:** [Y] detailed steps
- **Files Impacted:** [Z] files total
  - Create: [A] files
  - Modify: [B] files
  - Delete: [C] files

**Approach:**
[One paragraph high-level summary of approach]

**Key Changes:**
1. **[Primary change]** - `file1.ext`
   - [Brief description]
   
2. **[Secondary change]** - `file2.ext`
   - [Brief description]

3. **[Additional changes...]**

**Special Considerations:**
- Database migration: [YES / NO]
  - If YES: Will test locally first ✅
  - Production DB safe: [explanation]
- External integrations: [affected / not affected]
- Breaking changes: [YES / NO]
  - If YES: [migration path described]
- Edge cases: [X] identified and handled

**Testing Strategy:**
- Unit tests: [description]
- Integration tests: [description]
- Test scripts: [X] scripts to create
  - Bug verification: [if applicable]
  - Fix proof: [if applicable]
  - Feature testing: [description]

**Risk Assessment:**
- 🔴 Critical risks: [count] - [all mitigated]
- 🟡 Medium risks: [count] - [all addressed]
- 🟢 Low risks: [count] - [monitored]

**Rollback Plan:** ✅ Comprehensive rollback plan created

**Documentation Plan:**
- Update overview.md: ✅
- Update wip.md: ✅
- Update bugs-and-fixes.md: [if applicable]
- Update external docs: [if applicable]

═══════════════════════════════════════════════════════════════

**I HAVE COMPLETED:**
✅ Pre-task context check
✅ Deep task analysis
✅ Comprehensive impact analysis
✅ Risk assessment
✅ Detailed implementation plan (see above)
✅ Testing strategy
✅ Documentation plan
✅ Rollback plan

**THE COMPLETE DETAILED PLAN IS ABOVE WITH:**
- Step-by-step instructions
- Code citations for all changes
- Before/after code examples
- Reasoning for each change
- Impact analysis
- Risk mitigation
- Testing procedures

═══════════════════════════════════════════════════════════════
🔴 I WILL NOT MAKE ANY CODE CHANGES UNTIL YOU APPROVE 🔴
═══════════════════════════════════════════════════════════════

**PLEASE REVIEW THE PLAN ABOVE AND CHOOSE:**

**A) APPROVE** ✅
   - Proceed with implementation exactly as planned
   - I will execute step-by-step
   - I will provide progress updates
   - I will test thoroughly
   - I will document everything

**B) REQUEST MODIFICATIONS** 🔄
   - Specify what to change in the plan
   - I will revise and re-present
   - [Please explain what needs changing]

**C) CLARIFY** ❓
   - Ask questions about any part of the plan
   - I will provide detailed explanations
   - [Please specify what needs clarification]

**D) REJECT** ❌
   - Choose a completely different approach
   - I will create alternative plan
   - [Please specify direction for alternative]

**E) PAUSE** ⏸️
   - Need more time to review
   - Need to consult other resources
   - Will return to approve later

═══════════════════════════════════════════════════════════════

**WHAT IS YOUR DECISION?** [A / B / C / D / E]

[Please respond with letter and any additional notes]

═══════════════════════════════════════════════════════════════
```

**⏸️ PAUSE EXECUTION - AWAIT USER RESPONSE ⏸️**

═══════════════════════════════════════════════════════════════
STEP 7: EXECUTE IMPLEMENTATION (Only After Approval)
═══════════════════════════════════════════════════════════════

**⚠️ DO NOT PROCEED TO THIS STEP UNTIL USER APPROVES PLAN ⚠️**

**Once approved, execute the plan exactly as written.**

**Execution Protocol:**

```
═══════════════════════════════════════════════════════════════
EXECUTION LOG: TASK-[XXX]
═══════════════════════════════════════════════════════════════

**Started:** YYYY-MM-DD HH:MM
**Plan Approved By:** User
**Executing:** [X] phases, [Y] steps

═══════════════════════════════════════════════════════════════
PHASE 0: PRE-IMPLEMENTATION SETUP
═══════════════════════════════════════════════════════════════

**Step 0.1: Update WIP.md**
⏳ IN PROGRESS...

**Action:** Updated `/docs/wip.md` with task entry
**Status:** ✅ COMPLETE
**Time:** YYYY-MM-DD HH:MM

───────────────────────────────────────────────────────────────

**Step 0.2: Create /tempDocs session file**
⏳ IN PROGRESS...

**Created:** `/docs/tempDocs/YYYY-MM-DD-task-[XXX]-session.md`
**Purpose:** Track progress and findings
**Status:** ✅ COMPLETE
**Time:** YYYY-MM-DD HH:MM

───────────────────────────────────────────────────────────────

[Continue logging EVERY step...]

═══════════════════════════════════════════════════════════════
PHASE 1: FOUNDATION & TYPES
═══════════════════════════════════════════════════════════════

**Step 1.1: [Description from plan]**
⏳ IN PROGRESS...

**File Modified:** `path/to/file.ext`

**Code Added/Modified:**
```language
[exact code change made]
```

**Reasoning:** [why this works]

**Verification:**
✅ Code syntax correct
✅ Imports resolved
✅ No obvious errors
✅ Follows project conventions

**Status:** ✅ COMPLETE
**Time:** YYYY-MM-DD HH:MM

**WIP.md Updated:** ✅ (marked step 1.1 complete)

───────────────────────────────────────────────────────────────

**Step 1.2: [Next step...]**
[Same detailed logging...]

═══════════════════════════════════════════════════════════════
```

**After EACH step:**
1. Log what was done
2. Show the code change
3. Explain why it works
4. Verify step completed
5. Update WIP.md
6. Move to next step

**After EACH phase:**
```
**PROGRESS UPDATE:**

Phase [X] of [Y] completed: [Phase Name]

**Summary:**
- Steps completed: [count]
- Files modified: [list]
- Issues encountered: [none / description]
- Status: ✅ ON TRACK / ⚠️ MINOR ISSUES / 🔴 BLOCKED

**Next:** Starting Phase [X+1]: [Phase Name]

**Current WIP.md Status:**
- [x] Phase 1 - COMPLETE
- [x] Phase 2 - COMPLETE
- [ ] Phase 3 - STARTING
- [ ] Phase 4 - PENDING
```

═══════════════════════════════════════════════════════════════
STEP 8: COMPREHENSIVE TESTING
═══════════════════════════════════════════════════════════════

**After implementation complete, test THOROUGHLY.**

```
═══════════════════════════════════════════════════════════════
TESTING PHASE: TASK-[XXX]
═══════════════════════════════════════════════════════════════

**Started:** YYYY-MM-DD HH:MM

**Testing Strategy:**
1. Unit tests
2. Integration tests
3. Manual verification
4. Edge case testing
5. Regression testing
6. Performance testing (if applicable)
7. Security testing (if applicable)

═══════════════════════════════════════════════════════════════
TEST 1: UNIT TESTS
═══════════════════════════════════════════════════════════════

**Test File:** `path/to/test.spec.ext`

**Tests Run:**
- ✅ Test 1: [description] - PASS
- ✅ Test 2: [description] - PASS
- ✅ Test 3: [edge case] - PASS
- ❌ Test 4: [description] - FAIL
  - **Issue:** [what failed]
  - **Fix Applied:** [how fixed]
  - **Retest:** ✅ PASS

**Total:** [X] tests, [Y] passed, [Z] fixed

**Unit Test Status:** ✅ ALL PASS

═══════════════════════════════════════════════════════════════
TEST 2: INTEGRATION TESTS
═══════════════════════════════════════════════════════════════

**Test Script:** `/scripts/test-[feature].py`

**Scenario 1: Happy Path**
- **Steps:**
  1. [Action performed]
  2. [System response]
  3. [Verification]
  
- **Expected:** [what should happen]
- **Actual:** [what actually happened]
- **Result:** ✅ PASS

**Scenario 2: [Edge Case]**
[Same format...]

**Scenario 3: [Error Condition]**
[Same format...]

**Integration Test Status:** ✅ ALL PASS

═══════════════════════════════════════════════════════════════
TEST 3: BUG VERIFICATION (if fixing bug)
═══════════════════════════════════════════════════════════════

**Test Script:** `/scripts/verify-bug-[name].py`

**Purpose:** Prove bug existed before fix

**Result:**
```
Running bug verification...
❌ BUG REPRODUCED
Bug confirmed to exist before fix
```

**Status:** ✅ Bug successfully reproduced (as expected)

═══════════════════════════════════════════════════════════════
TEST 4: FIX VERIFICATION (if implementing fix)
═══════════════════════════════════════════════════════════════

**Test Script:** `/scripts/prove-fix-[name].py`

**Purpose:** Prove fix works 100%

**Tests:**
1. Bug no longer occurs: ✅ PASS
2. Normal operation works: ✅ PASS
3. Edge cases handled: ✅ PASS

**Result:**
```
Testing fix...
✅ Test 1 PASS: Bug is fixed
✅ Test 2 PASS: Normal operation works
✅ Test 3 PASS: Edge cases handled

✅ 100% SUCCESS - FIX VERIFIED
Safe to proceed with deployment
```

**Status:** ✅ 100% SUCCESS - FIX VERIFIED

═══════════════════════════════════════════════════════════════
TEST 5: MANUAL VERIFICATION
═══════════════════════════════════════════════════════════════

**User Workflow Testing:**

**Workflow 1: [Description]**
Steps:
1. [User action] - ✅ Works as expected
2. [System response] - ✅ Correct response
3. [UI update] - ✅ Updates correctly
4. [Data persistence] - ✅ Data saved correctly

**Result:** ✅ PASS

**Workflow 2: [Edge Case Workflow]**
[Same format...]

**Manual Verification Status:** ✅ ALL PASS

═══════════════════════════════════════════════════════════════
TEST 6: EDGE CASE TESTING
═══════════════════════════════════════════════════════════════

**Edge Case 1:** [Description]
- **Test Input:** [specific input]
- **Expected:** [what should happen]
- **Actual:** [what happened]
- **Handled Correctly:** ✅ YES
- **Code Handling:**
  File: `path/to/file.ext` - function name
  ```language
  [code that handles this case]
  ```

**Edge Case 2:** [Description]
[Same format...]

**Edge Case Testing Status:** ✅ ALL HANDLED

═══════════════════════════════════════════════════════════════
TEST 7: REGRESSION TESTING
═══════════════════════════════════════════════════════════════

**Existing Features Verified:**
- ✅ Feature 1 still works
- ✅ Feature 2 still works
- ✅ Feature 3 still works

**No unintended side effects detected**

**Regression Status:** ✅ NO REGRESSIONS

═══════════════════════════════════════════════════════════════
TEST 8: PERFORMANCE TESTING (if applicable)
═══════════════════════════════════════════════════════════════

**Baseline Performance:**
- Operation: [what measured]
- Before: [measurement]

**Current Performance:**
- After: [measurement]
- Change: [better / worse / same]
- Acceptable: ✅ YES

**Performance Status:** ✅ ACCEPTABLE

═══════════════════════════════════════════════════════════════
TEST 9: SECURITY TESTING (if applicable)
═══════════════════════════════════════════════════════════════

**Security Checks:**
- ✅ Authentication required
- ✅ Authorization enforced
- ✅ Input validated
- ✅ Output sanitized
- ✅ No new vulnerabilities introduced

**Security Status:** ✅ SECURE

═══════════════════════════════════════════════════════════════
TESTING SUMMARY
═══════════════════════════════════════════════════════════════

**Overall Status:** ✅ ALL TESTS PASSED

**Test Coverage:**
- Unit tests: [X] passed
- Integration tests: [Y] scenarios verified
- Manual tests: [Z] workflows tested
- Edge cases: [A] handled correctly
- Regressions: [B] checked, none found
- Bug verification: ✅ (if applicable)
- Fix verification: ✅ 100% success (if applicable)

**Success Criteria Met:**
- ✅ [Criterion 1 from task description]
- ✅ [Criterion 2 from task description]
- ✅ [Criterion 3 from task description]

**Ready for:** ✅ DEPLOYMENT / NEXT PHASE

═══════════════════════════════════════════════════════════════
```

**If any test fails:**

```
TEST FAILURE ANALYSIS:

**Test:** [Which test failed]
**What Failed:** [Description]

**Expected Behavior:**
[What should have happened]

**Actual Behavior:**
[What actually happened]

**Root Cause:**
[Why it failed - with code citation]
File: `path/to/file.ext`
```language
[problematic code]
```

**Fix Applied:**
```language
[corrected code]
```

**Why This Fix Works:**
[Explanation]

**Retest Result:** ✅ PASS / ❌ STILL FAILING

**If still failing:** [Next debugging step]

**Documented in:** `/docs/bugs-and-fixes.md` ✅
```

═══════════════════════════════════════════════════════════════
STEP 9: DOCUMENTATION UPDATES
═══════════════════════════════════════════════════════════════

**Update ALL relevant documentation with date/time stamps.**

```
═══════════════════════════════════════════════════════════════
DOCUMENTATION UPDATES: TASK-[XXX]
═══════════════════════════════════════════════════════════════

**Update Time:** YYYY-MM-DD HH:MM

═══════════════════════════════════════════════════════════════
UPDATE 1: /docs/overview.md
═══════════════════════════════════════════════════════════════

**Section Updated:** [Section name]
**Date/Time Added to Doc:** YYYY-MM-DD HH:MM

**Content Added:**

[Show the actual markdown content added to overview.md]

**Summary:** Added complete documentation of [feature] including:
- Overview and purpose
- Key files and their roles
- How it works technically
- API endpoints (if applicable)
- Integration points
- Edge cases handled

**Status:** ✅ COMPLETE

═══════════════════════════════════════════════════════════════
UPDATE 2: /docs/wip.md
═══════════════════════════════════════════════════════════════

**Action:** Marked WIP-[XXX] as COMPLETE
**Date/Time:** YYYY-MM-DD HH:MM

**Final WIP Entry:**
```markdown
### WIP-[XXX]: [Task Name]
**Status:** ✅ COMPLETE
**Completed:** YYYY-MM-DD HH:MM
**Duration:** [X] phases completed

**Result:** Successfully implemented [description]

**All success criteria met:** ✅

**Moved to:** `/docs/overview.md` - [section name]
```

**Status:** ✅ COMPLETE

═══════════════════════════════════════════════════════════════
UPDATE 3: /docs/bugs-and-fixes.md (if fixing bug)
═══════════════════════════════════════════════════════════════

**Date/Time:** YYYY-MM-DD HH:MM

**Entry Added:**

[Show the actual markdown content added to bugs-and-fixes.md]

**Summary:** Documented bug fix including:
- Complete symptom description
- Root cause with code citations
- Fix applied with code citations
- Test verification (verify-bug + prove-fix scripts)
- Lessons learned
- Prevention strategy

**Status:** ✅ COMPLETE

═══════════════════════════════════════════════════════════════
UPDATE 4: External Integration Docs (if applicable)
═══════════════════════════════════════════════════════════════

**File:** `/docs/projects-for-context-only/connection-overview.md`
**Date/Time:** YYYY-MM-DD HH:MM

**Changes:** [What was updated]

**Status:** ✅ COMPLETE / N/A

═══════════════════════════════════════════════════════════════
UPDATE 5: /tempDocs Cleanup
═══════════════════════════════════════════════════════════════

**Action:** Summarized and cleaned

**Kept:**
- `/docs/tempDocs/YYYY-MM-DD-task-[XXX]-summary.md`
  - Contains: Key findings, decisions, lessons learned

**Removed:**
- `/docs/tempDocs/YYYY-MM-DD-task-[XXX]-session.md` (detailed notes)
- [Other temporary files]

**Summary File Content:**
[Brief excerpt of what's in the summary file for next session]

**Status:** ✅ COMPLETE

═══════════════════════════════════════════════════════════════
DOCUMENTATION UPDATE SUMMARY
═══════════════════════════════════════════════════════════════

**Files Updated:** [count]
- ✅ overview.md
- ✅ wip.md
- ✅ bugs-and-fixes.md (if applicable)
- ✅ External docs (if applicable)
- ✅ tempDocs cleaned

**All documentation current:** ✅
**Future agents have full context:** ✅

═══════════════════════════════════════════════════════════════
```

═══════════════════════════════════════════════════════════════
STEP 10: FINAL COMPLETION REPORT
═══════════════════════════════════════════════════════════════

```
═══════════════════════════════════════════════════════════════
🎉 TASK COMPLETION REPORT: TASK-[XXX] 🎉
═══════════════════════════════════════════════════════════════

**Completed:** YYYY-MM-DD HH:MM
**Task Type:** [Type]
**Status:** ✅ COMPLETE

═══════════════════════════════════════════════════════════════
EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════════════

**Task:** [One-line description]

**Goal:** [What we aimed to achieve]

**Result:** [What was delivered]

**Success Criteria:**
- ✅ [Criterion 1] - Met
- ✅ [Criterion 2] - Met
- ✅ [Criterion 3] - Met

**All success criteria: ✅ ACHIEVED**

═══════════════════════════════════════════════════════════════
IMPLEMENTATION SUMMARY
═══════════════════════════════════════════════════════════════

**Approach Used:**
[Brief description of approach taken and why]

**Phases Completed:** [X] of [X]
**Steps Executed:** [Y] of [Y]
**Success Rate:** 100%

**Files Changed:**

**Created:** [X] files
- `new-file-1.ext` - [Purpose]
- `new-file-2.ext` - [Purpose]

**Modified:** [Y] files
- `modified-file-1.ext` - [What changed]
  - Before: [brief description]
  - After: [brief description]
- `modified-file-2.ext` - [What changed]

**Deleted:** [Z] files
- [If any]

**Total Impact:** [X+Y+Z] files touched

═══════════════════════════════════════════════════════════════
KEY CODE CHANGES
═══════════════════════════════════════════════════════════════

**Change 1: [Primary change description]**

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
**Benefit:** [What this enables]

───────────────────────────────────────────────────────────────

**Change 2: [Secondary change description]**
[Same format...]

───────────────────────────────────────────────────────────────

**Change 3: [Additional change]**
[Same format...]

═══════════════════════════════════════════════════════════════
TESTING RESULTS
═══════════════════════════════════════════════════════════════

**Overall:** ✅ ALL TESTS PASSED

**Test Coverage:**
- **Unit Tests:** [X] tests - ✅ ALL PASS
- **Integration Tests:** [Y] scenarios - ✅ ALL PASS
- **Manual Tests:** [Z] workflows - ✅ ALL PASS
- **Edge Cases:** [A] cases - ✅ ALL HANDLED
- **Regression:** [B] features - ✅ NO REGRESSIONS

**Special Testing:**
- Bug Verification: ✅ (if applicable)
  - Script: `/scripts/verify-bug-[name].py`
  - Result: Bug successfully reproduced before fix
  
- Fix Verification: ✅ 100% SUCCESS (if applicable)
  - Script: `/scripts/prove-fix-[name].py`
  - Result: All tests passed, fix verified

**Performance:** [Better / Same / Acceptable]
**Security:** ✅ No vulnerabilities introduced

═══════════════════════════════════════════════════════════════
CHALLENGES & LEARNINGS
═══════════════════════════════════════════════════════════════

**Challenges Encountered:**

**Challenge 1:** [What was difficult]
- **Issue:** [Description]
- **Why Challenging:** [Explanation]
- **Solution:** [How it was solved]
- **Code:**
  File: `path/to/file.ext`
  ```language
  [code showing solution]
  ```
- **Lesson:** [What was learned]

**Challenge 2:** [If any others]
[Same format...]

**Key Learnings About This Codebase:**
1. **[Learning 1]:** [Specific insight about how this codebase works]
   - Impact: [How this changes understanding]
   - Future Application: [When to use this knowledge]

2. **[Learning 2]:** [Specific pattern or antipattern discovered]
   - Why Important: [Explanation]
   - Future Application: [When to apply]

3. **[Learning 3]:** [Edge case or consideration for this domain]
   - Context: [When this matters]
   - Future Application: [How to handle]

**Patterns to Follow:**
- ✅ [Pattern 1 that worked well]
- ✅ [Pattern 2 that should be used in future]

**Patterns to Avoid:**
- ❌ [Antipattern 1 that caused problems]
- ❌ [Antipattern 2 that should not be repeated]

**For Future Tasks:**
- [Consideration 1 for next time]
- [Consideration 2 for next time]
- [Best practice discovered]

═══════════════════════════════════════════════════════════════
IMPACT ASSESSMENT (ACTUAL VS PLANNED)
═══════════════════════════════════════════════════════════════

**Planned Impact:**
- Files to modify: [X]
- Complexity: [level]
- Risk: [level]

**Actual Impact:**
- Files modified: [Y] ([More/Less/Same] than planned)
- Complexity: [As expected / Higher / Lower]
- Risk: [Materialized / Mitigated / Non-issue]

**Variance Explanation:**
[If actual differed from planned, why?]

**Performance Impact:** [Better / Neutral / Acceptable]
- Measured: [If measurements taken]
- Reasoning: [Why this impact]

**No Breaking Changes:** ✅ CONFIRMED
- Existing features: ✅ All working
- APIs: ✅ Backward compatible (or migration path provided)
- Database: ✅ Migrations successful

═══════════════════════════════════════════════════════════════
DOCUMENTATION UPDATED
═══════════════════════════════════════════════════════════════

✅ `/docs/overview.md` - Added [section] with complete feature documentation
✅ `/docs/wip.md` - Marked WIP-[XXX] as COMPLETE
✅ `/docs/bugs-and-fixes.md` - [If applicable] Documented fix with lessons learned
✅ `/docs/projects-for-context-only/` - [If applicable] Updated integration docs
✅ `/docs/tempDocs/` - Cleaned and summarized for next session

**All documentation synchronized:** ✅
**Date/Time stamps added:** ✅
**Future agents have full context:** ✅

═══════════════════════════════════════════════════════════════
RECOMMENDATIONS & FOLLOW-UP
═══════════════════════════════════════════════════════════════

**Optional Enhancements:**
- [ ] [Optional improvement that could be made]
- [ ] [Performance optimization opportunity]
- [ ] [Additional feature that's now possible]

**Monitoring Recommendations:**
- [What to monitor in production]
- [Metrics to track]
- [Alerts to set up]

**Related Work:**
- [Other tasks that could benefit from this work]
- [Features that are now unblocked]
- [Technical debt that could be addressed]

**Future Considerations:**
- [Long-term scalability thoughts]
- [Potential refactoring opportunities]
- [Architecture improvements to consider]

═══════════════════════════════════════════════════════════════
FINAL STATUS
═══════════════════════════════════════════════════════════════

**Task Status:** ✅ COMPLETE

**Quality Assurance:**
- ✅ All requirements met
- ✅ All tests passing
- ✅ No regressions
- ✅ Documentation updated
- ✅ Code reviewed (by self)
- ✅ Ready for use

**Deliverables:**
- ✅ Working implementation
- ✅ Test coverage
- ✅ Documentation
- ✅ Migration scripts (if applicable)
- ✅ Rollback capability

═══════════════════════════════════════════════════════════════
END OF TASK COMPLETION REPORT
═══════════════════════════════════════════════════════════════
```

═══════════════════════════════════════════════════════════════
STEP 11: PROVIDE GIT COMMIT COMMAND
═══════════════════════════════════════════════════════════════

**🔴 MANDATORY: Provide PowerShell git commit command**

```
═══════════════════════════════════════════════════════════════
GIT COMMIT COMMAND (PowerShell)
═══════════════════════════════════════════════════════════════

git add .; git commit -m "[Detailed commit message describing all changes: files modified, features added/fixed, why changes were made, impact on system, test scripts created, documentation updated]"; git push

═══════════════════════════════════════════════════════════════
```

**Commit Message Format:**
- What changed (specific files and functions)
- Why it changed (bug fix, new feature, enhancement)
- Impact (what this enables or fixes)
- Testing (test scripts created and results)
- Documentation (what docs were updated)

**Example:**
```powershell
git add .; git commit -m "Implement user profile feature in frontend/UserProfile.tsx and backend/routes/users.py, add profile photo upload with S3 integration in backend/services/storage.py, handle edge cases for missing data and large files, create test-user-profile.py integration test with 100% pass rate, update docs/overview.md with complete feature documentation and API endpoints, update docs/wip.md marking WIP-042 complete"; git push
```

═══════════════════════════════════════════════════════════════
STEP 12: PRESENT COMPLETION TO USER
═══════════════════════════════════════════════════════════════

```
═══════════════════════════════════════════════════════════════
✅ TASK COMPLETE: TASK-[XXX] ✅
═══════════════════════════════════════════════════════════════

**Task:** [Brief description]

**SUMMARY:**
[One paragraph describing what was accomplished, how it was done, and what the result is]

═══════════════════════════════════════════════════════════════

**WHAT WAS DELIVERED:**

**Implementation:**
- Created: [X] new files
- Modified: [Y] existing files
- Functions affected: [Z]
- Total code changes: [rough estimate if known]

**Key Features:**
- ✅ [Feature 1 delivered]
- ✅ [Feature 2 delivered]
- ✅ [Feature 3 delivered]

**Edge Cases Handled:**
- ✅ [Edge case 1]
- ✅ [Edge case 2]
- ✅ [Edge case 3]

═══════════════════════════════════════════════════════════════

**TESTING:**

✅ **All Tests Passed:**
- Unit tests: [X] passed
- Integration tests: [Y] scenarios verified
- Manual tests: [Z] workflows tested
- Edge cases: [A] handled
- Regressions: None found

**Test Scripts Created:**
- `/scripts/verify-bug-[name].py` - ✅ (if applicable)
- `/scripts/prove-fix-[name].py` - ✅ 100% success (if applicable)
- `/scripts/test-[feature].py` - ✅ Integration testing

═══════════════════════════════════════════════════════════════

**SUCCESS CRITERIA:**
- ✅ [Criterion 1 from task description] - ACHIEVED
- ✅ [Criterion 2 from task description] - ACHIEVED
- ✅ [Criterion 3 from task description] - ACHIEVED

**ALL SUCCESS CRITERIA MET** ✅

═══════════════════════════════════════════════════════════════

**DOCUMENTATION UPDATED:**
✅ `/docs/overview.md` - [Section] updated with complete feature docs
✅ `/docs/wip.md` - WIP-[XXX] marked complete
✅ `/docs/bugs-and-fixes.md` - [If applicable] Bug fix documented with lessons
✅ `/docs/tempDocs/` - Cleaned and summarized for next session

**All documentation synchronized with date/time stamps** ✅

═══════════════════════════════════════════════════════════════

**KEY LEARNINGS:**
1. [Learning 1 about codebase/domain]
2. [Learning 2 about patterns/antipatterns]
3. [Learning 3 for future tasks]

**Lessons documented in bugs-and-fixes.md for future reference** ✅

═══════════════════════════════════════════════════════════════

**GIT COMMIT COMMAND:**
```powershell
git add .; git commit -m "[Complete detailed commit message]"; git push
```

═══════════════════════════════════════════════════════════════

**THE TASK IS COMPLETE AND READY FOR USE** ✅

**Full completion report available above with:**
- Complete implementation details
- All code changes documented
- Comprehensive testing results
- Challenges and learnings
- Impact assessment
- Recommendations for future work

═══════════════════════════════════════════════════════════════

**WHAT WOULD YOU LIKE TO DO NEXT?**

**A) REVIEW IMPLEMENTATION** 
   - I can walk you through specific code changes
   - I can explain any part in more detail
   - I can show you the test results

**B) TEST IT YOURSELF**
   - Everything is implemented and tested
   - You can verify the changes
   - Test scripts are in `/scripts/`

**C) REQUEST REFINEMENTS**
   - Any adjustments needed?
   - Any additional edge cases to handle?
   - Any improvements desired?

**D) MOVE TO NEXT TASK**
   - Current task fully complete
   - Ready for new assignment
   - Context maintained for continuity

**E) DISCUSS LEARNINGS**
   - Review what was learned
   - Discuss patterns discovered
   - Plan future improvements

═══════════════════════════════════════════════════════════════

**PLEASE CHOOSE:** [A / B / C / D / E] or provide custom instruction

═══════════════════════════════════════════════════════════════
```

═══════════════════════════════════════════════════════════════
END OF TASK EXECUTION WORKFLOW
═══════════════════════════════════════════════════════════════

***TASK EXECUTION ENDS***

═══════════════════════════════════════════════════════════════
🔴 CRITICAL REMINDERS FOR EVERY TASK 🔴
═══════════════════════════════════════════════════════════════

**NEVER FORGET:**

1. ⏱️ **NO TIME PRESSURE** - Take all the time needed to get it right
2. 📂 **CHECK /TEMPDOCS FIRST** - Every single task starts here
3. 🧠 **THINK AS HARD AS YOU CAN** - Maximum cognitive intensity
4. ✅ **VERIFY EVERYTHING** - Against actual code, not assumptions
5. 🧪 **PROVE WITH SCRIPTS** - Bugs and fixes need 100% verification
6. 🌊 **MAP ALL IMPACTS** - Every change affects the entire system
7. 🔴 **NO CODE BEFORE APPROVAL** - Plan first, get approval, then code
8. 📚 **UPDATE DOCS ALWAYS** - With date/time stamps after every change
9. 💾 **LEAVE CONTEXT** - In /tempDocs for next session
10. 🧹 **STAY ORGANIZED** - Clean docs, archive scripts, maintain structure
11. 🔗 **CHECK INTEGRATIONS** - External projects if applicable
12. 💻 **GIT COMMIT ALWAYS** - PowerShell command when complete

**YOUR ROLE:**
- PLAN meticulously before acting
- CODE carefully following the plan
- TEST comprehensively before declaring done
- DOCUMENT everything with timestamps
- LEARN from every challenge
- ORGANIZE constantly

**REMEMBER:**
- You have infinite time - use it
- Quality > Speed always
- Prove everything with test scripts
- No assumptions, only verified facts
- Context preservation is critical
- Documentation is not optional

═══════════════════════════════════════════════════════════════

**ANY NEW MARKDOWN FILES THAT YOU WANT TO CREATE CAN BE DONE IN:**
\branches\aibt-modded\docs\tempDocs`

**AND WILL BE USED TO UPDATE:**
\branches\aibt-modded\docs\bugs-and-fixes.md`
\branches\aibt-modded\docs\overview.md` (and PT2, PT3, etc.)
\branches\aibt-modded\docs\wip.md`

**ANY MARKDOWN YOU CREATE: DATE IT (YYYY-MM-DD HH:MM)**

**THAT DIR IS FOR YOU - USE IT LIBERALLY**

═══════════════════════════════════════════════════════════════
```