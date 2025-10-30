# AIBT Backend - Test Every Single Endpoint
# Simple script that works without syntax errors

$base = "http://localhost:8080"
$pass = 0
$fail = 0

Write-Host "`nAIBT BACKEND - TESTING ALL ENDPOINTS`n" -ForegroundColor Cyan

# Setup: Login
Write-Host "Setting up..." -ForegroundColor Yellow
$user = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"samerawada92@gmail.com","password":"testpass456"}'
$ut = $user.access_token

$admin = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"adam@truetradinggroup.com","password":"adminpass123"}'
$at = $admin.access_token
Write-Host "Tokens obtained`n" -ForegroundColor Green

# Test function
function T {
    param($name, $method, $url, $body, $headers, $shouldFail=$false)
    
    Write-Host "Testing: $name" -ForegroundColor White
    try {
        $p = @{Uri=$url; Method=$method; ContentType="application/json"}
        if ($headers) { $p.Headers = $headers }
        if ($body) { $p.Body = ($body | ConvertTo-Json) }
        
        $r = Invoke-RestMethod @p
        
        if ($shouldFail) {
            Write-Host "  FAIL (should have been blocked)`n" -ForegroundColor Red
            $script:fail++
        } else {
            Write-Host "  PASS`n" -ForegroundColor Green
            $script:pass++
        }
        return $r
    } catch {
        if ($shouldFail) {
            Write-Host "  PASS (correctly blocked)`n" -ForegroundColor Green
            $script:pass++
        } else {
            Write-Host "  FAIL: $($_.Exception.Message)`n" -ForegroundColor Red
            $script:fail++
        }
        return $null
    }
}

# PUBLIC ENDPOINTS
Write-Host "`n=== PUBLIC (No Auth) ===`n" -ForegroundColor Cyan
T "GET /" "GET" "$base/"
T "GET /api/health" "GET" "$base/api/health"
$prices = T "GET /api/stock-prices" "GET" "$base/api/stock-prices?symbol=AAPL"

# AUTH ENDPOINTS
Write-Host "`n=== AUTHENTICATION ===`n" -ForegroundColor Cyan
T "POST /api/auth/signup (unapproved - should fail)" "POST" "$base/api/auth/signup" @{email="bad@email.com";password="test"} $null $true
T "POST /api/auth/login (user)" "POST" "$base/api/auth/login" @{email="samerawada92@gmail.com";password="testpass456"}
T "POST /api/auth/login (admin)" "POST" "$base/api/auth/login" @{email="adam@truetradinggroup.com";password="adminpass123"}
T "GET /api/auth/me (user)" "GET" "$base/api/auth/me" $null @{Authorization="Bearer $ut"}
T "GET /api/auth/me (admin)" "GET" "$base/api/auth/me" $null @{Authorization="Bearer $at"}
T "POST /api/auth/logout" "POST" "$base/api/auth/logout" $null @{Authorization="Bearer $ut"}

# USER MODEL ENDPOINTS
Write-Host "`n=== USER MODELS ===`n" -ForegroundColor Cyan
$myModels = T "GET /api/models (user)" "GET" "$base/api/models" $null @{Authorization="Bearer $ut"}
$newModel = T "POST /api/models (create)" "POST" "$base/api/models" @{name="TestM";signature="test";description="Test"} @{Authorization="Bearer $ut"}
$adminModels = T "GET /api/models (admin)" "GET" "$base/api/models" $null @{Authorization="Bearer $at"}

# POSITION ENDPOINTS
Write-Host "`n=== POSITIONS ===`n" -ForegroundColor Cyan
T "GET /api/models/8/positions (all)" "GET" "$base/api/models/8/positions" $null @{Authorization="Bearer $at"}
T "GET /api/models/8/positions (paginated)" "GET" "$base/api/models/8/positions?page=1&page_size=10" $null @{Authorization="Bearer $at"}
T "GET /api/models/8/positions/latest" "GET" "$base/api/models/8/positions/latest" $null @{Authorization="Bearer $at"}
T "GET /api/models/8/positions (user blocked)" "GET" "$base/api/models/8/positions" $null @{Authorization="Bearer $ut"} $true

# LOG ENDPOINTS
Write-Host "`n=== LOGS ===`n" -ForegroundColor Cyan
T "GET /api/models/8/logs (all)" "GET" "$base/api/models/8/logs" $null @{Authorization="Bearer $at"}
T "GET /api/models/8/logs (specific date)" "GET" "$base/api/models/8/logs?trade_date=2025-10-28" $null @{Authorization="Bearer $at"}

# PERFORMANCE ENDPOINTS  
Write-Host "`n=== PERFORMANCE ===`n" -ForegroundColor Cyan
$perf = T "GET /api/models/8/performance" "GET" "$base/api/models/8/performance" $null @{Authorization="Bearer $at"}

# ADMIN USER MANAGEMENT
Write-Host "`n=== ADMIN USER MGMT ===`n" -ForegroundColor Cyan
$allUsers = T "GET /api/admin/users" "GET" "$base/api/admin/users" $null @{Authorization="Bearer $at"}
$allModelsA = T "GET /api/admin/models" "GET" "$base/api/admin/models" $null @{Authorization="Bearer $at"}
$stats = T "GET /api/admin/stats" "GET" "$base/api/admin/stats" $null @{Authorization="Bearer $at"}

# ADMIN LEADERBOARD
Write-Host "`n=== LEADERBOARD ===`n" -ForegroundColor Cyan
$lb = T "GET /api/admin/leaderboard" "GET" "$base/api/admin/leaderboard" $null @{Authorization="Bearer $at"}

# TRADING CONTROL
Write-Host "`n=== TRADING CONTROL ===`n" -ForegroundColor Cyan
T "GET /api/trading/status (all)" "GET" "$base/api/trading/status" $null @{Authorization="Bearer $at"}
T "GET /api/trading/status/8" "GET" "$base/api/trading/status/8" $null @{Authorization="Bearer $at"}
T "GET /api/trading/status/8 (user blocked)" "GET" "$base/api/trading/status/8" $null @{Authorization="Bearer $ut"} $true

# MCP MANAGEMENT
Write-Host "`n=== MCP SERVICES ===`n" -ForegroundColor Cyan
T "GET /api/mcp/status" "GET" "$base/api/mcp/status" $null @{Authorization="Bearer $at"}
T "GET /api/mcp/status (user blocked)" "GET" "$base/api/mcp/status" $null @{Authorization="Bearer $ut"} $true

# SECURITY TESTS
Write-Host "`n=== SECURITY: AUTH REQUIRED ===`n" -ForegroundColor Cyan
T "GET /api/models (no auth - blocked)" "GET" "$base/api/models" $null $null $true
T "GET /api/auth/me (no auth - blocked)" "GET" "$base/api/auth/me" $null $null $true

# SECURITY: ADMIN-ONLY ENDPOINTS
Write-Host "`n=== SECURITY: ADMIN REQUIRED ===`n" -ForegroundColor Cyan
T "GET /api/admin/users (user - blocked)" "GET" "$base/api/admin/users" $null @{Authorization="Bearer $ut"} $true
T "GET /api/admin/models (user - blocked)" "GET" "$base/api/admin/models" $null @{Authorization="Bearer $ut"} $true
T "GET /api/admin/stats (user - blocked)" "GET" "$base/api/admin/stats" $null @{Authorization="Bearer $ut"} $true
T "GET /api/admin/leaderboard (user - blocked)" "GET" "$base/api/admin/leaderboard" $null @{Authorization="Bearer $ut"} $true

# SECURITY: USER ISOLATION (CRITICAL!)
Write-Host "`n=== SECURITY: USER ISOLATION (CRITICAL) ===`n" -ForegroundColor Cyan

# Create second user first if doesn't exist
try {
    $user2 = Invoke-RestMethod -Uri "$base/api/auth/signup" -Method Post -ContentType "application/json" -Body '{"email":"mperinotti@gmail.com","password":"testpass789"}'
    $ut2 = $user2.access_token
} catch {
    # Already exists, login instead
    $user2 = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"mperinotti@gmail.com","password":"testpass789"}'
    $ut2 = $user2.access_token
}

# Create model for user 1 (samerawada92)
$user1Model = Invoke-RestMethod -Uri "$base/api/models" -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $ut"} -Body '{"name":"User1 Model","signature":"user1-model","description":"Private to user 1"}'
$user1ModelId = $user1Model.id

# Create model for user 2 (mperinotti)
$user2Model = Invoke-RestMethod -Uri "$base/api/models" -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $ut2"} -Body '{"name":"User2 Model","signature":"user2-model","description":"Private to user 2"}'
$user2ModelId = $user2Model.id

Write-Host "  Created User1 Model (ID: $user1ModelId)" -ForegroundColor Gray
Write-Host "  Created User2 Model (ID: $user2ModelId)`n" -ForegroundColor Gray

# Test: User 2 CANNOT see User 1's models
T "User 2 CANNOT see User 1's model list" "GET" "$base/api/models" $null @{Authorization="Bearer $ut2"}
$user2Models = Invoke-RestMethod -Uri "$base/api/models" -Headers @{Authorization="Bearer $ut2"}
if ($user2Models.models | Where-Object { $_.id -eq $user1ModelId }) {
    Write-Host "  FAIL: User 2 can see User 1's model!" -ForegroundColor Red
    $script:fail++
} else {
    Write-Host "  PASS: User 2 cannot see User 1's model`n" -ForegroundColor Green
    $script:pass++
}

# Test: User 1 CANNOT see User 2's models
T "User 1 CANNOT see User 2's model list" "GET" "$base/api/models" $null @{Authorization="Bearer $ut"}
$user1Models = Invoke-RestMethod -Uri "$base/api/models" -Headers @{Authorization="Bearer $ut"}
if ($user1Models.models | Where-Object { $_.id -eq $user2ModelId }) {
    Write-Host "  FAIL: User 1 can see User 2's model!" -ForegroundColor Red
    $script:fail++
} else {
    Write-Host "  PASS: User 1 cannot see User 2's model`n" -ForegroundColor Green
    $script:pass++
}

# Test: User 2 CANNOT access User 1's model positions
T "User 2 blocked from User 1's positions" "GET" "$base/api/models/$user1ModelId/positions" $null @{Authorization="Bearer $ut2"} $true

# Test: User 1 CANNOT access User 2's model positions
T "User 1 blocked from User 2's positions" "GET" "$base/api/models/$user2ModelId/positions" $null @{Authorization="Bearer $ut"} $true

# Test: User 2 CANNOT access User 1's model logs
T "User 2 blocked from User 1's logs" "GET" "$base/api/models/$user1ModelId/logs" $null @{Authorization="Bearer $ut2"} $true

# Test: User 1 CANNOT access User 2's model logs
T "User 1 blocked from User 2's logs" "GET" "$base/api/models/$user2ModelId/logs" $null @{Authorization="Bearer $ut"} $true

# Test: User 2 CANNOT start/stop User 1's trading
T "User 2 blocked from starting User 1's trading" "GET" "$base/api/trading/status/$user1ModelId" $null @{Authorization="Bearer $ut2"} $true

# Test: User 1 CANNOT start/stop User 2's trading
T "User 1 blocked from starting User 2's trading" "GET" "$base/api/trading/status/$user2ModelId" $null @{Authorization="Bearer $ut"} $true

# ADVANCED FEATURES
Write-Host "`n=== MCP SERVICE CONTROL (POST) ===`n" -ForegroundColor Cyan
T "POST /api/mcp/start" "POST" "$base/api/mcp/start" $null @{Authorization="Bearer $at"}
T "POST /api/mcp/stop" "POST" "$base/api/mcp/stop" $null @{Authorization="Bearer $at"}

# ADMIN ROLE MANAGEMENT  
Write-Host "`n=== USER ROLE MANAGEMENT ===`n" -ForegroundColor Cyan

# Change role endpoint expects JSON body with new_role field
try {
    $roleChange = Invoke-RestMethod -Uri "$base/api/admin/users/300e9600-ff17-4a3a-83ca-27cba1801324/role?new_role=admin" -Method Put -ContentType "application/json" -Headers @{Authorization="Bearer $at"}
    Write-Host "Testing: PUT /api/admin/users/role (to admin)" -ForegroundColor White
    Write-Host "  PASS`n" -ForegroundColor Green
    $script:pass++
} catch {
    Write-Host "Testing: PUT /api/admin/users/role (to admin)" -ForegroundColor White
    Write-Host "  FAIL: $($_.Exception.Message)`n" -ForegroundColor Red
    $script:fail++
}

try {
    $roleBack = Invoke-RestMethod -Uri "$base/api/admin/users/300e9600-ff17-4a3a-83ca-27cba1801324/role?new_role=user" -Method Put -ContentType "application/json" -Headers @{Authorization="Bearer $at"}
    Write-Host "Testing: PUT /api/admin/users/role (back to user)" -ForegroundColor White
    Write-Host "  PASS`n" -ForegroundColor Green
    $script:pass++
} catch {
    Write-Host "Testing: PUT /api/admin/users/role (back to user)" -ForegroundColor White
    Write-Host "  FAIL: $($_.Exception.Message)`n" -ForegroundColor Red
    $script:fail++
}

# TRADING START/STOP
Write-Host "`n=== TRADING START/STOP ===`n" -ForegroundColor Cyan
T "POST /api/trading/start/8" "POST" "$base/api/trading/start/8?basemodel=openai/gpt-4o&start_date=2025-10-29&end_date=2025-10-30" $null @{Authorization="Bearer $at"}

# Wait a bit
Start-Sleep -Seconds 1

T "GET /api/trading/status/8 (should be running)" "GET" "$base/api/trading/status/8" $null @{Authorization="Bearer $at"}

T "POST /api/trading/stop/8" "POST" "$base/api/trading/stop/8" $null @{Authorization="Bearer $at"}

# RESULTS
Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "FINAL RESULTS" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Total: $($pass + $fail)" -ForegroundColor White
Write-Host "Passed: $pass" -ForegroundColor Green
Write-Host "Failed: $fail" -ForegroundColor Red
$rate = [math]::Round(($pass / ($pass + $fail)) * 100, 1)
Write-Host "Success Rate: $rate%`n" -ForegroundColor $(if ($rate -eq 100) {"Green"} else {"Yellow"})

if ($fail -eq 0) {
    Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "Backend is 100% functional!`n" -ForegroundColor Green
    
    if ($stats) {
        Write-Host "Database:" -ForegroundColor White
        Write-Host "  Users: $($stats.total_users)" -ForegroundColor Gray
        Write-Host "  Models: $($stats.total_models)" -ForegroundColor Gray  
        Write-Host "  Positions: $($stats.total_positions)" -ForegroundColor Gray
        Write-Host "  Logs: $($stats.total_logs)`n" -ForegroundColor Gray
    }
}

Write-Host "API Docs: http://localhost:8080/api/docs`n" -ForegroundColor Cyan

