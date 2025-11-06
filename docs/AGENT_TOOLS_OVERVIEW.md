# Agent Tools Overview - 2025-11-06

## Tool Separation by Agent Type

**General Conversations** (`/new`):
- Purpose: Help users understand platform and CREATE new models
- Tools: 3 tools focused on education and model creation
- Cannot modify existing models

**Model Conversations** (`/m/{id}/new`):
- Purpose: Analyze specific model performance and UPDATE that model
- Tools: 6 tools focused on analysis and configuration updates
- Cannot create new models (only update the current one)

---

## General Conversation Agent Tools (3 total)

Used in general platform conversations at `/new`:

1. **explain_platform_feature** - Explain platform capabilities
   - Used for: "how does intraday trading work?", "what are runs?"

2. **suggest_model_configuration** - Suggest model settings based on goals
   - Used for: "I want to day trade, what should I configure?"

3. **create_model** ⚠️ **WRITE ACCESS** - Create a new trading model
   - Creates new model in database with user's configuration
   - Parameters: name, description, trading_style, instrument, margin_account, etc.
   - Max 2000 chars for custom_rules and custom_instructions
   - Returns new model ID and confirms creation
   - Agent should always ask for name and confirm before creating

---

## Model Conversation Agent Tools (6 total)

Used in model-specific conversations at `/m/{id}/new`:

The model conversation agent has **6 tools** to interact with model configuration and trading history.

### Analysis Tools

1. **`analyze_trades`**
   - Analyzes trade patterns and performance
   - Can filter by run or analyze all runs
   - Used for: "show me losing trades", "analyze my trades"

2. **`get_ai_reasoning`**
   - Retrieves AI decision logs and reasoning
   - Default: queries ALL runs (no filter)
   - Used for: "what was the AI thinking?", "why did it decide to buy?"

3. **`calculate_metrics`**
   - Calculates performance metrics (returns, Sharpe, drawdowns)
   - Can calculate for specific run or aggregate
   - Used for: "what's my overall performance?", "calculate win rate"

4. **`suggest_rules`**
   - Suggests structured rules based on problems
   - Pattern matches common issues (drawdowns, overtrading, timing)
   - Used for: "how can I improve?", "what rules should I add?"

### Configuration Tools (NEW - 2025-11-06)

5. **`get_model_config`**
   - Views current model configuration
   - Shows: trading style, margin settings, custom_rules, custom_instructions
   - Used for: "what are my current rules?", "show my config"
   - Returns complete model configuration in readable format

6. **`update_model_rules`** ⚠️ **WRITE ACCESS**
   - Actually modifies model configuration
   - Can update `custom_rules` and/or `custom_instructions`
   - Supports append mode (add to existing) or replace mode
   - Max 2000 characters per field
   - Changes take effect on next run start
   
   **Parameters:**
   - `custom_rules` (str, optional): New custom trading rules
   - `custom_instructions` (str, optional): New custom instructions
   - `append` (bool, default=False): If True, appends to existing. If False, replaces.
   
   **Examples:**
   ```python
   # Replace all rules
   update_model_rules(custom_rules="Max position size: 20%. Always keep 20% cash.")
   
   # Append to existing rules
   update_model_rules(custom_rules="Never hold overnight.", append=True)
   
   # Update just instructions
   update_model_rules(custom_instructions="Focus on momentum breakouts")
   ```

## Tool Usage Pattern

**When user asks to improve the model:**
1. Agent uses `suggest_rules` to analyze and suggest improvements
2. Agent ASKS user if they want to apply suggested rules
3. If user confirms, agent uses `update_model_rules` to apply changes
4. Agent can verify with `get_model_config` to show updated configuration

**Safety:**
- Agent should always ASK before using `update_model_rules`
- Never silently modify configuration
- Confirm what's being changed and why

## Implementation Details

**Files:**
- `backend/agents/tools/get_model_config.py` - View configuration tool
- `backend/agents/tools/update_model_rules.py` - Update configuration tool
- `backend/agents/model_agent_langgraph.py` - Agent initialization with all tools
- `backend/models.py` - ModelInfo and ModelCreate schemas (includes custom_rules fields)
- `backend/services.py` - update_model() function handles database updates
- `backend/main.py` - PUT `/api/models/{model_id}` endpoint

**Database:**
- Table: `models`
- Fields: `custom_rules` (TEXT), `custom_instructions` (TEXT)
- Max length: 2000 characters each
- Migration: `011_add_custom_rules.sql`

**How Rules Are Used:**
- Rules are passed to trading agent via `get_agent_system_prompt()`
- Both daily and intraday agents receive custom_rules and custom_instructions
- Agent incorporates rules into decision-making process
- Structured rules in `model_rules` table (migration 013) for programmatic enforcement

## Tool Access Control

**General Agent Can:**
- ✅ Create new models
- ✅ Suggest configurations
- ✅ Explain features
- 🚫 Cannot update existing models
- 🚫 Cannot analyze trading history

**Model Agent Can:**
- ✅ View model configuration
- ✅ Update model rules/instructions
- ✅ Analyze trades
- ✅ Review AI reasoning
- ✅ Calculate metrics
- ✅ Suggest improvements
- 🚫 Cannot create new models

## Testing

**Test General Agent (Create Model):**
1. Navigate to `/new`
2. Chat: "I want to create a day trading model"
3. Agent uses `suggest_model_configuration`
4. Chat: "Let's create it, name it 'Test Trader'"
5. Agent uses `create_model` → returns new model ID

**Test Model Agent (Update Rules):**
1. Navigate to `/m/{id}/new`
2. Chat: "What are my current rules?"
   - Agent uses `get_model_config` to show configuration
3. Chat: "How can I make this better?"
   - Agent uses `suggest_rules` to analyze and suggest
4. Chat: "Yes, add those rules"
   - Agent uses `update_model_rules` to apply changes
5. Chat: "Show me the updated rules"
   - Agent uses `get_model_config` to confirm

## Next Steps

The agent can now:
- ✅ View all model configuration
- ✅ Suggest improvements based on performance
- ✅ Actually update the model's custom_rules and custom_instructions
- ✅ Verify changes were applied

This gives users conversational control over their trading model configuration without needing to manually edit settings.

