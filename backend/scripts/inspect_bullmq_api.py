"""
Inspect Python BullMQ API
Find out what methods are actually available
"""

from bullmq import Queue, Worker
import inspect

print("=" * 60)
print("Python BullMQ API Inspection")
print("=" * 60)

print("\n📦 Queue class methods:")
print("-" * 60)
queue_methods = [m for m in dir(Queue) if not m.startswith('_')]
for method in sorted(queue_methods):
    print(f"  - {method}")

print("\n👷 Worker class methods:")
print("-" * 60)
worker_methods = [m for m in dir(Worker) if not m.startswith('_')]
for method in sorted(worker_methods):
    print(f"  - {method}")

# Try to get help on Queue class
print("\n📖 Queue class signature:")
print("-" * 60)
try:
    sig = inspect.signature(Queue.__init__)
    print(f"  Queue.__init__{sig}")
except:
    print("  Could not get signature")

print("\n" + "=" * 60)

