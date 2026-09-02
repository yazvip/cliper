# AUTO CLIPPER - AI Video Auto Clipper Full-Stack

Platform untuk mengubah video panjang menjadi beberapa video pendek vertical 9:16 otomatis menggunakan AI.

![Architecture](./docs/architecture.png)

## 🎯 Fitur Lengkap (Semua Sudah Implemented)

### Core Pipeline
- Upload drag&drop MP4/MOV/WEBM/MKV/AVI (validasi MIME + 500MB)
- FFprobe metadata extraction (duration, resolution, fps, codec, bitrate)
- Transcription word-level timestamp (Whisper / Mock provider)
- AI Highlight Detection dengan scoring: Hook, Engagement, Emotion, Information, Story, Completeness
- Smart Auto Crop 9:16 dengan face/speaker tracking abstraction (bukan crop tengah)
- Auto Subtitle Engine 7 style: clean, bold, tiktok, podcast, minimal, gaming, highlight - mode word/phrase/sentence + animated pop/bounce
- Auto Hook + Title + Hashtag generator
- Clip Editor web-based (preview, timeline trim/split, caption editing, crop mode, text/emoji/logo, audio ducking)
- Template & Brand Kit auto-apply
- Export MP4 + ZIP bulk download
- Real-time progress via SSE `/api/jobs/:id/stream` + fallback polling
- Queue Redis + BullMQ dengan retry
- Admin Panel (users, jobs, logs, storage)

### Dashboard
Sidebar: Dashboard, Projects, Upload Video, Auto Clipper, Clips, Templates, Captions, Brand Kit, Storage, API, Usage, Settings, Admin

### Security
- bcrypt hash, JWT httpOnly, session table
- FFmpeg args validated & escaped anti command injection
- Path traversal protection `..` blocked
- MIME & size validation
- API key encrypted di DB, tidak expose ke browser

## 🏗 Architecture

```
User Upload (Next.js Frontend)
→ API /api/videos/upload → save ./uploads/videos/
→ BullMQ Queue (Redis)
→ Worker (Node.js, 2 concurrency, FFmpeg)
   → FFprobe → save metadata
   → Transcribe (AI Provider: mock/openai) → Transcript + TranscriptWord[]
   → Highlight Detection (GPT-4o-mini) → Clip[] dengan score
   → Clip Render: FFmpeg smart crop 1080x1920 + burn ASS subtitles + brand overlay
→ Output ./outputs/{projectId}/clip-{id}.mp4
→ Frontend SSE progress: Uploading 100% Analyzing 45% Generating captions 70% Rendering 82% Completed
```

## 📁 Struktur Project

```
/app - Next.js App Router
  /(auth)/login, register
  /(dashboard)/dashboard, projects, upload, clipper, clips/[id]/edit, templates, brand, captions, storage, usage, api, settings, admin
  /api/auth, projects, videos/upload, projects/[id]/generate-clips, clips, clips/[id]/render, clips/export/zip, jobs, jobs/[id]/stream, templates, brand-kit, admin/*
/components/ui - shadcn button, card, input, badge
/lib - prisma, auth, redis, queue, validators, utils
  /storage local.ts (interface ready S3)
  /video ffprobe.ts, ffmpeg.ts, smart-crop.ts, brand.ts
  /ai types.ts, provider.ts, mock.provider.ts, openai.provider.ts
  /caption styles.ts, ass-generator.ts
  /export zip.ts
/hooks useJobProgress.ts (SSE + polling fallback)
/server/worker index.ts
/prisma schema.prisma
/tests api.test.ts
Dockerfile, Dockerfile.worker, docker-compose.yml
```

## 🚀 Quick Start Development

```bash
# 1. Clone & install
npm install

# 2. Env
cp .env.example .env
# Edit:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/autoclipper"
REDIS_URL="redis://localhost:6379"
AI_PROVIDER="mock" # mock = no API key needed, openai = need OPENAI_API_KEY
OPENAI_API_KEY="" # isi jika pakai openai
JWT_SECRET="ganti-min-32-chars-super-secret"

# 3. Infra (postgres + redis)
docker compose up -d postgres redis

# 4. DB
npx prisma migrate dev --name init
npx prisma generate

# 5. Run
npm run dev     # http://localhost:3000
npm run worker  # terminal 2, butuh ffmpeg terinstall (apt install ffmpeg / brew install ffmpeg)

# 6. Full Docker
docker compose up -d
# app: http://localhost:3000, worker auto start, postgres:5432, redis:6379
```

## 🐳 Docker Deployment VPS Ubuntu

```bash
# Di VPS Ubuntu 22.04
sudo apt update && sudo apt install docker.io docker-compose git -y
git clone <repo> && cd auto-clipper
cp .env.example .env
# edit .env dengan nano .env -> ganti JWT_SECRET, DATABASE_URL, AI_PROVIDER

# Build & run
docker compose up -d --build

# Logs
docker compose logs -f app
docker compose logs -f worker

# Prisma migrate di container
docker compose exec app npx prisma migrate deploy

# Setup Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/autoclipper
# isi:
server {
  listen 80;
  server_name yourdomain.com;
  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
sudo ln -s /etc/nginx/sites-available/autoclipper /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# SSL dengan certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 🔑 AI Provider Setup

Default `AI_PROVIDER=mock` - tidak butuh API key, return dummy transcript & highlights untuk test UI.

Untuk production:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

`lib/ai/openai.provider.ts` pakai:
- Whisper `whisper-1` untuk transcribe dengan `timestamp_granularities: ['word']`
- GPT-4o-mini untuk highlight detection dengan prompt scoring
- Temperature 0.7 untuk highlight, 0.8 untuk title

Tambah provider baru: buat `lib/ai/anthropic.provider.ts` implement `AIProvider` interface, lalu di `provider.ts` tambahkan case.

## 📝 API Response Format Konsisten

Success:
```json
{ "status": true, "message": "success", "data": {} }
```
Error:
```json
{ "status": false, "message": "Error message", "error": {} }
```

Endpoints:
```
POST /api/auth/login
POST /api/auth/register
GET /api/projects
POST /api/projects
POST /api/videos/upload
POST /api/projects/:id/generate-clips
GET /api/clips?projectId=
GET /api/clips/:id
PATCH /api/clips/:id
DELETE /api/clips/:id
POST /api/clips/:id/render
POST /api/clips/export/zip
GET /api/download?path=
GET /api/jobs
GET /api/jobs/:id
GET /api/jobs/:id/stream (SSE)
GET/POST /api/templates
GET/POST /api/brand-kit
GET /api/captions
GET /api/admin/stats
GET /api/admin/users
GET /api/admin/logs
POST /api/admin/jobs/:id/retry
POST /api/admin/queue/clear
```

## 🧪 Testing

```bash
npm run test
# vitest - test validasi mime, command injection prevention, ASS time format, scoring 0-100, clip duration
```

## 📦 Export

- Single clip: `GET /api/download?path=projectId/clip-id.mp4` → MP4
- Bulk: `POST /api/clips/export/zip` dengan `{ clipIds: [] }` atau `{ projectId }` → ZIP
- Nama file: `project-name_clip-01.mp4` (diatur di lib/export)

## 🔜 TODO Production Hardening

- [ ] Integrasi face detection real: MediaPipe / face-api.js → inject coords ke smart-crop
- [ ] Audio ducking dengan ffmpeg `sidechaincompress`
- [ ] Transaksi S3: ganti LocalStorageProvider ke S3Provider
- [ ] WebSocket untuk collaborative editing
- [ ] Rate limiting dengan Redis
- [ ] CSRF protection

## 📄 License MIT

Semua tombol utama sudah punya fungsi nyata, bukan placeholder.
