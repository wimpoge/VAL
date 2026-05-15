# Stop the VAL (Visual AI Learning) dev stack.
# Kills whatever is listening on port 8000 (backend) and 3000 (frontend),
# then stops the pgvector container. Leaves Docker Desktop running.

$ErrorActionPreference = 'Continue'

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

function Stop-Port($port) {
    try {
        $procIds = Get-NetTCPConnection -LocalPort $port -ErrorAction Stop |
            Where-Object { $_.State -eq 'Listen' } |
            Select-Object -ExpandProperty OwningProcess -Unique
    } catch {
        Write-Host "Nothing listening on port $port."
        return
    }
    if (-not $procIds) {
        Write-Host "Nothing listening on port $port."
        return
    }
    foreach ($procId in $procIds) {
        try {
            $proc = Get-Process -Id $procId -ErrorAction Stop
            Write-Host "Stopping $($proc.ProcessName) (pid $procId) on port $port"
            Stop-Process -Id $procId -Force -ErrorAction Stop
        } catch {
            Write-Host "Could not stop pid ${procId}: $_"
        }
    }
}

Write-Step "Stopping backend (port 8000)..."
Stop-Port 8000

Write-Step "Stopping frontend (port 3000)..."
Stop-Port 3000

Write-Step "Stopping 'ai-roadmap-pg' container..."
$null = docker stop ai-roadmap-pg 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Container stopped."
} else {
    Write-Host "Container was not running (or Docker not reachable)."
}

Write-Step "Done."
Write-Host "Docker Desktop is left running. Quit it from the tray icon if you want a full shutdown."
