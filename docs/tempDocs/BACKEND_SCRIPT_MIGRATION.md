# Backend Script Organization - Migration Plan

**Date:** 2025-10-31

## Scripts to Move to `/backend/scripts/`

### Python Test Scripts (15 files)
1. test_mcp_concurrent_timeout.py
2. test_redis_connection.py
3. test_proxy_response_structure.py
4. test_openrouter_key.py
5. test_openrouter_simple.py
6. test_multi_user_fix.py
7. test_initial_cash_feature.py
8. test_model_parameters.py
9. test_intraday_data_fetch.py
10. test_cash_validation.py
11. test_cash_validation_real.py
12. TEST_SUPABASE_CONNECTION.py
13. TEST_MCP_SERVICES.py
14. TEST_LOG_MIGRATION.py
15. TEST_FIXES.py

### Python Utility Scripts (12 files)
16. VERIFY_LOG_MIGRATION.py
17. VERIFY_BUGS.py
18. PROVE_CALCULATION.py
19. FIX_LOG_MIGRATION.py
20. FIX_BUGS.py
21. FIND_ALL_REMAINING_BUGS.py
22. apply_migration_006.py
23. apply_migration_007.py
24. apply_migration_008.py
25. apply_migration_009.py
26. check_models.py
27. migrate_data.py

### PowerShell Scripts (6 files)
28. FIX_ALL_ISSUES.ps1
29. RUN_ALL_FIXES.ps1
30. TEST_ALL_ENDPOINTS.ps1
31. test_all.ps1
32. TEST_BACKEND.ps1
33. TEST_COMPLETE.ps1

### SQL Scripts (2 files)
34. FIX_ALL_ISSUES.sql
35. RESET_TRADING_DATA.sql

**Total: 35 files**

## Import Adjustments Needed

When moving from `/backend/*.py` to `/backend/scripts/*.py`, all imports need adjustment:

**Before (in /backend):**
```python
import sys
import os
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

from config import settings
from services import get_model_by_id
```

**After (in /backend/scripts):**
```python
import sys
import os
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from config import settings
from services import get_model_by_id
```

**Key change:** `os.path.dirname()` called TWICE to go up one more level.

