# YouTube Downloader Service

Based on custom `youtube-dl-exec` implementation.

## Features
- **Video Download**: Merges Video+Audio using ffmpeg.
- **Audio Download**: Extracts MP3.
- **Buffer Output**: Processes file in temp directory and returns buffer.

## Endpoints

### Get JSON (Base64)
```http
GET /youtube/download?url=...&quality=4
```
Returns metadata + Base64 encoded file content.

### Stream File
```http
GET /youtube/stream?url=...&quality=4
```
Directly downloads the file `video.mp4` or `audio.mp3`.

## Quality Map
| Index | Quality |
|---|---|
| 1 | 144p |
| 2 | 360p |
| 3 | 480p |
| 4 | 720p |
| 5 | 1080p |
| 8 | Audio (MP3) |

## Requirements
- Node.js
- `ffmpeg` (Handled by `ffmpeg-static`)
- Python (for `youtube-dl` runtime if needed, though `yt-dlp` binary usually self-contained)

## Installation
```bash
npm install
node index.js
```
Runs on Port 3000.
