# SSSTik Scraper API

An unofficial REST API for SSSTik (TikTok Downloader), built with Express.js and Cheerio.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yemobyte/scrape.git
    cd scrape/ssstik
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the server:**
    ```bash
    node index.js
    ```
    The server will start at `http://localhost:3000`.

## API Endpoints

### 1. Download Video
Download TikTok video without watermark, with watermark, or as MP3.

-   **Method:** `GET`
-   **URL:** `/download`
-   **Query Parameters:**
    -   `url`: The TikTok video URL (e.g., `https://vt.tiktok.com/ZS5ArkrWc/`)

-   **Response Example:**
    ```json
    {
      "status": true,
      "data": {
        "author": {
          "name": "KisheKun",
          "avatar": "https://tikcdn.io/ssstik/a/..."
        },
        "description": "sopan sopan🗿 #meme #memeviral ...",
        "stats": {
          "likes": "113",
          "comments": "29",
          "shares": "2"
        },
        "downloads": [
          {
            "type": "Without watermark",
            "url": "https://tikcdn.io/ssstik/75909803611112..."
          },
          {
            "type": "Download MP3",
            "url": "https://tikcdn.io/ssstik/m/..."
          }
        ]
      }
    }
    ```
