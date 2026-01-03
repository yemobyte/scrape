# Animedao (9anime) Scraper

Scraper API untuk site `https://9anime.me.uk/` (Animedao wrapper). Fully compatible dengan layout Otakudesu.

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
Menampilkan anime rilis terbaru dan populer.
```http
GET /animedao/home
```

### 2. Movies
Menampilkan daftar film anime terbaru.
```http
GET /animedao/movies?page=1
```

### 3. Schedule
Menampilkan jadwal rilis anime per hari.
```http
GET /animedao/schedule
```

### 4. Genres (Kategori)
Menampilkan daftar genre.
```http
GET /animedao/genres
```

### 5. Anime by Genre
```http
GET /animedao/genre/:slug?page=1
```
Example: `/animedao/genre/action`

### 6. Anime Detail
Detail lengkap anime termasuk sinopsis dan list episode.
```http
GET /animedao/anime/:slug
```
Example: `/animedao/anime/hd-one-piece`

### 7. Episode Stream
Mendapatkan link streaming iframe.
```http
GET /animedao/episode/:slug
```
Example: `/animedao/episode/one-piece-episode-1-english-subbed`

### 8. Search
Pencarian anime.
```http
GET /animedao/search?query=KEYWORD
```

## Author
Yemobyte
