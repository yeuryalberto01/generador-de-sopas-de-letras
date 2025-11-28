@echo off
echo ===================================================
echo    INSTALANDO DEPENDENCIAS - SOPA DE LETRAS IA
echo ===================================================

echo.
echo [1/2] Instalando dependencias del Backend...
cd backend
pip install -r requirements.txt
cd ..

echo.
echo [2/2] Instalando dependencias del Frontend...
cd Creador-de-sopas-de-letras-Ultra-IA
call npm install
cd ..

echo.
echo ===================================================
echo    INSTALACION COMPLETA
echo ===================================================
echo.
echo Ahora puedes ejecutar 'iniciar_sistema.bat'
pause
