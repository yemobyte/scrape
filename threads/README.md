# threads-scraper

A simple Threads scraper to extract post text, media, and stats.

## Usage

```bash
npm start
```

## Endpoint

**GET** `/api/threads?url=<post_url>`

### Response Example

```json
{
  "status": true,
  "creator": "yemobyte",
  "result": {
    "account_name": "Mark Zuckerberg",
    "username": "zuck",
    "text": "Post text here...",
    "stats": {
      "likes": "316K",
      "replies": "59K"
    },
    "media_type": "image",
    "media": [
      "https://..."
    ]
  }
}
```
