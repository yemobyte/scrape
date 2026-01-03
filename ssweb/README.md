# SSWeb Scraper

API Wrapper simpel untuk mengambil screenshot website menggunakan layanan yemobyte-sc.

## Requirements

- Node.js
- NPM

## Installation

```bash
npm install
```

## Usage

```bash
node index.js
```

Server akan berjalan di `http://localhost:3000`

## API Endpoints

### 1. Get Screenshot (Image Buffer)

Mengembalikan gambar langsung (image/png atau image/jpeg).

```
GET /ssweb
```

**Query Parameters:**
- `url` (Required): URL website yang ingin di-screenshot.
- `device` (Optional): Tipe device (`desktop`, `iphone-14`, `pixel-7`). Default: `desktop`.
- `type` (Optional): Format gambar (`png`, `jpeg`). Default: `png`.

**Example:**
```
http://localhost:3000/ssweb?url=https://google.com&device=iphone-14
```

### 2. Get Screenshot (JSON/Base64)

Mengembalikan response JSON dengan gambar dalam format base64.

```
GET /ssweb/json
```

**Query Parameters:** Same as above.

**Example Response:**
```json
{
  "status": true,
  "data": {
    "url": "https://google.com",
    "device": "iphone-14",
    "type": "png",
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA..."
  }
}
```

## Supported Devices

- `desktop`
- `iphone-14`
- `pixel-7`
- `custom`

## Author

Yemobyte
