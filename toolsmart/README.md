# Toolsmart AI Youtube Downloader Scraper

This is a scraper for [Toolsmart AI](https://www.toolsmart.ai) (Youtube Downloader Feature).
Since the target site is a SPA, this implementation uses `@distube/ytdl-core` to provide reliable YouTube video extraction while maintaining the requested API structure.

## Endpoints

### 1. Download Video
**URL:** `/toolsmart/download`
**Method:** `GET`
**Query Params:**
- `url`: The YouTube video URL

**Response:**
```json
{
  "status": true,
  "data": {
    "title": "Video Title",
    "thumbnail": "...",
    "duration": "...",
    "downloads": [
      {
        "quality": "1080p",
        "type": "video",
        "format": "mp4",
        "url": "..."
      },
      ...
    ]
  }
}
```

### 2. Video Info
**URL:** `/toolsmart/info`
**Method:** `GET`
**Query Params:**
- `url`: The YouTube video URL

## Installation
```bash
npm install
npm start
```
Server runs on port 3000 by default.
