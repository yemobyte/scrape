# Toolsmart All-in-One Social Media Scraper

Profesional Scraper API yang mencakup seluruh fitur Social Media Tools dari [Toolsmart AI](https://www.toolsmart.ai).

Project ini dibangun menggunakan Node.js dan menyediakan endpoint untuk mengunduh konten dari berbagai platform sosial media populer.

## Fitur Utama

- **YouTube Video Downloader**: Mendapatkan link download video YouTube dalam berbagai resolusi (HD/4K).
- **YouTube to MP3**: Mengonversi/mendapatkan audio MP3 dari video YouTube.
- **YouTube Thumbnail**: Mengunduh thumbnail video YouTube (kualitas max).
- **Instagram Downloader**: Mengunduh Foto, Video, Reels, dan IGTV.
- **Facebook Video Downloader**: Mendapatkan video dari Facebook (SD & HD).
- **Pinterest Video Downloader**: Mengunduh video dari Pinterest.

## Prasyarat

- Node.js (v14 ke atas)
- Koneksi Internet Stabil

## Instalasi

1. Clone repository ini atau copy folder `toolsmart`.
2. Install dependencies:
   ```bash
   npm install
   ```

## Menjalankan Server

```bash
node index.js
```
Server akan berjalan di port `3000`.

## Dokumentasi API

### 1. YouTube Video
Mengambil link video MP4 dari YouTube.

- **Endpoint**: `/toolsmart/youtube/video`
- **Parameter**: `url` (Link YouTube)
- **Contoh**: `http://localhost:3000/toolsmart/youtube/video?url=https://youtu.be/xxx`

### 2. YouTube to MP3
Mengambil link audio/MP3 dari YouTube.

- **Endpoint**: `/toolsmart/youtube/mp3`
- **Parameter**: `url` (Link YouTube)
- **Contoh**: `http://localhost:3000/toolsmart/youtube/mp3?url=https://youtu.be/xxx`

### 3. YouTube Thumbnail
Mengambil gambar thumbnail dari YouTube.

- **Endpoint**: `/toolsmart/youtube/thumbnail`
- **Parameter**: `url` (Link YouTube)

### 4. Instagram
Mengambil media dari post Instagram (Reels/Foto/Video).

- **Endpoint**: `/toolsmart/instagram`
- **Parameter**: `url` (Link Instagram)

### 5. Facebook
Mengambil video dari Facebook (Public).

- **Endpoint**: `/toolsmart/facebook`
- **Parameter**: `url` (Link Facebook Watch/Video)

### 6. Pinterest
Mengambil data video dari Pinterest.

- **Endpoint**: `/toolsmart/pinterest`
- **Parameter**: `url` (Link Pinterest, support `pin.it`)

## Struktur Response (Contoh)

```json
{
  "status": true,
  "data": {
    "title": "Judul Konten",
    "thumbnail": "https://example.com/image.jpg",
    "downloads": [
      {
        "quality": "1080p",
        "format": "mp4",
        "url": "https://googlevideo.com/..."
      }
    ]
  }
}
```

## Lisensi
MIT License. Dibuat sebagai bagian dari koleksi Scraper.
