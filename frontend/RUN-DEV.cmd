@echo off
cd /d "%~dp0"
echo Starting Next.js at http://localhost:3000
echo (Use this file instead of typing npm run dev)
call npm run dev
pause
