# Anichin Scraper

Scraper API untuk site `https://anichin.watch/` (sebelumnya `https://anichin.cafe/`).

## Installation

```bash
npm install
```

## Usage

```bash
node index.js
```

Server running on `http://localhost:3000`

## Endpoints

### 1. Home
Menampilkan update terbaru donghua.
```http
GET /anichin/home
```

### 2. Donghua List
Menampilkan daftar donghua (paginated).
```http
GET /anichin/donghua?page=1
```

### 3. Detail Donghua
Info lengkap dan list episode.
```http
GET /anichin/anime/:slug
```
Example: `/anichin/anime/battle-through-the-heavens-season-5`

### 4. Episode Stream
Mendapatkan link streaming iframe (termasuk decode server list).
```http
GET /anichin/episode/:slug
```
Example: `/anichin/episode/battle-through-the-heavens-season-5-episode-180-subtitle-indonesia`

### 5. Schedule
Jadwal rilis harian.
```http
GET /anichin/schedule
```

### 6. Genres
Daftar genre.
```http
GET /anichin/genres
```

### 7. Search
Pencarian donghua.
```http
GET /anichin/search?query=KEYWORD
```

## Author
Yemobyte
