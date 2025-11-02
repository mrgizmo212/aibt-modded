"""
Test datetime representations to see what's actually happening
"""

from datetime import datetime, timezone, timedelta

print("=" * 80)
print("DATETIME REPRESENTATION TEST")
print("=" * 80)
print()

# Use a timestamp that should be 15:59 EDT (market close)
# 15:59 EDT = 19:59 UTC
# Unix timestamp for 2025-10-15 19:59:00 UTC

ts_ms = 1760556960000  # milliseconds

print(f"Timestamp (ms): {ts_ms}")
print()

# Step 1: Create UTC datetime
print("Step 1: Create UTC datetime")
print("-" * 40)
ts_utc = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)
print(f"  ts_utc = {ts_utc}")
print(f"  ts_utc.hour = {ts_utc.hour}")
print(f"  ts_utc.minute = {ts_utc.minute}")
print(f"  ts_utc.tzinfo = {ts_utc.tzinfo}")
print(f"  ts_utc.strftime('%H:%M') = '{ts_utc.strftime('%H:%M')}'")
print()

# Step 2: Create EDT timezone
print("Step 2: Create EDT timezone")
print("-" * 40)
edt_tz = timezone(timedelta(hours=-4))
print(f"  edt_tz = {edt_tz}")
print(f"  edt_tz offset = {edt_tz.utcoffset(None)}")
print()

# Step 3: Convert to EDT
print("Step 3: Convert to EDT")
print("-" * 40)
ts_edt = ts_utc.astimezone(edt_tz)
print(f"  ts_edt = {ts_edt}")
print(f"  ts_edt.hour = {ts_edt.hour}")
print(f"  ts_edt.minute = {ts_edt.minute}")
print(f"  ts_edt.tzinfo = {ts_edt.tzinfo}")
print(f"  ts_edt.strftime('%H:%M') = '{ts_edt.strftime('%H:%M')}'")
print()

# Step 4: What should we see?
print("Step 4: Expected result")
print("-" * 40)
print(f"  UTC time: 19:59")
print(f"  EDT time: 15:59 (19:59 - 4 hours)")
print(f"  strftime output: '15:59'")
print()

# Step 5: Comparison
print("Step 5: Does it match?")
print("-" * 40)
result = ts_edt.strftime('%H:%M')
expected = "15:59"
if result == expected:
    print(f"  [OK] MATCH! Got '{result}' as expected")
else:
    print(f"  [X]  MISMATCH! Got '{result}' but expected '{expected}'")
print()

print("=" * 80)

# Now test what the terminal output is showing
print("\nWHY TERMINAL SHOWS 19:59")
print("=" * 80)
print()
print("The terminal output shows:")
print("  'Cached 19:55 (bar 257/261)'")
print("  'Cached 19:56 (bar 258/261)'")
print("  'Cached 19:57 (bar 259/261)'")
print("  'Cached 19:58 (bar 260/261)'")
print("  'Cached 19:59 (bar 261/261)'")
print()
print("These should be:")
print("  'Cached 15:55 (bar 257/261)'")
print("  'Cached 15:56 (bar 258/261)'")
print("  'Cached 15:57 (bar 259/261)'")
print("  'Cached 15:58 (bar 260/261)'")
print("  'Cached 15:59 (bar 261/261)'")
print()

if result == expected:
    print("[?] The conversion code is CORRECT")
    print("    But the terminal shows wrong times")
    print("    Possible reasons:")
    print("    1. The bars themselves have wrong timestamps from Polygon")
    print("    2. There's a different bug in how bars are created")
    print("    3. The aggregation is using wrong timezone")
else:
    print("[X] The conversion code is BROKEN")
    print("    The astimezone() call is not working as expected")

