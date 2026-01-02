# Otakudesu Unofficial API

A simple Express.js based scraper/API for Otakudesu.

## Installation

```bash
npm install
node index.js
```

## Endpoints

### 1. Home
- **URL**: `/anime/home`
- **Description**: Get latest anime updates.

### 2. Search Anime (Cari Anime)
- **URL**: `/anime/search/:keyword`
- **Example**: `/anime/search/one%20piece`
- **Description**: Search for anime by title.

### 3. Anime Detail
- **URL**: `/anime/anime/:slug`
- **Example**: `/anime/anime/one-piece-sub-indo/`
- **Description**: Get detailed information and list of episodes.

### 4. Episode Detail (Detail Episode)
- **URL**: `/anime/episode/:slug`
- **Example**: `/anime/episode/one-piece-episode-1065-sub-indo/`
- **Description**: Get episode stream links (embeds) and download links.
- **Returns**: List of servers (with `serverId`) and download links.

### 5. Stream URL (Stream Server)
- **URL**: `/anime/server/:serverId`
- **Example**: `/anime/server/123456-0-360p`
- **Description**: Get the actual embed URL for a specific server.
- **Parameters**: `serverId` is obtained from the Episode Detail endpoint.
- **Returns**: 
  ```json
  {
    "status": true,
    "data": {
      "url": "https://desustream.info/...",
      "quality": "360p"
    }
  }
  ```

### 6. Batch Download (Download Batch)
- **URL**: `/anime/batch/:slug`
- **Example**: `/anime/batch/one-piece-batch/`
- **Description**: Get batch download links if available.

## Notes
- Endpoints rely on scraping HTML, so they might break if the site layout changes.
- The `serverId` format is `id-index-quality`.
