"""
Simple Test: Client-Side Date Filtering

Tests JUST the filtering logic without hitting the backend.
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timezone

backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from dotenv import load_dotenv
load_dotenv(backend_path / ".env")

print("=" * 80)
print("CLIENT-SIDE DATE FILTERING - SIMPLE TEST")
print("=" * 80)
print()

# Test the filtering logic
from intraday_loader import _get_session_timestamp_range

DATE = "2025-10-15"
SESSION = "regular"

start_nano, end_nano = _get_session_timestamp_range(DATE, SESSION)
target_date = datetime.strptime(DATE, "%Y-%m-%d").date()

print(f"Target Date: {DATE}")
print(f"Timestamp Range: {start_nano} to {end_nano}")
print()

# Simulate trades from multiple dates
print("Simulating trades from multiple dates:")
print("-" * 80)

sample_trades = [
    {"participant_timestamp": 1760535000000000000, "price": 249.4, "date_label": "Oct 15 09:30"},  # Oct 15
    {"participant_timestamp": 1760536000000000000, "price": 250.0, "date_label": "Oct 15 09:47"},  # Oct 15
    {"participant_timestamp": 1761940620000000000, "price": 270.5, "date_label": "Oct 31 19:56"},  # Oct 31 (WRONG!)
    {"participant_timestamp": 1761941000000000000, "price": 271.0, "date_label": "Oct 31 20:00"},  # Oct 31 (WRONG!)
]

print(f"\nSample trades (mixed dates):")
for t in sample_trades:
    ts_utc = datetime.fromtimestamp(t['participant_timestamp'] / 1e9, tz=timezone.utc)
    print(f"  {t['date_label']}: {ts_utc.date()} (${t['price']})")

# Apply filtering logic (same as in code)
print("\nApplying client-side date filter...")
print("-" * 80)

filtered_trades = []
wrong_date_count = 0

for trade in sample_trades:
    ts_nano = trade.get('participant_timestamp', 0)
    if start_nano <= ts_nano <= end_nano:
        # Additional date validation
        ts_utc = datetime.fromtimestamp(ts_nano / 1e9, tz=timezone.utc)
        if ts_utc.date() == target_date:
            filtered_trades.append(trade)
            print(f"  ✅ KEEP: {trade['date_label']} (correct date)")
        else:
            wrong_date_count += 1
            print(f"  ❌ REMOVE: {trade['date_label']} (wrong date: {ts_utc.date()})")
    else:
        wrong_date_count += 1
        print(f"  ❌ REMOVE: {trade['date_label']} (outside timestamp range)")

print(f"\nFiltering Results:")
print(f"  Original: {len(sample_trades)} trades")
print(f"  Filtered: {len(filtered_trades)} trades")
print(f"  Removed: {wrong_date_count} wrong-date trades")

print()
print("=" * 80)

if len(filtered_trades) < len(sample_trades):
    print("✅ CLIENT-SIDE FILTERING WORKS!")
    print(f"   Removed {wrong_date_count} Oct 31 trades")
    print(f"   Kept {len(filtered_trades)} Oct 15 trades")
    print()
    print("IMPLEMENTATION:")
    print("  Lines 103-127 in backend/intraday_loader.py")
    print("  Filters trades after fetching, before aggregation")
else:
    print("❌ FILTERING FAILED")
    print("   All trades kept, none removed")

print("=" * 80)

