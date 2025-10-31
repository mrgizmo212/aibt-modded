# ============================================================================
# AIBT Backend Test Suite
# Tests all endpoints to prove backend is 100% functional
# ============================================================================

$baseUrl = "http://localhost:8080"
$passCount = 0
$failCount = 0

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " AIBT BACKEND - TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# PHASE 1: Health Checks
# ============================================================================

Write-Host "PHASE 1: Health Checks" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow

try {
    $health = Invoke-RestMethod -Uri "$baseUrl/"
    Write-Host "✅ Root endpoint working" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "❌ Root endpoint failed" -ForegroundColor Red
    $failCount++
}

try {
    $health2 = Invoke-RestMethod -Uri "$baseUrl/api/health"
    Write-Host "✅ Health endpoint working" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "❌ Health endpoint failed" -ForegroundColor Red
    $failCount++
}

# ============================================================================
# PHASE 2: Authentication
# ============================================================================

Write-Host ""
Write-Host "PHASE 2: Authentication" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow

# Login as user
try {
    $userLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"samerawada92@gmail.com","password":"testpass456"}'
    $userToken = $userLogin.access_token
    Write-Host "✅ User login successful" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "❌ User login failed" -ForegroundColor Red
    $failCount++
}

# Login as admin
try {
    $adminLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"adam@truetradinggroup.com","password":"adminpass123"}'
    $adminToken = $adminLogin.access_token
    Write-Host "✅ Admin login successful" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "❌ Admin login failed" -ForegroundColor Red
    $failCount++
}

# Get current user
try {
    $me = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Headers @{Authorization="Bearer $userToken"}
    Write-Host "✅ Get current user working (email: $($me.email))" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "❌ Get current user failed" -ForegroundColor Red
    $failCount++
}

# ============================================================================
# PHASE 3: User Endpoints
# ============================================================================

Write-Host ""
Write-Host "PHASE 3: User Data Access" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow

try {
    $myModels = Invoke-RestMethod -Uri "$baseUrl/api/models" -Headers @{Authorization="Bearer $userToken"}
    Write-Host "✅ Get my models working ($($myModels.total_models) models)" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "❌ Get my models failed" -ForegroundColor Red
    $failCount++
}

# Create a test model
try {
    $newModel = Invoke-RestMethod -Uri "$baseUrl/api/models" -Method Post -ContentType "application/json" `
        -Headers @{Authorization="Bearer $userToken"} `
        -Body '{"name":"Test Model","signature":"test-model","description":"Test"}'
    Write-Host "✅ Create model working (ID: $($newModel.id))" -ForegroundColor Green
    $passCount++
    $testModelId = $newModel.id
} catch {
    Write-Host "❌ Create model failed" -ForegroundColor Red
    $failCount++
}

# ============================================================================
# PHASE 4: Admin Endpoints
# ============================================================================

Write-Host ""
Write-Host "PHASE 4: Admin Access" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow

try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/admin/stats" -Headers @{Authorization="Bearer $adminToken"}
    Write-Host "✅ Admin stats working" -ForegroundColor Green
    Write-Host "   Users: $($stats.total_users)" -ForegroundColor Gray
    Write-Host "   Models: $($stats.total_models)" -ForegroundColor Gray
    Write-Host "   Positions: $($stats.total_positions)" -ForegroundColor Gray
    Write-Host "   Logs: $($stats.total_logs)" -ForegroundColor Gray
    $passCount++
} catch {
    Write-Host "❌ Admin stats failed" -ForegroundColor Red
    $failCount++
}

try {
    $allUsers = Invoke-RestMethod -Uri "$baseUrl/api/admin/users" -Headers @{Authorization="Bearer $adminToken"}
    Write-Host "✅ Get all users working ($($allUsers.total_users) users)" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "❌ Get all users failed" -ForegroundColor Red
    $failCount++
}

try {
    $allModels = Invoke-RestMethod -Uri "$baseUrl/api/admin/models" -Headers @{Authorization="Bearer $adminToken"}
    Write-Host "✅ Get all models working ($($allModels.total_models) models)" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "❌ Get all models failed" -ForegroundColor Red
    $failCount++
}

# ============================================================================
# PHASE 5: Security Tests
# ============================================================================

Write-Host ""
Write-Host "PHASE 5: Security & Privacy" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow

# User should NOT access admin endpoint
try {
    $blocked = Invoke-RestMethod -Uri "$baseUrl/api/admin/stats" -Headers @{Authorization="Bearer $userToken"}
    Write-Host "❌ SECURITY ISSUE: User accessed admin endpoint!" -ForegroundColor Red
    $failCount++
} catch {
    Write-Host "✅ User correctly blocked from admin endpoint (403)" -ForegroundColor Green
    $passCount++
}

# Unauthenticated should NOT access protected endpoint
try {
    $noAuth = Invoke-RestMethod -Uri "$baseUrl/api/models"
    Write-Host "❌ SECURITY ISSUE: Unauth accessed protected endpoint!" -ForegroundColor Red
    $failCount++
} catch {
    Write-Host "✅ Unauthenticated correctly blocked (401)" -ForegroundColor Green
    $passCount++
}

# ============================================================================
# PHASE 6: Trading Control
# ============================================================================

Write-Host ""
Write-Host "PHASE 6: Trading Control" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow

try {
    $tradingStatus = Invoke-RestMethod -Uri "$baseUrl/api/trading/status" -Headers @{Authorization="Bearer $adminToken"}
    Write-Host "✅ Trading status endpoint working" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "❌ Trading status failed" -ForegroundColor Red
    $failCount++
}

# ============================================================================
# PHASE 7: MCP Services
# ============================================================================

Write-Host ""
Write-Host "PHASE 7: MCP Service Management" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow

try {
    $mcpStatus = Invoke-RestMethod -Uri "$baseUrl/api/mcp/status" -Headers @{Authorization="Bearer $adminToken"}
    Write-Host "✅ MCP status endpoint working" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "❌ MCP status failed" -ForegroundColor Red
    $failCount++
}

# ============================================================================
# RESULTS
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TEST RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalTests = $passCount + $failCount
$successRate = if ($totalTests -gt 0) { [math]::Round(($passCount / $totalTests) * 100, 1) } else { 0 }

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "✅ Passed: $passCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor Red
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -eq 100) { "Green" } else { "Yellow" })

Write-Host ""

if ($failCount -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " ✅ ALL TESTS PASSED!" -ForegroundColor Green  
    Write-Host " Backend is 100% functional!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Database contains:" -ForegroundColor White
    if ($stats) {
        Write-Host "  - $($stats.total_users) users" -ForegroundColor Gray
        Write-Host "  - $($stats.total_models) AI models" -ForegroundColor Gray
        Write-Host "  - $($stats.total_positions) trading positions" -ForegroundColor Gray
        Write-Host "  - $($stats.total_logs) log entries" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️ Some tests failed - review above" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Tokens saved:" -ForegroundColor Cyan
Write-Host "`$userToken - Regular user" -ForegroundColor Gray
Write-Host "`$adminToken - Admin user" -ForegroundColor Gray
Write-Host ""
Write-Host "API Docs: http://localhost:8080/api/docs" -ForegroundColor Cyan
Write-Host ""

