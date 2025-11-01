# AI-Trader MCP Services Startup Script
# Run this FIRST before running the trading system

Write-Host "🛠️  AI-Trader MCP Services Starter" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Navigate to project directory
$projectDir = "C:\Users\User\Desktop\CS1027\aitrtader"
Set-Location $projectDir

# Activate virtual environment
Write-Host "`n📦 Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\activate

# Navigate to agent_tools directory
Write-Host "`n📂 Navigating to agent_tools..." -ForegroundColor Yellow
Set-Location agent_tools

# Start MCP services
Write-Host "`n🚀 Starting all 4 MCP services..." -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: Keep this window open!" -ForegroundColor Red
Write-Host "   Press Ctrl+C to stop all services when done." -ForegroundColor Yellow
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

python start_mcp_services.py

