@echo off
REM ===================================================================
REM  One-shot setup for the YouTube MCP server.
REM  Run this once from C:\YouTubeAPI:  double-click it, or run `setup.bat`.
REM  It installs dependencies, authorizes full (read+write) access, and
REM  registers the server with the Claude Code CLI.
REM ===================================================================

setlocal
set "PROJECT_DIR=%~dp0"
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
set "YOUTUBE_API_DIR=%PROJECT_DIR%"

echo.
echo [1/3] Installing Python dependencies...
python -m pip install -r "%PROJECT_DIR%\requirements.txt"
if errorlevel 1 (
  echo.
  echo "python" not found or pip failed. Trying the "py" launcher...
  py -m pip install -r "%PROJECT_DIR%\requirements.txt" || goto :pyfail
  set "PY=py"
) else (
  set "PY=python"
)

echo.
echo [2/3] Authorizing full read/write access (a browser will open)...
%PY% "%PROJECT_DIR%\authorize_full_access.py" || goto :authfail

echo.
echo [3/3] Registering the MCP server with Claude Desktop...
%PY% "%PROJECT_DIR%\register_desktop.py" || goto :regfail

echo.
echo Done. Fully quit Claude Desktop from the system tray (Quit), then reopen it.
echo The "youtube" tools will be available in your next conversation.
goto :done

:pyfail
echo.
echo ERROR: Python was not found. Install Python 3 and re-run setup.bat.
goto :end

:authfail
echo.
echo ERROR: Authorization step failed. Make sure youtube-oauth-client.json
echo is present in this folder, then re-run setup.bat.
goto :end

:regfail
echo.
echo ERROR: Could not register with Claude Desktop. See README.md to paste
echo the config manually into Settings - Developer - Edit Config.
goto :end

:done
:end
echo.
pause
endlocal
