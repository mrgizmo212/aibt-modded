# API Key Authentication - Added to Backend

**Date:** 2025-11-02  
**Status:** ✅ COMPLETE

---

## 🎯 WHAT WAS ADDED

**Dual authentication support for FastAPI backend:**
- ✅ JWT Bearer tokens (Supabase Auth) - For web app users
- ✅ API Keys via `X-API-Key` header - For programmatic access

---

## 🔐 API KEY DETAILS

**Current API Key:** `customkey1`

**Key Info:**
- **Name:** Default API Key
- **Role:** admin (full access)
- **Email:** api@truetradinggroup.com
- **Access:** All endpoints

---

## 📊 FILES MODIFIED

**File:** `backend/auth.py`

### **Changes:**

**1. Added API Key support (lines 16-25):**
```python
# Security schemes
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

# Valid API keys
VALID_API_KEYS = {
    "customkey1": {
        "name": "Default API Key",
        "role": "admin",
        "email": "api@truetradinggroup.com"
    }
}
```

**2. Added API key verification (lines 190-211):**
```python
def verify_api_key(api_key: Optional[str] = Security(api_key_header)) -> Optional[Dict[str, Any]]:
    if not api_key:
        return None
    
    if api_key in VALID_API_KEYS:
        key_info = VALID_API_KEYS[api_key]
        return {
            "id": f"apikey_{api_key[:8]}",
            "email": key_info["email"],
            "role": key_info["role"]
        }
    
    return None
```

**3. Combined authentication function (lines 214-278):**
```python
async def get_current_user_or_api_key(
    api_key: Optional[str] = Security(api_key_header),
    bearer_credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> Dict[str, Any]:
    # Try API key first
    if api_key and api_key in VALID_API_KEYS:
        return api_key_user_info
    
    # Fall back to JWT
    if bearer_credentials:
        return jwt_user_info
    
    # Reject if neither provided
    raise HTTPException(401, "Authentication required")
```

**4. Updated dependencies (lines 281-291):**
```python
# Now uses get_current_user_or_api_key
async def require_auth(current_user: Dict[str, Any] = Depends(get_current_user_or_api_key)):
    return current_user

async def require_admin(current_user: Dict[str, Any] = Depends(get_current_user_or_api_key)):
    if not is_admin(current_user.get("role", "")):
        raise HTTPException(403, "Admin access required")
    return current_user
```

---

## 🧪 TESTING

**Test Script:** `scripts/test-api-key-auth.py`

**Run it:**
```powershell
python scripts/test-api-key-auth.py
```

**Tests:**
1. ✅ Get models with valid API key
2. ✅ Get trading status with valid API key
3. ✅ Invalid API key is rejected (401)
4. ✅ No authentication is rejected (401)

---

## 📝 USAGE

### **Option 1: Using curl**
```bash
# Get models
curl http://localhost:8080/api/models \
  -H 'X-API-Key: customkey1'

# Start trading
curl http://localhost:8080/api/trading/start/{model_id} \
  -X POST \
  -H 'X-API-Key: customkey1' \
  -H 'Content-Type: application/json' \
  -d '{"base_model":"openai/gpt-5","start_date":"2025-10-21","end_date":"2025-10-21"}'
```

### **Option 2: Using Python requests**
```python
import requests

headers = {"X-API-Key": "customkey1"}

# Get models
response = requests.get("http://localhost:8080/api/models", headers=headers)
models = response.json()

# Start trading
response = requests.post(
    f"http://localhost:8080/api/trading/start/{model_id}",
    headers=headers,
    json={
        "base_model": "openai/gpt-5",
        "start_date": "2025-10-21",
        "end_date": "2025-10-21"
    }
)
```

### **Option 3: Frontend still uses JWT** (no changes needed)
```typescript
// Frontend auth-context.tsx automatically uses JWT
// No changes needed - JWT authentication still works!
```

---

## 🔒 SECURITY NOTES

**Current Implementation (Development):**
- ⚠️ API key hardcoded in code (`customkey1`)
- ⚠️ Single key with admin access
- ⚠️ Not suitable for production

**Production Recommendations:**
1. **Store keys in environment variables**
   ```python
   VALID_API_KEYS = {
       os.getenv("API_KEY_1"): {...},
       os.getenv("API_KEY_2"): {...}
   }
   ```

2. **Store keys in database**
   - Table: `api_keys` with columns: key, name, role, created_at, expires_at
   - Query database to verify keys
   - Support key rotation

3. **Add key expiration**
   - Set expiration dates
   - Auto-revoke expired keys

4. **Add rate limiting**
   - Prevent abuse
   - Track usage per key

5. **Add per-key permissions**
   - Some keys read-only
   - Some keys full access
   - Granular control

---

## ✅ BENEFITS

**For Development:**
- ✅ Easy testing without Supabase login
- ✅ Scripts can access API directly
- ✅ CLI tools can automate tasks
- ✅ External integrations possible

**For Production:**
- ✅ Service-to-service authentication
- ✅ Third-party integrations
- ✅ Webhook callbacks
- ✅ Monitoring tools

---

## 🎯 AUTHENTICATION FLOW

**Request comes in:**
1. Check for `X-API-Key` header → If valid, authenticate as API key user
2. Check for `Authorization: Bearer <token>` header → If valid, authenticate as JWT user
3. If neither → Reject with 401

**Priority: API key first, then JWT**

---

**API key authentication is now live! Test with the script to verify.** 🎯

