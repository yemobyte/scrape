# Toolsmart YouTube Scraper

Profesional Scraper API untuk **Toolsmart AI** (Khusus YouTube Features).

## Fitur Utama

- **YouTube Video Downloader**: Mendapatkan link download video YouTube (MP4).
- **YouTube to MP3**: Mengonversi/mendapatkan audio MP3.
- **YouTube Thumbnail**: Mengunduh thumbnail kualitas tinggi.

## Prasyarat

- Node.js (v14+)
- **yt-dlp** (Wajib terinstall di sistem / VPS)

## Instalasi

1. Install dependencies:
   ```bash
   npm install
   ```

2. Jalankan Server:
   ```bash
   node index.js
   ```
   Server berjalan di port `3000`.

## Dokumentasi API

### 1. YouTube Video
Mengambil link video MP4.

- **Endpoint**: `/toolsmart/youtube/video`
- **Parameter**: `url`
- **Contoh**: `/toolsmart/youtube/video?url=https://youtu.be/xxx`

### 2. YouTube to MP3
Mengambil link audio/MP3.

- **Endpoint**: `/toolsmart/youtube/mp3`
- **Parameter**: `url`

### 3. YouTube Thumbnail
Mengambil gambar thumbnail.

- **Endpoint**: `/toolsmart/youtube/thumbnail`
- **Parameter**: `url`

## Struktur Response

```json
{
  "status": true,
  "data": {
    "title": "Judul Video",
    "thumbnail": "...",
    "downloads": [
      {
        "quality": "720p",
        "format": "mp4",
        "url": "..."
      }
    ]
  }
}
```

## Lisensi
MIT License.
