#!/bin/sh
set -e

echo "🚀 Entrypoint: checking postgres..."
# Wait for postgres via node check
for i in 1 2 3 4 5 6 7 8 9 10; do
  if npx prisma db execute --schema=./prisma/schema.prisma --stdin <<< "SELECT 1" 2>/dev/null; then
    echo "✅ DB connected"
    break
  fi
  echo "⏳ Waiting DB... $i"
  sleep 2
done

echo "🗄️ Prisma migrate deploy..."
npx prisma migrate deploy 2>&1

echo "🌱 Prisma generate..."
npx prisma generate 2>&1 || true

echo "▶️ Starting: $@"
exec "$@"
