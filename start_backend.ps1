# Start AI-Trader FastAPI Backend
# Run this before starting the frontend

Write-Host "🚀 Starting AI-Trader Backend API" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Navigate to backend directory
$backendDir = "C:\Users\User\Desktop\CS1027\aibt\backend"
Set-Location $backendDir

# Check if venv exists, create if not
if (!(Test-Path "venv")) {
    Write-Host "`n📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "   ✅ Virtual environment created" -ForegroundColor Green
}

# Activate venv
Write-Host "`n📦 Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\activate

# Install/Update dependencies
Write-Host "`n📥 Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet

# Start FastAPI server
Write-Host "`n🚀 Starting FastAPI server on port 8080..." -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "📡 API will be available at:" -ForegroundColor Green
Write-Host "   - http://localhost:8080" -ForegroundColor Cyan
Write-Host "   - http://localhost:8080/api/docs (Swagger UI)" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

python main.py

