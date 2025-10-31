# 🎯 Custom Rules & Instructions Feature

**Date:** 2025-10-31  
**Status:** ✅ COMPLETE

---

## 🎯 Overview

Users can now define **custom trading rules** and **custom instructions** for each model:

- **No rules/instructions** → AI uses default trading behavior
- **With rules** → AI MUST follow specific trading rules (overrides defaults)
- **With instructions** → AI considers strategy guidance
- **Both** → AI follows rules strictly AND considers instructions

---

## 📁 Files Created/Modified

### **Backend:**
1. ✅ `migrations/011_add_custom_rules.sql` - Database columns
2. ✅ `models.py` - Added custom_rules, custom_instructions fields
3. ✅ `services.py` - Updated create/update to handle rules
4. ✅ `main.py` - Updated endpoints to save/retrieve rules
5. ✅ `trading/agent_prompt.py` - Appends custom rules to system prompt
6. ✅ `trading/base_agent.py` - Accepts and stores custom rules
7. ✅ `trading/agent_manager.py` - Passes custom rules to agent

### **Frontend:**
8. ✅ `types/api.ts` - Added custom_rules, custom_instructions types
9. ✅ `lib/api.ts` - Updated create/update functions
10. ✅ `app/models/create/page.tsx` - Added textareas for rules/instructions
11. ✅ `app/models/[id]/page.tsx` - Added to edit modal

---

## 🗄️ Database Schema

### **New Columns in `models` Table:**
```sql
custom_rules TEXT               -- Custom trading rules (up to 2000 chars)
custom_instructions TEXT        -- Custom strategy instructions (up to 2000 chars)
```

**Migration 011:**
```sql
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS custom_rules TEXT;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS custom_instructions TEXT;
```

---

## 🎨 Frontend UI

### **Model Creation Page**
**New Sections Added:**

#### 1. **Custom Trading Rules** (Optional)
- Textarea with 2000 character limit
- Placeholder: "Only trade tech stocks. Never hold more than 5 positions. Take profit at 10%. Use stop-loss at -5%."
- Character counter
- Monospace font for clarity

#### 2. **Custom Instructions** (Optional)
- Textarea with 2000 character limit
- Placeholder: "Focus on value investing. Prefer companies with P/E ratio under 20. Analyze market sentiment before each trade."
- Character counter
- Monospace font for clarity

#### 3. **Info Banner**
Explains how rules/instructions work:
- No rules/instructions → Default behavior
- With rules → AI follows rules
- With instructions → AI considers guidance
- Both → Follows rules + considers instructions

### **Edit Modal**
Both textareas also added to the edit modal for updating existing models.

---

## 🤖 Agent Integration

### **How It Works:**

**1. User Creates Model:**
```typescript
{
  name: "Tech Growth Strategy",
  custom_rules: "Only trade FAANG stocks. Max 5 positions. Take profit at 15%.",
  custom_instructions: "Focus on growth stocks with strong earnings."
}
```

**2. Saved to Database:**
```sql
INSERT INTO models (..., custom_rules, custom_instructions) VALUES
(..., 'Only trade FAANG stocks...', 'Focus on growth stocks...');
```

**3. Agent Starts Trading:**
```python
# Agent manager loads model data
custom_rules = model_data.get("custom_rules")
custom_instructions = model_data.get("custom_instructions")

# Passes to BaseAgent
agent = BaseAgent(
    signature=signature,
    basemodel=basemodel,
    custom_rules=custom_rules,
    custom_instructions=custom_instructions
)
```

**4. System Prompt Generated:**
```python
# Base prompt (default behavior)
base_prompt = agent_system_prompt.format(...)

# If custom_rules provided:
base_prompt += """
🎯 CUSTOM TRADING RULES (MUST FOLLOW):
Only trade FAANG stocks. Max 5 positions. Take profit at 15%.

These are MANDATORY rules you MUST follow. Override default behavior if these conflict.
"""

# If custom_instructions provided:
base_prompt += """
📋 CUSTOM STRATEGY INSTRUCTIONS:
Focus on growth stocks with strong earnings.

Consider these instructions when making trading decisions.
"""
```

**5. AI Follows Custom Behavior:**
- Agent sees custom rules in system prompt
- Agent MUST follow rules (overrides default)
- Agent considers instructions (guides strategy)

---

## 📋 Examples

### **Example 1: Conservative Strategy**
```
Rules: 
"Never trade more than 3 stocks at once. 
Take profit at 8%. 
Use strict stop-loss at -3%. 
Only buy when RSI < 30."

Instructions:
"Prefer blue-chip stocks with market cap > $100B. 
Focus on dividend-paying companies."
```

### **Example 2: Aggressive Growth**
```
Rules:
"Focus on high-growth tech stocks. 
Hold up to 10 positions. 
Take profit at 20%. 
No stop-loss (ride out dips)."

Instructions:
"Target companies with revenue growth > 30% YoY. 
Look for disruptive technologies."
```

### **Example 3: Sector Rotation**
```
Rules:
"Only trade one sector at a time. 
Rotate sectors weekly. 
Equal weight all positions."

Instructions:
"Start with technology sector. 
Analyze sector momentum before rotating."
```

### **Example 4: Value Investing**
```
Rules:
"Only stocks with P/E < 15. 
Minimum market cap $10B. 
Hold minimum 30 days."

Instructions:
"Look for undervalued companies with strong fundamentals. 
Buy when market overreacts to bad news."
```

---

## 🎛️ Behavior Logic

### **Priority:**
```
1. Custom Rules (if provided) - MUST FOLLOW
2. Custom Instructions (if provided) - CONSIDER
3. Default AI Behavior - FALLBACK
```

### **Scenarios:**

| Custom Rules | Custom Instructions | AI Behavior |
|---|---|---|
| ❌ None | ❌ None | Uses default trading logic |
| ✅ Provided | ❌ None | Follows rules strictly |
| ❌ None | ✅ Provided | Considers instructions |
| ✅ Provided | ✅ Provided | Follows rules + considers instructions |

---

## ✅ What's Working

### **Frontend:**
- ✅ Textareas in model creation page
- ✅ Textareas in edit modal
- ✅ 2000 character limit
- ✅ Character counter
- ✅ Info banner explaining usage
- ✅ Saves to database

### **Backend:**
- ✅ Database columns created
- ✅ API endpoints updated
- ✅ Agent prompt generator updated
- ✅ Custom rules appended to system prompt
- ✅ Agent receives and uses custom behavior

### **Agent:**
- ✅ Reads custom rules from database
- ✅ Appends to system prompt
- ✅ Follows rules during trading
- ✅ Falls back to default if no custom rules

---

## 📝 Next Steps

### **1. Run Migration 011:**
```sql
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS custom_rules TEXT;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS custom_instructions TEXT;
```

**Run in Supabase Dashboard SQL Editor**

### **2. Restart Backend**
```powershell
cd aibt-modded\backend
python main.py
```

### **3. Test**
1. Go to `/models/create`
2. Fill in custom rules and/or instructions
3. Create model
4. Start trading
5. Check logs to see custom rules in system prompt

---

## 🎉 Summary

**You can now:**
- ✅ Define custom trading rules per model
- ✅ Provide strategy instructions per model
- ✅ Override default AI behavior
- ✅ Create specialized trading strategies
- ✅ Edit rules anytime
- ✅ Save configurations in database
- ✅ Agent automatically follows custom rules

**Examples:**
- Day trading strategy with strict rules
- Value investing with fundamental analysis
- Momentum trading with technical indicators
- Sector rotation with custom logic
- Conservative vs aggressive profiles

**The AI will follow YOUR rules!** 🎯

