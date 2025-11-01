# launcher.ps1 - Puzzle Generator Launcher (Optimizado)
# Script simplificado para iniciar backend + frontend

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "Puzzle Generator"

# Configuración
$BACKEND_PORT = 8000
$FRONTEND_PORT = 5173
$BACKEND_DIR = "puzzle_generator_starter\backend_fastapi"
$FRONTEND_DIR = "puzzle_generator_starter"

# Función simplificada para mensajes
function Write-Status { param($Message, $Color = "White") Write-Host $Message -ForegroundColor $Color }

# Función para iniciar servicio
function Start-Service {
    param($Name, $Command, $WorkingDir = $null)

    Write-Status "[$Name] Iniciando..." "Cyan"

    try {
        $processArgs = @{
            FilePath = "powershell.exe"
            ArgumentList = @("-Command", "& { $Command }")
            PassThru = $true
            NoNewWindow = $true
        }

        if ($WorkingDir) {
            $processArgs.WorkingDirectory = $WorkingDir
        }

        $process = Start-Process @processArgs
        Write-Status "[$Name] PID: $($process.Id)" "Gray"
        return $process
    }
    catch {
        Write-Status "[ERROR] Falló $Name`: $($_.Exception.Message)" "Red"
        return $null
    }
}

# Función para verificar puerto
function Test-Port { param($Port) try { $null = Get-NetTCPConnection -LocalPort $Port -ErrorAction Stop; return $false } catch { return $true } }

# Verificar y liberar puerto backend si es necesario
Write-Status "Verificando puerto $BACKEND_PORT..." "Cyan"
if (-not (Test-Port $BACKEND_PORT)) {
    Write-Status "[WARNING] Puerto $BACKEND_PORT ocupado, intentando liberar..." "Yellow"
    try {
        $connections = Get-NetTCPConnection -LocalPort $BACKEND_PORT -ErrorAction Stop
        foreach ($conn in $connections) {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
    } catch {
        Write-Status "[ERROR] No se pudo liberar puerto $BACKEND_PORT" "Red"
        exit 1
    }
}

# Iniciar servicios
try {
    Write-Status "`n[*] Iniciando servicios..." "Yellow"

    # Backend
    $backendProcess = Start-Service "Backend" "python -m uvicorn main:app --reload --port $BACKEND_PORT" $BACKEND_DIR
    if (-not $backendProcess) { throw "No se pudo iniciar backend" }

    # Esperar un poco para que el backend inicie
    Write-Status "[Backend] Iniciando..." "Yellow"
    Start-Sleep -Seconds 5

    # Frontend
    $frontendProcess = Start-Service "Frontend" "npm run dev" $FRONTEND_DIR
    if (-not $frontendProcess) { throw "No se pudo iniciar frontend" }

    # Mostrar información
    Write-Status "`n[+] Servicios iniciados:" "Green"
    Write-Status "   Frontend: http://localhost:$FRONTEND_PORT" "Cyan"
    Write-Status "   Backend:  http://localhost:$BACKEND_PORT" "Cyan"
    Write-Status "   API Docs: http://localhost:$BACKEND_PORT/docs" "Cyan"

    Write-Status "`n[i] Presiona Ctrl+C para detener" "Yellow"

    # Monitorear procesos
    while ($true) {
        if ($backendProcess.HasExited) {
            Write-Status "`n[!] Backend se detuvo inesperadamente" "Red"
            break
        }
        if ($frontendProcess.HasExited) {
            Write-Status "`n[!] Frontend se detuvo inesperadamente" "Red"
            break
        }
        Start-Sleep -Seconds 3
    }
}
catch {
    Write-Status "`n[!] Error: $($_.Exception.Message)" "Red"
}
finally {
    Write-Status "`n[-] Deteniendo servicios..." "Yellow"
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force
    }
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force
    }
    Write-Status "[+] Servicios detenidos" "Green"
}