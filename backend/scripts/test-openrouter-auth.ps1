# PowerShell wrapper to run OpenRouter authentication test

Write-Host "Running OpenRouter API Authentication Test..." -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory if not already there
$backendDir = Split-Path -Parent $PSScriptRoot
Push-Location $backendDir

try {
    # Activate virtual environment if it exists
    if (Test-Path "venv\Scripts\Activate.ps1") {
        Write-Host "Activating virtual environment..." -ForegroundColor Yellow
        & "venv\Scripts\Activate.ps1"
    }
    
    # Run the Python test script
    python scripts\test-openrouter-auth.py
    
    $exitCode = $LASTEXITCODE
    
    Write-Host ""
    if ($exitCode -eq 0) {
        Write-Host "✅ Test completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Test failed. Please check the output above." -ForegroundColor Red
    }
    
    exit $exitCode
}
finally {
    Pop-Location
}

