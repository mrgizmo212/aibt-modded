"""
Complete Test: Create Model + Test Parameter Updates

This script:
1. Creates a test model if none exists
2. Updates model_parameters
3. Verifies the save worked
"""

import requests
import json
from dotenv import load_dotenv

load_dotenv()

# Configuration
API_URL = "http://localhost:8080"
ADMIN_EMAIL = "adam@truetradinggroup.com"
ADMIN_PASSWORD = "adminpass123"

def test_full_flow():
    """Test complete model creation and parameter update flow"""
    
    print("=" * 70)
    print("COMPLETE MODEL PARAMETER TEST")
    print("=" * 70)
    
    # Step 1: Login
    print("\n[1] Logging in as admin...")
    login_response = requests.post(
        f"{API_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    
    if login_response.status_code != 200:
        print(f"[ERROR] Login failed: {login_response.text}")
        return
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] Login successful")
    
    # Step 2: Check existing models
    print("\n[2] Checking existing models...")
    models_response = requests.get(f"{API_URL}/api/models", headers=headers)
    
    if models_response.status_code != 200:
        print(f"[ERROR] Failed to fetch models: {models_response.text}")
        return
    
    models = models_response.json()["models"]
    print(f"[OK] Found {len(models)} existing models")
    
    # Step 3: Create a test model if none exist
    if len(models) == 0:
        print("\n[3] Creating test model...")
        create_data = {
            "name": "Test GPT-5 Model",
            "description": "Test model for parameter updates",
            "initial_cash": 10000.0,
            "default_ai_model": "openai/gpt-5",
            "model_parameters": {
                "verbosity": "high",
                "reasoning_effort": "high",
                "max_tokens": 4000,
                "max_completion_tokens": 4000,
                "top_p": 0.9
            }
        }
        
        create_response = requests.post(
            f"{API_URL}/api/models",
            headers=headers,
            json=create_data
        )
        
        if create_response.status_code != 200:
            print(f"[ERROR] Failed to create model: {create_response.text}")
            return
        
        model = create_response.json()
        model_id = model["id"]
        print(f"[OK] Created model: {model['name']} (ID: {model_id})")
        print(f"    Initial parameters: {json.dumps(model.get('model_parameters'), indent=6)}")
    else:
        model = models[0]
        model_id = model["id"]
        print(f"\n[3] Using existing model: {model['name']} (ID: {model_id})")
        print(f"    Current parameters: {json.dumps(model.get('model_parameters'), indent=6)}")
    
    # Step 4: Update model_parameters
    print(f"\n[4] Updating model_parameters...")
    new_params = {
        "temperature": 0.8,
        "max_tokens": 128000,  # Updated to correct GPT-5 limit
        "max_completion_tokens": 32000,
        "verbosity": "high",
        "reasoning_effort": "high",
        "top_p": 0.95,
        "frequency_penalty": 0.1,
        "presence_penalty": 0.1
    }
    
    update_data = {
        "name": model["name"],
        "description": model.get("description"),
        "default_ai_model": model.get("default_ai_model") or "openai/gpt-5",
        "model_parameters": new_params
    }
    
    print(f"    Sending update:")
    print(f"    {json.dumps(new_params, indent=6)}")
    
    update_response = requests.put(
        f"{API_URL}/api/models/{model_id}",
        headers=headers,
        json=update_data
    )
    
    if update_response.status_code != 200:
        print(f"\n[ERROR] UPDATE FAILED!")
        print(f"    Status: {update_response.status_code}")
        print(f"    Response: {update_response.text}")
        return
    
    print("[OK] Update request succeeded")
    updated_model = update_response.json()
    print(f"    Response parameters: {json.dumps(updated_model.get('model_parameters'), indent=6)}")
    
    # Step 5: Verify by fetching again
    print(f"\n[5] Verifying by fetching model again...")
    verify_response = requests.get(f"{API_URL}/api/models", headers=headers)
    
    if verify_response.status_code != 200:
        print(f"[ERROR] Failed to verify: {verify_response.text}")
        return
    
    verified_models = verify_response.json()["models"]
    verified_model = next((m for m in verified_models if m["id"] == model_id), None)
    
    if not verified_model:
        print("[ERROR] Model not found after update")
        return
    
    verified_params = verified_model.get("model_parameters")
    print(f"[OK] Model re-fetched")
    print(f"    Verified parameters: {json.dumps(verified_params, indent=6)}")
    
    # Step 6: Compare and report
    print(f"\n[6] RESULTS:")
    print("=" * 70)
    
    if verified_params == new_params:
        print("[SUCCESS] Parameters saved correctly!")
        print("\nAll parameters match:")
        for key, value in new_params.items():
            print(f"  {key}: {value}")
    else:
        print("[BUG DETECTED] Parameters did NOT save correctly!")
        print("\nExpected vs Actual:")
        print("-" * 70)
        
        all_keys = set(list(new_params.keys()) + list((verified_params or {}).keys()))
        
        for key in sorted(all_keys):
            expected = new_params.get(key, "[NOT SET]")
            actual = (verified_params or {}).get(key, "[NOT SET]")
            
            if expected == actual:
                status = "OK"
            else:
                status = "MISMATCH"
            
            print(f"  [{status:8}] {key:25} | Expected: {expected:20} | Actual: {actual}")
        
        print("\nMissing keys:", [k for k in new_params if k not in (verified_params or {})])
        print("Extra keys:", [k for k in (verified_params or {}) if k not in new_params])
    
    print("=" * 70)

if __name__ == "__main__":
    try:
        test_full_flow()
    except Exception as e:
        print(f"\n[ERROR] Test crashed: {e}")
        import traceback
        traceback.print_exc()

