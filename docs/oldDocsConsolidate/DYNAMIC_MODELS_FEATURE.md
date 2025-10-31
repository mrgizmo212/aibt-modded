# Dynamic AI Models Feature

**Date:** 2025-10-31  
**Status:** ✅ Complete

## What Was Added

Added the ability to **fetch available AI models dynamically from OpenRouter** instead of hardcoding them in the frontend.

---

## 🔧 Changes Made

### **Backend: New Endpoint**
**File:** `backend/main.py`

Added `GET /api/available-models` endpoint that:
- ✅ Fetches models from OpenRouter API (`https://openrouter.ai/api/v1/models`)
- ✅ Filters for text-generation models (GPT, Claude, Gemini, Llama, etc.)
- ✅ Returns model ID, name, provider, context length, pricing
- ✅ Limits to top 50 relevant models
- ✅ Has fallback hardcoded list if API fails
- ✅ Handles errors gracefully

**Response Format:**
```json
{
  "models": [
    {
      "id": "openai/gpt-4o",
      "name": "GPT-4o",
      "provider": "openai",
      "context_length": 128000,
      "pricing": {...}
    }
  ],
  "total": 50,
  "source": "openrouter",
  "cached": false
}
```

### **Frontend: API Function**
**File:** `frontend/lib/api.ts`

Added `fetchAvailableModels()` function to call the backend endpoint.

### **Frontend: Constants Updated**
**File:** `frontend/lib/constants.ts`

- Renamed `AVAILABLE_MODELS` → `FALLBACK_MODELS`
- These are now fallback models (used if API fails)
- Can be overridden with API response

---

## 🚀 How to Use

### **Option 1: Fetch Models on App Load** (Recommended)

Update your root layout or auth context to fetch models once:

```typescript
// In layout.tsx or a context provider
import { fetchAvailableModels } from '@/lib/api'
import { useEffect, useState } from 'react'

const [models, setModels] = useState(FALLBACK_MODELS)

useEffect(() => {
  async function loadModels() {
    try {
      const data = await fetchAvailableModels()
      setModels(data.models)
    } catch (error) {
      console.error('Failed to fetch models, using fallback')
    }
  }
  loadModels()
}, [])
```

### **Option 2: Test the Endpoint**

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/available-models"
```

**cURL:**
```bash
curl http://localhost:8080/api/available-models
```

---

## 📋 What You Get

### **Real-time Models**
- Latest models from OpenRouter
- New models automatically available
- No need to update frontend code

### **Fallback Protection**
- If OpenRouter API is down → uses hardcoded fallback
- If network fails → uses hardcoded fallback
- Always functional, never breaks

### **Model Information**
- **ID** - OpenRouter model identifier
- **Name** - Human-readable name
- **Provider** - openai, anthropic, google, meta, etc.
- **Context Length** - Token limit
- **Pricing** - Cost per token (if available)

---

## 🎯 Benefits

### **Before (Hardcoded):**
- ❌ Had to manually update constants file
- ❌ New models required code deployment
- ❌ Outdated model lists
- ❌ No pricing information

### **After (Dynamic):**
- ✅ Models update automatically
- ✅ Always shows latest available models
- ✅ Includes pricing and context info
- ✅ No code changes needed for new models
- ✅ Still works offline (fallback)

---

## 🧪 Testing

1. **Start backend:** `cd aibt-modded/backend ; python main.py`
2. **Test endpoint:**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:8080/api/available-models"
   ```
3. **Should return:** 50+ models from OpenRouter

---

## 🔮 Future Enhancements

### **Model Caching**
Add Redis caching to avoid hitting OpenRouter API every time:
```python
# Cache for 1 hour
cache_key = "available_models"
cached = redis.get(cache_key)
if cached:
    return json.loads(cached)
    
# Fetch and cache
models = fetch_from_openrouter()
redis.setex(cache_key, 3600, json.dumps(models))
```

### **Model Filtering**
Add query parameters for filtering:
```
GET /api/available-models?provider=openai
GET /api/available-models?min_context=32000
GET /api/available-models?max_price=0.01
```

### **Model Recommendations**
Suggest best models for trading based on:
- Performance history
- Cost efficiency
- Win rate
- Speed

### **Model Comparison**
Show side-by-side comparison:
- Context length
- Pricing
- Speed
- Best use cases

---

## 📝 Files Modified

1. ✅ `backend/main.py` - Added `/api/available-models` endpoint
2. ✅ `frontend/lib/api.ts` - Added `fetchAvailableModels()` function
3. ✅ `frontend/lib/constants.ts` - Renamed to `FALLBACK_MODELS`

---

## 🎉 Summary

You now have:
- ✅ Dynamic model fetching from OpenRouter
- ✅ 50+ AI models automatically available
- ✅ Fallback protection if API fails
- ✅ Model metadata (context, pricing)
- ✅ No manual updates needed

**The AI model list is now dynamic and always up-to-date!** 🚀

