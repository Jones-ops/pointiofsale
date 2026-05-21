param(
  [switch]$Clean
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   POS System - Installation Demo" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Check environment ──
Write-Host "`n[1/6] Checking environment..." -ForegroundColor Yellow
$rootDir = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $rootDir "backend"
$dataDir = Join-Path $backendDir "data"
$dbFile = Join-Path $dataDir "pos.db"

if (-not (Test-Path (Join-Path $backendDir "node_modules"))) {
  Write-Host "  Installing backend dependencies..." -ForegroundColor Gray
  Push-Location $backendDir; npm install; Pop-Location
}
$frontendDir = Join-Path $rootDir "frontend"
if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
  Write-Host "  Installing frontend dependencies..." -ForegroundColor Gray
  Push-Location $frontendDir; npm install; Pop-Location
}
Write-Host "  Environment ready" -ForegroundColor Green

# ── Step 2: Clean database (if -Clean flag) ──
Write-Host "`n[2/6] Database state..." -ForegroundColor Yellow
if ($Clean -and (Test-Path $dbFile)) {
  Remove-Item $dbFile -Force
  Write-Host "  Deleted existing database (clean install)" -ForegroundColor Magenta
}
if (Test-Path $dbFile) {
  Write-Host "  Existing database found at: backend\data\pos.db" -ForegroundColor Green
  $size = (Get-Item $dbFile).Length
  Write-Host "  Size: $([math]::Round($size/1KB, 1)) KB" -ForegroundColor Gray
} else {
  Write-Host "  No database yet (fresh install — will auto-create on first start)" -ForegroundColor Cyan
}

# ── Step 3: Check production mode ──
Write-Host "`n[3/6] Production mode check..." -ForegroundColor Yellow
$envExample = Join-Path $rootDir ".env.example"
$envFile = Join-Path $rootDir ".env"

# Check if .env exists
if (Test-Path $envFile) {
  Write-Host "  .env file: EXISTS" -ForegroundColor Green
} else {
  Write-Host "  .env file: MISSING (using defaults)" -ForegroundColor DarkYellow
}

# Check JWT secret
$jwtSecret = "pos-system-secret-key-change-in-production"
if (Test-Path $envFile) {
  $envContent = Get-Content $envFile -Raw
  if ($envContent -match "JWT_SECRET=$jwtSecret") {
    Write-Host "  JWT_SECRET: DEFAULT (change for production!)" -ForegroundColor Red
  } else {
    Write-Host "  JWT_SECRET: Custom" -ForegroundColor Green
  }
} else {
  Write-Host "  JWT_SECRET: $jwtSecret (DEFAULT - change for production!)" -ForegroundColor Red
}

# Check database driver
$usePg = [string]::IsNullOrEmpty($env:DATABASE_URL)
if ($usePg) {
  Write-Host "  Database: SQLite (single-user, file-based)" -ForegroundColor Yellow
  Write-Host "  Recommendation: Set DATABASE_URL to PostgreSQL for production" -ForegroundColor DarkYellow
} else {
  Write-Host "  Database: PostgreSQL ($env:DATABASE_URL)" -ForegroundColor Green
}

# Check NODE_ENV
if ($env:NODE_ENV -eq "production") {
  Write-Host "  NODE_ENV: production" -ForegroundColor Green
} else {
  Write-Host "  NODE_ENV: not set (development mode)" -ForegroundColor DarkYellow
}

# Frontend mode
if (Test-Path (Join-Path $frontendDir "dist")) {
  Write-Host "  Frontend: built (production-ready)" -ForegroundColor Green
} else {
  Write-Host "  Frontend: dev server mode (run 'npm run build' for production)" -ForegroundColor DarkYellow
}

# ── Step 4: Start backend to trigger auto-migration ──
Write-Host "`n[4/6] Starting backend (auto-migration)..." -ForegroundColor Yellow
Write-Host "  Starting backend server in background..." -ForegroundColor Gray

$backendLog = Join-Path $rootDir "backend.log"
$backendProcess = Start-Process -FilePath "node" -ArgumentList "src/app.js" -WorkingDirectory $backendDir -NoNewWindow -RedirectStandardOutput $backendLog -RedirectStandardError $backendLog -PassThru

Start-Sleep -Seconds 3

if ($backendProcess.HasExited) {
  Write-Host "  Backend failed to start!" -ForegroundColor Red
  Get-Content $backendLog -Tail 10
  exit 1
}

# Show backend logs
$backendOutput = Get-Content $backendLog
foreach ($line in $backendOutput) {
  Write-Host "  [backend] $line" -ForegroundColor DarkGray
}
Write-Host "  Backend running on http://localhost:3001 (PID: $($backendProcess.Id))" -ForegroundColor Green

# ── Step 5: Verify installation details ──
Write-Host "`n[5/6] Verifying installation..." -ForegroundColor Yellow

# Check what was created
try {
  $apiBase = "http://localhost:3001/api"

  # Check settings/status
  $status = Invoke-RestMethod -Uri "$apiBase/settings/status" -ErrorAction Stop
  Write-Host "  Setup status: setup_complete=$($status.setup_complete)" -ForegroundColor Cyan

  # Check seeded data
  $loginResp = Invoke-RestMethod -Uri "$apiBase/auth/login" -Method Post -Body (@{ username = "admin"; password = "admin123" } | ConvertTo-Json) -ContentType "application/json" -ErrorAction SilentlyContinue
  if ($loginResp) {
    Write-Host "  Admin login: OK (admin / admin123)" -ForegroundColor Green
    $token = $loginResp.token

    # Check categories
    $cats = Invoke-RestMethod -Uri "$apiBase/categories" -Headers @{ Authorization = "Bearer $token" }
    Write-Host "  Categories: $($cats.data.Count) seeded" -ForegroundColor Green

    # Check users
    $users = Invoke-RestMethod -Uri "$apiBase/users" -Headers @{ Authorization = "Bearer $token" }
    Write-Host "  Users: $($users.data.Count) created" -ForegroundColor Green

    # Check settings
    $settings = Invoke-RestMethod -Uri "$apiBase/settings" -Headers @{ Authorization = "Bearer $token" }
    Write-Host "  Company: '$($settings.company_name)'" -ForegroundColor Gray
  } else {
    Write-Host "  Admin login: FAILED" -ForegroundColor Red
  }
} catch {
  Write-Host "  API check failed: $_" -ForegroundColor Red
}

# ── Step 6: Summary ──
Write-Host "`n[6/6] Installation Summary" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Backend  : http://localhost:3001" -ForegroundColor White
Write-Host "  Frontend : http://localhost:5173" -ForegroundColor White
Write-Host "  Admin    : admin / admin123" -ForegroundColor White
Write-Host "  DB       : backend\data\pos.db" -ForegroundColor White
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "  Database: $(if ($usePg) { 'SQLite (file-based)' } else { 'PostgreSQL' })" -ForegroundColor $(if ($usePg) { 'Yellow' } else { 'Green' })
Write-Host "  JWT Secret: $(if ((Test-Path $envFile) -and (Get-Content $envFile -Raw) -notmatch 'pos-system-secret-key-change-in-production') { 'Custom' } else { 'DEFAULT - CHANGE IT' })" -ForegroundColor $(if ((Test-Path $envFile) -and (Get-Content $envFile -Raw) -notmatch $jwtSecret) { 'Green' } else { 'Red' })
Write-Host "  Frontend: $(if (Test-Path (Join-Path $frontendDir 'dist')) { 'Built (production)' } else { 'Dev server' })" -ForegroundColor $(if (Test-Path (Join-Path $frontendDir 'dist')) { 'Green' } else { 'Yellow' })
Write-Host "  NODE_ENV: $(if ($env:NODE_ENV -eq 'production') { 'production' } else { 'not set (recommend: production)' })" -ForegroundColor $(if ($env:NODE_ENV -eq 'production') { 'Green' } else { 'Yellow' })
Write-Host "========================================" -ForegroundColor Cyan

# Clean up
Write-Host "`nPress any key to stop the demo server..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Stop-Process -Id $backendProcess.Id -Force
Write-Host "Demo server stopped." -ForegroundColor Gray
