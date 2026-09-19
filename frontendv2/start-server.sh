#!/bin/bash
# Sabilearn - Local Server
echo "Starting Sabilearn locally..."
echo ""
echo "NOTE: This runs on port 3000 on purpose - the backend's CORS policy"
echo "only allows requests from http://localhost:3000. Don't change this"
echo "port unless the backend's allow_origins is updated to match."
echo ""

open_browser() {
  URL="http://localhost:3000/index.html"
  if command -v open >/dev/null 2>&1; then open "$URL"
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL"
  fi
}

if command -v python3 >/dev/null 2>&1; then
  echo "Found Python. Starting server at http://localhost:3000"
  ( sleep 1; open_browser ) &
  python3 -m http.server 3000
elif command -v python >/dev/null 2>&1; then
  echo "Found Python. Starting server at http://localhost:3000"
  ( sleep 1; open_browser ) &
  python -m http.server 3000
elif command -v npx >/dev/null 2>&1; then
  echo "Python not found. Found Node.js — using npx serve at http://localhost:3000"
  ( sleep 1; open_browser ) &
  npx --yes serve -l 3000
else
  echo "Could not find Python or Node.js on this machine."
  echo "Please install Python (https://python.org) or Node.js (https://nodejs.org),"
  echo "or use the VS Code 'Live Server' extension instead — see README.md."
fi
