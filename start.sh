#!/bin/sh
set -e

# Export DATABASE_URL if not already set
if [ -z "$DATABASE_URL" ]; then
  echo "Warning: DATABASE_URL is not set"
fi

# Run Prisma migrations using the binary directly
echo "Running Prisma migrations..."
cd /app
./node_modules/.bin/prisma db push --skip-generate

# Start the Next.js server
echo "Starting Next.js server..."
exec node server.js
