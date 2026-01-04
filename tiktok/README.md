# TikTok Scraper

Professional TikTok Downloader and Scraper API by **Yemobyte**.

## Features
- **No Watermark**: Download HD videos without watermark.
- **Full Metadata**: Extracts plays, likes, comments, shares, author info, and music.
- **Slide Support**: Handles image slideshows gracefully.

## Endpoints

### Download Video
`GET /tiktok/download?url=https://www.tiktok.com/...`
Returns detailed video information and download links.

**Response:**
```json
{
  "status": true,
  "author": "Yemobyte",
  "result": {
    "title": "Caption...",
    "author": { ... },
    "stats": { "plays": 1234, ... },
    "video": {
      "no_watermark": "https://...",
      "no_watermark_hd": "https://..."
    }
  }
}
```

## Installation
```bash
npm install
node index.js
```
Runs on Port 3000.
