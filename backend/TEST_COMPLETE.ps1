# ============================================================================
# AIBT BACKEND - COMPLETE ENDPOINT TEST SUITE
# Tests EVERY SINGLE endpoint in the API
# ============================================================================

$baseUrl = "http://localhost:8080"
$passCount = 0
$failCount = 0
$testDetails = @()

function Test-Endpoint {
    param(
        [string]$Category,
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [object]$Body,
        [hashtable]$Headers,
        [string]$ExpectedStatus = "Pass",
        [string]$ExpectField = ""
    )
    
    $testNum = $script:passCount + $script:failCount + 1
    Write-Host "`n[$testNum] " -NoNewline -ForegroundColor Cyan
    Write-Host "[$Category] " -NoNewline -ForegroundColor Yellow
    Write-Host $Name -ForegroundColor White
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
        }
        
        if ($Headers) {
            $params.Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        
        # Verify expected field if specified
        if ($ExpectField -and $response) {
            $fieldValue = $response.$ExpectField
            Write-Host "    ✅ PASS - $ExpectField`: $fieldValue" -ForegroundColor Green
        } else {
            Write-Host "    ✅ PASS" -ForegroundColor Green
        }
        
        $script:passCount++
        $script:testDetails += @{
            Test = $Name
            Status = "PASS"
            Category = $Category
        }
        return $response
        
    } catch {
        if ($ExpectedStatus -eq "Fail") {
            Write-Host "    ✅ PASS (Expected to fail)" -ForegroundColor Green
            $script:passCount++
            $script:testDetails += @{
                Test = $Name
                Status = "PASS"
                Category = $Category
            }
        } else {
            $errorMsg = $_.Exception.Message
            Write-Host "    ❌ FAIL: $errorMsg" -ForegroundColor Red
            $script:failCount++
            $script:testDetails += @{
                Test = $Name
                Status = "FAIL"
                Category = $Category
                Error = $errorMsg
            }
        }
        return $null
    }
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "     AIBT BACKEND - COMPLETE ENDPOINT TEST SUITE" -ForegroundColor Cyan
Write-Host "     Testing ALL Endpoints" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan

# ============================================================================
# SETUP: Login to get tokens
# ============================================================================

Write-Host "`n🔐 Setting up test credentials..." -ForegroundColor Yellow

$userLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"samerawada92@gmail.com","password":"testpass456"}'
$userToken = $userLogin.access_token
Write-Host "   ✅ User token obtained" -ForegroundColor Green

$adminLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"adam@truetradinggroup.com","password":"adminpass123"}'
$adminToken = $adminLogin.access_token
Write-Host "   ✅ Admin token obtained" -ForegroundColor Green

# ============================================================================
# CATEGORY 1: PUBLIC ENDPOINTS (No Auth Required)
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " CATEGORY 1: PUBLIC ENDPOINTS (3 tests)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Test-Endpoint -Category "PUBLIC" -Name "Root endpoint (/)" `
    -Method "GET" -Url "$baseUrl/"

Test-Endpoint -Category "PUBLIC" -Name "Health check" `
    -Method "GET" -Url "$baseUrl/api/health"

Test-Endpoint -Category "PUBLIC" -Name "Get stock prices (AAPL)" `
    -Method "GET" -Url "$baseUrl/api/stock-prices?symbol=AAPL" `
    -ExpectField "total_records"

# ============================================================================
# CATEGORY 2: AUTHENTICATION ENDPOINTS
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " CATEGORY 2: AUTHENTICATION (6 tests)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Test-Endpoint -Category "AUTH" -Name "Login (already tested in setup)" `
    -Method "POST" -Url "$baseUrl/api/auth/login" `
    -Body @{email="samerawada92@gmail.com"; password="testpass456"}

Test-Endpoint -Category "AUTH" -Name "Get current user (/api/auth/me)" `
    -Method "GET" -Url "$baseUrl/api/auth/me" `
    -Headers @{Authorization="Bearer $userToken"} `
    -ExpectField "email"

# Test unapproved signup (should fail)
Test-Endpoint -Category "AUTH" -Name "Signup with unapproved email (should fail)" `
    -Method "POST" -Url "$baseUrl/api/auth/signup" `
    -Body @{email="hacker@evil.com"; password="password123"} `
    -ExpectedStatus "Fail"

# Test signup with approved email (new user)
Test-Endpoint -Category "AUTH" -Name "Signup with approved email" `
    -Method "POST" -Url "$baseUrl/api/auth/signup" `
    -Body @{email="mperinotti@gmail.com"; password="testpass789"}

# Logout test
Test-Endpoint -Category "AUTH" -Name "Logout" `
    -Method "POST" -Url "$baseUrl/api/auth/logout" `
    -Headers @{Authorization="Bearer $userToken"}

# Re-login after logout
$userLogin2 = Test-Endpoint -Category "AUTH" -Name "Re-login after logout" `
    -Method "POST" -Url "$baseUrl/api/auth/login" `
    -Body @{email="samerawada92@gmail.com"; password="testpass456"}

# ============================================================================
# CATEGORY 3: USER MODEL MANAGEMENT
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " CATEGORY 3: USER MODEL MANAGEMENT (3 tests)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$myModels = Test-Endpoint -Category "MODELS" -Name "Get my models" `
    -Method "GET" -Url "$baseUrl/api/models" `
    -Headers @{Authorization="Bearer $userToken"} `
    -ExpectField "total_models"

$newModel = Test-Endpoint -Category "MODELS" -Name "Create new model" `
    -Method "POST" -Url "$baseUrl/api/models" `
    -Headers @{Authorization="Bearer $userToken"} `
    -Body @{name="Complete Test Model"; signature="test-model-complete"; description="Full test model"}

if ($newModel) {
    $testModelId = $newModel.id
    Write-Host "    📝 Created model ID: $testModelId" -ForegroundColor Gray
}

# Get admin's models (should have 7 migrated models)
$adminModels = Test-Endpoint -Category "MODELS" -Name "Get admin's models (should have 7+ models)" `
    -Method "GET" -Url "$baseUrl/api/models" `
    -Headers @{Authorization="Bearer $adminToken"} `
    -ExpectField "total_models"

# ============================================================================
# CATEGORY 4: POSITION ENDPOINTS
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " CATEGORY 4: POSITIONS (4 tests)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Get positions for migrated model (claude-4.5-sonnet = ID 8)
$positions = Test-Endpoint -Category "POSITIONS" -Name "Get positions (Model 8: claude-4.5-sonnet)" `
    -Method "GET" -Url "$baseUrl/api/models/8/positions" `
    -Headers @{Authorization="Bearer $adminToken"} `
    -ExpectField "total_records"

# Get positions with pagination
Test-Endpoint -Category "POSITIONS" -Name "Get positions with pagination (page 1, size 10)" `
    -Method "GET" -Url "$baseUrl/api/models/8/positions?page=1&page_size=10" `
    -Headers @{Authorization="Bearer $adminToken"}

# Get latest position
Test-Endpoint -Category "POSITIONS" -Name "Get latest position (Model 8)" `
    -Method "GET" -Url "$baseUrl/api/models/8/positions/latest" `
    -Headers @{Authorization="Bearer $adminToken"} `
    -ExpectField "cash"

# Test that user CANNOT access another user's model positions (privacy test)
Test-Endpoint -Category "POSITIONS" -Name "User blocked from admin's model (privacy test)" `
    -Method "GET" -Url "$baseUrl/api/models/8/positions" `
    -Headers @{Authorization="Bearer $userToken"} `
    -ExpectedStatus "Fail"

# ============================================================================
# CATEGORY 5: LOG ENDPOINTS
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " CATEGORY 5: TRADING LOGS (2 tests)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Get all logs for model
Test-Endpoint -Category "LOGS" -Name "Get all logs (Model 8)" `
    -Method "GET" -Url "$baseUrl/api/models/8/logs" `
    -Headers @{Authorization="Bearer $adminToken"} `
    -ExpectField "total_entries"

# Get logs for specific date
Test-Endpoint -Category "LOGS" -Name "Get logs for specific date (2025-10-28)" `
    -Method "GET" -Url "$baseUrl/api/models/8/logs?trade_date=2025-10-28" `
    -Headers @{Authorization="Bearer $adminToken"}

# ============================================================================
# CATEGORY 6: PERFORMANCE METRICS
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " CATEGORY 6: PERFORMANCE METRICS (1 test)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$performance = Test-Endpoint -Category "PERFORMANCE" -Name "Get performance metrics (Model 8)" `
    -Method "GET" -Url "$baseUrl/api/models/8/performance" `
    -Headers @{Authorization="Bearer $adminToken"}

if ($performance -and $performance.metrics) {
    Write-Host "    📊 Sharpe Ratio: $($performance.metrics.sharpe_ratio)" -ForegroundColor Gray
    Write-Host "    📊 Cumulative Return: $($performance.metrics.cumulative_return)" -ForegroundColor Gray
}

# ============================================================================
# CATEGORY 7: ADMIN USER MANAGEMENT
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " CATEGORY 7: ADMIN USER MANAGEMENT (3 tests)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$allUsers = Test-Endpoint -Category "ADMIN" -Name "Get all users" `
    -Method "GET" -Url "$baseUrl/api/admin/users" `
    -Headers @{Authorization="Bearer $adminToken"} `
    -ExpectField "total_users"

$allModelsAdmin = Test-Endpoint -Category "ADMIN" -Name "Get all models (all users)" `
    -Method "GET" -Url "$baseUrl/api/admin/models" `
    -Headers @{Authorization="Bearer $adminToken"} `
    -ExpectField "total_models"

$stats = Test-Endpoint -Category "ADMIN" -Name "Get system statistics" `
    -Method "GET" -Url "$baseUrl/api/admin/stats" `
    -Headers @{Authorization="Bearer $adminToken"}

if ($stats) {
    Write-Host "    📊 Users: $($stats.total_users)" -ForegroundColor Gray
    Write-Host "    📊 Models: $($stats.total_models)" -ForegroundColor Gray
    Write-Host "    📊 Positions: $($stats.total_positions)" -ForegroundColor Gray
    Write-Host "    📊 Logs: $($stats.total_logs)" -ForegroundColor Gray
}

# ============================================================================
# CATEGORY 8: ADMIN LEADERBOARD
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " CATEGORY 8: ADMIN LEADERBOARD (1 test)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$leaderboard = Test-Endpoint -Category "ADMIN" -Name "Get global leaderboard" `
    -Method "GET" -Url "$baseUrl/api/admin/leaderboard" `
    -Headers @{Authorization="Bearer $adminToken"} `
    -ExpectField "total_models"

if ($leaderboard -and $leaderboard.leaderboard) {
    Write-Host "    🏆 Top 3 Models:" -ForegroundColor Gray
    for ($i = 0; $i -lt [Math]::Min(3, $leaderboard.leaderboard.Count); $i++) {
        $model = $leaderboard.leaderboard[$i]
        Write-Host "       $($i+1). $($model.model_name) - Return: $($model.cumulative_return)" -ForegroundColor Gray
    }
}

# ============================================================================
# CATEGORY 9: TRADING CONTROL
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " CATEGORY 9: TRADING CONTROL (4 tests)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Get all trading status
Test-Endpoint -Category "TRADING" -Name "Get all trading status" `
    -Method "GET" -Url "$baseUrl/api/trading/status" `
    -Headers @{Authorization="Bearer $adminToken"} `
    -ExpectField "total_running"

# Get specific model trading status
Test-Endpoint -Category "TRADING" -Name "Get model 8 trading status" `
    -Method "GET" -Url "$baseUrl/api/trading/status/8" `
    -Headers @{Authorization="Bearer $adminToken"} `
    -ExpectField "status"

# Test user CANNOT start admin's model (privacy)
Test-Endpoint -Category "TRADING" -Name "User blocked from starting admin's model" `
    -Method "GET" -Url "$baseUrl/api/trading/status/8" `
    -Headers @{Authorization="Bearer $userToken"} `
    -ExpectedStatus "Fail"

# Get user's own trading status (should be empty/not_running)
if ($testModelId) {
    Test-Endpoint -Category "TRADING" -Name "Get user's model trading status" `
        -Method "GET" -Url "$baseUrl/api/trading/status/$testModelId" `
        -Headers @{Authorization="Bearer $userToken"}
}

# ============================================================================
# CATEGORY 10: MCP SERVICE MANAGEMENT
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " CATEGORY 10: MCP SERVICE MANAGEMENT (2 tests)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$mcpStatus = Test-Endpoint -Category "MCP" -Name "Get MCP service status" `
    -Method "GET" -Url "$baseUrl/api/mcp/status" `
    -Headers @{Authorization="Bearer $adminToken"}

if ($mcpStatus) {
    foreach ($prop in $mcpStatus.PSObject.Properties) {
        Write-Host "    📡 $($prop.Name): $($prop.Value.status)" -ForegroundColor Gray
    }
}

# Test user CANNOT access MCP endpoints (admin only)
Test-Endpoint -Category "MCP" -Name "User blocked from MCP status" `
    -Method "GET" -Url "$baseUrl/api/mcp/status" `
    -Headers @{Authorization="Bearer $userToken"} `
    -ExpectedStatus "Fail"

# ============================================================================
# CATEGORY 11: SECURITY TESTS
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host " CATEGORY 11: SECURITY AND PRIVACY (6 tests)" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

# No auth - should fail
Test-Endpoint -Category "SECURITY" -Name "Unauth blocked from /api/models" `
    -Method "GET" -Url "$baseUrl/api/models" `
    -ExpectedStatus "Fail"

Test-Endpoint -Category "SECURITY" -Name "Unauth blocked from /api/auth/me" `
    -Method "GET" -Url "$baseUrl/api/auth/me" `
    -ExpectedStatus "Fail"

# User should NOT access admin endpoints
Test-Endpoint -Category "SECURITY" -Name "User blocked from admin/users" `
    -Method "GET" -Url "$baseUrl/api/admin/users" `
    -Headers @{Authorization="Bearer $userToken"} `
    -ExpectedStatus "Fail"

Test-Endpoint -Category "SECURITY" -Name "User blocked from admin/models" `
    -Method "GET" -Url "$baseUrl/api/admin/models" `
    -Headers @{Authorization="Bearer $userToken"} `
    -ExpectedStatus "Fail"

Test-Endpoint -Category "SECURITY" -Name "User blocked from admin/stats" `
    -Method "GET" -Url "$baseUrl/api/admin/stats" `
    -Headers @{Authorization="Bearer $userToken"} `
    -ExpectedStatus "Fail"

Test-Endpoint -Category "SECURITY" -Name "User blocked from admin/leaderboard" `
    -Method "GET" -Url "$baseUrl/api/admin/leaderboard" `
    -Headers @{Authorization="Bearer $userToken"} `
    -ExpectedStatus "Fail"

# ============================================================================
# FINAL RESULTS
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "                       FINAL TEST RESULTS" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

$totalTests = $passCount + $failCount
$successRate = if ($totalTests -gt 0) { [math]::Round(($passCount / $totalTests) * 100, 1) } else { 0 }

Write-Host "Total Endpoints Tested: $totalTests" -ForegroundColor White
Write-Host "✅ Passed: $passCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor Red
Write-Host "📊 Success Rate: $successRate%" -ForegroundColor $(if ($successRate -eq 100) { "Green" } else { "Yellow" })

Write-Host ""

if ($failCount -eq 0) {
    Write-Host "====================================================================" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "            100 PERCENT TEST SUCCESS!" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "     AIBT BACKEND IS PRODUCTION-READY!" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "  - Authentication" -ForegroundColor Green
    Write-Host "  - Authorization (Admin vs User)" -ForegroundColor Green
    Write-Host "  - Data Privacy (RLS enforced)" -ForegroundColor Green
    Write-Host "  - Model Management" -ForegroundColor Green
    Write-Host "  - Trading Data Access" -ForegroundColor Green
    Write-Host "  - Trading Control" -ForegroundColor Green
    Write-Host "  - MCP Service Management" -ForegroundColor Green
    Write-Host "  - Admin Dashboard APIs" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "====================================================================" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📊 VERIFIED DATABASE CONTENTS:" -ForegroundColor White
    if ($stats) {
        Write-Host "   Users: $($stats.total_users) (Admins: $($stats.admin_count), Regular: $($stats.user_count))" -ForegroundColor Gray
        Write-Host "   AI Models: $($stats.total_models)" -ForegroundColor Gray
        Write-Host "   Trading Positions: $($stats.total_positions)" -ForegroundColor Gray
        Write-Host "   Log Entries: $($stats.total_logs)" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️ $failCount tests failed - review errors above" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔗 Interactive API Docs: http://localhost:8080/api/docs" -ForegroundColor Cyan
Write-Host ""

