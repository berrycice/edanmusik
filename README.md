# MUSIK — Personal Music Streaming Library

Aplikasi personal music streaming library berbasis PWA, React, Express, dan Cloudflare R2 / SQLite.

## Fitur Utama
- **Beranda, Tambah, Library**: Navigasi 3 area utama dengan Bottom Navigation Bar.
- **Single Audio Instance & Background Playback**: Mendukung kontrol media sistem operasi (Media Session API) pada Android/iOS.
- **PWA**: Siap dipasang di layar utama (Add to Home Screen) pada Android dan iOS.
- **Cloudflare R2 Storage**: Penyimpanan berkas audio dan sampul gambar dengan URL aman.
- **Ekstraksi & Konversi FFmpeg**: Pemrosesan audio, standardisasi MP3, dan ekstraksi sampul otomatis.

## Menjalankan Proyek Secara Lokal

### Prasyarat
- Node.js 20+
- **FFmpeg & FFprobe**: terpasang di sistem:
  - Linux: `sudo apt install ffmpeg`
  - macOS: `brew install ffmpeg`
  - Windows: download dari ffmpeg.org dan masukkan ke PATH
- **yt-dlp** (opsional untuk download dari YouTube):
  - Linux/Mac: binary sudah disediakan di `./bin/yt-dlp` atau instal global via `pip install yt-dlp` / `brew install yt-dlp`
  - Windows: download `yt-dlp.exe` dan taruh di folder `./bin/` atau pasang ke PATH.

### Langkah Instalasi
1. Ekstrak file zip ini ke folder komputer Anda.
2. Salin `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
3. Pasang dependensi:
   ```bash
   npm install
   ```
4. Jalankan mode pengembangan:
   ```bash
   npm run dev
   ```
5. Buka peramban di `http://localhost:3000`.

### Build Produksi
```bash
npm run build
npm start
```
