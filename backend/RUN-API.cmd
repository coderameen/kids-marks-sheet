@echo off
cd /d "%~dp0"
call .venv\Scripts\activate.bat
echo Starting Flask API at http://127.0.0.1:5000
python app.py
pause
