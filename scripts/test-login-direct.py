"""
Test Login API Directly
========================
This script tests the backend login endpoint to identify the issue.

BEFORE RUNNING:
1. Make sure backend is running (python backend/main.py)
2. Have a valid test account ready

RUN THIS:
python scripts/test-login-direct.py
"""

import requests
import json

API_URL = "http://localhost:8080"

def test_health():
    """Test 1: Is backend running?"""
    print("\n" + "="*60)
    print("TEST 1: Backend Health Check")
    print("="*60)
    try:
        response = requests.get(f"{API_URL}/api/health", timeout=5)
        print(f"✅ Backend is running!")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        return True
    except requests.exceptions.ConnectionError:
        print(f"❌ BACKEND NOT RUNNING!")
        print(f"   Cannot connect to {API_URL}")
        print(f"   Solution: Start backend with 'python backend/main.py'")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_login(email, password):
    """Test 2: Can we login?"""
    print("\n" + "="*60)
    print("TEST 2: Login Attempt")
    print("="*60)
    print(f"Email: {email}")
    print(f"Password: {'*' * len(password)}")
    
    try:
        response = requests.post(
            f"{API_URL}/api/auth/login",
            headers={"Content-Type": "application/json"},
            json={"email": email, "password": password},
            timeout=10
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ LOGIN SUCCESSFUL!")
            print(f"   Token: {data.get('access_token', 'N/A')[:50]}...")
            print(f"   User: {data.get('user', {})}")
            return True
        else:
            print(f"❌ LOGIN FAILED!")
            try:
                error = response.json()
                print(f"   Error: {error}")
            except:
                print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"❌ REQUEST TIMED OUT!")
        print(f"   Backend took too long to respond")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_cors():
    """Test 3: CORS configuration"""
    print("\n" + "="*60)
    print("TEST 3: CORS Configuration")
    print("="*60)
    try:
        response = requests.options(
            f"{API_URL}/api/auth/login",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST"
            },
            timeout=5
        )
        
        cors_headers = {
            "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
            "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
            "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers"),
        }
        
        print(f"Status: {response.status_code}")
        print(f"CORS Headers: {json.dumps(cors_headers, indent=2)}")
        
        if response.headers.get("Access-Control-Allow-Origin"):
            print(f"✅ CORS is configured")
            return True
        else:
            print(f"⚠️  CORS headers missing - might cause frontend issues")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("\n" + "="*60)
    print("AI TRADING PLATFORM - LOGIN DIAGNOSTIC TEST")
    print("="*60)
    
    # Test 1: Health
    backend_running = test_health()
    if not backend_running:
        print("\n" + "="*60)
        print("DIAGNOSIS: Backend not running")
        print("="*60)
        print("SOLUTION: Start backend:")
        print("  cd backend")
        print("  python main.py")
        exit(1)
    
    # Test 2: Login
    print("\n" + "-"*60)
    email = input("Enter test email: ").strip()
    password = input("Enter test password: ").strip()
    
    if not email or not password:
        print("❌ Email and password required!")
        exit(1)
    
    login_success = test_login(email, password)
    
    # Test 3: CORS
    cors_ok = test_cors()
    
    # Summary
    print("\n" + "="*60)
    print("DIAGNOSTIC SUMMARY")
    print("="*60)
    print(f"Backend Running:     {'✅' if backend_running else '❌'}")
    print(f"Login Working:       {'✅' if login_success else '❌'}")
    print(f"CORS Configured:     {'✅' if cors_ok else '⚠️'}")
    
    if backend_running and login_success and cors_ok:
        print("\n✅ BACKEND IS WORKING CORRECTLY!")
        print("   Issue is likely in frontend. Check:")
        print("   1. Browser console (F12) for errors")
        print("   2. Network tab for failed requests")
        print("   3. Frontend .env.local has NEXT_PUBLIC_API_URL=http://localhost:8080")
    elif backend_running and not login_success:
        print("\n❌ LOGIN ENDPOINT HAS ISSUES!")
        print("   Possible causes:")
        print("   1. Supabase credentials not configured")
        print("   2. User account doesn't exist")
        print("   3. Wrong password")
        print("   4. Backend error (check terminal logs)")
    elif backend_running and not cors_ok:
        print("\n⚠️  CORS MAY CAUSE FRONTEND ISSUES!")
        print("   Frontend might get blocked by browser")
    
    print("="*60)

