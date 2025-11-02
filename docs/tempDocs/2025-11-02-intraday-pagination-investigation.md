# 2025-11-02 - Intraday Pagination Investigation

## Context
- Task: Diagnose AAPL intraday pagination returning duplicate page 1 results
- Code examined: `backend/intraday_loader.py` (`fetch_all_trades_for_session`), `backend/trading/intraday_agent.py`
- Scripts referenced for background: `scripts/prove-cursor-bug.py`, `scripts/prove-pagination-fix-final.py`

## Observations
- After page 1, `fetch_all_trades_for_session` rebuilds params with only `{cursor, limit}`; timestamp/order filters are dropped, so subsequent calls rely entirely on Polygon cursor.
- For high-volume symbols (AAPL) Polygon responds with identical cursors, causing 50x fetch of page 1; IBM seemingly unaffected (possibly single-page or stable cursor churn).
- Agent pipeline (`run_intraday_session`) always reuses `load_intraday_session`, so repeated data leads to only six aggregated minute bars and truncated trading session.

## Open Questions / Hypotheses
1. Polygon may require `timestamp.gte/lte` (or at least `order`) to remain constant between cursor hops for high-volume instruments; dropping them could invalidate cursor state.
2. Proxy might be caching by path without query differentiation when only cursor is supplied; need to verify how apiv3 proxy forwards encoded cursor values.
3. Fallback idea: detect identical `next_url` / identical first+last timestamps and switch to manual timestamp chunking (e.g., advance `timestamp.gte` to last seen trade + 1ns).

## Suggested Next Steps
- Instrument logging inside `fetch_all_trades_for_session` to capture cursor hash + first/last timestamps per page (see `scripts/prove-cursor-bug.py` for reference structure).
- Experiment with keeping original filters when adding cursor (`params = {"cursor": cursor, **base_filters}`) to confirm whether Polygon advances for AAPL.
- If cursor remains stuck, prototype hourly sub-range fetch (09:30-10:30, 10:30-11:30, etc.) to bypass cursor dependency.

## Outstanding Items
- Need confirmation from up-to-date Polygon docs — web search attempts today returned generic debugging material, no pagination specifics.
- No code changes applied yet; awaiting decision on preferred mitigation (retain filters vs. manual chunking vs. alternative endpoint).


