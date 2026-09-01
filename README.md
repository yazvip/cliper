# AUTO CLIPPER - AI Video Clipper

Platform untuk mengubah video panjang menjadi clip pendek vertical otomatis dengan AI.

## Tech Stack
- Next.js 14, TypeScript, Tailwind, shadcn/ui
- PostgreSQL + Prisma
- Redis + BullMQ
- FFmpeg + FFprobe
- Modular AI Provider (Mock, OpenAI, Anthropic, Groq)

## Architecture
User Upload -> FFprobe metadata -> Queue -> Transcribe (Whisper) -> AI Highlight Detection (scoring Hook/Engagement/Emotion/Info) -> FFmpeg Smart Crop 9:16 -> Auto Captions -> Brand Kit -> Export

## Quick Start
1. Clone & install
```bash
npm install
```

2. Setup env
```bash
cp .env.example .env
# edit DATABASE_URL, REDIS_URL, AI_PROVIDER, OPENAI_API_KEY jika pakai openai
```

3. Start infra
```bash
docker compose up -d postgres redis
```

4. Prisma
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. Dev server
```bash
npm run dev # frontend at http://localhost:3000
npm run worker # in separate terminal, video worker (needs ffmpeg installed)
```

6. Docker full stack
```bash
docker compose up -d
```

## API Endpoints
POST /api/auth/register
POST /api/auth/login
GET /api/projects
POST /api/projects
POST /api/videos/upload
POST /api/projects/:id/generate-clips
GET /api/clips?projectId=xxx
GET /api/jobs/:id

## Folder Structure
/app - Next.js app router (landing, auth, dashboard, api)
/components/ui - shadcn components
/lib - prisma, auth, redis, queue, storage, ai, video, utils
/server/worker - BullMQ worker (ffmpeg heavy jobs)
/prisma - schema
/uploads, /outputs - local storage (gitignored)
/public - static

## Security Notes
- Password bcrypt hash
- Session JWT httpOnly cookie
- FFmpeg args validated & escaped, no direct user input to command
- MIME & size validation
- Path traversal protection
- API key encrypted in DB, never exposed to browser

## Development AI Provider
Default AI_PROVIDER=mock - no API key needed, returns dummy transcript & highlights for UI testing.
Set AI_PROVIDER=openai and OPENAI_API_KEY to use real Whisper + GPT-4o-mini for highlight detection.

## Smart Crop
Current implementation uses center intelligent crop (1080x1920). For face/speaker tracking, extend lib/video/ffmpeg.ts with face detection coords from AI (e.g., OpenCV or cloud vision) and pass x,y to crop filter.

## TODO Next Steps
- Implement clip editor (timeline, trim, subtitle style, brand overlay)
- Real-time progress via SSE/WebSocket (currently polling /api/jobs/:id)
- Template & Brand Kit CRUD UI
- Export ZIP & MP4 download route
- Admin panel
