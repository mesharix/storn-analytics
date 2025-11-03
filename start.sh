#!/bin/sh
set -e

# Export DATABASE_URL if not already set
if [ -z "$DATABASE_URL" ]; then
  echo "Warning: DATABASE_URL is not set"
fi

# Run Prisma migrations
echo "Running Prisma migrations..."
cd /app
npx prisma db push --skip-generate --accept-data-loss || echo "Migration failed, but continuing..."

# Start the Next.js server
echo "Starting Next.js server..."
exec node server.js
