# Complete LangGraph Migration - All Conversations

## Objective
Migrate BOTH Run conversations and General conversations to LangGraph, making the entire chat system use consistent modern architecture.

---

## What We're Migrating

### 1. Run Conversations
**Current:** SystemAgent (old LangChain)  
**New:** LangGraph create_react_agent  
**Endpoint:** `/api/models/{model_id}/runs/{run_id}/chat-stream`

### 2. General Conversations  
**Current:** Simple ChatOpenAI (no tools)  
**New:** LangGraph create_react_agent with model builder tools  
**Endpoint:** `/api/chat/general-stream` (when model_id=None)

---

## Implementation Steps

### Step 1: Create Run Agent (LangGraph)

**File:** Create `backend/agents/run_agent_langgraph.py`

Copy `model_agent_langgraph.py` and modify:
- Accept `run_id` parameter (not None)
- Tools query with specific run_id
- System prompt focuses on ONE run (not all runs)
- Same create_react_agent pattern

### Step 2: Create General Agent (LangGraph) 

**File:** Create `backend/agents/general_agent_langgraph.py`

New tools for model building:
- `explain_platform_tool` - Answer platform questions
- `suggest_model_config_tool` - Recommend model settings
- `create_model_tool` - Guide model creation
- `explain_trading_concepts_tool` - Trading education

### Step 3: Update Run Conversation Endpoint

**File:** `backend/main.py` - `/api/models/{model_id}/runs/{run_id}/chat-stream`

Replace:
```python
from agents.system_agent import create_system_agent
agent = create_system_agent(model_id, run_id, user_id, supabase)
```

With:
```python
from agents.run_agent_langgraph import create_run_conversation_agent  
agent = create_run_conversation_agent(model_id, run_id, user_id, supabase)
```

### Step 4: Update General Conversation Endpoint

**File:** `backend/main.py` - `/api/chat/general-stream` (else branch)

Replace:
```python
model = ChatOpenAI(**params)
async for chunk in model.astream(messages):
    yield token
```

With:
```python
from agents.general_agent_langgraph import create_general_conversation_agent
agent = create_general_conversation_agent(user_id, supabase)
async for chunk in agent.astream({"messages": messages}):
    # Handle chunks (same pattern as model conversations)
```

---

## Architecture After Migration

All three conversation types use LangGraph:

```
1. General Conversations
   └── LangGraph create_react_agent
       └── ChatOpenAI → OpenRouter
       └── Tools: [explain_platform, suggest_config, create_model, explain_concepts]

2. Model Conversations ✅ DONE
   └── LangGraph create_react_agent
       └── ChatOpenAI → OpenRouter
       └── Tools: [analyze_trades(ALL), get_reasoning(ALL), calc_metrics(ALL), suggest_rules]

3. Run Conversations
   └── LangGraph create_react_agent
       └── ChatOpenAI → OpenRouter
       └── Tools: [analyze_trades(run_id=85), get_reasoning(run_id=85), calc_metrics(run_id=85), suggest_rules]
```

---

## Benefits

**Consistency:**
- All conversations use same pattern
- Same debugging approach
- Same error handling

**Maintainability:**
- One framework instead of three approaches
- Easier to add features
- Clear separation of concerns

**Capability:**
- General gets tools (better model building guidance)
- Run gets modern architecture (better than buggy SystemAgent)
- All benefit from LangGraph features (checkpointing, state, streaming)

---

## Testing Checklist

After migration:

**General Conversations:**
- [ ] Can explain platform features
- [ ] Can guide model creation
- [ ] Tools work correctly
- [ ] Frontend unchanged

**Run Conversations:**
- [ ] Can analyze specific run
- [ ] Tools work with run_id filter
- [ ] Reasoning logs accessible
- [ ] Frontend unchanged

**Model Conversations:**
- [x] Already verified working
- [x] Tools called successfully
- [x] AI reasoning accessed

---

## Implementation Order

1. **Run Agent** (quick - copy model agent, change run_id)
2. **Update run endpoint** (find/replace SystemAgent)  
3. **Test run conversations**
4. **General agent** (design tools first)
5. **Update general endpoint**
6. **Test general conversations**

---

**This makes the entire system consistent and modern!**

