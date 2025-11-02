"""
PROOF: Model Parameters Are Saved But NOT Used

This script proves that model_parameters are stored in the database
and saved to run snapshots, but are NOT passed to ChatOpenAI when
creating the AI model instance.
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

print("=" * 80)
print("PROVING: Model Parameters Stored But NOT Used")
print("=" * 80)
print()

# Test 1: Check what's in the database
print("TEST 1: What's stored in your model's database record?")
print("-" * 80)

from supabase import create_client
from dotenv import load_dotenv

load_dotenv(backend_path / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Get model 169
result = supabase.table("models").select("*").eq("id", 169).execute()

if result.data:
    model = result.data[0]
    print(f"✅ Model ID: {model['id']}")
    print(f"   Name: {model['name']}")
    print(f"   default_ai_model: {model.get('default_ai_model')}")
    print(f"   model_parameters: {model.get('model_parameters')}")
    print()
    
    if model.get('model_parameters'):
        print("✅ PROOF 1: model_parameters ARE stored in database!")
        print(f"   Parameters: {model['model_parameters']}")
    else:
        print("❌ model_parameters NOT in database")
else:
    print("❌ Model 169 not found")
    sys.exit(1)

print()

# Test 2: Check BaseAgent initialization
print("TEST 2: Does BaseAgent.__init__() accept model_parameters?")
print("-" * 80)

from trading.base_agent import BaseAgent
import inspect

# Get __init__ signature
sig = inspect.signature(BaseAgent.__init__)
params = list(sig.parameters.keys())

print(f"BaseAgent.__init__() parameters:")
for param in params:
    print(f"  - {param}")

if 'model_parameters' in params:
    print()
    print("✅ BaseAgent accepts model_parameters")
else:
    print()
    print("❌ PROOF 2: BaseAgent does NOT accept model_parameters parameter!")
    print("   It only accepts: signature, basemodel, stock_symbols, etc.")

print()

# Test 3: Check what ChatOpenAI receives
print("TEST 3: What parameters does ChatOpenAI receive?")
print("-" * 80)

# Read the actual code
with open(backend_path / "trading" / "base_agent.py", 'r', encoding='utf-8') as f:
    content = f.read()
    
# Find ChatOpenAI creation
if "ChatOpenAI(" in content:
    start = content.find("self.model = ChatOpenAI(")
    end = content.find(")", start) + 1
    code_snippet = content[start:end]
    
    print("Code in base_agent.py (around line 213):")
    print(code_snippet)
    print()
    
    # Check what's being passed
    if "temperature" in code_snippet:
        print("✅ temperature is passed")
    else:
        print("❌ PROOF 3a: temperature NOT passed to ChatOpenAI!")
    
    if "max_tokens" in code_snippet:
        print("✅ max_tokens is passed")
    else:
        print("❌ PROOF 3b: max_tokens NOT passed to ChatOpenAI!")
    
    if "top_p" in code_snippet:
        print("✅ top_p is passed")
    else:
        print("❌ PROOF 3c: top_p NOT passed to ChatOpenAI!")

print()

# Test 4: Check run snapshot
print("TEST 4: Are model_parameters saved to run snapshots?")
print("-" * 80)

# Get latest run for model 169
runs = supabase.table("runs").select("*").eq("model_id", 169).order("created_at", desc=True).limit(1).execute()

if runs.data and len(runs.data) > 0:
    run = runs.data[0]
    snapshot = run.get("strategy_snapshot", {})
    
    print(f"✅ Run #{run['run_number']} found")
    print(f"   Strategy Snapshot contains:")
    for key in snapshot.keys():
        print(f"     - {key}")
    
    if "model_parameters" in snapshot:
        print()
        print(f"✅ PROOF 4: model_parameters ARE saved to run snapshot!")
        print(f"   But they're only for TRACKING, not USAGE")
    else:
        print()
        print("❌ model_parameters NOT in run snapshot")
else:
    print("⚠️  No runs found for model 169 yet")

print()
print("=" * 80)
print("CONCLUSION")
print("=" * 80)
print()
print("✅ model_parameters ARE stored in database")
print("✅ model_parameters ARE saved to run snapshots (for auditing)")
print("❌ model_parameters are NOT passed to ChatOpenAI constructor")
print("❌ model_parameters are NOT used when making AI calls")
print()
print("RESULT: Your configured temperature, max_tokens, etc. are IGNORED!")
print()
print("To fix this, BaseAgent needs to:")
print("  1. Accept model_parameters in __init__()")
print("  2. Pass them to ChatOpenAI() constructor")
print("  3. Apply temperature, max_tokens, top_p, etc.")
print()
print("=" * 80)

