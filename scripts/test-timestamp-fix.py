"""
TEST: Timestamp Range Calculation Fix

Shows current bug, proposed fix, and verification.
"""

from datetime import datetime, timezone, timedelta

print("=" * 80)
print("TIMESTAMP RANGE CALCULATION - BUG vs FIX")
print("=" * 80)
print()

# Test parameters
date = "2025-10-15"
session = "regular"
year, month, day = map(int, date.split("-"))

print(f"Testing for: {date}, {session} session")
print()

# ============================================================================
# CURRENT CODE (BUGGY)
# ============================================================================

print("CURRENT CODE (BUGGY):")
print("-" * 80)

et_offset = -4  # EDT offset

# Regular session: 9:30 AM - 4:00 PM EDT
start_hour, start_min = 9, 30
end_hour, end_min = 16, 0

# Current calculation
print(f"\nCalculation:")
print(f"  start_hour - et_offset = {start_hour} - ({et_offset}) = {start_hour - et_offset}")
print(f"  end_hour - et_offset = {end_hour} - ({et_offset}) = {end_hour - et_offset}")

start_dt_old = datetime(year, month, day, start_hour - et_offset, start_min, tzinfo=timezone.utc)
end_dt_old = datetime(year, month, day, end_hour - et_offset, end_min, tzinfo=timezone.utc)

print(f"\nResult:")
print(f"  Start: {start_dt_old} ({start_dt_old.strftime('%Y-%m-%d %H:%M')} UTC)")
print(f"  End:   {end_dt_old} ({end_dt_old.strftime('%Y-%m-%d %H:%M')} UTC)")

start_nano_old = int(start_dt_old.timestamp() * 1_000_000_000)
end_nano_old = int(end_dt_old.timestamp() * 1_000_000_000)

print(f"\nNanosecond range:")
print(f"  Start nano: {start_nano_old}")
print(f"  End nano:   {end_nano_old}")
print(f"  Span: {(end_nano_old - start_nano_old) / 1e9 / 3600:.1f} hours")

# Verify what dates these represent
print(f"\nVerification:")
print(f"  Start date: {datetime.fromtimestamp(start_nano_old / 1e9, tz=timezone.utc).strftime('%Y-%m-%d %H:%M')}")
print(f"  End date:   {datetime.fromtimestamp(end_nano_old / 1e9, tz=timezone.utc).strftime('%Y-%m-%d %H:%M')}")

if start_dt_old.day == end_dt_old.day:
    print(f"  ✅ Same day")
else:
    print(f"  ❌ CROSSES MIDNIGHT!")

# ============================================================================
# PROPOSED FIX
# ============================================================================

print("\n" + "=" * 80)
print("PROPOSED FIX:")
print("-" * 80)

print(f"\nFix: Create datetime in EDT, then convert to UTC")
print(f"  Instead of: datetime(year, month, day, hour - offset, ...)")
print(f"  Use: datetime(year, month, day, hour, ...) in EDT, then convert")

# Create EDT times
edt_tz = timezone(timedelta(hours=-4))
start_dt_edt = datetime(year, month, day, start_hour, start_min, tzinfo=edt_tz)
end_dt_edt = datetime(year, month, day, end_hour, end_min, tzinfo=edt_tz)

print(f"\nEDT datetimes:")
print(f"  Start EDT: {start_dt_edt.strftime('%Y-%m-%d %H:%M %Z')}")
print(f"  End EDT:   {end_dt_edt.strftime('%Y-%m-%d %H:%M %Z')}")

# Convert to UTC
start_dt_utc = start_dt_edt.astimezone(timezone.utc)
end_dt_utc = end_dt_edt.astimezone(timezone.utc)

print(f"\nConverted to UTC:")
print(f"  Start UTC: {start_dt_utc.strftime('%Y-%m-%d %H:%M')} UTC")
print(f"  End UTC:   {end_dt_utc.strftime('%Y-%m-%d %H:%M')} UTC")

start_nano_new = int(start_dt_utc.timestamp() * 1_000_000_000)
end_nano_new = int(end_dt_utc.timestamp() * 1_000_000_000)

print(f"\nNanosecond range:")
print(f"  Start nano: {start_nano_new}")
print(f"  End nano:   {end_nano_new}")
print(f"  Span: {(end_nano_new - start_nano_new) / 1e9 / 3600:.1f} hours")

# ============================================================================
# COMPARISON
# ============================================================================

print("\n" + "=" * 80)
print("COMPARISON: OLD vs NEW")
print("=" * 80)
print()

print(f"OLD (Buggy):")
print(f"  {datetime.fromtimestamp(start_nano_old / 1e9, tz=timezone.utc).strftime('%Y-%m-%d %H:%M')} to")
print(f"  {datetime.fromtimestamp(end_nano_old / 1e9, tz=timezone.utc).strftime('%Y-%m-%d %H:%M')}")
print(f"  Span: {(end_nano_old - start_nano_old) / 1e9 / 3600:.1f} hours")

print(f"\nNEW (Fixed):")
print(f"  {start_dt_utc.strftime('%Y-%m-%d %H:%M')} to")
print(f"  {end_dt_utc.strftime('%Y-%m-%d %H:%M')}")
print(f"  Span: {(end_nano_new - start_nano_new) / 1e9 / 3600:.1f} hours")

if start_nano_old == start_nano_new and end_nano_old == end_nano_new:
    print(f"\n⚠️  TIMESTAMPS ARE IDENTICAL!")
    print(f"    The bug is NOT in _get_session_timestamp_range()")
    print(f"    Polygon itself is returning wrong-date data!")
else:
    print(f"\n✅ FIX CHANGES THE TIMESTAMPS")
    print(f"   This should prevent fetching wrong-date data")

# ============================================================================
# EXPECTED VS ACTUAL
# ============================================================================

print("\n" + "=" * 80)
print("EXPECTED BEHAVIOR:")
print("=" * 80)
print()

print(f"For {date} regular session:")
print(f"  EDT times: 09:30 - 16:00")
print(f"  UTC times: 13:30 - 20:00")
print(f"  Duration: 6.5 hours (390 minutes)")
print()
print(f"Should fetch ONLY Oct 15 trades between:")
print(f"  Start: 2025-10-15 13:30:00 UTC (09:30 EDT)")
print(f"  End:   2025-10-15 20:00:00 UTC (16:00 EDT)")
print()
print(f"Should NOT fetch:")
print(f"  ❌ Oct 31 trades")
print(f"  ❌ Trades after 16:00 EDT on Oct 15")
print(f"  ❌ Trades before 09:30 EDT on Oct 15")

# ============================================================================
# POLYGON REQUEST ANALYSIS
# ============================================================================

print("\n" + "=" * 80)
print("WHY IS POLYGON RETURNING OCT 31 DATA?")
print("=" * 80)
print()

print("Hypothesis 1: Timestamp overflow")
print(f"  If hour becomes > 24, datetime might wrap to next day")
print(f"  But we calculated: hour = {end_hour - et_offset} = {end_hour} - ({et_offset}) = 20")
print(f"  20 < 24, so this isn't the issue")
print()

print("Hypothesis 2: Month/day confusion")
print(f"  If parsing date='2025-10-15' incorrectly")
print(f"  But we see month=10, day=15, so parsing is correct")
print()

print("Hypothesis 3: Polygon API bug/quirk")
print(f"  Polygon might be interpreting our timestamp range differently")
print(f"  OR returning cached data from different dates")
print(f"  OR the cursor pagination is jumping to Oct 31")
print()

print("🔍 TO VERIFY:")
print(f"  Add logging to fetch_all_trades_for_session()")
print(f"  Print start_nano and end_nano being sent to Polygon")
print(f"  Check if ALL pages return Oct 15 data or if later pages are Oct 31")

print()
print("=" * 80)
print("RECOMMENDATION:")
print("=" * 80)
print()
print("1. Add logging to show exact timestamp range sent to Polygon")
print("2. Check if pagination cursor is causing date jump")
print("3. Validate EACH trade's date, not just first/last")
print("4. Filter out trades from wrong dates")
print()
print("=" * 80)

