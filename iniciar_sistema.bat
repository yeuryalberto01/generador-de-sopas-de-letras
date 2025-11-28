@echo off
echo ===================================================
echo    INICIANDO PANEL DE CONTROL - SOPA DE LETRAS IA
echo ===================================================

set "VENV_PYTHON=.venv\Scripts\python.exe"

if exist "%VENV_PYTHON%" (
    echo [INFO] Usando entorno virtual detectado (.venv)
    set "PYTHON_CMD=%VENV_PYTHON%"
) else (
    echo [INFO] Usando Python del sistema
    set "PYTHON_CMD=python"
)

echo.
echo Verificando dependencias...
"%PYTHON_CMD%" -m pip install psutil requests customtkinter > nul 2>&1

echo.
echo Abriendo interfaz grafica...
"%PYTHON_CMD%" launcher.py

if %errorlevel% neq 0 (
    echo.
    echo HUBO UN ERROR AL INICIAR EL LANZADOR.
    echo Verifica que Python este instalado correctamente.
    pause
)
