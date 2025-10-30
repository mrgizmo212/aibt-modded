# FUTURE: TTG Ecosystem Integration

**Date Noted:** 2025-10-29 20:05  
**Priority:** Future Enhancement (Not Current Sprint)  
**Status:** Documented for Later Implementation

---

## 🎯 **GOAL**

**Integrate AIBT into TTG Ecosystem** as a specialty app (like ttglm and aicharts)

---

## 📋 **CURRENT STATUS**

**AIBT Today (Standalone):**
- ✅ Own authentication (Supabase)
- ✅ Own user management
- ✅ Whitelist-based signup
- ✅ Independent platform
- ✅ Fully functional

**Works perfectly as standalone application.**

---

## 🔮 **FUTURE VISION**

**AIBT After Integration:**

```
MemberPress (truetradinggroup.com)
    ↓ Subscription management
TTG Dashboard (ai.truetradinggroup.com)
    ↓ Central hub
    ├→ ttgai2 (MARI) - AI Chat
    ├→ ttglm - Podcasts
    ├→ aicharts - Charts
    └→ AIBT - AI Trading Platform ← NEW!
```

---

## 🔧 **INTEGRATION REQUIREMENTS (When Ready)**

### **Authentication Changes:**
1. Accept TTG Dashboard JWT tokens
2. Remove standalone signup (use MemberPress)
3. Sync users from WordPress
4. Map TTG tiers to AIBT permissions

### **Backend Changes:**
5. Add TTG token validation
6. Add user sync endpoint (`/api/auth/ttg-sync`)
7. Map WordPress IDs to AIBT users
8. Keep Supabase but add TTG user mapping

### **Frontend Changes:**
9. Handle token from URL (`?token={jwt}&ttg_tok={ttg}`)
10. Remove signup page
11. Update login for TTG tokens
12. Add tier display

### **Database Changes:**
13. Add `wordpress_id` to profiles
14. Add `ttg_tier` field (1-6)
15. Map memberships to features

---

## 📝 **IMPLEMENTATION PLAN (Future)**

**Phase 1: Preparation**
- Study ttglm/aicharts token handling
- Document TTG auth flow completely
- Plan database schema changes

**Phase 2: Backend Integration**
- Add TTG JWT validation
- Create user sync endpoint
- Map tiers to permissions
- Test with TTG Dashboard

**Phase 3: Frontend Updates**
- Add token handler
- Remove signup page
- Update auth flow
- Test complete journey

**Phase 4: Dashboard Integration**
- Add AIBT button to TTG Dashboard sidebar
- Configure token generation
- Add to member navigation
- Test end-to-end

---

## 🎯 **SUCCESS CRITERIA (When Implemented)**

1. ✅ Users access AIBT from TTG Dashboard
2. ✅ No separate signup needed
3. ✅ WordPress subscriptions control access
4. ✅ Tier-based permissions
5. ✅ Seamless authentication
6. ✅ User data synced
7. ✅ Works like other specialty apps

---

## ⏰ **TIMELINE**

**Current:** Focus on completing standalone AIBT
**Next:** Fix remaining frontend issues
**Then:** Polish and finalize standalone version
**Future:** Plan and implement TTG integration

---

## 📚 **REFERENCE DOCUMENTS**

**For Integration (When Ready):**
- `ttg-ecosystem.md` - Complete ecosystem architecture
- `ttglm` codebase - Token handling reference
- `aicharts` codebase - JWT validation reference
- `ttg_next_dashboard` - Token generation logic

---

**Note:** This integration is FUTURE work. First, complete standalone AIBT platform! ✅

**Documented:** 2025-10-29 20:05

