const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

/* Initialize Express */
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.set('json spaces', 2);

/* Helper: Execute yt-dlp */
const runYtDlp = (url) => {
    return new Promise((resolve, reject) => {
        const command = `yt-dlp -J --no-playlist --quiet "${url}"`;
        exec(command, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
            if (error) {
                return reject(stderr || error.message);
            }
            try {
                const data = JSON.parse(stdout);
                resolve(data);
            } catch (e) {
                reject('Failed to parse yt-dlp output');
            }
        });
    });
};

/* Root Endpoint */
app.get('/', (req, res) => {
    res.json({
        status: true,
        author: 'Yemobyte',
        endpoints: {
            youtube_video: '/toolsmart/youtube/video?url=',
            youtube_mp3: '/toolsmart/youtube/mp3?url=',
            youtube_thumbnail: '/toolsmart/youtube/thumbnail?url='
        }
    });
});

/* 1. YouTube Video Downloader */
app.get('/toolsmart/youtube/video', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, message: 'URL required' });

        const info = await runYtDlp(url);

        const downloads = (info.formats || [])
            .filter(f => f.ext === 'mp4' && f.acodec !== 'none' && f.vcodec !== 'none')
            .map(f => ({
                quality: f.format_note || f.resolution || 'unknown',
                format: f.ext,
                size: f.filesize ? `${(f.filesize / 1024 / 1024).toFixed(2)} MB` : null,
                url: f.url
            }));

        if (downloads.length === 0) {
            const best = (info.formats || []).filter(f => f.ext === 'mp4').pop();
            if (best) downloads.push({ quality: 'best', format: 'mp4', url: best.url });
        }

        res.json({
            status: true,
            data: {
                title: info.title,
                thumbnail: info.thumbnail,
                duration: info.duration,
                views: info.view_count,
                downloads
            }
        });
    } catch (e) {
        res.status(500).json({ status: false, message: 'Failed to fetch video', error: e.toString() });
    }
});

/* 2. YouTube MP3 (Audio) */
app.get('/toolsmart/youtube/mp3', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, message: 'URL required' });

        const info = await runYtDlp(url);

        const downloads = (info.formats || [])
            .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
            .map(f => ({
                bitrate: `${Math.round(f.abr || 0)}kbps`,
                format: f.ext,
                size: f.filesize ? `${(f.filesize / 1024 / 1024).toFixed(2)} MB` : null,
                url: f.url
            }));

        res.json({
            status: true,
            data: {
                title: info.title,
                thumbnail: info.thumbnail,
                downloads
            }
        });
    } catch (e) {
        res.status(500).json({ status: false, message: 'Failed to fetch audio' });
    }
});

/* 3. YouTube Thumbnail */
app.get('/toolsmart/youtube/thumbnail', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, message: 'URL required' });

        const info = await runYtDlp(url);

        res.json({
            status: true,
            data: {
                title: info.title,
                thumbnails: (info.thumbnails || []).map(t => ({ url: t.url, resolution: t.resolution || `${t.width}x${t.height}` }))
            }
        });
    } catch (e) {
        res.status(500).json({ status: false, message: 'Failed to fetch thumbnail' });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
