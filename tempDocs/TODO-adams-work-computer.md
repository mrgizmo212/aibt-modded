# TODO: Adam's Work Computer Setup

## Set OPENAI_API_KEY Environment Variable

**Date:** 2025-11-07  
**Status:** Pending (needs to be done on Adam's work computer)

---

## What to Do

On Adam's work computer, set the `OPENAI_API_KEY` environment variable to avoid system env var conflicts with project .env file.

**Command:**
```powershell
[System.Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "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", "User")
```

**Then restart terminal** or set in current session:
```powershell
$env:OPENAI_API_KEY = "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"
```

**Verify:**
```powershell
$env:OPENAI_API_KEY
```

Should return: `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`

---

## Why This Is Needed

- System env vars override .env file
- Old/wrong API key in system env causes 401 errors
- Backend needs correct OpenRouter API key to function
- Setting it system-wide ensures consistency

---

**Delete this file after completing the task on Adam's work computer.**

