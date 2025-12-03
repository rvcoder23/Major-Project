@echo off
echo 🏢 Front Office Management System Setup
echo =================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install root dependencies
echo 📦 Installing root dependencies...
npm install

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
npm install
cd ..

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
npm install
cd ..

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Copy backend/env.example to backend/.env
echo 2. Add your Supabase credentials to backend/.env
echo 3. Run the Supabase schema from supabase/schema.sql
echo 4. Start the development server with: npm run dev
echo.
echo 🔑 Default login credentials:
echo    Username: admin
echo    Password: admin123
echo.
echo 🚀 To start the application:
echo    npm run dev
pause
