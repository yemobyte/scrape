# Scraper Otakudesu

Scraper untuk mengambil data dari Otakudesu.

## Cara Setup

1. Install dependensi:
   ```bash
   npm install
   ```

2. Jalankan server:
   ```bash
   node index.js
   ```

3. Server akan berjalan di `http://localhost:3000`.

## Endpoint

- `GET /anime/home` - Halaman Utama
- `GET /anime/schedule` - Jadwal Rilis
- `GET /anime/anime/:slug` - Detail Anime
- `GET /anime/complete-anime` - Anime Tamat
- `GET /anime/ongoing-anime` - Anime Ongoing
- `GET /anime/genre` - Daftar Genre
- `GET /anime/genre/:slug` - Anime per Genre
- `GET /anime/episode/:slug` - Detail Episode
- `GET /anime/search/:keyword` - Cari Anime
- `GET /anime/batch/:slug` - Download Batch
- `GET /anime/server/:serverId` - Stream URL
- `GET /anime/unlimited` - Semua Anime
