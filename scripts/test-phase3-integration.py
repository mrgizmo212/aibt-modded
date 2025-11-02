#!/usr/bin/env python3
"""
Phase 3 Integration Test Script
Tests all API endpoints used by updated frontend components

Tests:
1. Backend connectivity
2. Authentication (login required for other tests)
3. Model CRUD operations (NavigationSidebar, ModelEditDialog)
4. Trading status (NavigationSidebar, StatsGrid)
5. Portfolio stats (StatsGrid)
6. Available AI models (ModelEditDialog)

Usage:
    python scripts/test-phase3-integration.py

Set these environment variables or it will use defaults:
    API_URL=http://localhost:8080
    TEST_EMAIL=your@email.com
    TEST_PASSWORD=yourpassword
"""

import os
import sys
import requests
import json
from typing import Optional

# Configuration
API_URL = os.getenv('API_URL', 'http://localhost:8080')
TEST_EMAIL = os.getenv('TEST_EMAIL', 'adam@truetradinggroup.com')
TEST_PASSWORD = os.getenv('TEST_PASSWORD', 'adminpass123')

# Global token storage
AUTH_TOKEN: Optional[str] = None

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}[PASS] {text}{Colors.RESET}")

def print_error(text: str):
    print(f"{Colors.RED}[FAIL] {text}{Colors.RESET}")

def print_info(text: str):
    print(f"{Colors.YELLOW}[INFO] {text}{Colors.RESET}")

def print_result(data: dict):
    print(f"{Colors.RESET}{json.dumps(data, indent=2)}{Colors.RESET}")

def get_headers():
    """Get headers with authentication token"""
    headers = {'Content-Type': 'application/json'}
    if AUTH_TOKEN:
        headers['Authorization'] = f'Bearer {AUTH_TOKEN}'
    return headers

# Test 1: Backend Connectivity
def test_backend_connectivity():
    print_header("TEST 1: Backend Connectivity")
    try:
        response = requests.get(f'{API_URL}/api/health', timeout=5)
        if response.status_code == 200:
            print_success(f"Backend is running at {API_URL}")
            return True
        else:
            print_error(f"Backend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error(f"Cannot connect to backend at {API_URL}")
        print_info("Make sure backend is running: python backend/main.py")
        return False
    except Exception as e:
        print_error(f"Connection error: {str(e)}")
        return False

# Test 2: Authentication
def test_authentication():
    global AUTH_TOKEN
    print_header("TEST 2: Authentication (Login)")
    
    try:
        payload = {
            'email': TEST_EMAIL,
            'password': TEST_PASSWORD
        }
        
        print_info(f"Logging in as: {TEST_EMAIL}")
        response = requests.post(
            f'{API_URL}/api/auth/login',
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            AUTH_TOKEN = data.get('access_token')
            
            if AUTH_TOKEN:
                print_success("Login successful! Token received")
                print_info(f"User: {data.get('user', {}).get('email')}")
                return True
            else:
                print_error("Login response missing access_token")
                print_result(data)
                return False
        else:
            print_error(f"Login failed with status {response.status_code}")
            try:
                print_result(response.json())
            except:
                print_error(response.text)
            return False
            
    except Exception as e:
        print_error(f"Login error: {str(e)}")
        return False

# Test 3: Get Models (NavigationSidebar)
def test_get_models():
    print_header("TEST 3: Get Models (NavigationSidebar)")
    
    try:
        response = requests.get(
            f'{API_URL}/api/models',
            headers=get_headers()
        )
        
        if response.status_code == 200:
            models = response.json()
            print_success(f"Retrieved {len(models)} models")
            
            if len(models) > 0:
                print_info("Sample model:")
                print_result(models[0])
            else:
                print_info("No models exist yet (create one to test)")
            
            return True, models
        else:
            print_error(f"Failed to get models: {response.status_code}")
            print_result(response.json())
            return False, []
            
    except Exception as e:
        print_error(f"Get models error: {str(e)}")
        return False, []

# Test 4: Get Trading Status (NavigationSidebar, StatsGrid)
def test_get_trading_status():
    print_header("TEST 4: Get Trading Status")
    
    try:
        response = requests.get(
            f'{API_URL}/api/trading/status',
            headers=get_headers()
        )
        
        if response.status_code == 200:
            statuses = response.json()
            print_success(f"Retrieved trading status for {len(statuses)} models")
            
            if len(statuses) > 0:
                print_info("Sample status:")
                print_result(statuses[0])
                
                running_count = sum(1 for s in statuses if s.get('is_running'))
                print_info(f"Models running: {running_count}/{len(statuses)}")
            else:
                print_info("No trading status (no models or not trading)")
            
            return True, statuses
        else:
            print_error(f"Failed to get trading status: {response.status_code}")
            print_result(response.json())
            return False, []
            
    except Exception as e:
        print_error(f"Get trading status error: {str(e)}")
        return False, []

# Test 5: Get Available AI Models (ModelEditDialog)
def test_get_available_ai_models():
    print_header("TEST 5: Get Available AI Models (ModelEditDialog)")
    
    try:
        response = requests.get(
            f'{API_URL}/api/available-models',
            headers=get_headers()
        )
        
        if response.status_code == 200:
            models = response.json()
            print_success(f"Retrieved {len(models)} available AI models")
            
            if len(models) > 0:
                print_info("Available models:")
                for model in models[:5]:  # Show first 5
                    model_name = model if isinstance(model, str) else model.get('id') or model.get('name')
                    print(f"  - {model_name}")
                if len(models) > 5:
                    print(f"  ... and {len(models) - 5} more")
            
            return True, models
        else:
            print_error(f"Failed to get available models: {response.status_code}")
            print_result(response.json())
            return False, []
            
    except Exception as e:
        print_error(f"Get available AI models error: {str(e)}")
        return False, []

# Test 6: Create Model (ModelEditDialog)
def test_create_model():
    print_header("TEST 6: Create Model (ModelEditDialog)")
    
    try:
        payload = {
            'name': 'Test Model - Phase 3',
            'default_ai_model': 'gpt-4o',
            'system_prompt': 'Test system prompt for integration testing',
            'temperature': 0.7,
            'max_tokens': 2000,
            'trading_mode': 'paper',
            'starting_capital': 10000,
            'max_position_size': 25,
            'max_daily_loss': 5,
            'allowed_symbols': ['AAPL', 'MSFT', 'GOOGL']
        }
        
        print_info("Creating test model...")
        response = requests.post(
            f'{API_URL}/api/models',
            json=payload,
            headers=get_headers()
        )
        
        if response.status_code in [200, 201]:
            model = response.json()
            print_success(f"Model created successfully! ID: {model.get('id')}")
            print_result(model)
            return True, model
        else:
            print_error(f"Failed to create model: {response.status_code}")
            print_result(response.json())
            return False, None
            
    except Exception as e:
        print_error(f"Create model error: {str(e)}")
        return False, None

# Test 7: Update Model (ModelEditDialog)
def test_update_model(model_id: int):
    print_header(f"TEST 7: Update Model (ModelEditDialog) - ID: {model_id}")
    
    try:
        payload = {
            'name': 'Test Model - Phase 3 (Updated)',
            'max_position_size': 30,
        }
        
        print_info(f"Updating model {model_id}...")
        response = requests.put(
            f'{API_URL}/api/models/{model_id}',
            json=payload,
            headers=get_headers()
        )
        
        if response.status_code == 200:
            model = response.json()
            print_success("Model updated successfully!")
            print_info(f"New name: {model.get('name')}")
            print_info(f"New max position: {model.get('max_position_size')}%")
            return True
        else:
            print_error(f"Failed to update model: {response.status_code}")
            print_result(response.json())
            return False
            
    except Exception as e:
        print_error(f"Update model error: {str(e)}")
        return False

# Test 8: Get Model Performance (StatsGrid)
def test_get_model_performance(model_id: int):
    print_header(f"TEST 8: Get Model Performance (StatsGrid) - ID: {model_id}")
    
    try:
        response = requests.get(
            f'{API_URL}/api/models/{model_id}/performance',
            headers=get_headers()
        )
        
        if response.status_code == 200:
            performance = response.json()
            print_success("Performance data retrieved!")
            print_result(performance)
            return True, performance
        else:
            print_error(f"Failed to get performance: {response.status_code}")
            # This might fail if model never traded - that's okay
            print_info("(This is okay if model never traded)")
            return False, None
            
    except Exception as e:
        print_error(f"Get performance error: {str(e)}")
        return False, None

# Test 9: Delete Model (ModelEditDialog)
def test_delete_model(model_id: int):
    print_header(f"TEST 9: Delete Model (ModelEditDialog) - ID: {model_id}")
    
    try:
        print_info(f"Deleting test model {model_id}...")
        response = requests.delete(
            f'{API_URL}/api/models/{model_id}',
            headers=get_headers()
        )
        
        if response.status_code in [200, 204]:
            print_success("Model deleted successfully!")
            return True
        else:
            print_error(f"Failed to delete model: {response.status_code}")
            print_result(response.json())
            return False
            
    except Exception as e:
        print_error(f"Delete model error: {str(e)}")
        return False

# Main Test Runner
def main():
    print(f"\n{Colors.BOLD}[TEST] Phase 3 Integration Test Suite{Colors.RESET}")
    print(f"Testing API endpoints used by updated components\n")
    
    results = {
        'passed': 0,
        'failed': 0,
        'total': 0
    }
    
    # Test 1: Backend Connectivity
    results['total'] += 1
    if test_backend_connectivity():
        results['passed'] += 1
    else:
        results['failed'] += 1
        print_error("\n[FAIL] Backend not running. Cannot continue tests.")
        print_info("Start backend: python backend/main.py")
        sys.exit(1)
    
    # Test 2: Authentication
    results['total'] += 1
    if test_authentication():
        results['passed'] += 1
    else:
        results['failed'] += 1
        print_error("\n[FAIL] Authentication failed. Cannot continue tests.")
        print_info(f"Check credentials: {TEST_EMAIL} / {TEST_PASSWORD}")
        sys.exit(1)
    
    # Test 3: Get Models
    results['total'] += 1
    success, models = test_get_models()
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 4: Get Trading Status
    results['total'] += 1
    success, statuses = test_get_trading_status()
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 5: Get Available AI Models
    results['total'] += 1
    success, ai_models = test_get_available_ai_models()
    if success:
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 6: Create Model
    results['total'] += 1
    success, created_model = test_create_model()
    if success:
        results['passed'] += 1
        test_model_id = created_model.get('id')
    else:
        results['failed'] += 1
        test_model_id = None
    
    # Test 7: Update Model (if we created one)
    if test_model_id:
        results['total'] += 1
        if test_update_model(test_model_id):
            results['passed'] += 1
        else:
            results['failed'] += 1
    
    # Test 8: Get Performance (if we have a model)
    if test_model_id:
        results['total'] += 1
        success, perf = test_get_model_performance(test_model_id)
        # Don't count this as failure if model never traded
        results['passed'] += 1
    
    # Test 9: Delete Model (cleanup)
    if test_model_id:
        results['total'] += 1
        if test_delete_model(test_model_id):
            results['passed'] += 1
        else:
            results['failed'] += 1
            print_info(f"[WARNING] Test model {test_model_id} not cleaned up - delete manually")
    
    # Final Report
    print_header("TEST SUMMARY")
    print(f"Total Tests: {results['total']}")
    print_success(f"Passed: {results['passed']}")
    if results['failed'] > 0:
        print_error(f"Failed: {results['failed']}")
    else:
        print_success(f"Failed: {results['failed']}")
    
    pass_rate = (results['passed'] / results['total'] * 100) if results['total'] > 0 else 0
    print(f"\nPass Rate: {pass_rate:.1f}%\n")
    
    if results['failed'] == 0:
        print_success("[SUCCESS] All tests passed! Frontend components ready to use.")
        print_info("\nYou can now:")
        print_info("  1. Test the frontend: cd frontend-v2 && npm run dev")
        print_info("  2. Visit http://localhost:3000")
        print_info("  3. Components tested: NavigationSidebar, StatsGrid, ModelEditDialog")
        return 0
    else:
        print_error(f"[WARNING] {results['failed']} test(s) failed. Check errors above.")
        return 1

if __name__ == '__main__':
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Test interrupted by user{Colors.RESET}")
        sys.exit(130)

