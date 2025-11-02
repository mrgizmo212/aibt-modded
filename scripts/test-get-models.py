#!/usr/bin/env python3
"""
Test what GET /api/models returns
"""

import requests

API_URL = 'http://localhost:8080'
EMAIL = 'adam@truetradinggroup.com'
PASSWORD = 'adminpass123'

# Login first
print("Logging in...")
login_response = requests.post(
    f'{API_URL}/api/auth/login',
    json={'email': EMAIL, 'password': PASSWORD}
)

if login_response.status_code == 200:
    data = login_response.json()
    token = data.get('access_token')
    print(f"✅ Logged in as {data['user']['email']}\n")
    
    # Get models
    print("Fetching models from GET /api/models...")
    models_response = requests.get(
        f'{API_URL}/api/models',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if models_response.status_code == 200:
        result = models_response.json()
        print(f"\n✅ Backend Response:")
        print(f"{result}\n")
        
        models = result.get('models', [])
        print(f"Total models in response: {len(models)}")
        
        for model in models:
            print(f"\nModel ID {model['id']}:")
            print(f"  Name: {model['name']}")
            print(f"  Signature: {model['signature']}")
            print(f"  AI Model: {model.get('default_ai_model', 'N/A')}")
            print(f"  Active: {model.get('is_active', 'N/A')}")
    else:
        print(f"❌ Failed: {models_response.status_code}")
        print(models_response.text)
else:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)

