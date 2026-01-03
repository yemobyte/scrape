# MEGA.nz Scraper

API untuk mengambil informasi dan download file dari MEGA.nz menggunakan `megajs`.

## Installation

```bash
npm install
```

## Usage

```bash
node index.js
```

Server berjalan di `http://localhost:3000`

## API Endpoints

### 1. Get File Info

```
GET /mega?url=MEGA_URL
```

Example output:
```json
{
  "status": true,
  "data": {
    "filename": "MediaFire_-_Getting_Started.pdf",
    "size": 123456,
    "size_formatted": "0.12 MB",
    "type": "application/pdf",
    "url": "...",
    "download_api": "http://localhost:3000/mega/download?url=..."
  }
}
```

### 2. Download File (Stream)

```
GET /mega/download?url=MEGA_URL
```
Langsung mengunduh file.

## Author

Yemobyte
