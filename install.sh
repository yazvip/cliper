#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"

DOMAIN="${DOMAIN:-}"; EMAIL="${EMAIL:-}"; ADMIN_EMAIL="${ADMIN_EMAIL:-}"
SKIP_SWAP=false; FORCE_BUILD=false
usage(){ echo "Usage: sudo ./install.sh [--domain example.com] [--email ops@example.com] [--admin-email email] [--skip-swap] [--force-build]"; }
while (($#)); do case "$1" in
  --domain|--email|--admin-email) [[ $# -ge 2 ]] || { usage >&2; exit 2; }; case "$1" in --domain) DOMAIN="$2";; --email) EMAIL="$2";; *) ADMIN_EMAIL="$2";; esac; shift 2;;
  --skip-swap) SKIP_SWAP=true; shift;; --force-build) FORCE_BUILD=true; shift;; -h|--help) usage; exit 0;; *) usage >&2; exit 2;; esac; done
die(){ echo "ERROR: $*" >&2; exit 1; }; log(){ echo "[$(date +'%F %T')] $*"; }
[[ $EUID -eq 0 ]] || die "jalankan sebagai root: sudo ./install.sh"
[[ -f docker-compose.prod.yml && -f Dockerfile && -f package.json && -f prisma/schema.prisma ]] || die "jalankan dari root repository lengkap"
export DEBIAN_FRONTEND=noninteractive
command -v apt-get >/dev/null || die "hanya mendukung Debian/Ubuntu"
apt-get update; apt-get install -y ca-certificates curl git openssl jq ufw util-linux
command -v docker >/dev/null || { curl -fsSL https://get.docker.com | sh; }
docker compose version >/dev/null 2>&1 || apt-get install -y docker-compose-plugin
systemctl enable --now docker

if [[ "$SKIP_SWAP" != true ]]; then
  ram_kb=$(awk '/MemTotal/{print $2}' /proc/meminfo)
  if (( ram_kb < 2097152 )) && [[ ! -e /swapfile ]]; then
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
    chmod 600 /swapfile; mkswap /swapfile >/dev/null; swapon /swapfile
    grep -qE '^/swapfile\s' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
fi
gen_secret(){ openssl rand -hex 32; }
ensure_env(){ local k="$1" v="$2"; grep -qE "^${k}=.+" .env || echo "${k}=${v}" >> .env; }
touch .env; chmod 600 .env
ensure_env POSTGRES_USER postgres; ensure_env POSTGRES_DB autoclipper
ensure_env POSTGRES_PASSWORD "$(gen_secret)"; ensure_env REDIS_PASSWORD "$(gen_secret)"; ensure_env JWT_SECRET "$(gen_secret)"
pg_user=$(grep -E '^POSTGRES_USER=' .env | head -1 | cut -d= -f2-); pg_db=$(grep -E '^POSTGRES_DB=' .env | head -1 | cut -d= -f2-)
pg_pass=$(grep -E '^POSTGRES_PASSWORD=' .env | head -1 | cut -d= -f2-); redis_pass=$(grep -E '^REDIS_PASSWORD=' .env | head -1 | cut -d= -f2-)
ensure_env DATABASE_URL "postgresql://${pg_user}:${pg_pass}@postgres:5432/${pg_db}?schema=public"
ensure_env REDIS_URL "redis://:${redis_pass}@redis:6379"
ensure_env AI_PROVIDER mock
if [[ -n "$DOMAIN" ]]; then sed -i "/^DOMAIN=/d;/^NEXT_PUBLIC_APP_URL=/d" .env; echo "DOMAIN=$DOMAIN" >> .env; echo "NEXT_PUBLIC_APP_URL=https://${DOMAIN}" >> .env; fi
[[ -n "$EMAIL" ]] && { sed -i '/^EMAIL=/d' .env; echo "EMAIL=$EMAIL" >> .env; }
[[ -n "$ADMIN_EMAIL" ]] && { sed -i '/^ADMIN_EMAIL=/d' .env; echo "ADMIN_EMAIL=$ADMIN_EMAIL" >> .env; }
mkdir -p uploads outputs tmp backups; chmod 700 uploads outputs tmp backups
docker compose -f docker-compose.prod.yml config >/dev/null || die "docker compose config invalid"

args=(); [[ "$FORCE_BUILD" == true ]] && args+=(--no-cache)
log "Building production images"; docker compose -f docker-compose.prod.yml build "${args[@]}" app worker
docker compose -f docker-compose.prod.yml up -d postgres redis
for i in {1..60}; do docker compose -f docker-compose.prod.yml ps --status running postgres redis | grep -qE 'postgres|redis' && break; (( i == 60 )) && die "database/redis tidak ready"; sleep 2; done
docker compose -f docker-compose.prod.yml up -d app worker
log "Applying Prisma migrations"; docker compose -f docker-compose.prod.yml exec -T app npx prisma migrate deploy
for i in {1..60}; do if curl -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1; then break; fi; (( i == 60 )) && { docker compose -f docker-compose.prod.yml logs --tail=100 app worker; die "application health check failed"; }; sleep 2; done
ufw --force enable >/dev/null 2>&1 || true; ufw allow 22/tcp >/dev/null 2>&1 || true; ufw allow 80/tcp >/dev/null 2>&1 || true; ufw allow 443/tcp >/dev/null 2>&1 || true; ufw delete allow 3000/tcp >/dev/null 2>&1 || true
install -m 0755 autoclipper /usr/local/bin/autoclipper
docker compose -f docker-compose.prod.yml ps
echo "Installation selesai. Jalankan profile Caddy setelah DNS siap: docker compose -f docker-compose.prod.yml --profile with-caddy up -d"
