#!/bin/bash
set -e

SERVER_PID=""

start_server() {
  echo "Starting Next.js dev server..."
  npm run dev &
  SERVER_PID=$!
  echo "Server started with PID $SERVER_PID"
  # Wait for server to be ready (max 30 seconds)
  for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
      echo "Server is ready."
      return 0
    fi
    sleep 1
  done
  echo "Server did not become ready in time."
  kill $SERVER_PID 2>/dev/null || true
  exit 1
}

# Check if server is already running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "Server is already running."
else
  start_server
fi

# Now run the test
echo "Testing flight search..."
RESPONSE=$(curl -s "http://localhost:3000/api/search?from=NEW+DELHI&to=MUMBAI&date=2026-08-31&class=3A&quota=GN&maxHubs=10&maxConnections=2&page=1&pageSize=10&modes=train%2Cbus%2Cflight" \
  -H "Accept: application/json")

# Check if we got a response
if [ -z "$RESPONSE" ]; then
  echo "Error: No response from server."
  exit 1
fi

# Use jq to extract flight legs
echo "Response:"
echo "$RESPONSE" | jq '.'

echo ""
echo "Flight legs:"
echo "$RESPONSE" | jq '.results.all[]?.legs[] | select(.mode=="flight")' || echo "No flight legs found or jq not installed."

# If we started the server, kill it
if [ -n "$SERVER_PID" ]; then
  echo "Stopping server (PID $SERVER_PID)"
  kill $SERVER_PID 2>/dev/null || true
fi
