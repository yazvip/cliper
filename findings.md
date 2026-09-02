# Findings

## Project flow
- Next.js app menerima upload, menyimpan media ke bind mount `uploads`, membuat job BullMQ di Redis, lalu worker menjalankan FFprobe/AI/FFmpeg dan menulis hasil ke `outputs`.
- Production stack adalah PostgreSQL + Redis + app + worker, dengan Caddy opsional. App/worker memakai `.env`; Caddy belum memakai `env_file`, sehingga `DOMAIN`/`EMAIL` tidak otomatis tersedia di container.
- Prisma migration dijalankan entrypoint app, tetapi fallback `prisma db push --accept-data-loss` berbahaya untuk produksi.

## Installer audit
- `install.sh` adalah kandidat installer utama, tetapi tidak memvalidasi root/Ubuntu, tidak menjamin Docker Compose plugin terpasang, menghapus `node_modules`/`.next` dan menjalankan `npm install` di host, serta meng-overwrite schema Prisma jika validate gagal.
- Installer memakai password admin default `Admin123!`, menulis password admin ke output, dan menyisipkan input email/password langsung ke JavaScript shell container (rawan quote/injection dan rahasia bocor).
- Installer membuka port 3000 walau production menyediakan reverse proxy; health check hanya warning sehingga instalasi dapat selesai dalam kondisi rusak.
- `down` sebelum deploy memutus layanan; `build --no-cache` selalu lambat dan tidak ada lock untuk mencegah dua installer berjalan bersamaan.
- Redis production healthcheck tidak mengirim password, sehingga healthcheck dapat gagal saat `REDIS_PASSWORD` diisi.
- Compose production tidak memetakan `./tmp` pada worker dan Caddy tidak menerima variabel domain/email.

## Production readiness
- Migrations harus fail-closed (`migrate deploy` saja); schema drift perlu dilaporkan, bukan diperbaiki dengan `db push --accept-data-loss`.
- Installer perlu idempotent: preserve `.env`, generate secret hanya saat kosong, membuat direktori, validasi compose config, menunggu health, dan gagal jika app/worker tidak sehat.
