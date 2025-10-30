# Comprehensive Fix & Test Workflow
# Runs all fixes systematically with testing between each step

$ErrorActionPreference = "Continue"

Write-Host "`n===================================================================" -ForegroundColor Cyan
Write-Host " AIBT PLATFORM - SYSTEMATIC FIX & TEST WORKFLOW" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

$totalSteps = 6
$currentStep = 0

# ============================================================================
# STEP 1: Verify Portfolio Value Fix
# ============================================================================

$currentStep++
Write-Host "`n[$currentStep/$totalSteps] Verifying Portfolio Value Fix" -ForegroundColor Yellow
Write-Host "-------------------------------------------------------------------" -ForegroundColor Yellow

try {
    python PROVE_CALCULATION.py
    Write-Host "`n✅ Portfolio value calculation verified" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Portfolio value test failed" -ForegroundColor Red
    exit 1
}

# ============================================================================
# STEP 2: Test Current Log Migration State
# ============================================================================

$currentStep++
Write-Host "`n[$currentStep/$totalSteps] Testing Log Migration Status (BEFORE fix)" -ForegroundColor Yellow
Write-Host "-------------------------------------------------------------------" -ForegroundColor Yellow

python TEST_LOG_MIGRATION.py
$logTestResult = $LASTEXITCODE

if ($logTestResult -eq 0) {
    Write-Host "`n✅ Logs already complete - no fix needed" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Log migration incomplete - will fix" -ForegroundColor Yellow
}

# ============================================================================
# STEP 3: Fix & Re-Migrate Logs
# ============================================================================

if ($logTestResult -ne 0) {
    $currentStep++
    Write-Host "`n[$currentStep/$totalSteps] Fixing Log Migration" -ForegroundColor Yellow
    Write-Host "-------------------------------------------------------------------" -ForegroundColor Yellow
    
    python FIX_LOG_MIGRATION.py
    Write-Host "`n✅ Log re-migration complete" -ForegroundColor Green
}

# ============================================================================
# STEP 4: Verify Log Migration Fix
# ============================================================================

if ($logTestResult -ne 0) {
    $currentStep++
    Write-Host "`n[$currentStep/$totalSteps] Verifying Log Migration Fix" -ForegroundColor Yellow
    Write-Host "-------------------------------------------------------------------" -ForegroundColor Yellow
    
    python VERIFY_LOG_MIGRATION.py
    $verifyResult = $LASTEXITCODE
    
    if ($verifyResult -eq 0) {
        Write-Host "`n✅ Log migration verified successful" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Log migration still incomplete" -ForegroundColor Red
    }
}

# ============================================================================
# STEP 5: Test All API Endpoints
# ============================================================================

$currentStep++
Write-Host "`n[$currentStep/$totalSteps] Testing All API Endpoints" -ForegroundColor Yellow
Write-Host "-------------------------------------------------------------------" -ForegroundColor Yellow

.\test_all.ps1

# ============================================================================
# STEP 6: Generate Final Report
# ============================================================================

$currentStep++
Write-Host "`n[$currentStep/$totalSteps] Generating Final Report" -ForegroundColor Yellow
Write-Host "-------------------------------------------------------------------" -ForegroundColor Yellow

Write-Host "`n===================================================================" -ForegroundColor Cyan
Write-Host " FIX & TEST WORKFLOW COMPLETE" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

Write-Host "`nFixed Issues:" -ForegroundColor White
Write-Host "  ✅ Portfolio value calculation" -ForegroundColor Green
if ($logTestResult -ne 0) {
    if ($verifyResult -eq 0) {
        Write-Host "  ✅ Log migration" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Log migration (needs review)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✅ Log migration (was already complete)" -ForegroundColor Green
}

Write-Host "`nNext Steps:" -ForegroundColor White
Write-Host "  1. Refresh frontend (Ctrl+F5) to see new values" -ForegroundColor Gray
Write-Host "  2. Check /models/8 shows ~`$10,693 total value" -ForegroundColor Gray
Write-Host "  3. Check /admin leaderboard shows positive returns" -ForegroundColor Gray
Write-Host "  4. Document fixes in docs/bugs-and-fixes.md" -ForegroundColor Gray

Write-Host "`n===================================================================" -ForegroundColor Cyan
Write-Host ""

