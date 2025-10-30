# AI-Trader Quick Start Script
# This script handles all the setup and runs the trading system

Write-Host "🚀 AI-Trader Quick Start" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Navigate to project directory
$projectDir = "C:\Users\User\Desktop\CS1027\aitrtader"
Set-Location $projectDir

# Step 1: Activate virtual environment
Write-Host "`n📦 Step 1: Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\activate

# Step 2: Clean up interfering environment variables
Write-Host "`n🧹 Step 2: Cleaning environment variables..." -ForegroundColor Yellow
Remove-Item Env:\OPENAI_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:\OPENAI_API_BASE -ErrorAction SilentlyContinue
Write-Host "   ✅ Removed Windows env vars that override .env file" -ForegroundColor Green

# Step 3: Set UTF-8 encoding for emoji support
Write-Host "`n🔤 Step 3: Setting UTF-8 encoding..." -ForegroundColor Yellow
$env:PYTHONIOENCODING = "utf-8"
Write-Host "   ✅ UTF-8 encoding enabled" -ForegroundColor Green

# Step 4: Verify MCP services are running
Write-Host "`n🔍 Step 4: Checking MCP services..." -ForegroundColor Yellow
$servicesRunning = $true
$ports = @(8000, 8001, 8002, 8003)
$serviceNames = @("Math", "Search", "Trade", "Price")

for ($i = 0; $i -lt $ports.Length; $i++) {
    $port = $ports[$i]
    $serviceName = $serviceNames[$i]
    
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Host "   ✅ $serviceName service (port $port) - Running" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $serviceName service (port $port) - NOT Running" -ForegroundColor Red
            $servicesRunning = $false
        }
    } catch {
        Write-Host "   ❌ $serviceName service (port $port) - NOT Running" -ForegroundColor Red
        $servicesRunning = $false
    }
}

if (-not $servicesRunning) {
    Write-Host "`n⚠️  WARNING: Not all MCP services are running!" -ForegroundColor Red
    Write-Host "   Please start them in a separate terminal:" -ForegroundColor Yellow
    Write-Host "   cd agent_tools" -ForegroundColor Cyan
    Write-Host "   python start_mcp_services.py" -ForegroundColor Cyan
    Write-Host "`nPress Enter to continue anyway, or Ctrl+C to exit..."
    Read-Host
}

# Step 5: Run the trading system
Write-Host "`n🎯 Step 5: Starting AI Trading System..." -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan

python main.py

# Done
Write-Host "`n✅ Trading session completed!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan

