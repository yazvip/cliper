#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

PROJECT_NAME="Auto-Clipper Premium"
REQUIRED_NODE_MAJOR=20
REQUIRED_NPM_MAJOR=9
MIN_RAM_MB=1024
MIN_DISK_GB=10

log() { echo -e "${CYAN}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
section() { echo -e "\n${BOLD}${BLUE}=== $1 ===${NC}\n"; }

# Detect compose command
detect_compose() {
  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    echo "docker-compose"
  else
    echo "docker-compose"
  fi
}
COMPOSE_CMD=$(detect_compose)

# Banner
clear
echo -e "${BOLD}${CYAN}"
cat <<'BANNER'
   ___         __           ___ _ _                     
  / _ \ _   _ / _| ___     / __\ (_) _ __  _ __   ___ _ __ 
 / /_\ \ | | | |_ / _ \   / /  | | | '_ \| '_ \ / _ \ '__|
/ /_\\ \ |_| |  _| (_) | / /___| | | |_) | |_) |  __/ |   
\____/ \__,_|_|  \___/  \____/|_|_| .__/| .__/ \___|_|   
                                   |_|   |_|              
   Premium Viral Clip Generator - VPS Installer v2.0
BANNER
echo -e "${NC}"

# ============================================================
# PHASE 1: AUDIT - Check VPS Specs
# ============================================================
section "PHASE 1: AUDIT VPS & ENVIRONMENT"

# OS
echo -e "${BOLD}🖥️  OS & Kernel:${NC}"
if [ -f /etc/os-release ]; then
  cat /etc/os-release | grep -E "^(NAME|VERSION|ID|VERSION_ID)=" | sed 's/^/  /'
fi
echo "  Kernel: $(uname -r)"
echo "  Arch: $(uname -m)"
echo "  Hostname: $(hostname)"

# CPU
echo -e "\n${BOLD}⚙️  CPU:${NC}"
CPU_CORES=$(nproc 2>/dev/null || echo "unknown")
CPU_MODEL=$(lscpu 2>/dev/null | grep "Model name" | sed 's/.*: *//' | xargs || echo "unknown")
echo "  Cores: $CPU_CORES"
echo "  Model: $CPU_MODEL"

# RAM
echo -e "\n${BOLD}💾 RAM:${NC}"
RAM_TOTAL_MB=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}' || echo "0")
RAM_AVAILABLE_MB=$(free -m 2>/dev/null | awk '/^Mem:/{print $7}' || echo "0")
echo "  Total: ${RAM_TOTAL_MB} MB ($(free -h 2>/dev/null | awk '/^Mem:/{print $2}' || echo 'unknown'))"
echo "  Available: ${RAM_AVAILABLE_MB} MB"
if [ "$RAM_TOTAL_MB" -lt "$MIN_RAM_MB" ] && [ "$RAM_TOTAL_MB" != "0" ]; then
  warn "RAM below ${MIN_RAM_MB}MB minimum, build may be slow or fail (recommend 2GB+)"
else
  success "RAM OK"
fi

# Disk
echo -e "\n${BOLD}💿 Disk:${NC}"
DISK_AVAILABLE_GB=$(df -BG . 2>/dev/null | tail -1 | awk '{print $4}' | sed 's/G//' || echo "0")
echo "  Available: ${DISK_AVAILABLE_GB}GB (in $(pwd))"
df -h . 2>/dev/null | tail -1 | sed 's/^/  /'
if [ "$DISK_AVAILABLE_GB" -lt "$MIN_DISK_GB" ] && [ "$DISK_AVAILABLE_GB" != "0" ]; then
  warn "Disk below ${MIN_DISK_GB}GB, may run out of space"
else
  success "Disk OK"
fi

# Node.js check
echo -e "\n${BOLD}🟢 Node.js & NPM:${NC}"
NODE_CURRENT="not installed"
NODE_MAJOR=0
if command -v node >/dev/null 2>&1; then
  NODE_CURRENT=$(node -v)
  NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
  echo "  User node: $NODE_CURRENT (major: $NODE_MAJOR)"
else
  echo "  User node: not found"
fi

SUDO_NODE_CURRENT="not installed"
SUDO_NODE_MAJOR=0
if sudo node -v >/dev/null 2>&1; then
  SUDO_NODE_CURRENT=$(sudo node -v)
  SUDO_NODE_MAJOR=$(sudo node -v | sed 's/v//' | cut -d. -f1)
  echo "  Sudo node: $SUDO_NODE_CURRENT (major: $SUDO_NODE_MAJOR)"
else
  echo "  Sudo node: not found (will install)"
fi

NPM_CURRENT="not installed"
if command -v npm >/dev/null 2>&1; then
  NPM_CURRENT=$(npm -v)
  echo "  User npm: v$NPM_CURRENT"
fi
if sudo npm -v >/dev/null 2>&1; then
  echo "  Sudo npm: v$(sudo npm -v)"
fi

# Check nvm
if [ -d "$HOME/.nvm" ]; then
  echo "  nvm: found at $HOME/.nvm"
  ls $HOME/.nvm/versions/node/ 2>/dev/null | sed 's/^/    - /' || true
else
  echo "  nvm: not found"
fi

# Docker check
echo -e "\n${BOLD}🐳 Docker:${NC}"
if command -v docker >/dev/null 2>&1; then
  echo "  Docker: $(docker --version 2>/dev/null || echo 'unknown')"
  if docker ps >/dev/null 2>&1; then
    success "Docker daemon running"
  else
    warn "Docker daemon not running or permission denied (try sudo)"
    if sudo docker ps >/dev/null 2>&1; then
      echo "  Sudo docker: OK"
    else
      error "Docker daemon not running"
    fi
  fi
else
  warn "Docker not installed - will install"
fi

if docker compose version >/dev/null 2>&1; then
  echo "  Compose v2: $(docker compose version)"
elif command -v docker-compose >/dev/null 2>&1; then
  echo "  Compose v1: $(docker-compose --version)"
else
  warn "docker-compose not found - will install plugin"
fi

# Ports check
echo -e "\n${BOLD}🔌 Ports:${NC}"
for PORT in 3000 5432 6379 80 443; do
  if ss -tlnp 2>/dev/null | grep -q ":$PORT " || netstat -tlnp 2>/dev/null | grep -q ":$PORT "; then
    echo "  Port $PORT: IN USE"
    ss -tlnp 2>/dev/null | grep ":$PORT " | head -1 | sed 's/^/    /' || true
  else
    echo "  Port $PORT: free ✅"
  fi
done

# Project files check
echo -e "\n${BOLD}📁 Project Files:${NC}"
REQUIRED_FILES=("package.json" "prisma/schema.prisma" "Dockerfile" "docker-compose.prod.yml" "next.config.mjs" ".dockerignore")
for FILE in "${REQUIRED_FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo "  $FILE: exists ✅"
  else
    error "$FILE: MISSING"
  fi
done

# Env check
echo -e "\n${BOLD}🔐 Environment:${NC}"
if [ -f ".env" ]; then
  echo "  .env: exists"
  for VAR in DATABASE_URL REDIS_URL JWT_SECRET NEXTAUTH_SECRET; do
    if grep -q "^$VAR=" .env 2>/dev/null; then
      echo "    $VAR: set ✅"
    else
      warn "$VAR: not set in .env"
    fi
  done
else
  warn ".env not found - will create from .env.example"
  if [ -f ".env.example" ]; then
    cp .env.example .env
    success "Created .env from .env.example - PLEASE EDIT IT!"
  fi
fi

# Audit summary
section "AUDIT SUMMARY"
ISSUES=0
if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ] && [ "$NODE_MAJOR" != "0" ]; then
  error "Node.js major $NODE_MAJOR < required $REQUIRED_NODE_MAJOR"
  ISSUES=$((ISSUES+1))
fi
if [ "$SUDO_NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ] && [ "$SUDO_NODE_MAJOR" != "0" ]; then
  error "Sudo Node.js major $SUDO_NODE_MAJOR < required $REQUIRED_NODE_MAJOR - CRITICAL FOR DOCKER BUILD"
  ISSUES=$((ISSUES+1))
fi
if ! command -v docker >/dev/null 2>&1; then
  error "Docker not installed"
  ISSUES=$((ISSUES+1))
fi
if [ "$RAM_TOTAL_MB" != "0" ] && [ "$RAM_TOTAL_MB" -lt "$MIN_RAM_MB" ]; then
  warn "Low RAM"
fi
if [ "$DISK_AVAILABLE_GB" != "0" ] && [ "$DISK_AVAILABLE_GB" -lt "$MIN_DISK_GB" ]; then
  warn "Low Disk"
fi

if [ $ISSUES -eq 0 ]; then
  success "Audit passed - no critical issues"
else
  warn "Found $ISSUES critical issue(s) - will auto-fix in next phase"
fi

echo ""
read -p "Continue to auto-fix & install? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted by user"
  exit 1
fi

# ============================================================
# PHASE 2: AUTO-FIX Node.js, NPM, Docker
# ============================================================
section "PHASE 2: AUTO-FIX & UPDATE"

# Fix Node.js if needed
NEED_NODE_UPDATE=false
if [ "$SUDO_NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ] || [ "$SUDO_NODE_MAJOR" = "0" ]; then
  NEED_NODE_UPDATE=true
fi
if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ] || [ "$NODE_MAJOR" = "0" ]; then
  NEED_NODE_UPDATE=true
fi

if [ "$NEED_NODE_UPDATE" = true ]; then
  log "Updating Node.js to v${REQUIRED_NODE_MAJOR}.x system-wide..."
  
  # Remove old nodejs
  sudo apt remove -y nodejs npm 2>/dev/null || true
  sudo apt autoremove -y 2>/dev/null || true
  
  # Install dependencies
  sudo apt update
  sudo apt install -y curl ca-certificates gnupg
  
  # Install NodeSource
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  
  # Update npm to latest
  sudo npm install -g npm@latest
  
  # Verify
  echo "  New user node: $(node -v)"
  echo "  New sudo node: $(sudo node -v)"
  echo "  New user npm: v$(npm -v)"
  echo "  New sudo npm: v$(sudo npm -v)"
  
  if [ "$(sudo node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)" -ge "$REQUIRED_NODE_MAJOR" ]; then
    success "Node.js updated to $(sudo node -v)"
  else
    error "Failed to update Node.js"
    exit 1
  fi
else
  success "Node.js v${NODE_MAJOR} >= v${REQUIRED_NODE_MAJOR} - OK"
fi

# Fix Docker if needed
if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker $USER || true
  success "Docker installed"
fi

# Install docker-compose plugin if missing
if ! docker compose version >/dev/null 2>&1 && ! command -v docker-compose >/dev/null 2>&1; then
  log "Installing docker-compose plugin..."
  sudo apt update
  sudo apt install -y docker-compose-plugin docker-compose || true
  success "docker-compose installed"
fi

# Fix permissions
log "Fixing permissions..."
sudo chown -R $USER:$USER . 2>/dev/null || sudo chown -R ubuntu:ubuntu . 2>/dev/null || true
chmod +x docker/entrypoint.sh 2>/dev/null || true
chmod +x install.sh 2>/dev/null || true
success "Permissions fixed"

# ============================================================
# PHASE 3: DEPENDENCIES & BUILD
# ============================================================
section "PHASE 3: INSTALL DEPENDENCIES"

# Clean old
log "Cleaning old node_modules..."
rm -rf node_modules package-lock.json .next 2>/dev/null || true
sudo rm -rf node_modules package-lock.json .next 2>/dev/null || true

log "Running npm install (Node $(node -v), NPM v$(npm -v))..."
npm install --no-audit --no-fund

# Check if archiver, bullmq etc present
if ! grep -q '"archiver"' package.json; then
  log "Adding missing deps..."
  npm install archiver@6.0.1 bullmq@4.17.0 --save --no-audit --no-fund || true
fi

log "Generating Prisma Client..."
npx prisma generate

success "Dependencies installed"

# ============================================================
# PHASE 4: DOCKER BUILD & DEPLOY
# ============================================================
section "PHASE 4: DOCKER BUILD & DEPLOY"

COMPOSE_FILE="docker-compose.prod.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
  COMPOSE_FILE="docker-compose.yml"
fi

log "Using compose file: $COMPOSE_FILE"
log "Compose command: $COMPOSE_CMD -f $COMPOSE_FILE"

log "Building images (this may take 3-5 minutes)..."
sudo $COMPOSE_CMD -f $COMPOSE_FILE build --no-cache app worker

success "Build completed"

log "Starting containers..."
sudo $COMPOSE_CMD -f $COMPOSE_FILE up -d

log "Waiting 10s for services to start..."
sleep 10

log "Container status:"
sudo $COMPOSE_CMD -f $COMPOSE_FILE ps

log "App logs (last 50 lines):"
sudo $COMPOSE_CMD -f $COMPOSE_FILE logs --tail=50 app || true

# Health check
section "HEALTH CHECK"
sleep 5
if curl -sf http://localhost:3000/api/health >/dev/null 2>&1; then
  success "API health check PASSED - http://localhost:3000/api/health"
  curl -s http://localhost:3000/api/health | head -c 200
  echo ""
else
  warn "API health check failed - checking logs..."
  sudo $COMPOSE_CMD -f $COMPOSE_FILE logs --tail=100 app || true
fi

# Final summary
section "INSTALLATION COMPLETE"
echo -e "${GREEN}${BOLD}"
cat <<'DONE'
   ___         __           ___ _ _                     
  / _ \ _   _ / _| ___     / __\ (_) _ __  _ __   ___ _ __ 
 / /_\ \ | | | |_ / _ \   / /  | | | '_ \| '_ \ / _ \ '__|
/ /_\\ \ |_| |  _| (_) | / /___| | | |_) | |_) |  __/ |   
\____/ \__,_|_|  \___/  \____/|_|_| .__/| .__/ \___|_|   
                                   |_|   |_|              
DONE
echo -e "${NC}"
echo "Project: $PROJECT_NAME"
echo "Node: $(node -v) | NPM: v$(npm -v) | Sudo Node: $(sudo node -v)"
echo "Docker: $(docker --version 2>/dev/null || echo 'unknown')"
echo "Compose: $($COMPOSE_CMD --version 2>/dev/null || $COMPOSE_CMD version 2>/dev/null || echo 'unknown')"
echo ""
echo "Containers:"
sudo $COMPOSE_CMD -f $COMPOSE_FILE ps 2>/dev/null || true
echo ""
echo "URLs:"
echo "  Local: http://localhost:3000"
echo "  Health: http://localhost:3000/api/health"
echo "  Admin: admin@autoclipper.local / Admin123!"
echo ""
echo "Commands:"
echo "  Logs: sudo $COMPOSE_CMD -f $COMPOSE_FILE logs -f --tail=100 app worker"
echo "  Status: sudo $COMPOSE_CMD -f $COMPOSE_FILE ps"
echo "  Restart: sudo $COMPOSE_CMD -f $COMPOSE_FILE restart"
echo "  Stop: sudo $COMPOSE_CMD -f $COMPOSE_FILE down"
echo ""
success "All done! Open http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_VPS_IP'):3000"
