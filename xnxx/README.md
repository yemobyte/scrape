# XNXX Scraper API

A powerful XNXX scraper using **Puppeteer Real Browser** to bypass restrictions and extract high-quality stream URLs.
Created by **Yemobyte**.

## Features
- **Home/Latest**: Get latest videos.
- **Search**: Search for videos by keyword.
- **Categories**: List available categories.
- **Detail**: Extract **Low**, **High**, and **HLS** stream URLs directly.

## Endpoints

### 1. Home
`GET /`
Returns latest videos.

### 2. Search
`GET /search?q=mom`
Returns search results.

### 3. Detail (Stream)
`GET /detail?url=https://www.xnxx.com/video-xyz/title`
Returns metadata and stream links (MP4/HLS).

### 4. Categories
`GET /categories`
Returns list of tags/categories.

## Setup
1. `npm install`
2. `node index.js`
