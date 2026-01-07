# X/Twitter Scraper

A Node.js scraper for X (formerly Twitter) that extracts tweet metadata and media without requiring login credentials, utilizing Puppeteer for guest access.

## Endpoints

### 1. Get Tweet Details
Fetches content, statistics, and media from a specific Tweet URL.

- **URL:** `/api/twitter`
- **Method:** `GET`
- **Query Params:**
  - `url` (Required): The full X/Twitter status URL.
- **Example:** `/api/twitter?url=https://x.com/Dexerto/status/2008505566176702484`
- **Success Response:**
  ```json
  {
    "status": true,
    "creator": "yemobyte",
    "result": {
      "account_name": "Dexerto",
      "username": "@Dexerto",
      "text": "Tweet content text...",
      "stats": {
        "views": "3.9M",
        "likes": "181K",
        "replies": "1.7K",
        "reposts": "12K"
      },
      "media_type": "image",
      "media": [
        "https://pbs.twimg.com/media/..."
      ]
    }
  }
  ```

## Installation & Usage

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start Server:**
    ```bash
    node index.js
    ```
    The server will start on port `3000`.

