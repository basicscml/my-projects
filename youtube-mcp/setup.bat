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
echo [3/3] Registering the MCP server with Claude Code CLI...
claude mcp add youtube --env YOUTUBE_API_DIR=%PROJECT_DIR% -- %PY% "%PROJECT_DIR%\youtube_mcp_server.py"
if errorlevel 1 (
  echo.
  echo Could not run "claude mcp add" automatically.
  echo If you use the Claude DESKTOP app instead of the CLI, see README.md
  echo for the JSON config to paste into Settings - Developer - Edit Config.
  goto :done
)

echo.
echo Done. Run "claude mcp list" to confirm "youtube" is connected.
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

:done
:end
echo.
pause
endlocal
