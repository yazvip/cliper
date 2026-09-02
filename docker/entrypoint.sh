#!/bin/sh
set -e

echo "🚀 Auto-Clipper Entrypoint"

# Wait for postgres
echo "⏳ Waiting for PostgreSQL..."
for i in $(seq 1 30); do
  if npx prisma db execute --schema=./prisma/schema.prisma --stdin <<SQL 2>/dev/null
SELECT 1;
SQL
  then
    echo "✅ PostgreSQL connected"
    break
  fi
  echo "  Attempt $i/30..."
  sleep 2
  if [ $i -eq 30 ]; then
    echo "❌ Failed to connect to PostgreSQL after 30 attempts"
    echo "Continuing anyway..."
  fi
done

# Generate Prisma Client (in case volume changed)
echo "🔧 Generating Prisma Client..."
npx prisma generate || echo "⚠️ prisma generate failed, continuing"

# Run migrations
echo "🗄️ Running migrations..."
npx prisma migrate deploy

echo "▶️ Starting: $@"
exec "$@"
