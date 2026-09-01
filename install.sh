#!/bin/bash
set -e

# AUTO CLIPPER VPS INSTALLER v1.1 - Fixed Private Repo + Clone Fail
# Usage:
# Public repo: curl -fsSL https://raw.githubusercontent.com/yazvip/cliper/main/install.sh | sudo bash -s -- --domain cliper.apivalidasi.my.id --email andrias.korex@gmail.com
# Private repo with token: curl -fsSL https://raw.githubusercontent.com/yazvip/cliper/main/install.sh | sudo GITHUB_TOKEN=ghp_xxx bash -s -- --domain cliper.apivalidasi.my.id --repo yazvip/cliper

DOMAIN=""
EMAIL=""
ADMIN_EMAIL="admin@autoclipper.local"
ADMIN_PASS="Admin123!"
REPO="yazvip/cliper"
BRANCH="main"
SKIP_SWAP=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --domain) DOMAIN="$2"; shift 2;;
    --email) EMAIL="$2"; shift 2;;
    --repo) REPO="$2"; shift 2;;
    --branch) BRANCH="$2"; shift 2;;
    --admin-email) ADMIN_EMAIL="$2"; shift 2;;
    --admin-pass) ADMIN_PASS="$2"; shift 2;;
    --skip-swap) SKIP_SWAP=true; shift;;
    *) shift;;
  esac
done

echo "╔════════════════════════════════════════╗"
echo "║   AUTO CLIPPER VPS INSTALLER v1.1    ║"
echo "║   Fixed Private Repo + Prod Compose  ║"
echo "╚════════════════════════════════════════╝"
echo ""

if [[ $EUID -ne 0 ]]; then
  echo "❌ Jalankan sebagai root: sudo ./install.sh"
  exit 1
fi

OS=$(lsb_release -rs 2>/dev/null || echo "unknown")
echo "📦 OS: Ubuntu $OS"
echo "📦 Repo: $REPO branch $BRANCH"

# 1. Dependencies
echo "📦 Installing dependencies..."
apt-get update -qq
apt-get install -y -qq docker.io docker-compose-plugin git curl ufw jq 2>/dev/null || apt-get install -y -qq docker.io docker-compose git curl ufw

systemctl enable --now docker 2>/dev/null || service docker start 2>/dev/null || true
echo "✅ Docker: $(docker --version 2>/dev/null || echo 'installed')"

# 2. Swap
RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
RAM_MB=$((RAM_KB/1024))
echo "💾 RAM: ${RAM_MB}MB"
if [[ $RAM_MB -lt 2048 && "$SKIP_SWAP" != true ]]; then
  if [[ ! -f /swapfile ]]; then
    echo "⚙️ Creating 2GB swap..."
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    grep -q swapfile /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "✅ Swap created"
  fi
else
  echo "✅ RAM OK, skip swap"
fi

# 3. Determine install dir
INSTALL_DIR="/opt/auto-clipper"
CURRENT_HAS_COMPOSE=false
if [[ -f "./docker-compose.prod.yml" || -f "./docker-compose.yml" ]]; then
  INSTALL_DIR=$(pwd)
  CURRENT_HAS_COMPOSE=true
  echo "📁 Using current dir: $INSTALL_DIR"
else
  echo "📁 Install dir: $INSTALL_DIR"
  mkdir -p $INSTALL_DIR
fi

# 4. Clone / Update repo - FIXED FOR PRIVATE REPO
cd /tmp
CLONE_URL="https://github.com/${REPO}.git"
if [[ -n "$GITHUB_TOKEN" ]]; then
  CLONE_URL="https://${GITHUB_TOKEN}@github.com/${REPO}.git"
  echo "🔑 Using GITHUB_TOKEN for private repo"
fi

if [[ "$CURRENT_HAS_COMPOSE" == false ]]; then
  if [[ -d "$INSTALL_DIR/.git" ]]; then
    echo "🔄 Repo exists, pulling..."
    cd $INSTALL_DIR
    git pull 2>/dev/null || echo "⚠️ Pull failed, continuing..."
  else
    echo "📥 Cloning $REPO..."
    rm -rf /tmp/clone-temp
    if git clone -b $BRANCH $CLONE_URL /tmp/clone-temp 2>&1; then
      echo "✅ Clone OK"
      cp -r /tmp/clone-temp/* $INSTALL_DIR/ 2>/dev/null || true
      cp -r /tmp/clone-temp/.* $INSTALL_DIR/ 2>/dev/null || true
      rm -rf /tmp/clone-temp
    else
      echo "❌ Clone gagal!"
      echo "   Kemungkinan:"
      echo "   1. Repo private dan butuh token: export GITHUB_TOKEN=ghp_xxx"
      echo "   2. Repo tidak ada / salah nama: $REPO"
      echo "   3. GitHub minta PAT, bukan password"
      echo ""
      echo "   SOLUSI CEPAT:"
      echo "   - Jadikan repo Public di GitHub Settings"
      echo "   - Atau buat token: GitHub -> Settings -> Developer settings -> PAT classic -> repo scope"
      echo "   - Lalu: GITHUB_TOKEN=ghp_xxx sudo -E ./install.sh --domain $DOMAIN --repo $REPO"
      echo ""
      echo "   Cek apakah file sudah ada di $INSTALL_DIR ?"
      if [[ ! -f "$INSTALL_DIR/docker-compose.prod.yml" && ! -f "$INSTALL_DIR/docker-compose.yml" ]]; then
        echo "❌ Tidak ada docker-compose file di $INSTALL_DIR, aborting"
        echo "   Silakan clone manual:"
        echo "   git clone https://${REPO}.git $INSTALL_DIR"
        echo "   Atau upload file ZIP manual ke $INSTALL_DIR"
        exit 1
      else
        echo "⚠️ Clone gagal tapi file compose sudah ada, lanjut..."
      fi
    fi
  fi
else
  echo "✅ Compose file sudah ada di current dir, skip clone"
fi

cd $INSTALL_DIR

# 5. Check compose file exists - FIX: support both prod and dev
COMPOSE_FILE=""
if [[ -f docker-compose.prod.yml ]]; then
  COMPOSE_FILE="docker-compose.prod.yml"
elif [[ -f docker-compose.yml ]]; then
  COMPOSE_FILE="docker-compose.yml"
else
  echo "❌ ERROR: Tidak ada docker-compose.yml atau docker-compose.prod.yml di $INSTALL_DIR"
  echo "   Isi folder:"
  ls -la $INSTALL_DIR
  exit 1
fi
echo "✅ Compose file: $COMPOSE_FILE"

# 6. Generate .env
if [[ ! -f .env ]]; then
  echo "🔑 Generating .env..."
  JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n1)
  POSTGRES_PASS=$(openssl rand -hex 16 2>/dev/null || echo "postgres$(date +%s)")
  REDIS_PASS=$(openssl rand -hex 16 2>/dev/null || echo "redis$(date +%s)")
  if [[ -z "$DOMAIN" ]]; then
    IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}' | head -n1)
    APP_URL="http://$IP:3000"
  else
    APP_URL="https://$DOMAIN"
  fi
  cat > .env <<EOF
DATABASE_URL="postgresql://postgres:${POSTGRES_PASS}@postgres:5432/autoclipper?schema=public"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${POSTGRES_PASS}
POSTGRES_DB=autoclipper
REDIS_URL="redis://:${REDIS_PASS}@redis:6379"
REDIS_PASSWORD=${REDIS_PASS}
JWT_SECRET="${JWT_SECRET}"
NEXT_PUBLIC_APP_URL="${APP_URL}"
STORAGE_PATH="./uploads"
OUTPUT_PATH="./outputs"
AI_PROVIDER="mock"
OPENAI_API_KEY=""
DOMAIN="${DOMAIN}"
EMAIL="${EMAIL}"
ADMIN_EMAIL="${ADMIN_EMAIL}"
ADMIN_PASSWORD="${ADMIN_PASS}"
EOF
  echo "✅ .env generated: APP_URL=$APP_URL"
else
  echo "✅ .env exists, updating APP_URL if domain given..."
  if [[ -n "$DOMAIN" ]]; then
    sed -i "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://$DOMAIN|" .env
    sed -i "s|^DOMAIN=.*|DOMAIN=$DOMAIN|" .env
  fi
fi

# 7. Docker up
echo "🐳 Building & Starting..."
docker compose -f $COMPOSE_FILE down 2>/dev/null || docker-compose -f $COMPOSE_FILE down 2>/dev/null || true

# Fix for old docker-compose yml error - ensure we use correct file
if grep -q "FileNotFoundError.*docker-compose.yml" $INSTALL_DIR/../*.log 2>/dev/null; then
  echo "⚠️ Fixing compose file reference..."
  sed -i "s/docker-compose.yml/$COMPOSE_FILE/g" install.sh 2>/dev/null || true
fi

docker compose -f $COMPOSE_FILE up -d postgres redis 2>/dev/null || docker-compose -f $COMPOSE_FILE up -d postgres redis

echo "⏳ Waiting postgres..."
for i in {1..30}; do
  if docker compose -f $COMPOSE_FILE exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo "✅ Postgres ready"
    break
  fi
  sleep 1
done

docker compose -f $COMPOSE_FILE up -d app worker 2>/dev/null || docker-compose -f $COMPOSE_FILE up -d app worker

echo "⏳ Waiting app (20s)..."
sleep 15

# 8. Migrate
echo "🗄️ Prisma migrate..."
docker compose -f $COMPOSE_FILE exec -T app npx prisma migrate deploy 2>/dev/null || docker compose -f $COMPOSE_FILE exec -T app npx prisma db push --accept-data-loss 2>/dev/null || echo "⚠️ Migrate will retry on next restart"

# 9. Admin
echo "👤 Creating admin $ADMIN_EMAIL"
docker compose -f $COMPOSE_FILE exec -T app node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
(async () => {
  try {
    const p = new PrismaClient();
    const hash = await bcrypt.hash('${ADMIN_PASS}', 10);
    await p.user.upsert({
      where: { email: '${ADMIN_EMAIL}' },
      update: { passwordHash: hash, role: 'ADMIN' },
      create: { email: '${ADMIN_EMAIL}', passwordHash: hash, name: 'Admin', role: 'ADMIN' }
    });
    console.log('Admin OK');
    await p.\$disconnect();
  } catch(e){ console.log('Admin seed error', e.message); }
})();
" 2>/dev/null || echo "⚠️ Admin seed failed, register via UI then set role ADMIN in DB"

# 10. UFW
echo "🔥 UFW..."
ufw --force enable 2>/dev/null || true
ufw allow 22/tcp 2>/dev/null || true
ufw allow 80/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true
ufw allow 3000/tcp 2>/dev/null || true

# 11. CLI
echo "🔧 Installing CLI..."
cp ./autoclipper /usr/local/bin/autoclipper 2>/dev/null || true
chmod +x /usr/local/bin/autoclipper 2>/dev/null || true

IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}' | head -n1)
URL="https://$DOMAIN"
if [[ -z "$DOMAIN" ]]; then URL="http://$IP:3000"; fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   ✅ AUTO CLIPPER INSTALLED v1.1      ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "🌐 URL: $URL"
echo "👤 Admin: $ADMIN_EMAIL / $ADMIN_PASS"
echo "📁 Dir: $INSTALL_DIR"
echo "📄 Compose: $COMPOSE_FILE"
echo ""
echo "Commands:"
echo "  autoclipper status"
echo "  autoclipper logs"
echo "  docker compose -f $COMPOSE_FILE ps"
echo "  docker compose -f $COMPOSE_FILE logs -f app worker"
echo ""
if [[ -n "$DOMAIN" ]]; then
  echo "⚠️ Pastikan DNS A record $DOMAIN -> $IP"
fi
echo "🎉 Done!"
