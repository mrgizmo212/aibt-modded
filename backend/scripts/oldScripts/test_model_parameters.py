"""
Test Model Parameters Configuration
Tests all 17 AI models to verify parameter detection and validation
"""

import requests
import json
from typing import Dict, Any

# Base URL
API_BASE = "http://localhost:8080"

# All 17 models to test
MODELS_TO_TEST = [
    "anthropic/claude-sonnet-4.5",
    "google/gemini-2.5-pro",
    "x-ai/grok-4-fast",
    "deepseek/deepseek-chat-v3.1",
    "openai/gpt-5",
    "openai/gpt-5-mini",
    "openai/gpt-oss-120b",
    "minimax/minimax-m2",
    "z-ai/glm-4.6",
    "qwen/qwen3-max",
    "openai/gpt-4.1-mini",
    "openai/gpt-5-codex",
    "openai/gpt-oss-20b",
    "openai/o3",
    "openai/gpt-4.1",
    "openai/o3-mini",
]


def test_model_config(model_id: str) -> Dict[str, Any]:
    """
    Test model configuration endpoint
    
    Args:
        model_id: Model identifier
        
    Returns:
        Configuration response
    """
    try:
        response = requests.get(
            f"{API_BASE}/api/model-config",
            params={"model_id": model_id},
            timeout=5
        )
        
        if response.status_code == 200:
            return {
                "success": True,
                "data": response.json()
            }
        else:
            return {
                "success": False,
                "error": f"HTTP {response.status_code}",
                "details": response.text
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def verify_parameters(model_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Verify parameters match expected configuration
    
    Args:
        model_id: Model identifier
        config: Configuration response
        
    Returns:
        Verification results
    """
    model_lower = model_id.lower()
    params = config.get("default_parameters", {})
    model_type = config.get("model_type", "unknown")
    
    results = {
        "model_id": model_id,
        "model_type": model_type,
        "checks": []
    }
    
    # Check 1: GPT-5 models should NOT have temperature
    if 'gpt-5' in model_lower and 'oss' not in model_lower:
        if 'temperature' in params:
            results["checks"].append(f"❌ FAIL: GPT-5 should NOT have temperature (has: {params['temperature']})")
        else:
            results["checks"].append("✅ PASS: GPT-5 correctly has NO temperature")
        
        if 'verbosity' in params:
            results["checks"].append(f"✅ PASS: GPT-5 has verbosity ({params['verbosity']})")
        else:
            results["checks"].append("❌ FAIL: GPT-5 missing verbosity")
        
        if 'reasoning_effort' in params:
            results["checks"].append(f"✅ PASS: GPT-5 has reasoning_effort ({params['reasoning_effort']})")
        else:
            results["checks"].append("❌ FAIL: GPT-5 missing reasoning_effort")
    
    # Check 2: o3 models should NOT have temperature or verbosity
    if 'o3' in model_lower:
        if 'temperature' in params:
            results["checks"].append(f"❌ FAIL: o3 should NOT have temperature (has: {params['temperature']})")
        else:
            results["checks"].append("✅ PASS: o3 correctly has NO temperature")
        
        if 'verbosity' in params:
            results["checks"].append(f"❌ FAIL: o3 should NOT have verbosity (has: {params['verbosity']})")
        else:
            results["checks"].append("✅ PASS: o3 correctly has NO verbosity")
        
        if 'reasoning_effort' in params:
            results["checks"].append(f"✅ PASS: o3 has reasoning_effort ({params['reasoning_effort']})")
        else:
            results["checks"].append("❌ FAIL: o3 missing reasoning_effort")
    
    # Check 3: Claude should have temperature and top_k
    if 'claude' in model_lower:
        if 'temperature' in params:
            results["checks"].append(f"✅ PASS: Claude has temperature ({params['temperature']})")
        else:
            results["checks"].append("❌ FAIL: Claude missing temperature")
        
        if 'top_k' in params:
            results["checks"].append(f"✅ PASS: Claude has top_k ({params['top_k']})")
        else:
            results["checks"].append("❌ FAIL: Claude missing top_k")
    
    # Check 4: Gemini should have max_output_tokens
    if 'gemini' in model_lower:
        if 'max_output_tokens' in params:
            results["checks"].append(f"✅ PASS: Gemini has max_output_tokens ({params['max_output_tokens']})")
        else:
            results["checks"].append("❌ FAIL: Gemini missing max_output_tokens")
        
        if 'temperature' in params:
            results["checks"].append(f"✅ PASS: Gemini has temperature ({params['temperature']})")
        else:
            results["checks"].append("❌ FAIL: Gemini missing temperature")
    
    # Check 5: Grok should have web_search
    if 'grok' in model_lower or 'x-ai' in model_lower:
        if 'web_search' in params:
            results["checks"].append(f"✅ PASS: Grok has web_search ({params['web_search']})")
        else:
            results["checks"].append("❌ FAIL: Grok missing web_search")
    
    # Check 6: All models should have max_tokens or max_completion_tokens
    if 'max_tokens' in params or 'max_completion_tokens' in params or 'max_output_tokens' in params:
        token_param = params.get('max_tokens') or params.get('max_completion_tokens') or params.get('max_output_tokens')
        results["checks"].append(f"✅ PASS: Has token limit ({token_param})")
    else:
        results["checks"].append("❌ FAIL: Missing token limit parameter")
    
    # Check 7: Standard models should have temperature
    if model_type == 'standard':
        if 'temperature' in params:
            results["checks"].append(f"✅ PASS: Standard model has temperature ({params['temperature']})")
        else:
            results["checks"].append("❌ FAIL: Standard model missing temperature")
    
    return results


def print_results(results: Dict[str, Any]):
    """Pretty print test results"""
    print(f"\n{'='*80}")
    print(f"Model: {results['model_id']}")
    print(f"Type: {results['model_type']}")
    print(f"{'-'*80}")
    
    for check in results['checks']:
        print(f"  {check}")
    
    # Count passes/fails
    passes = sum(1 for c in results['checks'] if '✅ PASS' in c)
    fails = sum(1 for c in results['checks'] if '❌ FAIL' in c)
    
    print(f"{'-'*80}")
    print(f"Results: {passes} passed, {fails} failed")
    print(f"{'='*80}")


def main():
    """Run all tests"""
    print("🧪 Testing Model Parameter Configuration")
    print(f"Testing {len(MODELS_TO_TEST)} models...")
    print(f"API: {API_BASE}")
    
    all_results = []
    total_passes = 0
    total_fails = 0
    
    for model_id in MODELS_TO_TEST:
        print(f"\n🔍 Testing: {model_id}...")
        
        # Get config
        response = test_model_config(model_id)
        
        if not response["success"]:
            print(f"❌ API Error: {response.get('error')}")
            print(f"   Details: {response.get('details', 'N/A')}")
            continue
        
        # Verify parameters
        config = response["data"]
        verification = verify_parameters(model_id, config)
        
        # Print results
        print_results(verification)
        
        # Track totals
        passes = sum(1 for c in verification['checks'] if '✅ PASS' in c)
        fails = sum(1 for c in verification['checks'] if '❌ FAIL' in c)
        total_passes += passes
        total_fails += fails
        
        all_results.append(verification)
    
    # Summary
    print("\n" + "="*80)
    print("📊 FINAL SUMMARY")
    print("="*80)
    print(f"Models tested: {len(all_results)}/{len(MODELS_TO_TEST)}")
    print(f"Total checks passed: {total_passes}")
    print(f"Total checks failed: {total_fails}")
    print(f"Success rate: {(total_passes / (total_passes + total_fails) * 100):.1f}%" if (total_passes + total_fails) > 0 else "N/A")
    print("="*80)
    
    # List any models with failures
    failed_models = [r for r in all_results if any('❌ FAIL' in c for c in r['checks'])]
    if failed_models:
        print("\n⚠️  Models with failed checks:")
        for r in failed_models:
            print(f"  - {r['model_id']}")
    else:
        print("\n🎉 All models passed all checks!")
    
    # Show parameter examples for each model type
    print("\n" + "="*80)
    print("📋 PARAMETER EXAMPLES BY MODEL TYPE")
    print("="*80)
    
    model_types = {}
    for r in all_results:
        if response := test_model_config(r['model_id']):
            if response["success"]:
                config = response["data"]
                model_type = config.get("model_type")
                if model_type not in model_types:
                    model_types[model_type] = config
    
    for model_type, config in model_types.items():
        print(f"\n{model_type.upper()}:")
        print(json.dumps(config.get("default_parameters", {}), indent=2))


if __name__ == "__main__":
    print("\n" + "🚀 Starting Model Parameter Tests" + "\n")
    print("Prerequisites:")
    print("  1. Backend must be running on http://localhost:8080")
    print("  2. Endpoint /api/model-config must be available")
    print("\nPress Ctrl+C to cancel or wait 3 seconds to start...")
    
    import time
    try:
        time.sleep(3)
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Tests cancelled by user")
    except Exception as e:
        print(f"\n\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

