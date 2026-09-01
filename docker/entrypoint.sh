#!/bin/sh
set -e

echo "🚀 Entrypoint: waiting for postgres..."
until npx prisma db execute --schema=./prisma/schema.prisma --stdin <<< "SELECT 1" 2>/dev/null || pg_isready -h postgres -U $POSTGRES_USER; do
  echo "Waiting postgres..."
  sleep 2
done

echo "🗄️ Prisma migrate deploy..."
npx prisma migrate deploy || npx prisma db push --accept-data-loss || echo "Migrate failed, continuing..."

echo "🌱 Prisma generate..."
npx prisma generate

echo "▶️ Starting app..."
exec "$@"
