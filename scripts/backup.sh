#!/bin/bash
set -Eeuo pipefail
umask 077
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-autoclipper}" > "$BACKUP_DIR/db.sql"
tar -czf "$BACKUP_DIR/uploads.tar.gz" ./uploads
tar -czf "$BACKUP_DIR/outputs.tar.gz" ./outputs
cp .env "$BACKUP_DIR/.env.backup"
echo "Backup done: $BACKUP_DIR"
