# External Project Integration: aitrtader

**Last Updated:** 2025-10-29 10:35  
**Integration Type:** Read-Only Data Consumer

---

## Project Relationship

**AIBT (this project)** is a visualization frontend for **aitrtader** (AI trading system).

```
┌─────────────────────────────────────────────────────┐
│  aitrtader/ (Context Project)                       │
│  - Autonomous AI trading system                     │
│  - Generates trading data (JSONL files)             │
│  - Provides calculation utilities (Python modules)  │
└─────────────┬───────────────────────────────────────┘
              │ Read-Only Access
              │ (File System + Python Imports)
              ▼
┌─────────────────────────────────────────────────────┐
│  aibt/ (This Project)                               │
│  - Next.js dashboard frontend                       │
│  - FastAPI backend adapter                          │
│  - Visualizes aitrtader data                        │
└─────────────────────────────────────────────────────┘
```

---

## Integration Points

### 1. Python Module Imports

**FILE:** `aibt/backend/services.py`

**Imports from aitrtader:**
```python
# Add aitrtader to Python path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "aitrtader"))

# Import calculation logic
from tools.result_tools import (
    calculate_all_metrics,           # Performance calculations
    get_daily_portfolio_values,      # Portfolio value over time
    get_available_date_range         # Date range helper
)

from tools.price_tools import (
    get_latest_position,             # Latest position reader
    all_nasdaq_100_symbols           # Stock symbol list
)
```

**Why:** Reuses tested calculation logic, ensures consistency

**Impact:** Changes to aitrtader/tools/ affect aibt backend

---

### 2. Data File Access

**FILE:** `aibt/backend/services.py`

**Reads from aitrtader data:**
```python
# Path to aitrtader data
aitrtader_path = Path(__file__).parent.parent.parent / "aitrtader"
data_dir = aitrtader_path / "data" / "agent_data"
merged_data = aitrtader_path / "data" / "merged.jsonl"

# Read JSONL files
position_file = data_dir / "{model}" / "position" / "position.jsonl"
log_file = data_dir / "{model}" / "log" / "{date}" / "log.jsonl"
```

**Why:** Visualizes the data AI agents generate

**Impact:** Data schema changes in aitrtader affect aibt parsing

---

### 3. Configuration Reference

**aitrtader Configuration:**
- `.env` - API keys, ports
- `configs/default_config.json` - Model list, date ranges
- `.runtime_env.json` - Current trading state

**aibt reads:**
- Model signatures from `data/agent_data/` directory names
- Date ranges from position.jsonl files
- Does NOT read aitrtader configuration files directly

---

## Data Flow

```
aitrtader Trading Session:
  main.py runs → AI agent trades → Writes to position.jsonl & log.jsonl

aibt Backend (FastAPI):
  Reads position.jsonl & log.jsonl → Calculates metrics → Exposes REST API

aibt Frontend (Next.js):
  Fetches from REST API → Renders charts & tables → User views dashboard
```

**No circular dependencies** - aibt consumes aitrtader output, never writes back

---

## Compatibility Requirements

### aitrtader Version:
- **Minimum:** Any version with `tools/result_tools.py` and `tools/price_tools.py`
- **Tested:** Version from 2025-10-29 session
- **Data Format:** JSONL with documented schema

### Data Schema Dependencies:

**position.jsonl format:**
```json
{
  "date": "YYYY-MM-DD",
  "id": number,
  "this_action": {...},
  "positions": {
    "SYMBOL": shares,
    "CASH": amount
  }
}
```

**log.jsonl format:**
```json
{
  "timestamp": "ISO8601",
  "signature": "model-name",
  "new_messages": [...]
}
```

**If aitrtader changes these schemas, aibt must be updated.**

---

## Breaking Changes to Watch For

### In aitrtader:

1. **tools/result_tools.py function signatures change**
   - Impact: aibt/backend/services.py must update imports
   - Fix: Update function calls in services.py

2. **JSONL schema changes**
   - Impact: aibt parsing breaks
   - Fix: Update backend/services.py and frontend TypeScript types

3. **Data directory structure changes**
   - Impact: aibt can't find files
   - Fix: Update paths in backend/services.py

4. **Calculation logic changes**
   - Impact: Metrics differ between aitrtader and aibt
   - Fix: No action needed (automatically synced via imports)

---

## File System Assumptions

**aibt assumes:**
1. `aitrtader/` exists at `../aitrtader` (sibling directory)
2. `aitrtader/data/agent_data/` contains model directories
3. Each model dir has `position/` and `log/` subdirectories
4. JSONL files are well-formed (one JSON object per line)
5. aitrtader tools are importable via sys.path manipulation

**If any assumption breaks, aibt backend will fail gracefully** (empty data returned, not crashes)

---

## Testing Integration

**To test aibt independently:**
1. Must have aitrtader with trading data
2. At least one model must have position.jsonl file
3. Recommended: Run aitrtader once to generate sample data

**To test without aitrtader:**
- Create mock data in aibt/backend/test_data/
- Modify services.py to read from test_data/ instead
- Not recommended for production

---

## Monitoring Integration Health

**Check if integration is working:**

```powershell
# Test FastAPI can import aitrtader modules
cd C:\Users\User\Desktop\CS1027\aibt\backend
python -c "import sys; sys.path.insert(0, '../../aitrtader'); from tools.result_tools import calculate_all_metrics; print('✅ Import successful')"

# Test FastAPI can read aitrtader data
curl http://localhost:8080/api/models
# Should return list of models from aitrtader/data/agent_data/
```

**If import fails:**
- Check aitrtader directory exists
- Check tools/ directory exists in aitrtader
- Check Python dependencies match (numpy, pandas)

**If data read fails:**
- Check data/agent_data/ directory exists
- Check at least one model has position.jsonl
- Check file permissions (read access)

---

## Future Integration Considerations

**If aitrtader moves to database storage:**
- aibt backend would connect to same database
- No JSONL file reading needed
- API endpoints remain same (abstraction layer)

**If aitrtader becomes multi-instance:**
- aibt could aggregate data from multiple aitrtader deployments
- Would need instance identifier in data paths

**If aitrtader adds authentication:**
- aibt backend might need to authenticate to access data
- Currently assumes local filesystem access

---

**END OF CONNECTION OVERVIEW DOCUMENTATION**

*This document describes the integration between aibt and aitrtader as of 2025-10-29.*

