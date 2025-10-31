# FEATURE BRAINSTORMING & ENHANCEMENT PROMPT

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

***BRAINSTORMING TASK BEGINS***

**** THINK AS HARD AS YOU CAN - BE CREATIVE BUT GROUNDED IN REALITY ****

```

═══════════════════════════════════════════════════════════════
🔴 FEATURE BRAINSTORMING & ENHANCEMENT SESSION 🔴
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

**BRAINSTORMING FOCUS:**
REVIEW THIS DOCUMENT ITS FOR X.COM \ttgai2






**CONTEXT / GOALS:**
[What are we trying to achieve? What problem needs solving?]




**CONSTRAINTS (if any):**
[Technical limitations, budget, timeline, dependencies, etc.]




**INSPIRATION / REFERENCE:**
[Any existing features you like, competitor features, user requests, etc.]




═══════════════════════════════════════════════════════════════

## AI AGENT WORKFLOW

STEP 1: CODEBASE CAPABILITY ASSESSMENT
───────────────────────────────────────

Before brainstorming, understand what the codebase CAN do.

**CURRENT CAPABILITIES INVENTORY:**

Analyze the codebase to identify:

```
CURRENT SYSTEM CAPABILITIES:

**Core Features:**
1. [Feature 1] - Implemented in `path/to/file.ext`
   Code: [citation showing implementation]
   
2. [Feature 2] - Implemented in `path/to/file.ext`
   Code: [citation showing implementation]
   
3. [Feature 3] - Implemented in `path/to/file.ext`
   Code: [citation showing implementation]

[List all major features with code evidence]

**Technical Infrastructure:**
- Framework/Stack: [What's actually being used - cite package.json/requirements.txt]
- Architecture Pattern: [MVC/Microservices/etc. - cite code structure]
- Database/Storage: [What's used - cite config/connection code]
- External APIs: [What's integrated - cite API call code]
- Authentication: [How it works - cite auth code]
- State Management: [How state is handled - cite code]

**Existing Patterns & Conventions:**
- File organization: [How files are structured]
- Naming conventions: [Patterns observed in code]
- Error handling: [How errors are handled - cite examples]
- Logging: [How logging works - cite examples]
- Testing: [Testing setup - cite test files if they exist]

**Extension Points:**
[Where new features can plug in easily]
- Plugin system: [Yes/No - cite code if exists]
- Service layer: [How services are structured - cite examples]
- Event system: [How components communicate - cite code]
- API endpoints: [How to add new endpoints - cite example]
```

**STRENGTHS TO LEVERAGE:**
```
What is this codebase particularly good at?
1. [Strength 1] - Evidence: [code citation]
2. [Strength 2] - Evidence: [code citation]
3. [Strength 3] - Evidence: [code citation]
```

**LIMITATIONS TO CONSIDER:**
```
What are the current constraints?
1. [Limitation 1] - Evidence: [code citation showing limitation]
2. [Limitation 2] - Evidence: [code citation showing limitation]
3. [Limitation 3] - Evidence: [code citation showing limitation]
```

═══════════════════════════════════════════════════════════════

STEP 2: GAP ANALYSIS
─────────────────────

What's missing? What could be better?

**FUNCTIONAL GAPS:**
```
What functionality doesn't exist but would be valuable?

1. **Gap:** [Missing feature/capability]
   **Evidence:** [Search codebase - confirm it doesn't exist]
   **User Value:** [Why users would want this]
   **Related to:** [Existing features it would complement]
   
2. **Gap:** [Missing feature/capability]
   [Same format...]
```

**PERFORMANCE GAPS:**
```
Where could performance be improved?

1. **Area:** [Slow/inefficient part]
   **Current Implementation:** `path/to/file.ext`
   Code: [citation showing current approach]
   **Bottleneck:** [Why it's slow]
   **Impact:** [How it affects users]
```

**USER EXPERIENCE GAPS:**
```
Where could UX be better?

1. **Pain Point:** [User friction point]
   **Current Experience:** [What users have to do now]
   **Related Code:** `path/to/file.ext` [citation]
   **Why it's difficult:** [Explanation]
```

**INTEGRATION GAPS:**
```
What external integrations are missing?

1. **Service:** [External service that could be integrated]
   **Use Case:** [What it would enable]
   **Feasibility:** [Based on current architecture - cite relevant code]
```

═══════════════════════════════════════════════════════════════

STEP 3: IDEA GENERATION
────────────────────────

Now brainstorm ideas. Be creative but realistic.

For EACH idea, evaluate against the ACTUAL codebase.

**IDEA TEMPLATE:**

```
═══════════════════════════════════════════════════════════════
IDEA #1: [Feature/Enhancement Name]
═══════════════════════════════════════════════════════════════

**Category:** [New Feature / Enhancement / Optimization / Integration]

**Priority:** [Critical / High / Medium / Low]

**Description:**
[1-2 paragraph description of the idea]

**User Value:**
[What problem does this solve? What value does it provide?]

**Technical Feasibility Assessment:**

**Fits with Current Architecture?** [Yes / Partially / No]
- Current architecture: [cite relevant structural code]
- How it would fit: [explanation with code examples]
- Challenges: [what makes it difficult]

**Required Components:**
1. **Frontend Changes** (if applicable)
   - New files needed: [list]
   - Modified files: [`existing-file.ext`]
     Current code: [citation]
     Where to add: [specific location/function]
   
2. **Backend Changes** (if applicable)
   - New endpoints/services: [list]
   - Modified files: [`existing-file.ext`]
     Current code: [citation]
     Where to integrate: [specific location]
   
3. **Database Changes** (if applicable)
   - New tables/collections: [list with schema]
   - Modified tables: [changes needed]
   
4. **External Dependencies** (if applicable)
   - New packages needed: [list with justification]
   - New API integrations: [list with purpose]

**Implementation Approach:**

**Phase 1: Foundation**
- Step 1: [First step - cite where it goes in code]
- Step 2: [Next step - cite integration points]
- Step 3: [Next step - cite affected files]

**Phase 2: Core Feature**
- [Steps with code citations]

**Phase 3: Polish & Integration**
- [Steps with code citations]

**Code Integration Points:**
[Specific locations in existing code where this would plug in]

1. **Entry Point:** `path/to/file.ext` - `functionName()`
   Current code:
   ```language
   [citation of where to integrate]
   ```
   How to integrate: [specific changes needed]

2. **Service Layer:** `path/to/service.ext` - `serviceName`
   Current code:
   ```language
   [citation]
   ```
   New service needed: [description with example structure]

3. **State Management:** `path/to/store.ext`
   Current code:
   ```language
   [citation]
   ```
   New state needed: [what to add]

**Dependencies on Existing Code:**
- Uses: [`existing-file.ext:functionName()`] - [citation]
- Modifies: [`existing-file.ext`] - [citation of what changes]
- Extends: [`existing-pattern`] - [citation of pattern]

**Potential Breaking Changes:**
[What existing functionality might this affect?]
- Impact on: [`file.ext:functionName()`] - [citation and explanation]
- Mitigation: [how to prevent breaking changes]

**Complexity Score:** [Low / Medium / High / Very High]

**Reasoning:**
- Code changes required: [X files, Y functions]
- New concepts introduced: [list]
- Testing complexity: [explanation]
- Integration complexity: [explanation]

**Estimated Effort:** [Small / Medium / Large / Very Large]
[Based on codebase analysis, NOT arbitrary time estimates]

**Benefits:**
1. [Benefit 1 with user impact]
2. [Benefit 2 with user impact]
3. [Benefit 3 with user impact]

**Risks:**
1. [Risk 1 with likelihood and code evidence]
2. [Risk 2 with likelihood and code evidence]
3. [Risk 3 with likelihood and code evidence]

**Alternative Approaches:**
1. [Alternative 1] - [why better/worse than main approach]
2. [Alternative 2] - [why better/worse than main approach]

**Dependencies:**
- Requires: [Other features that must exist first]
- Blocks: [Other features waiting on this]
- Related to: [Features that would benefit from this]

**Success Metrics:**
[How to measure if this is successful]
- Metric 1: [measurable outcome]
- Metric 2: [measurable outcome]

**Decision:** [RECOMMEND / CONSIDER / DEFER / REJECT]

**Reasoning for Decision:**
[Why this decision based on codebase analysis and constraints]

═══════════════════════════════════════════════════════════════
```

**Generate 5-10 ideas using this template.**

═══════════════════════════════════════════════════════════════

STEP 4: PRIORITIZATION MATRIX
──────────────────────────────

Rank all ideas based on code analysis.

**PRIORITIZATION CRITERIA:**

1. **User Value** (1-10)
   - How much does this help users?
   
2. **Technical Feasibility** (1-10)
   - Based on actual codebase architecture
   - 10 = fits perfectly, minimal changes
   - 1 = requires major refactoring
   
3. **Implementation Complexity** (1-10 inverted)
   - Based on actual code changes needed
   - 10 = very simple (few files, clear integration)
   - 1 = very complex (many files, unclear integration)
   
4. **Risk Level** (1-10 inverted)
   - Based on potential breaking changes
   - 10 = no breaking changes possible
   - 1 = high chance of breaking things
   
5. **Synergy with Existing Features** (1-10)
   - How well does it leverage existing code?
   - Cite code showing synergies

**PRIORITY MATRIX:**

```
╔════════════════════════════════════════════════════════════════╗
║                    HIGH VALUE, LOW EFFORT                       ║
║                      DO THESE FIRST                            ║
╠════════════════════════════════════════════════════════════════╣
║ IDEA #X: [Name]                                                ║
║ Score: [Total] | Value: [X] | Feasibility: [X] | Risk: [X]    ║
║ Key Integration: `file.ext:function()` [citation]              ║
╠════════════════════════════════════════════════════════════════╣
║ IDEA #Y: [Name]                                                ║
║ [Same format...]                                               ║
╚════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════╗
║                   HIGH VALUE, HIGH EFFORT                       ║
║                    STRATEGIC INITIATIVES                       ║
╠════════════════════════════════════════════════════════════════╣
║ [Ideas...]                                                     ║
╚════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════╗
║                   LOW VALUE, LOW EFFORT                        ║
║                       QUICK WINS                               ║
╠════════════════════════════════════════════════════════════════╣
║ [Ideas...]                                                     ║
╚════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════╗
║                   LOW VALUE, HIGH EFFORT                       ║
║                     AVOID / DEFER                              ║
╠════════════════════════════════════════════════════════════════╣
║ [Ideas...]                                                     ║
╚════════════════════════════════════════════════════════════════╝
```

═══════════════════════════════════════════════════════════════

STEP 5: TECHNICAL ROADMAP
──────────────────────────

For recommended ideas, create implementation roadmap.

**RECOMMENDED IDEAS ROADMAP:**

```
PHASE 1: QUICK WINS (High Value, Low Effort)
─────────────────────────────────────────────

IDEA #X: [Name]
├─ Step 1: Modify `file1.ext` [citation of change location]
├─ Step 2: Add function to `file2.ext` [citation of integration point]
├─ Step 3: Update state in `store.ext` [citation]
└─ Step 4: Test integration

Estimated Impact: [X files, Y functions]
Prerequisites: None
Blocks: None

───

IDEA #Y: [Name]
[Same format...]

═══════════════════════════════════════════════════════════════

PHASE 2: STRATEGIC FEATURES (High Value, High Effort)
──────────────────────────────────────────────────────

IDEA #Z: [Name]
├─ Foundation Work:
│  ├─ Create service layer in `services/` [example structure]
│  └─ Add types in `types/` [example types]
├─ Core Implementation:
│  ├─ Implement in `component.ext` [integration point citation]
│  └─ Add API endpoints [citation of where]
├─ Integration:
│  ├─ Connect to existing `feature.ext` [citation]
│  └─ Update `config.ext` [citation]
└─ Testing & Polish

Estimated Impact: [X files, Y functions]
Prerequisites: IDEA #X must be completed first
Blocks: IDEA #A depends on this

═══════════════════════════════════════════════════════════════

DEFERRED FOR LATER:
───────────────────
- IDEA #M: [Name] - Reason: [why deferred with code evidence]
- IDEA #N: [Name] - Reason: [why deferred with code evidence]
```

═══════════════════════════════════════════════════════════════

STEP 6: UPDATE WIP.MD
─────────────────────

For each RECOMMENDED idea, add to `/docs/wip.md`:

```markdown
### WIP-XXX: [Feature/Enhancement Name]
**Status:** 🔵 PROPOSED (Not yet started)
**Priority:** [Critical/High/Medium/Low]
**Proposed:** YYYY-MM-DD HH:MM
**Category:** [New Feature / Enhancement / Optimization]

**Objective:**
[What we're trying to achieve and why]

**User Value:**
[How this helps users]

**Approach:**
[High-level implementation approach]

**Technical Assessment:**
- **Feasibility:** [High/Medium/Low based on code analysis]
- **Complexity:** [Low/Medium/High/Very High]
- **Estimated Impact:** [X files, Y functions to modify/create]

**Files To Be Modified/Created:**
- [`existing-file.ext`] - [What changes] - Integration point: [line/function]
- [`new-file.ext`] - [New file purpose]

**Integration Points:**
1. **`path/to/file.ext:functionName()`**
   Current code:
   ```language
   [citation showing where to integrate]
   ```
   
2. [Additional integration points...]

**Dependencies:**
- Requires completion of: [Other WIP items if any]
- Uses existing: [`file.ext:function()`] - [citation]
- Modifies existing: [`file.ext`] - [citation]

**Potential Breaking Changes:**
- [Impact on existing feature] - Mitigation: [how to avoid]

**Testing Plan:**
- Unit tests: [What to test]
- Integration tests: [What to test]
- Manual testing: [Steps to verify]

**Code Structure Preview:**
[Example of key code structure with proper citations showing where it fits]

**Questions/Decisions Needed:**
- [ ] [Question 1 about implementation]
- [ ] [Question 2 about approach]

**Approval Status:** 🟡 AWAITING APPROVAL
```

═══════════════════════════════════════════════════════════════

STEP 7: PRESENT BRAINSTORMING RESULTS
──────────────────────────────────────

Compile everything into final presentation:

---

# BRAINSTORMING SESSION RESULTS

**Date:** YYYY-MM-DD HH:MM
**Session Focus:** [What we brainstormed]
**Codebase Analyzed:** [Project name]

---

## EXECUTIVE SUMMARY

**Ideas Generated:** [X total]
- ✅ Recommended: [Y ideas]
- 🤔 Consider: [Z ideas]
- ⏸️ Defer: [A ideas]
- ❌ Reject: [B ideas]

**Top 3 Recommendations:**
1. **IDEA #X:** [Name] - [One-line benefit]
2. **IDEA #Y:** [Name] - [One-line benefit]
3. **IDEA #Z:** [Name] - [One-line benefit]

---

## CURRENT CODEBASE CAPABILITIES

[Summary from Step 1 - what system can currently do]

**Key Strengths to Leverage:**
- [Strength 1 with code evidence]
- [Strength 2 with code evidence]

**Key Limitations to Consider:**
- [Limitation 1 with code evidence]
- [Limitation 2 with code evidence]

---

## ALL IDEAS GENERATED

[List all ideas with brief summaries and decisions]

### ✅ RECOMMENDED IDEAS

**IDEA #X: [Name]**
- **Why Recommended:** [Based on code analysis]
- **User Value:** [Benefit]
- **Complexity:** [Low/Medium/High with code evidence]
- **Key Integration:** `file.ext:function()` [citation]
- **Estimated Impact:** [X files, Y functions]

[Repeat for all recommended ideas]

### 🤔 CONSIDER WITH CAUTION

**IDEA #Y: [Name]**
- **Why Cautious:** [Concerns based on code]
- **Value vs Risk:** [Analysis]

### ⏸️ DEFERRED

**IDEA #Z: [Name]**
- **Why Deferred:** [Reason with code evidence]
- **Revisit When:** [Conditions]

### ❌ NOT RECOMMENDED

**IDEA #A: [Name]**
- **Why Rejected:** [Reason with code evidence]

---

## IMPLEMENTATION ROADMAP

[Detailed roadmap from Step 5]

---

## NEXT STEPS

**Immediate Actions:**
1. **Review & Approve** top recommendations
2. **Prioritize** which idea to start with
3. **Assign** to development (or proceed with implementation)

**For Each Approved Idea:**
1. Create detailed implementation plan
2. Update `/docs/wip.md` with approved status
3. Begin development following RULE 5 (plan approval first)

---

## DOCUMENTATION UPDATES

✅ Updated `/docs/wip.md` with proposed features
✅ All ideas backed by code analysis and citations
✅ Feasibility assessed against actual codebase

---

**END OF BRAINSTORMING SESSION**

═══════════════════════════════════════════════════════════════

STEP 8: PRESENT TO USER
───────────────────────

State:

"**BRAINSTORMING SESSION COMPLETE**

**Ideas Generated:** [X total]
**Recommended:** [Y ideas] based on codebase analysis

**Top Recommendations:**
1. IDEA #X: [Name] - [Why it's great with code evidence]
2. IDEA #Y: [Name] - [Why it's great with code evidence]
3. IDEA #Z: [Name] - [Why it's great with code evidence]

**I have:**
✅ Analyzed current codebase capabilities
✅ Identified gaps and opportunities
✅ Generated [X] feature ideas
✅ Assessed each idea against actual code architecture
✅ Cited specific integration points for each idea
✅ Prioritized based on value, feasibility, and complexity
✅ Created implementation roadmap
✅ Updated `/docs/wip.md` with proposed features

**All recommendations are grounded in actual codebase analysis, not speculation.**

**Next Steps:**
A) Review detailed analysis above
B) Approve specific ideas to move to WIP status
C) Request more details on any idea
D) Request additional brainstorming in specific area
E) Start implementation on approved idea

What would you like to do?"

═══════════════════════════════════════════════════════════════

## CRITICAL RULES FOR BRAINSTORMING

1. **GROUND IN REALITY** - Every idea must reference actual code
2. **CITE INTEGRATION POINTS** - Show exactly where features would plug in
3. **ASSESS FEASIBILITY** - Based on actual architecture, not theory
4. **CONSIDER IMPACT** - What existing code is affected
5. **BE HONEST** - If something is complex, say so with evidence
6. **PRIORITIZE SMART** - Not just "cool ideas" but "feasible value"
7. **DOCUMENT PROPERLY** - Update wip.md with real technical details
8. **NO GUESSING** - If uncertain about feasibility, investigate code first

**Remember: Creativity is good, but every idea must be anchored in the actual codebase.**

```

***BRAINSTORMING TASK ENDS***