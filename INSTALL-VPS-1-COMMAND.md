# AUTO CLIPPER VPS PREMIUM - 1 COMMAND INSTALLER

## 🚀 Install di Ubuntu 22.04/24.04 Fresh VPS

### Opsi A: Domain + Auto SSL (Recommended)
```bash
curl -fsSL https://raw.githubusercontent.com/USERNAME/auto-clipper/main/install.sh | sudo bash -s -- --domain clipper.domainkamu.com --email admin@domainkamu.com
```

### Opsi B: IP saja (HTTP)
```bash
git clone https://github.com/USERNAME/auto-clipper.git
cd auto-clipper
sudo chmod +x install.sh
sudo ./install.sh
```

### Opsi C: Makefile
```bash
git clone https://github.com/USERNAME/auto-clipper.git
cd auto-clipper
sudo make install
```

## Setelah Install
URL: https://clipper.domainkamu.com atau http://IP:3000
Admin: admin@autoclipper.local / Admin123!
Cek: autoclipper status
Logs: autoclipper logs
Update: autoclipper update
Backup: autoclipper backup

## Fix nama folder jika extract di Windows
Folder _id_ -> [id]
Folder _dashboard_ -> (dashboard)
Folder _auth_ -> (auth)

Jalankan fix-names.bat atau manual rename.

## Fitur Premium Pillar 1 Included
- lib/ai/viral-score.ts - Viral Probability 0-100% + Retention Curve
- lib/ai/hook-dna.ts - 10 hook variants
- lib/caption/emoji-sfx.ts - Auto emoji, SFX, zoom, shake
- lib/video/auto-effects.ts
- Prisma Clip: viralProbability, retentionCurve, hookVariants, autoEffects
