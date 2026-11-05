@echo off
setlocal
cd /d "%~dp0"
set "PORT=8000"

where py >nul 2>&1
if not errorlevel 1 (
    start "Zoo Day - servidor local" cmd /k py -m http.server %PORT% --bind 127.0.0.1
) else (
    where python >nul 2>&1
    if errorlevel 1 (
        echo Python nao foi encontrado.
        echo Instale o Python ou abra a pasta no VS Code e use a extensao Live Server.
        pause
        exit /b 1
    )
    start "Zoo Day - servidor local" cmd /k python -m http.server %PORT% --bind 127.0.0.1
)

timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:%PORT%"
