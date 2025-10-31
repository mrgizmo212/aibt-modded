# Start AI-Trader Next.js 16 Frontend
# Make sure backend is running first!

Write-Host "🎨 Starting AI-Trader Frontend" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Navigate to frontend directory
# $frontendDir = "C:\Users\User\Desktop\CS1027\aibt\frontend" # OLD ABSOLUTE PATH
$frontendDir = Join-Path $PSScriptRoot ".." "frontend"
Set-Location $frontendDir

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "`n📦 Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
    npm install
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
}

# Start Next.js dev server with Turbopack
Write-Host "`n🚀 Starting Next.js 16 with Turbopack..." -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Frontend will be available at:" -ForegroundColor Green
Write-Host "   - http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚡ Turbopack enabled for lightning-fast builds!" -ForegroundColor Yellow
Write-Host "⚠️  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

npm run dev

