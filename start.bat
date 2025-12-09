@echo off
REM Quick Start Script for Wednesday Healthcare Management System (Windows)

echo.
echo ==========================================
echo Wednesday - Healthcare Management System
echo Quick Start Script (Windows)
echo ==========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo X Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Navigate to infra directory
cd /d "%~dp0infra"

echo [INFO] Checking for .env file...
if not exist .env (
    echo [WARN] .env file not found. Please copy .env.example to .env and configure if needed.
)

echo.
echo [RUN] Starting services...
echo [INFO] This may take 1-2 minutes for first run...
echo.

docker-compose up -d

echo.
echo [INFO] Waiting for services to be ready...
timeout /t 10 /nobreak

echo.
echo ==========================================
echo [OK] Setup Complete!
echo ==========================================
echo.
echo Access the application:
echo   [Frontend]   http://localhost:5173
echo   [Backend]    http://localhost:8000
echo   [API Docs]   http://localhost:8000/docs
echo   [RabbitMQ]   http://localhost:15672 (guest/guest)
echo.
echo Useful commands:
echo   View backend logs   : docker logs infra-backend-1
echo   View frontend logs  : docker logs infra-frontend-1
echo   Stop services       : docker-compose down
echo   View all services   : docker ps
echo.
pause
