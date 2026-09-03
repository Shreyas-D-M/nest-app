#!/bin/sh
set -e

# Start Speaches FastAPI/uvicorn server in background
uvicorn --factory speaches.main:create_app &
SERVER_PID=$!

# Ensure the default multilingual model for Indian/English speech is downloaded
(
  for i in $(seq 1 30); do
    if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
      curl -s -X POST http://localhost:8000/v1/models/Systran%2Ffaster-whisper-small > /dev/null 2>&1 || true
      break
    fi
    sleep 1
  done
) &

wait "$SERVER_PID"
