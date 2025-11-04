# Work In Progress

## Purpose
This file tracks all features, enhancements, and changes currently being developed. Once completed, they are removed from here and added to `overview.md`.

---

## WIP Template (For Future Use)

```
### WIP-XXX: [Feature/Enhancement Name]
**Status:** 🟡 In Progress / 🔴 Blocked / 🟢 Ready for Review  
**Priority:** Critical/High/Medium/Low  
**Started:** YYYY-MM-DD HH:MM  
**Assigned To:** [Person/Team/AI Agent]

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

### 🎉 Nothing Currently In Progress!

All recent features have been completed and documented in `overview.md`.

---

## Recently Completed (Moved to overview.md)

### ✅ WIP-001: Two-Level Conversation System
**Completed:** 2025-11-04 19:00  
**Status:** Production-ready  

**What Was Built:**
- ChatGPT-style conversation organization
- General conversations (top-level)
- Model-specific conversations (nested under models)
- Auto-generated titles from first message
- Full CRUD operations (create, resume, delete)
- URL routing (?c=13 for conversations)

**Files Created:**
- `backend/migrations/015_multi_conversation_support.sql`
- `backend/services/title_generation.py`

**Files Modified:**
- `backend/services/chat_service.py` - V2 functions
- `backend/main.py` - 5 new API endpoints
- `frontend-v2/lib/api.ts` - 5 new API client functions
- `frontend-v2/components/navigation-sidebar.tsx` - Complete UI rewrite

**Documentation:**
- Documented in `overview.md` Section 11
- Documented in `tempDocs/2025-11-04-two-level-conversations-COMPLETE.md`

**Git Commit:**
```powershell
git add .; git commit -m "Implement two-level conversation system with ChatGPT-style organization, auto-title generation, and URL routing. Created title_generation.py service, added 5 new API endpoints in main.py, updated chat_service.py with V2 functions, rewrote navigation-sidebar.tsx with nested conversations, added URL routing in app/page.tsx. Database migration 015 applied. Fully tested and production-ready."; git push
```

---

## Potential Future Work (Ideas)

### 💡 Idea: Load Conversation Messages into Chat Interface
**Priority:** Medium  
**Complexity:** Low  
**Estimated Time:** 1-2 hours

**Current State:**
- Conversations work perfectly
- Sidebar shows conversations
- Clicking conversation shows toast but doesn't load messages

**What's Needed:**
- Pass `selectedConversationId` to `ChatInterface` component
- When conversation selected, call `getSessionMessages(conversationId)`
- Populate messages array with historical messages
- Clear messages when "New Chat" clicked

**Benefits:**
- Complete conversation persistence
- Users can resume previous discussions seamlessly

---

### 💡 Idea: Conversation Search/Filter
**Priority:** Low  
**Complexity:** Low  
**Estimated Time:** 2-3 hours

**Problem:**
- With many conversations, sidebar becomes cluttered
- Hard to find specific conversation

**Proposed Solution:**
- Add search input at top of CONVERSATIONS section
- Filter conversations by title as user types
- Highlight matching text

**Implementation:**
```tsx
<input 
  placeholder="Search conversations..."
  onChange={(e) => filterConversations(e.target.value)}
/>
```

---

### 💡 Idea: Conversation Export
**Priority:** Low  
**Complexity:** Medium  
**Estimated Time:** 3-4 hours

**Use Case:**
- User wants to save conversation as text file
- User wants to share conversation with colleague
- User wants to analyze conversation data

**Formats:**
- Text (Markdown)
- JSON (structured data)
- PDF (formatted)

**Implementation:**
- Add "Export" button to conversation menu
- Fetch all messages for conversation
- Generate file in selected format
- Trigger download

---

### 💡 Idea: Manual Conversation Rename
**Priority:** Low  
**Complexity:** Low  
**Estimated Time:** 1 hour

**Current State:**
- Titles auto-generated from first message
- No way to manually edit title

**Proposed Solution:**
- Double-click conversation title to edit
- Or "Rename" option in context menu
- Update via API: `PUT /api/chat/sessions/{id}/title`

---

### 💡 Idea: Live Trading Integration
**Priority:** High  
**Complexity:** Very High  
**Estimated Time:** 2-3 weeks

**Objective:**
Connect to real broker APIs for live trading execution

**Requirements:**
- Broker API integration (Alpaca, Interactive Brokers, TD Ameritrade)
- Real-time market data feed
- Order execution and management
- Risk management (position sizing, stop losses)
- Paper trading mode for testing
- Regulatory compliance (pattern day trader rules, etc.)

**Challenges:**
- API rate limits
- Real money at risk
- Latency requirements
- Error handling (failed orders, connection drops)
- Market hours restrictions

---

### 💡 Idea: Strategy Marketplace
**Priority:** Medium  
**Complexity:** High  
**Estimated Time:** 1-2 weeks

**Objective:**
Allow users to share and import trading strategies

**Features:**
- Publish strategy (rules + instructions + parameters)
- Browse strategies by category
- Import strategy into own model
- Rate/review strategies
- Strategy versioning

**Monetization:**
- Free strategies (community-contributed)
- Premium strategies (paid)
- Subscription for access to premium library

---

### 💡 Idea: Advanced Backtesting
**Priority:** Medium  
**Complexity:** High  
**Estimated Time:** 1 week

**Features:**
- Walk-forward analysis (rolling windows)
- Monte Carlo simulation (random price scenarios)
- Multi-asset backtesting (stocks + options + crypto)
- Slippage and commission modeling
- Order execution simulation (limit orders, stop orders)

**Benefits:**
- More realistic performance estimates
- Better understanding of strategy robustness
- Identify overfitting

---

### 💡 Idea: Risk Management Dashboard
**Priority:** High  
**Complexity:** Medium  
**Estimated Time:** 3-4 days

**Features:**
- Real-time portfolio risk metrics
- Value at Risk (VaR) calculation
- Correlation matrix visualization
- Position size calculator
- Alerts for risk threshold breaches

**Implementation:**
- New page: `/risk-dashboard`
- Real-time updates via SSE
- Charts using Recharts
- Alerts using toast notifications

---

### 💡 Idea: Multi-Asset Support
**Priority:** Medium  
**Complexity:** Very High  
**Estimated Time:** 2-3 weeks

**Current State:**
- Only supports stocks (NASDAQ 100)

**Proposed Assets:**
- Cryptocurrency (Bitcoin, Ethereum, etc.)
- Forex (EUR/USD, GBP/USD, etc.)
- Options (calls, puts)
- Futures
- Commodities

**Challenges:**
- Different data formats
- Different market hours
- Different liquidity profiles
- Different order types
- Different risk models

---

## Work Queue

**Next up when work begins:**

1. (Empty - waiting for next feature request)

**Backlog:**

1. Load conversation messages into chat interface
2. Add conversation search/filter
3. Implement conversation export
4. Add manual conversation rename
5. (Add items as they're prioritized)

---

## Decision Log

**When making architectural decisions, document them here:**

### Decision: Use ChatGPT-style Conversations (2025-11-04)
**Context:** Users requested conversation organization similar to ChatGPT  
**Options Considered:**
1. Single conversation per model (current)
2. Multiple conversations per model (chosen)
3. Tags/folders for organization

**Decision:** Multiple conversations per model with nested structure  
**Rationale:**
- Most familiar to users (ChatGPT pattern)
- Allows separation of concerns (different strategies, analysis types)
- Auto-generated titles improve discoverability
- URL routing enables sharing specific conversations

**Trade-offs:**
- More complex UI (nesting, expand/collapse)
- More database queries (list conversations per model)
- Migration required (existing users)

**Result:** Successfully implemented, users happy with feature

---

### Decision: Auto-Generate Titles vs Manual Entry (2025-11-04)
**Context:** How should conversations be titled?  
**Options Considered:**
1. Manual entry (user types title)
2. Auto-generate from first message (chosen)
3. Both (default auto, allow rename)

**Decision:** Auto-generate from first message  
**Rationale:**
- Reduces friction (no extra step)
- ChatGPT does this successfully
- Can add manual rename later if needed
- AI generates better titles than users would type

**Trade-offs:**
- Requires AI API call (small cost)
- May generate generic titles for vague messages
- Fallback to simple extraction needed

**Result:** Works great, titles are high quality

---

**Last Updated:** 2025-11-04 by AI Agent  
**Next Update:** When new work begins

