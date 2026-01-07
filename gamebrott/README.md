# Gamebrott Scraper

This is a Node.js scraper for [Gamebrott](https://gamebrott.com/), providing news updates and detailed article content via a JSON API.

## 🚀 Endpoints

### 1. Get Latest News
Fetches the latest news articles from the Gamebrott "Berita" section.

- **URL:** `/api/berita`
- **Method:** `GET`
- **Success Response:**
  ```json
  {
    "status": true,
    "creator": "yemobyte",
    "data": [
      {
        "title": "Article Title",
        "link": "https://gamebrott.com/article-url",
        "image": "https://gamebrott.com/image.jpg",
        "date": "2 hours ago"
      }
    ]
  }
  ```

### 2. Get Article Detail
Fetches the full content of a specific article.

- **URL:** `/api/detail`
- **Method:** `GET`
- **Query Params:**
  - `url` (Required): The full URL of the Gamebrott article.
- **Example:** `/api/detail?url=https://gamebrott.com/example-article`
- **Success Response:**
  ```json
  {
    "status": true,
    "creator": "yemobyte",
    "data": {
      "title": "Article Title",
      "image": "https://gamebrott.com/full-image.jpg",
      "author": "Author Name",
      "date": "Date String",
      "content": "Full text content of the article..."
    }
  }
  ```

## 🛠️ Installation & Usage

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start Server:**
    ```bash
    node index.js
    ```
    The server will start on port `3000`.

