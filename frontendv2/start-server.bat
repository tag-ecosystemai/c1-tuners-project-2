@echo off
title Sabilearn - Local Server
echo Starting Sabilearn locally...
echo.
echo NOTE: This runs on port 3000 on purpose - the backend's CORS policy
echo only allows requests from http://localhost:3000. Don't change this
echo port unless the backend's allow_origins is updated to match.
echo.

REM Try Python first (most common)
where python >nul 2>nul
if %errorlevel%==0 (
    echo Found Python. Starting server at http://localhost:3000
    start "" http://localhost:3000/index.html
    python -m http.server 3000
    goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
    echo Found Python (py launcher). Starting server at http://localhost:3000
    start "" http://localhost:3000/index.html
    py -m http.server 3000
    goto :eof
)

REM Fall back to Node.js if Python isn't installed
where npx >nul 2>nul
if %errorlevel%==0 (
    echo Python not found. Found Node.js — using npx serve at http://localhost:3000
    start "" http://localhost:3000/index.html
    npx --yes serve -l 3000
    goto :eof
)

echo.
echo Could not find Python or Node.js on this machine.
echo Please install Python (https://python.org) or Node.js (https://nodejs.org),
echo or use the VS Code "Live Server" extension instead — see README.md.
echo (If you use Live Server, set its port to 3000 in VS Code settings.)
echo.
pause
