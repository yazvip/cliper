#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

PROJECT_NAME="Auto-Clipper Premium v3.0"
REQUIRED_NODE_MAJOR=20
REQUIRED_NPM_MAJOR=9
MIN_RAM_MB=1024
MIN_DISK_GB=10

log() { echo -e "${CYAN}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
section() { echo -e "\n${BOLD}${BLUE}=== $1 ===${NC}\n"; }

detect_compose() {
  if docker compose version >/dev/null 2>&1; then echo "docker compose";
  elif command -v docker-compose >/dev/null 2>&1; then echo "docker-compose";
  else echo "docker compose"; fi
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
   Premium Viral Clip Generator - VPS Installer v3.0
   Fixed: Prisma P1012 + Node 20 + BullMQ + Archiver
BANNER
echo -e "${NC}"

# ============================================================
# PHASE 1: AUDIT
# ============================================================
section "PHASE 1: AUDIT VPS & ENVIRONMENT"

echo -e "${BOLD}🖥️  OS & Kernel:${NC}"
if [ -f /etc/os-release ]; then cat /etc/os-release | grep -E "^(NAME|VERSION|ID|VERSION_ID)=" | sed 's/^/  /'; fi
echo "  Kernel: $(uname -r) | Arch: $(uname -m) | Host: $(hostname)"

echo -e "\n${BOLD}⚙️  CPU & RAM:${NC}"
CPU_CORES=$(nproc 2>/dev/null || echo "unknown")
echo "  Cores: $CPU_CORES | Model: $(lscpu 2>/dev/null | grep 'Model name' | sed 's/.*: *//' | xargs || echo unknown)"
RAM_TOTAL_MB=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}' || echo "0")
RAM_AVAILABLE_MB=$(free -m 2>/dev/null | awk '/^Mem:/{print $7}' || echo "0")
echo "  RAM Total: ${RAM_TOTAL_MB} MB | Available: ${RAM_AVAILABLE_MB} MB"
if [ "$RAM_TOTAL_MB" -lt "$MIN_RAM_MB" ] && [ "$RAM_TOTAL_MB" != "0" ]; then warn "RAM below ${MIN_RAM_MB}MB"; else success "RAM OK"; fi

echo -e "\n${BOLD}💿 Disk:${NC}"
DISK_AVAILABLE_GB=$(df -BG . 2>/dev/null | tail -1 | awk '{print $4}' | sed 's/G//' || echo "0")
echo "  Available: ${DISK_AVAILABLE_GB}GB in $(pwd)"
df -h . | tail -1 | sed 's/^/  /'
if [ "$DISK_AVAILABLE_GB" -lt "$MIN_DISK_GB" ] && [ "$DISK_AVAILABLE_GB" != "0" ]; then warn "Disk < ${MIN_DISK_GB}GB"; else success "Disk OK"; fi

echo -e "\n${BOLD}🟢 Node.js & NPM:${NC}"
NODE_MAJOR=0; SUDO_NODE_MAJOR=0
if command -v node >/dev/null 2>&1; then NODE_CURRENT=$(node -v); NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1); echo "  User node: $NODE_CURRENT (major $NODE_MAJOR)"; else echo "  User node: not found"; fi
if sudo node -v >/dev/null 2>&1; then SUDO_NODE_CURRENT=$(sudo node -v); SUDO_NODE_MAJOR=$(sudo node -v | sed 's/v//' | cut -d. -f1); echo "  Sudo node: $SUDO_NODE_CURRENT (major $SUDO_NODE_MAJOR)"; else echo "  Sudo node: not found"; fi
if command -v npm >/dev/null 2>&1; then echo "  User npm: v$(npm -v)"; fi
if sudo npm -v >/dev/null 2>&1; then echo "  Sudo npm: v$(sudo npm -v)"; fi
if [ -d "$HOME/.nvm" ]; then echo "  nvm: found"; ls $HOME/.nvm/versions/node/ 2>/dev/null | sed 's/^/    - /' || true; fi

echo -e "\n${BOLD}🐳 Docker:${NC}"
if command -v docker >/dev/null 2>&1; then
  echo "  Docker: $(docker --version 2>/dev/null)"
  if sudo docker ps >/dev/null 2>&1; then success "Docker daemon running"; else error "Docker daemon not running"; fi
else warn "Docker not installed"; fi
if docker compose version >/dev/null 2>&1; then echo "  Compose v2: $(docker compose version)"; elif command -v docker-compose >/dev/null 2>&1; then echo "  Compose v1: $(docker-compose --version)"; else warn "docker-compose not found"; fi

echo -e "\n${BOLD}🔌 Ports:${NC}"
for PORT in 3000 5432 6379 80 443; do
  if ss -tlnp 2>/dev/null | grep -q ":$PORT " || netstat -tlnp 2>/dev/null | grep -q ":$PORT "; then echo "  Port $PORT: IN USE"; else echo "  Port $PORT: free ✅"; fi
done

echo -e "\n${BOLD}📁 Project Files:${NC}"
for FILE in "package.json" "prisma/schema.prisma" "Dockerfile" "docker-compose.prod.yml" "next.config.mjs" ".dockerignore" "install.sh"; do
  if [ -f "$FILE" ]; then echo "  $FILE: ✅"; else error "$FILE: MISSING"; fi
done

echo -e "\n${BOLD}🔐 Prisma Schema Validation:${NC}"
if [ -f "prisma/schema.prisma" ]; then
  # Check first 2 lines - old bug had generator and datasource on same line without newline
  HEAD_LINES=$(head -5 prisma/schema.prisma)
  echo "$HEAD_LINES" | sed 's/^/  /'
  if grep -q "generator client { provider" prisma/schema.prisma && head -1 prisma/schema.prisma | grep -q "datasource"; then
    error "Schema corrupted: generator and datasource on same line!"
  else
    # Try npx prisma validate
    if npx prisma validate 2>&1 | grep -q "Valid"; then
      success "Prisma schema VALID"
    else
      warn "Prisma validate failed, will try to auto-fix"
      npx prisma validate 2>&1 | tail -20 | sed 's/^/  /' || true
    fi
  fi
else
  error "prisma/schema.prisma not found"
fi

echo -e "\n${BOLD}🔐 .env:${NC}"
if [ -f ".env" ]; then echo "  .env: exists"; else warn ".env not found - will create"; fi

section "AUDIT SUMMARY"
ISSUES=0
if [ "$SUDO_NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ] && [ "$SUDO_NODE_MAJOR" != "0" ]; then error "Sudo Node $SUDO_NODE_MAJOR < $REQUIRED_NODE_MAJOR"; ISSUES=$((ISSUES+1)); fi
if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ] && [ "$NODE_MAJOR" != "0" ]; then error "User Node $NODE_MAJOR < $REQUIRED_NODE_MAJOR"; ISSUES=$((ISSUES+1)); fi
if ! command -v docker >/dev/null 2>&1; then error "Docker missing"; ISSUES=$((ISSUES+1)); fi

if [ $ISSUES -eq 0 ]; then success "Audit passed"; else warn "Found $ISSUES critical - will auto-fix"; fi
echo ""
read -p "Continue to auto-fix & install? (y/n) " -n 1 -r; echo; if [[ ! $REPLY =~ ^[Yy]$ ]]; then echo "Aborted"; exit 1; fi

# ============================================================
# PHASE 2: AUTO-FIX
# ============================================================
section "PHASE 2: AUTO-FIX Node, NPM, Docker, Prisma"

# Fix Node
NEED_NODE_UPDATE=false
if [ "$SUDO_NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ] || [ "$SUDO_NODE_MAJOR" = "0" ]; then NEED_NODE_UPDATE=true; fi
if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ] || [ "$NODE_MAJOR" = "0" ]; then NEED_NODE_UPDATE=true; fi

if [ "$NEED_NODE_UPDATE" = true ]; then
  log "Updating Node.js to v${REQUIRED_NODE_MAJOR} system-wide..."
  sudo apt remove -y nodejs npm 2>/dev/null || true
  sudo apt autoremove -y 2>/dev/null || true
  sudo apt update
  sudo apt install -y curl ca-certificates gnupg
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  sudo npm install -g npm@latest
  echo "  New node: $(node -v) | sudo node: $(sudo node -v)"
  success "Node updated"
else success "Node OK"; fi

# Docker
if ! command -v docker >/dev/null 2>&1; then log "Installing Docker..."; curl -fsSL https://get.docker.com | sudo sh; sudo usermod -aG docker $USER || true; success "Docker installed"; fi
if ! docker compose version >/dev/null 2>&1 && ! command -v docker-compose >/dev/null 2>&1; then sudo apt install -y docker-compose-plugin docker-compose || true; fi

# Fix perms
log "Fixing permissions..."
sudo chown -R $USER:$USER . 2>/dev/null || sudo chown -R ubuntu:ubuntu . 2>/dev/null || true
chmod +x docker/entrypoint.sh install.sh 2>/dev/null || true

# Fix Prisma schema if corrupted (the P1012 error)
log "Checking & fixing prisma/schema.prisma..."
if ! npx prisma validate >/dev/null 2>&1; then
  warn "Schema invalid - overwriting with fixed template"
  cat > prisma/schema.prisma <<'SCHEMA'
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ProjectStatus { DRAFT UPLOADING PROCESSING TRANSCRIBING ANALYZING CLIPPING RENDERING COMPLETED FAILED }
enum JobStatus { QUEUED PROCESSING COMPLETED FAILED RETRYING }
enum JobType { FFPROBE TRANSCRIBE HIGHLIGHT_DETECT CLIP_RENDER CAPTION_RENDER VIRAL_ANALYSIS }
enum ClipStatus { PENDING PROCESSING COMPLETED FAILED }
enum AspectRatio { AR_9_16 AR_16_9 AR_1_1 }
enum Platform { TIKTOK YOUTUBE_SHORTS INSTAGRAM_REELS FACEBOOK_REELS }
enum ClipStyle { VIRAL EDUCATIONAL PODCAST GAMING MOTIVATIONAL STORYTELLING NEWS COMEDY }

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  name         String?
  passwordHash String
  role         String    @default("USER")
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  sessions     Session[]
  projects     Project[]
  templates    Template[]
  brandKits    BrandKit[]
  apiKeys      ApiKey[]
  aiUsages     AIUsage[]
  systemLogs   SystemLog[]
}
model Session {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}
model Project {
  id           String        @id @default(uuid())
  userId       String
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  title        String
  description  String?
  status       ProjectStatus @default(DRAFT)
  style        ClipStyle     @default(VIRAL)
  aspectRatio  AspectRatio   @default(AR_9_16)
  platform     Platform      @default(TIKTOK)
  clipCount    Int           @default(5)
  clipDuration Int           @default(30)
  aiIntensity  String        @default("balanced")
  thumbnailPath String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  videos       Video[]
  clips        Clip[]
  jobs         ProcessingJob[]
  @@index([userId, status])
}
model Video {
  id               String   @id @default(uuid())
  projectId        String
  project          Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  originalFilename String
  storedPath       String
  mimeType         String
  sizeBytes        Int
  duration         Float?
  width            Int?
  height           Int?
  fps              Float?
  codec            String?
  bitrate          Int?
  audioCodec       String?
  audioChannels    Int?
  hasAudio         Boolean  @default(true)
  ffprobeJson      Json?
  createdAt        DateTime @default(now())
  transcript       Transcript?
}
model Transcript {
  id       String           @id @default(uuid())
  videoId  String           @unique
  video    Video            @relation(fields: [videoId], references: [id], onDelete: Cascade)
  fullText String           @db.Text
  language String           @default("id")
  createdAt DateTime        @default(now())
  words    TranscriptWord[]
}
model TranscriptWord {
  id           String     @id @default(uuid())
  transcriptId String
  transcript   Transcript @relation(fields: [transcriptId], references: [id], onDelete: Cascade)
  word         String
  start        Float
  end          Float
  confidence   Float      @default(1)
  speaker      String?
  @@index([transcriptId, start])
}
model Clip {
  id                String     @id @default(uuid())
  projectId         String
  project           Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  startTime         Float
  endTime           Float
  duration          Float
  title             String?
  hook              String?
  description       String?
  hashtags          String[]
  score             Float      @default(0)
  hookScore         Float      @default(0)
  engagementScore   Float      @default(0)
  emotionScore      Float      @default(0)
  infoScore         Float      @default(0)
  reason            String?    @db.Text
  viralProbability  Float      @default(0)
  retentionScore    Float      @default(0)
  shareabilityScore Float      @default(0)
  viralBreakdown    Json?
  retentionCurve    Json?
  hookVariants      Json?
  autoEffects       Json?
  ctrPrediction     Float      @default(0)
  status            ClipStatus @default(PENDING)
  outputPath        String?
  thumbnailPath     String?
  aspectRatio       AspectRatio @default(AR_9_16)
  cropMode          String     @default("smart")
  captionStyle      String     @default("tiktok")
  renderedAt        DateTime?
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  captions          Caption[]
}
model Caption {
  id     String @id @default(uuid())
  clipId String
  clip   Clip   @relation(fields: [clipId], references: [id], onDelete: Cascade)
  word   String
  start  Float
  end    Float
  style  Json?
  @@index([clipId, start])
}
model Template {
  id              String      @id @default(uuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  name            String
  aspectRatio     AspectRatio @default(AR_9_16)
  captionStyle    String      @default("tiktok")
  fontFamily      String      @default("Inter")
  primaryColor    String      @default("#ffffff")
  secondaryColor  String      @default("#000000")
  backgroundColor String      @default("#000000")
  watermarkPath   String?
  logoPath        String?
  introPath       String?
  outroPath       String?
  config          Json?
  isPublic        Boolean     @default(false)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}
model BrandKit {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name          String
  logoPath      String?
  brandName     String?
  primaryColor  String
  secondaryColor String
  fontFamily    String   @default("Inter")
  watermarkPath String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
model MediaAsset {
  id         String   @id @default(uuid())
  userId     String
  filename   String
  storedPath String
  mimeType   String
  sizeBytes  Int
  type       String
  createdAt  DateTime @default(now())
}
model ProcessingJob {
  id          String    @id @default(uuid())
  projectId   String?
  project     Project?  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  clipId      String?
  type        JobType
  status      JobStatus @default(QUEUED)
  progress    Int       @default(0)
  payload     Json?
  result      Json?
  error       String?   @db.Text
  attempts    Int       @default(0)
  bullMqJobId String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  @@index([projectId, status])
  @@index([status, type])
}
model AIUsage {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider   String
  model      String
  tokensUsed Int      @default(0)
  costUsd    Float    @default(0)
  operation  String
  createdAt  DateTime @default(now())
}
model ApiKey {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider     String
  encryptedKey String   @db.Text
  name         String?
  createdAt    DateTime @default(now())
}
model SystemLog {
  id        String   @id @default(uuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  projectId String?
  jobId     String?
  level     String
  service   String
  message   String   @db.Text
  meta      Json?
  createdAt DateTime @default(now())
  @@index([level, service])
}
SCHEMA
  success "Schema fixed"
fi

if npx prisma validate 2>&1 | grep -q "Valid"; then success "Prisma schema VALID ✅"; else error "Schema still invalid"; npx prisma validate; fi

# ============================================================
# PHASE 3: DEPS
# ============================================================
section "PHASE 3: INSTALL DEPENDENCIES"
rm -rf node_modules package-lock.json .next 2>/dev/null || true
sudo rm -rf node_modules package-lock.json .next 2>/dev/null || true
log "npm install (Node $(node -v))..."
npm install --no-audit --no-fund
log "Prisma generate..."
npx prisma generate
success "Deps OK"

# ============================================================
# PHASE 4: DOCKER BUILD
# ============================================================
section "PHASE 4: DOCKER BUILD & DEPLOY"
COMPOSE_FILE="docker-compose.prod.yml"
[ -f "$COMPOSE_FILE" ] || COMPOSE_FILE="docker-compose.yml"
log "Compose: $COMPOSE_FILE | Cmd: $COMPOSE_CMD"

log "Building (3-5 min)..."
sudo $COMPOSE_CMD -f $COMPOSE_FILE build --no-cache app worker
success "Build OK"

log "Starting..."
sudo $COMPOSE_CMD -f $COMPOSE_FILE up -d
sleep 10
sudo $COMPOSE_CMD -f $COMPOSE_FILE ps
sudo $COMPOSE_CMD -f $COMPOSE_FILE logs --tail=50 app || true

section "HEALTH CHECK"
sleep 5
if curl -sf http://localhost:3000/api/health >/dev/null 2>&1; then success "API OK - http://localhost:3000/api/health"; curl -s http://localhost:3000/api/health | head -c 200; echo ""; else warn "API check failed, see logs"; sudo $COMPOSE_CMD -f $COMPOSE_FILE logs --tail=100 app || true; fi

section "INSTALLATION COMPLETE"
echo -e "${GREEN}${BOLD}✅ AUTO CLIPPER v3.0 READY${NC}"
echo "Node: $(node -v) | NPM: v$(npm -v) | Sudo Node: $(sudo node -v)"
echo "Docker: $(docker --version 2>/dev/null)"
echo ""
sudo $COMPOSE_CMD -f $COMPOSE_FILE ps 2>/dev/null || true
echo ""
echo "URLs: http://localhost:3000 | https://cliper.apivalidasi.my.id"
echo "Admin: admin@autoclipper.local / Admin123!"
echo "Logs: sudo $COMPOSE_CMD -f $COMPOSE_FILE logs -f --tail=100 app worker"
success "Done! Open http://$(curl -s ifconfig.me 2>/dev/null || echo YOUR_IP):3000"
