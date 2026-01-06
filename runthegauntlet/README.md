# RunTheGauntlet Scraper API

RunTheGauntlet scraper API built with Express.js, Axios, and Cheerio. Runs on port 3000.

## Installation

```bash
npm install
```

## Usage

```bash
npm start
```

Server will run on `http://localhost:3000`

## Endpoints

### GET /
API information and available endpoints

### GET /home
Get latest videos from homepage

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "title": "Video title",
      "slug": "video-slug",
      "url": "https://runthegauntlet.org/view/video-slug",
      "thumbnail": "https://runthegauntlet.org/media/images/video.jpg",
      "description": "Video description",
      "date": "Jun.17",
      "duration": "0:10",
      "views": "4868011"
    }
  ]
}
```

### GET /browse/:page?
Browse all videos with pagination (page defaults to 1)

**Response:**
```json
{
  "status": "success",
  "currentPage": 1,
  "hasNextPage": true,
  "data": [...]
}
```

### GET /video/:slug
Get video details and direct video source URL

**Response:**
```json
{
  "status": "success",
  "data": {
    "title": "Video title",
    "slug": "video-slug",
    "description": "Video description",
    "videoUrl": "https://rtgvideo.com/RTG/video.mp4",
    "duration": "0:10",
    "views": "4868011",
    "pageUrl": "https://runthegauntlet.org/view/video-slug"
  }
}
```

### GET /gauntlet
Get gauntlet challenge levels

**Response:**
```json
{
  "status": "success",
  "data": {
    "title": "Gauntlet title",
    "description": "Gauntlet description",
    "totalLevels": 20,
    "levels": [
      {
        "level": 1,
        "title": "Level title",
        "slug": "level-slug",
        "url": "https://runthegauntlet.org/view/level-slug"
      }
    ]
  }
}
```

### GET /cringe/:page?
Get cringe category videos with pagination

**Response:**
```json
{
  "status": "success",
  "category": "cringe",
  "currentPage": 1,
  "hasNextPage": true,
  "data": [...]
}
```

### GET /search/:query
Search videos by title

**Response:**
```json
{
  "status": "success",
  "query": "search term",
  "totalResults": 5,
  "data": [...]
}
```

## Error Responses

```json
{
  "status": "error",
  "message": "Error description"
}
```

## Dependencies

- express: ^4.18.2
- axios: ^1.6.0
- cheerio: ^1.0.0-rc.12
