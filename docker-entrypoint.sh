#!/bin/sh
set -e

echo "[entrypoint] Starting Xeno Validator..."

# Start backend
cd /app/backend
node -r dotenv/config src/app.js &

# Wait for backend to be ready
sleep 2

# Start nginx in foreground
echo "[entrypoint] Starting Nginx..."
nginx -g "daemon off;"
