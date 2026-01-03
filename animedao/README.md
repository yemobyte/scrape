# Animedao (9anime) Scraper

Scraper API untuk `https://animedao.site/9anime/` (Source: `https://9anime.me.uk/`).

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
```GET /animedao/home```

### 2. Anime Detail
```GET /animedao/anime/:slug```
Example: `/animedao/anime/hd-one-piece` (slug dari home link)

### 3. Episode Stream
```GET /animedao/episode/:slug```
Example: `/animedao/episode/one-piece-episode-1-english-subbed`

### 4. Search
```GET /animedao/search?query=KEYWORD```

## Author
Yemobyte
