# AI Model Parameters Configuration

**Date:** 2025-10-31  
**Source:** OpenRouter API + Official Documentation

## Model-Specific Parameters (October 2025)

---

## 🤖 GPT-5 Models (OpenAI)

### GPT-5 Pro / GPT-5 Codex
**New Parameters (Responses API):**
- `verbosity`: `low` | `medium` | `high` - Controls response detail
- `reasoning_effort`: `minimal` | `low` | `medium` | `high` - Depth of reasoning
- `temperature`: **Still supported** (0.0-1.0) - Controls randomness
- `max_tokens`: Integer - Maximum response length
- `top_p`: Float (0.0-1.0) - Nucleus sampling
- `frequency_penalty`: Float (-2.0 to 2.0) - Reduces repetition
- `presence_penalty`: Float (-2.0 to 2.0) - Encourages topic diversity

**Notes:**
- GPT-5 has NEW parameters (verbosity, reasoning_effort) but STILL supports temperature
- Use `verbosity: "high"` + `reasoning_effort: "high"` for trading decisions
- Can mix old and new parameters

**Recommended for Trading:**
```json
{
  "temperature": 0.7,
  "verbosity": "high",
  "reasoning_effort": "high",
  "max_tokens": 4000
}
```

---

### o3-mini (Reasoning Model)
**Parameters:**
- `reasoning_effort`: `minimal` | `low` | `medium` | `high` - **PRIMARY PARAMETER**
- `max_tokens`: Integer
- **NO temperature** - Reasoning models use deterministic logic

**Recommended for Trading:**
```json
{
  "reasoning_effort": "high",
  "max_tokens": 4000
}
```

---

### GPT-4.5 Orion / GPT-4o / GPT-4o Mini
**Standard Parameters:**
- `temperature`: 0.0-2.0 (default: 1.0)
- `max_tokens`: Integer
- `top_p`: 0.0-1.0 (default: 1.0)
- `frequency_penalty`: -2.0 to 2.0
- `presence_penalty`: -2.0 to 2.0
- `stop`: String or array of strings

**Recommended for Trading:**
```json
{
  "temperature": 0.7,
  "max_tokens": 4000,
  "top_p": 0.9
}
```

---

## 🧠 Claude Models (Anthropic)

### Claude Sonnet 4.5 / Claude Haiku 4.5 / Claude Sonnet 3.7
**Parameters:**
- `temperature`: 0.0-1.0 (default: 1.0)
- `max_tokens`: Integer (required)
- `top_p`: 0.0-1.0
- `top_k`: Integer (1-500) - Anthropic-specific
- `stop_sequences`: Array of strings

**Notes:**
- Claude requires `max_tokens` to be explicitly set
- `top_k` is Claude-specific parameter (limits vocabulary sampling)

**Recommended for Trading:**
```json
{
  "temperature": 0.7,
  "max_tokens": 4096,
  "top_p": 0.9,
  "top_k": 250
}
```

---

### Claude 3.5 Sonnet / Claude 3 Opus / Claude 3 Haiku
**Parameters:** Same as Claude 4.5 above

---

## 🌐 Google Models

### Gemini Pro 2.5 / Gemini 2.5 Flash / Gemini 2.0 Pro
**Parameters:**
- `temperature`: 0.0-2.0 (default: 1.0)
- `max_output_tokens`: Integer
- `top_p`: 0.0-1.0
- `top_k`: Integer
- `stop_sequences`: Array of strings
- `candidate_count`: Integer (1-8) - Number of response candidates

**Notes:**
- Uses `max_output_tokens` instead of `max_tokens`
- Supports multiple candidates

**Recommended for Trading:**
```json
{
  "temperature": 0.8,
  "max_output_tokens": 8192,
  "top_p": 0.95,
  "top_k": 40
}
```

---

## 🚀 xAI Models

### Grok 4 / Grok 3
**Parameters:**
- `temperature`: 0.0-2.0
- `max_tokens`: Integer
- `top_p`: 0.0-1.0
- `frequency_penalty`: Float
- `presence_penalty`: Float

**Special Features:**
- Real-time web search capability
- Can set `web_search: true` for live data

**Recommended for Trading:**
```json
{
  "temperature": 0.7,
  "max_tokens": 4000,
  "web_search": true
}
```

---

## 🇨🇳 DeepSeek Models

### DeepSeek V3.1 Terminus / DeepSeek V3
**Parameters:**
- `temperature`: 0.0-2.0
- `max_tokens`: Integer
- `top_p`: 0.0-1.0
- `frequency_penalty`: Float
- `presence_penalty`: Float

**Modes:**
- Thinking mode (slower, deeper reasoning)
- Non-thinking mode (faster responses)

**Recommended for Trading:**
```json
{
  "temperature": 0.7,
  "max_tokens": 4000,
  "top_p": 0.9
}
```

---

## 🧬 Qwen Models

### QwQ-32B (Reasoning) / Qwen 3 Next 80B
**Parameters:**
- `temperature`: 0.0-2.0
- `max_tokens`: Integer
- `top_p`: 0.0-1.0
- `repetition_penalty`: Float (> 0.0)

**Notes:**
- QwQ is reasoning-focused (similar to o3-mini)
- Use lower temperature for reasoning models

**Recommended for Trading:**
```json
{
  "temperature": 0.5,
  "max_tokens": 4000,
  "top_p": 0.9
}
```

---

## 🦙 Meta & Nvidia Models

### Llama 3.3 Nemotron 49B / Llama 3.3 70B
**Parameters:**
- `temperature`: 0.0-2.0
- `max_tokens`: Integer
- `top_p`: 0.0-1.0
- `frequency_penalty`: Float
- `presence_penalty`: Float
- `repetition_penalty`: Float

**Recommended for Trading:**
```json
{
  "temperature": 0.7,
  "max_tokens": 4000,
  "top_p": 0.9
}
```

---

## 📊 Universal OpenRouter Parameters

All models through OpenRouter support:
- `model`: String (required)
- `messages`: Array (required)
- `max_tokens`: Integer
- `temperature`: Float (most models)
- `top_p`: Float
- `stream`: Boolean
- `stop`: String or array

**OpenRouter-Specific Headers:**
```http
Authorization: Bearer sk-or-v1-...
HTTP-Referer: https://yourdomain.com
X-Title: Your App Name
```

---

## 🎯 Recommended Trading Configurations

### For GPT-5 Models
```python
{
    "model": "openai/gpt-5-pro",
    "verbosity": "high",
    "reasoning_effort": "high",
    "temperature": 0.7,
    "max_tokens": 4000
}
```

### For Claude 4.5 Models
```python
{
    "model": "anthropic/claude-sonnet-4.5",
    "temperature": 0.7,
    "max_tokens": 4096,
    "top_p": 0.9,
    "top_k": 250
}
```

### For Gemini 2.5 Models
```python
{
    "model": "google/gemini-pro-2.5",
    "temperature": 0.8,
    "max_output_tokens": 8192,
    "top_p": 0.95
}
```

### For Reasoning Models (o3-mini, QwQ)
```python
{
    "model": "openai/o3-mini",
    "reasoning_effort": "high",
    "max_tokens": 4000
    # NO temperature for pure reasoning models
}
```

### For Grok 4 (with web search)
```python
{
    "model": "xai/grok-4",
    "temperature": 0.7,
    "max_tokens": 4000,
    "web_search": true
}
```

---

## ⚠️ Important Notes

### Temperature Usage
- ✅ **GPT-5 Pro/Codex**: STILL uses temperature (not deprecated)
- ❌ **o3-mini**: Does NOT use temperature (reasoning-only)
- ❌ **QwQ-32B**: Lower temp recommended for reasoning
- ✅ **All other models**: Use temperature normally

### Model-Specific Quirks
1. **Claude models**: Require `max_tokens` explicitly set
2. **Gemini models**: Use `max_output_tokens` not `max_tokens`
3. **GPT-5**: Can combine old params (temp) with new (verbosity/reasoning)
4. **Grok**: Has unique `web_search` parameter
5. **Reasoning models**: Prefer deterministic (no temp or low temp)

---

## 🔧 Implementation

When calling models via OpenRouter, detect model type and apply appropriate parameters:

```typescript
function getModelConfig(modelId: string) {
  if (modelId.includes('gpt-5-pro') || modelId.includes('gpt-5-codex')) {
    return {
      temperature: 0.7,
      verbosity: 'high',
      reasoning_effort: 'high',
      max_tokens: 4000
    }
  }
  
  if (modelId.includes('o3-mini') || modelId.includes('qwq')) {
    return {
      reasoning_effort: 'high',
      max_tokens: 4000
      // No temperature
    }
  }
  
  if (modelId.includes('claude')) {
    return {
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 0.9
    }
  }
  
  if (modelId.includes('gemini')) {
    return {
      temperature: 0.8,
      max_output_tokens: 8192,
      top_p: 0.95
    }
  }
  
  if (modelId.includes('grok')) {
    return {
      temperature: 0.7,
      max_tokens: 4000,
      web_search: true
    }
  }
  
  // Default for other models
  return {
    temperature: 0.7,
    max_tokens: 4000,
    top_p: 0.9
  }
}
```

---

## 📚 Sources

- OpenAI GPT-5 Cookbook: https://cookbook.openai.com/examples/gpt-5/
- OpenRouter API Docs: https://openrouter.ai/docs
- Anthropic Claude API: https://docs.anthropic.com/
- Google Gemini API: https://ai.google.dev/
- xAI Grok API: https://docs.x.ai/

---

**Last Updated:** 2025-10-31

