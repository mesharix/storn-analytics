#!/bin/sh
set -e

# Export DATABASE_URL if not already set
if [ -z "$DATABASE_URL" ]; then
  echo "Warning: DATABASE_URL is not set"
fi

# Start the Next.js server
exec node server.js
