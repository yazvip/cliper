#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

REQUIRED_NODE_MAJOR=20
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

clear
echo -e "${BOLD}${CYAN}"
cat <<'BANNER'
   ___         __           ___ _ _                     
  / _ \ _   _ / _| ___     / __\ (_) _ __  _ __   ___ _ __ 
 / /_\ \ | | | |_ / _ \   / /  | | | '_ \| '_ \ / _ \ '__|
/ /_\\ \ |_| |  _| (_) | / /___| | | |_) | |_) |  __/ |   
\____/ \__,_|_|  \___/  \____/|_|_| .__/| .__/ \___|_|   
                                   |_|   |_|              
   Premium Viral Clip Generator - VPS Installer v3.1
   Fixed: Prisma P1012 + Node 20 + Multi-line Enums
BANNER
echo -e "${NC}"

section "PHASE 1: AUDIT"
echo "OS: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'"' -f2 || uname -a)"
echo "CPU: $(nproc) cores | RAM: $(free -h | awk '/^Mem:/{print $2}') | Disk: $(df -h . | tail -1 | awk '{print $4}') available"
echo "Node: $(node -v 2>/dev/null || echo 'not found') | Sudo Node: $(sudo node -v 2>/dev/null || echo 'not found') | NPM: v$(npm -v 2>/dev/null || echo 'not found')"
echo "Docker: $(docker --version 2>/dev/null || echo 'not installed')"
echo "Compose: $($COMPOSE_CMD version 2>/dev/null || $COMPOSE_CMD --version 2>/dev/null || echo 'not found')"

if [ -f "prisma/schema.prisma" ]; then
  if npx prisma validate >/dev/null 2>&1; then success "Prisma schema VALID"; else warn "Prisma schema INVALID - will auto-fix"; fi
else
  error "prisma/schema.prisma missing"
fi

read -p "Continue? (y/n) " -n 1 -r; echo; [[ $REPLY =~ ^[Yy]$ ]] || exit 1

section "PHASE 2: AUTO-FIX Node & Docker & Prisma"
# Fix Node if needed
NODE_MAJOR=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1 || echo 0)
SUDO_NODE_MAJOR=$(sudo node -v 2>/dev/null | sed 's/v//' | cut -d. -f1 || echo 0)
if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ] || [ "$SUDO_NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
  log "Updating Node.js to v20..."
  sudo apt remove -y nodejs npm 2>/dev/null || true
  sudo apt update && sudo apt install -y curl ca-certificates gnupg
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  sudo npm install -g npm@latest
  success "Node $(node -v) | Sudo $(sudo node -v)"
fi

if ! command -v docker >/dev/null 2>&1; then curl -fsSL https://get.docker.com | sudo sh; fi
sudo chown -R $USER:$USER . 2>/dev/null || sudo chown -R ubuntu:ubuntu . 2>/dev/null || true
chmod +x docker/entrypoint.sh 2>/dev/null || true

# FIX PRISMA SCHEMA - OVERWRITE WITH CORRECT MULTI-LINE VERSION
log "Fixing prisma/schema.prisma (multi-line enums)..."
cat > prisma/schema.prisma <<'SCHEMA'
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ProjectStatus {
  DRAFT
  UPLOADING
  PROCESSING
  TRANSCRIBING
  ANALYZING
  CLIPPING
  RENDERING
  COMPLETED
  FAILED
}

enum JobStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
  RETRYING
}

enum JobType {
  FFPROBE
  TRANSCRIBE
  HIGHLIGHT_DETECT
  CLIP_RENDER
  CAPTION_RENDER
  VIRAL_ANALYSIS
}

enum ClipStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

enum AspectRatio {
  AR_9_16
  AR_16_9
  AR_1_1
}

enum Platform {
  TIKTOK
  YOUTUBE_SHORTS
  INSTAGRAM_REELS
  FACEBOOK_REELS
}

enum ClipStyle {
  VIRAL
  EDUCATIONAL
  PODCAST
  GAMING
  MOTIVATIONAL
  STORYTELLING
  NEWS
  COMEDY
}

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

if npx prisma validate 2>&1 | grep -q "valid"; then success "Prisma schema VALID ✅"; else error "Schema still invalid"; npx prisma validate; exit 1; fi

section "PHASE 3: DEPS"
rm -rf node_modules package-lock.json .next 2>/dev/null || true
sudo rm -rf node_modules package-lock.json .next 2>/dev/null || true
log "npm install..."
npm install --no-audit --no-fund
npx prisma generate
success "Deps OK"

section "PHASE 4: DOCKER BUILD"
COMPOSE_FILE="docker-compose.prod.yml"
[ -f "$COMPOSE_FILE" ] || COMPOSE_FILE="docker-compose.yml"
log "Building $COMPOSE_FILE..."
sudo $COMPOSE_CMD -f $COMPOSE_FILE build --no-cache app worker
sudo $COMPOSE_CMD -f $COMPOSE_FILE up -d
sleep 10
sudo $COMPOSE_CMD -f $COMPOSE_FILE ps
sudo $COMPOSE_CMD -f $COMPOSE_FILE logs --tail=50 app || true

section "HEALTH CHECK"
sleep 5
if curl -sf http://localhost:3000/api/health >/dev/null 2>&1; then success "API OK"; curl -s http://localhost:3000/api/health; echo ""; else warn "API check failed"; sudo $COMPOSE_CMD -f $COMPOSE_FILE logs --tail=100 app || true; fi

section "DONE"
echo -e "${GREEN}✅ AUTO CLIPPER v3.1 READY${NC}"
sudo $COMPOSE_CMD -f $COMPOSE_FILE ps 2>/dev/null || true
echo "Open http://$(curl -s ifconfig.me 2>/dev/null || echo YOUR_IP):3000 | Admin: admin@autoclipper.local / Admin123!"
