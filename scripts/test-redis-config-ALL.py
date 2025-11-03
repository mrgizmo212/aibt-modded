"""
RUN ALL REDIS CONFIG TESTS
Comprehensive test suite to verify the fix works in all contexts
"""

import sys
import subprocess


def run_test(test_name, test_file):
    """Run a single test and return success status"""
    print(f"\n{'=' * 80}")
    print(f"RUNNING: {test_name}")
    print(f"{'=' * 80}\n")
    
    result = subprocess.run(
        [sys.executable, test_file],
        capture_output=True,
        text=True
    )
    
    print(result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr)
    
    return result.returncode == 0


def main():
    """Run all tests"""
    print("=" * 80)
    print("REDIS CONFIG COMPREHENSIVE TEST SUITE")
    print("=" * 80)
    print()
    print("This test suite verifies that the Redis-backed config solution:")
    print("  1. Works in synchronous contexts (MCP tools)")
    print("  2. Works in async contexts (BaseAgent)")
    print("  3. Works across subprocesses (fixes the production bug)")
    print("  4. Maintains multi-model isolation (multi-user safety)")
    print()
    
    tests = [
        ("Test 1: Synchronous Context", "scripts/test-redis-config-sync.py"),
        ("Test 2: Async Context", "scripts/test-redis-config-async.py"),
        ("Test 3: Subprocess Communication", "scripts/test-redis-config-subprocess.py"),
        ("Test 4: Multi-Model Isolation", "scripts/test-redis-config-isolation.py"),
    ]
    
    results = {}
    
    for test_name, test_file in tests:
        success = run_test(test_name, test_file)
        results[test_name] = success
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUITE SUMMARY")
    print("=" * 80)
    print()
    
    all_passed = True
    for test_name, success in results.items():
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"  {status}: {test_name}")
        if not success:
            all_passed = False
    
    print()
    print("=" * 80)
    
    if all_passed:
        print("✅ ALL TESTS PASSED!")
        print("=" * 80)
        print()
        print("🎉 The Redis config solution is working correctly!")
        print("🎉 Ready to deploy to production!")
        print()
        print("Next steps:")
        print("  1. Ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set on Render")
        print("  2. Deploy updated code to Render")
        print("  3. Monitor logs for 'SIGNATURE environment variable is not set' errors")
        print("  4. Verify trading decisions execute successfully")
        print()
        return 0
    else:
        print("❌ SOME TESTS FAILED")
        print("=" * 80)
        print()
        print("⚠️  The solution needs debugging before deploying to production.")
        print("⚠️  Review failed tests above and fix issues.")
        print()
        return 1


if __name__ == "__main__":
    sys.exit(main())
