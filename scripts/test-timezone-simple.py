"""
Simple timezone conversion test
Shows what's being cached vs what we're looking up
"""

from datetime import datetime, timezone, timedelta

print("=" * 80)
print("TIMEZONE CONVERSION TEST")
print("=" * 80)
print()

# Simulate a bar at market close
# Market closes at 4:00 PM EDT (16:00 EDT)
# In UTC, that's 20:00 UTC (16:00 + 4 hours)

print("SCENARIO: Bar at market close (4:00 PM EDT)")
print("-" * 80)

# Use actual timestamp from the terminal output shown
# First trade timestamp: 1760535000008601000 nanoseconds
# Convert to milliseconds: 1760535000008 ms
# This is 09:30 AM EDT on Oct 15, 2025

market_open_nano = 1760535000008601000
market_open_ms = market_open_nano // 1_000_000  # Convert to milliseconds

print(f"1. Polygon timestamp (nanoseconds): {market_open_nano}")
print(f"   Converted to milliseconds: {market_open_ms}")
print()

# STEP 1: What intraday_loader.py does (CACHING)
print("STEP 1: cache_intraday_bars() conversion:")
print("-" * 40)

ts_ms = market_open_ms

# Create UTC datetime
ts_utc = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)
print(f"  ts_utc = {ts_utc}")
print(f"  ts_utc timezone: {ts_utc.tzinfo}")

# Create EDT timezone (UTC-4)
edt_tz = timezone(timedelta(hours=-4))
print(f"  edt_tz offset: {edt_tz}")

# Convert to EDT
ts_edt = ts_utc.astimezone(edt_tz)
print(f"  ts_edt = {ts_edt}")
print(f"  ts_edt timezone: {ts_edt.tzinfo}")

# Format as HH:MM (what we cache)
minute_str_cached = ts_edt.strftime('%H:%M')
print(f"  [OK] CACHED KEY: intraday:model_169:2025-10-15:AAPL:{minute_str_cached}")
print()

# STEP 2: What intraday_agent.py does (RETRIEVAL)
print("STEP 2: _get_session_minutes() + retrieval:")
print("-" * 40)

# Expected minute at market open (EDT)
expected_minute = "09:30"
print(f"  Looking for market open in EDT: {expected_minute}")
print(f"  [OK] LOOKUP KEY: intraday:model_169:2025-10-15:AAPL:{expected_minute}")
print()

# STEP 3: Comparison
print("STEP 3: Do they match?")
print("-" * 40)
if minute_str_cached == expected_minute:
    print("  [OK] MATCH! Keys are identical!")
else:
    print(f"  [X] MISMATCH!")
    print(f"     Cached as: {minute_str_cached}")
    print(f"     Looking for: {expected_minute}")
    print(f"     Difference: {int(minute_str_cached.split(':')[0]) - int(expected_minute.split(':')[0])} hours")

print()
print("=" * 80)

# Test a few more times
print("\nTesting more times:")
print("-" * 80)

test_cases = [
    (1760535000000, "09:30"),  # Market open
    (1760542200000, "11:30"),  # Mid-day
    (1760556900000, "15:59"),  # Market close (corrected timestamp)
]

for ts_ms, expected in test_cases:
    ts_utc = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)
    edt_tz = timezone(timedelta(hours=-4))
    ts_edt = ts_utc.astimezone(edt_tz)
    cached = ts_edt.strftime('%H:%M')
    
    match = "[OK]" if cached == expected else "[X] "
    print(f"{match} Expected {expected} -> Cached {cached} -> UTC {ts_utc.strftime('%H:%M')}")


