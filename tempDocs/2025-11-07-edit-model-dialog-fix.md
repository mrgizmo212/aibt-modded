# Edit Model Dialog Fix - 2025-11-07 16:35

## BUG-026: Controlled to Uncontrolled Input Error

**Problem:**
Clicking "Edit Model" button caused React error:
```
A component is changing a controlled input to be uncontrolled.
value changing from defined to undefined
```

**Root Cause:**
useEffect that loads model data was missing two fields that exist in initial useState:
- `max_position_size_dollars`
- `max_daily_loss_dollars`

When effect fired, these fields became `undefined`, causing controlled inputs to become uncontrolled.

**Fix Applied:**
Added the two missing fields to the useEffect's setFormData call at lines 136-137.

**Files Modified:**
- `frontend-v2/components/model-edit-dialog.tsx` - Lines 136-137

**Result:**
✅ Edit Model dialog opens without errors
✅ All input fields remain controlled
✅ No undefined values

---

**Session Status:** Complete

