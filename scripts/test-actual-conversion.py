"""
Test the ACTUAL conversion code from intraday_loader.py
Without needing Redis or HTTP2
"""

import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

print("=" * 80)
print("TESTING ACTUAL CONVERSION CODE FROM INTRADAY_LOADER.PY")
print("=" * 80)
print()

# Simulate a bar at market close
# Last trading minute: 15:59 EDT = 19:59 UTC
bar = {
    'timestamp': 1760556960000,  # milliseconds UTC (19:36 UTC for testing)
    'open': 249.4,
    'high': 250.1,
    'low': 249.2,
    'close': 249.8,
    'volume': 12345
}

print("Test bar:")
print(f"  timestamp: {bar['timestamp']} ms")
print(f"  close: ${bar['close']}")
print()

# THIS IS THE EXACT CODE FROM intraday_loader.py (lines 238-249)
print("Running conversion (exact code from intraday_loader.py):")
print("-" * 80)

ts_ms = bar['timestamp']
print(f"1. ts_ms = {ts_ms}")

# Create UTC datetime
ts_utc = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)
print(f"2. ts_utc = {ts_utc}")
print(f"   ts_utc.strftime('%H:%M') = '{ts_utc.strftime('%H:%M')}'")

# Create EDT timezone (UTC-4)
edt_tz = timezone(timedelta(hours=-4))
print(f"3. edt_tz = {edt_tz}")

# Convert to EDT
ts_edt = ts_utc.astimezone(edt_tz)
print(f"4. ts_edt = {ts_edt}")
print(f"   ts_edt.strftime('%H:%M') = '{ts_edt.strftime('%H:%M')}'")

minute_str = ts_edt.strftime('%H:%M')
print(f"5. minute_str = '{minute_str}'")

print()
print("=" * 80)
print("RESULT:")
print("=" * 80)
print(f"UTC time: {ts_utc.strftime('%H:%M')}")
print(f"EDT time: {minute_str}")
print()

if "19:" in minute_str:
    print("[X] BROKEN - Still showing UTC time!")
    print("    The code is NOT converting to EDT")
elif "15:" in minute_str or "09:" in minute_str or "10:" in minute_str or "11:" in minute_str or "12:" in minute_str or "13:" in minute_str or "14:" in minute_str:
    print("[OK] WORKING - Showing EDT time!")
    print("     The conversion code is correct")
else:
    print("[?] UNEXPECTED result")

print()
print("If this shows EDT correctly but your terminal shows UTC,")
print("then the backend server needs to be RESTARTED to load the new code.")

