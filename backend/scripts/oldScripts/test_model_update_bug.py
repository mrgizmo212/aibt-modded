"""
Test: Model Parameters Not Saving Bug

This script tests if model_parameters can be updated via the PUT endpoint
"""

import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
API_URL = "http://localhost:8080"
TEST_USER_EMAIL = "adam@truetradinggroup.com"
TEST_USER_PASSWORD = "adminpass123"

def test_model_update():
    """Test updating model parameters"""
    
    print("Testing Model Parameter Update Bug\n")
    print("=" * 70)
    
    # Step 1: Login
    print("\n[1] Logging in...")
    login_response = requests.post(
        f"{API_URL}/api/auth/login",
        json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
    )
    
    if login_response.status_code != 200:
        print(f"[ERROR] Login failed: {login_response.text}")
        return
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] Login successful")
    
    # Step 2: Get user's models
    print("\n[2] Fetching user models...")
    models_response = requests.get(
        f"{API_URL}/api/models",
        headers=headers
    )
    
    if models_response.status_code != 200:
        print(f"[ERROR] Failed to fetch models: {models_response.text}")
        return
    
    models = models_response.json()["models"]
    
    if not models:
        print("[ERROR] No models found for user")
        return
    
    test_model = models[0]
    model_id = test_model["id"]
    print(f"[OK] Found model: {test_model['name']} (ID: {model_id})")
    
    # Step 3: Show current parameters
    print(f"\n[3] Current model_parameters:")
    current_params = test_model.get("model_parameters")
    print(json.dumps(current_params, indent=2))
    
    # Step 4: Try to update with new parameters
    print(f"\n[4] Attempting to update model_parameters...")
    new_params = {
        "temperature": 0.8,
        "max_tokens": 16000,
        "verbosity": "high",
        "reasoning_effort": "high",
        "top_p": 0.95
    }
    
    update_data = {
        "name": test_model["name"],  # Required field
        "description": test_model.get("description"),
        "default_ai_model": test_model.get("default_ai_model") or "openai/gpt-5",
        "model_parameters": new_params
    }
    
    print(f"Sending update with data:")
    print(json.dumps(update_data, indent=2))
    
    update_response = requests.put(
        f"{API_URL}/api/models/{model_id}",
        headers=headers,
        json=update_data
    )
    
    if update_response.status_code != 200:
        print(f"\n[ERROR] UPDATE FAILED!")
        print(f"Status: {update_response.status_code}")
        print(f"Response: {update_response.text}")
        return
    
    print("\n[OK] Update request succeeded")
    updated_model = update_response.json()
    
    # Step 5: Verify the update
    print(f"\n[5] Verifying update...")
    verify_response = requests.get(
        f"{API_URL}/api/models",
        headers=headers
    )
    
    if verify_response.status_code != 200:
        print(f"[ERROR] Failed to verify: {verify_response.text}")
        return
    
    verified_models = verify_response.json()["models"]
    verified_model = next((m for m in verified_models if m["id"] == model_id), None)
    
    if not verified_model:
        print("[ERROR] Model not found after update")
        return
    
    print(f"\n[OK] Model fetched after update")
    print(f"\nUpdated model_parameters:")
    updated_params = verified_model.get("model_parameters")
    print(json.dumps(updated_params, indent=2))
    
    # Step 6: Compare
    print(f"\n[6] Comparison:")
    print(f"Expected: {json.dumps(new_params, indent=2, sort_keys=True)}")
    print(f"Actual: {json.dumps(updated_params, indent=2, sort_keys=True)}")
    
    if updated_params == new_params:
        print("\n[SUCCESS] Parameters saved correctly!")
    else:
        print("\n[BUG CONFIRMED] Parameters did NOT save!")
        print("\nDifferences:")
        for key in new_params:
            if key not in (updated_params or {}):
                print(f"  Missing: {key}")
            elif new_params[key] != updated_params.get(key):
                print(f"  {key}: expected {new_params[key]}, got {updated_params.get(key)}")

if __name__ == "__main__":
    try:
        test_model_update()
    except Exception as e:
        print(f"\n[ERROR] Test error: {e}")
        import traceback
        traceback.print_exc()


