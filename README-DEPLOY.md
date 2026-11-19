# Kampung Amanah — Game Multiplayer 2D

Paket source code ini berisi aplikasi lengkap **Game Multiplayer 2D Kampung Amanah** (React + TypeScript + HTML5 Canvas + Express + WebSocket).

## Menjalankan Secara Lokal
Pastikan **Node.js 20+** sudah terpasang, lalu jalankan di folder hasil ekstrak ZIP:

```bash
npm install
npm run build
NODE_ENV=production npx tsx server.ts
```

Buka browser ke `http://localhost:3000`.

## Deploy ke Hosting (Node.js + WebSocket)
Karena game mendukung multiplayer real-time lewat WebSocket (`/ws/game`), gunakan hosting yang mendukung **Node.js + WebSocket**, seperti:
- **Railway** / **Render** / **Fly.io** / **Google Cloud Run** / **VPS**

> **PENTING — jangan deploy ke Vercel static saja.** Vercel hanya menayangkan file frontend (`dist/`) dan TIDAK menjalankan `server.ts`, sehingga `/ws/game` mengembalikan 404, game mentok di "Menghubungkan ulang..." dan karakter tidak pernah spawn. Server harus jalan di hosting Node.js.

Pengaturan umum saat deploy:
- **Build Command**: `npm install --legacy-peer-deps && npm run build` (`--legacy-peer-deps` diperlukan karena konflik peer dependency esbuild vs vite)
- **Start Command**: `NODE_ENV=production npx tsx server.ts`
- **Port**: server membaca `process.env.PORT` (fallback 3000) — biarkan hosting yang mengatur `PORT`.

### Deploy ke Render (gratis, paling mudah)
1. Push repo ini ke GitHub.
2. Di Render: **New +** > **Blueprint** > pilih repo ini (file `render.yaml` sudah disiapkan).
3. Render membuat Web Service dan memberikan URL publik (mis. `https://kampung-amanah-game.onrender.com`).
4. Buka URL itu — game dan server WebSocket jalan di alamat yang sama, jadi tidak perlu mengubah kode client.
5. Catatan: paket gratis Render tidur setelah 15 menit tanpa trafik dan bangun lagi saat ada yang membuka (butuh beberapa detik). Data pemain (profil/rumah) tersimpan di `data/` dan akan hilang saat service di-restart — wajar untuk tahap awal.

## Variabel Lingkungan Opsional (`.env`)
- `KAMPUNG_IG_USERNAME` — default `kampung.amanah`
- `KAMPUNG_IG_FOLLOWERS` — angka followers sementara jika belum ada token (contoh: `259`)
- `IG_ACCESS_TOKEN` & `IG_USER_ID` — opsional, jika sudah punya token Instagram Graph API untuk sinkron otomatis followers `@kampung.amanah`.
