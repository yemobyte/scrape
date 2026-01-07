# Gamebrott Scraper

A Node.js scraper for Gamebrott.com to extract news lists and article details.

## Usage

```bash
npm start
```

## Endpoints

### 1. Get News List
Fetches the latest news from the Gamebrott news news section.

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
        "link": "https://gamebrott.com/...",
        "image": "https://...",
        "date": "Date String"
      }
    ]
  }
  ```

### 2. Get Article Detail
Fetches the full content of a specific article.

- **URL:** `/api/detail`
- **Method:** `GET`
- **Query Params:**
  - `url` (Required): The full Gamebrott article URL.
- **Example:** `/api/detail?url=https://gamebrott.com/judul-berita`
- **Success Response:**
  ```json
  {
    "status": true,
    "creator": "yemobyte",
    "data": {
      "title": "Article Title",
      "image": "https://...",
      "author": "Author Name",
      "date": "Date String",
      "content": "Full article content..."
    }
  }
  ```
