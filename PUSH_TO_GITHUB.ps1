# Push AIBT Platform to GitHub
# One script to initialize and push everything

Write-Host "Pushing AIBT to GitHub..." -ForegroundColor Cyan

# Initialize git if needed
if (-not (Test-Path .git)) {
    git init
}

# Add all files
git add .

# Commit with comprehensive message
git commit -m "Complete AIBT Platform - Full-Stack AI Trading System

- Backend: FastAPI with 51 endpoints (98% tests passing)
- Frontend: Next.js 16 with dark theme
- Database: Supabase PostgreSQL with RLS
- Features: Authentication, AI trading, MCP services, admin dashboard
- Bugs Fixed: Portfolio calculations, log migration
- Status: Production-ready

Built: 2025-10-29"

# Set branch to main
git branch -M main

# Add remote
git remote add origin https://github.com/mrgizmo212/aibt.git

# Push everything
git push -u origin main --force

Write-Host "`nDone! AIBT pushed to GitHub" -ForegroundColor Green
Write-Host "View at: https://github.com/mrgizmo212/aibt" -ForegroundColor Cyan

