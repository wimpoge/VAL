# One-click bootstrap for the VAL (Visual AI Learning) dev environment.
# Starts: Docker Desktop -> pgvector container -> FastAPI backend -> Next.js frontend

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$backend = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

function Test-DockerReady {
    try {
        $null = docker info --format '{{.ServerVersion}}' 2>$null
        return ($LASTEXITCODE -eq 0)
    } catch {
        return $false
    }
}

# 1. Docker Desktop
Write-Step "Checking Docker daemon..."
if (Test-DockerReady) {
    Write-Host "Already running."
} else {
    $dockerExe = "$env:ProgramFiles\Docker\Desktop\Docker Desktop.exe"
    if (-not (Test-Path $dockerExe)) {
        Write-Host "Docker Desktop not found at:" -ForegroundColor Yellow
        Write-Host "  $dockerExe"
        Write-Host "Open Docker Desktop manually and re-run." -ForegroundColor Yellow
        exit 1
    }
    Write-Step "Launching Docker Desktop and waiting for the daemon..."
    Start-Process $dockerExe | Out-Null
    $deadline = (Get-Date).AddMinutes(2)
    while (-not (Test-DockerReady)) {
        if ((Get-Date) -gt $deadline) {
            Write-Host ""
            Write-Host "Docker did not become ready within 2 minutes. Aborting." -ForegroundColor Red
            exit 1
        }
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
    Write-Host ""
    Write-Host "Docker is ready."
}

# 2. pgvector container
Write-Step "Ensuring 'ai-roadmap-pg' container is running..."
$state = docker inspect -f '{{.State.Running}}' ai-roadmap-pg 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Container 'ai-roadmap-pg' does not exist yet." -ForegroundColor Yellow
    Write-Host "Create it once with:"
    Write-Host "  docker run -d --name ai-roadmap-pg -p 5432:5432 -e POSTGRES_PASSWORD=password -v ai-roadmap-pg-data:/var/lib/postgresql/data pgvector/pgvector:pg16"
    exit 1
} elseif ($state -eq 'true') {
    Write-Host "Already running."
} else {
    docker start ai-roadmap-pg | Out-Null
    Write-Host "Started."
}

# 3. Backend (FastAPI) — auto-activate venv if found
$venvActivate = $null
foreach ($candidate in @('.venv', 'venv', 'env')) {
    $p = Join-Path $backend "$candidate\Scripts\Activate.ps1"
    if (Test-Path $p) { $venvActivate = $p; break }
}
if ($venvActivate) {
    $backendCmd = "Set-Location '$backend'; & '$venvActivate'; uvicorn main:app --reload --port 8000"
} else {
    $backendCmd = "Set-Location '$backend'; uvicorn main:app --reload --port 8000"
}
Write-Step "Launching backend (uvicorn :8000) in a new window..."
Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCmd | Out-Null

# 4. Frontend (Next.js)
$frontendCmd = "Set-Location '$frontend'; npm run dev"
Write-Step "Launching frontend (next dev :3000) in a new window..."
Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCmd | Out-Null

Write-Step "All set."
Write-Host "  Backend:  http://localhost:8000  (docs at /docs)"
Write-Host "  Frontend: http://localhost:3000"
Write-Host ""
Write-Host "Close the two spawned PowerShell windows to stop the servers."
