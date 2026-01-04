# X (Twitter) Scraper

Professional X.com Scraper API by **Yemo**.

## Features
- **Session-Based**: Uses cookies extracted from the active session (`cookies.json`) to access content.
- **Media Extraction**: Detects videos and images in posts.
- **Puppeteer-Real-Browser**: Bypasses bot detection.

## Endpoints

### Download/Scrape Post
`GET /x/download?url=https://x.com/...`
Returns the text and media links of the post.

**Response:**
```json
{
  "status": true,
  "author": "Yemo",
  "data": {
    "text": "Post content...",
    "media": [ "https://video.twimg.com/..." ]
  }
}
```

## Setup
1. **Cookies**: The scraper relies on `cookies.json`. Ensure it is populated with valid X.com cookies (especially `ct0`, `auth_token`, `twid`).
2. **Install**:
   ```bash
   npm install
   node index.js
   ```

## License
MIT
