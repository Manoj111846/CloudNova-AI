@echo off
setlocal
cd /d "%~dp0\.."
echo.
echo ============================================
echo          CloudNova AI - Windows
echo ============================================
echo.
if not exist ".venv\Scripts\python.exe" (
  echo [1/4] Creating virtual environment...
  py -m venv .venv
  if errorlevel 1 (
    echo Could not create the virtual environment. Check that Python 3 is installed.
    pause
    exit /b 1
  )
)
if not exist ".env" (
  echo [2/4] Creating local .env configuration...
  copy ".env.example" ".env" >nul
  echo Created .env. Add your NEW Gemini API key to .env to enable AI responses.
) else (
  echo [2/4] Existing .env found.
)
echo [3/4] Installing required packages...
".venv\Scripts\python.exe" -m pip install --upgrade pip
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 (
  echo Package installation failed. Read the error above.
  pause
  exit /b 1
)
echo [4/4] Starting CloudNova AI...
echo Open http://127.0.0.1:8000 in your browser.
".venv\Scripts\python.exe" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pause
