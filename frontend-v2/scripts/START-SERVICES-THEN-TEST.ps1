# Quick Start Script for Bug Testing
# This PowerShell script provides commands to start services

Write-Host "🚀 AIBT Frontend Bug Testing - Service Startup Guide" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Gray
Write-Host ""

Write-Host "📋 YOU NEED 3 TERMINALS OPEN:" -ForegroundColor Yellow
Write-Host ""

Write-Host "TERMINAL 1 - Backend:" -ForegroundColor Green
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  python main.py" -ForegroundColor White
Write-Host ""

Write-Host "TERMINAL 2 - Frontend:" -ForegroundColor Green
Write-Host "  cd frontend-v2" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""

Write-Host "TERMINAL 3 - Tests:" -ForegroundColor Green
Write-Host "  cd frontend-v2/scripts" -ForegroundColor White
Write-Host "  npm install" -ForegroundColor White
Write-Host "  npm run check" -ForegroundColor White
Write-Host "  npm run verify:all" -ForegroundColor White
Write-Host ""

Write-Host ("=" * 70) -ForegroundColor Gray
Write-Host ""

Write-Host "⚡ QUICK TEST (No Puppeteer):" -ForegroundColor Cyan
Write-Host "  1. Start backend + frontend (as above)" -ForegroundColor White
Write-Host "  2. Open: http://localhost:3000" -ForegroundColor White
Write-Host "  3. Press F12 (DevTools)" -ForegroundColor White
Write-Host "  4. See: MANUAL-TEST-ALL-BUGS.md for console commands" -ForegroundColor White
Write-Host ""

Write-Host "📖 Full Instructions:" -ForegroundColor Cyan
Write-Host "  See: frontend-v2/scripts/README.md" -ForegroundColor White
Write-Host ""

