@echo off
echo =======================================================
echo Starting CoreInventory App...
echo =======================================================
echo.

:: Check if node is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed! Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules\" (
    echo Installing dependencies for the first time...
    call npm install
) else (
    echo Dependencies found. Skipping install...
)

echo.
echo Starting development server...
echo The app will open in your default browser automatically.
echo Keep this window open to keep the server running.
echo =======================================================
echo.

:: Run the Vite development server and open the browser
call npm run dev -- --open

pause
