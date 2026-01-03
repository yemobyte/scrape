# MediaFire Scraper

MediaFire file information scraper API built with Express.js, Axios, and Cheerio.

## Installation

```bash
npm install express axios cheerio cors
```

## Usage

```bash
node index.js
```

Server will run on `http://localhost:3000`

## API Endpoints

### 1. Get file info by ID
```
GET /mediafire/:id
```

Example:
```
http://localhost:3000/mediafire/abc123xyz
```

### 2. Get file info by full URL
```
GET /mediafire/url?url=MEDIAFIRE_URL
```

Example:
```
http://localhost:3000/mediafire/url?url=https://www.mediafire.com/file/abc123xyz/filename.zip
```

## Response Format

```json
{
  "status": true,
  "data": {
    "filename": "example.zip",
    "filesize": "10 MB",
    "uploadDate": "2026-01-03",
    "downloadLink": "https://download1234.mediafire.com/..."
  }
}
```

## Error Response

```json
{
  "status": false,
  "message": "Error message"
}
```

## Author

Yemobyte
