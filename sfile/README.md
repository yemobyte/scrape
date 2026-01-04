# Sfile Scraper

Professional Sfile.mobi Scraper API by **Yemo**.

## Features
- **Search**: Advanced search for files on Sfile.
- **Download Info**: Extract secure download links and file metadata.
- **Stream**: Stream files directly through the API, bypassing intermediate pages.

## Endpoints

### 1. Search Files
`GET /sfile/search?q=query`
Returns a list of files matching the query.

**Response:**
```json
{
  "status": true,
  "author": "Yemo",
  "data": [
    { "title": "file.zip", "url": "...", "meta": "10MB" }
  ]
}
```

### 2. Get Download Info
`GET /sfile/download?url=https://sfile.mobi/...`
Returns file details and a generated stream URL.

**Response:**
```json
{
  "status": true,
  "author": "Yemo",
  "data": {
    "filename": "file.zip",
    "size": "10MB",
    "original_url": "...",
    "download_page": "...",
    "stream_url": "http://localhost:3000/sfile/stream?url=..."
  }
}
```

### 3. Stream File
`GET /sfile/stream?url=https://sfile.mobi/...`
Directly downloads the file to your device.

## Installation
```bash
npm install
node index.js
```
Runs on Port 3000.
