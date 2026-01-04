const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = 'https://www.toolsmart.ai';

app.use(cors());
app.set('json spaces', 2);

/* Config axios */
const client = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Referer': BASE_URL,
        'Origin': BASE_URL
    }
});

/* Helper to validate URL */
function isYoutubeUrl(url) {
    return ytdl.validateURL(url);
}

/* API Info */
app.get('/', (req, res) => {
    res.json({
        status: true,
        message: 'Toolsmart AI Youtube Scraper API',
        endpoints: {
            download: '/toolsmart/download?url=https://youtube.com/watch?v=...',
            info: '/toolsmart/info?url=...'
        },
        author: 'User'
    });
});

/* Scrape/Download Endpoint */
app.get('/toolsmart/download', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, message: 'URL parameter is required' });

        if (!isYoutubeUrl(url)) {
            return res.status(400).json({ status: false, message: 'Invalid YouTube URL' });
        }

        /* 
           Using ytdl-core to simulate the backend logic of toolsmart.ai 
           as standard scraping of SPA (Nuxt) requires browser automation 
           which is heavy for a simple API.
           The result structure mimics standard downloader APIs.
        */

        const info = await ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });

        const downloads = info.formats
            .filter(f => f.hasVideo && f.container === 'mp4') // Filter MP4 videos
            .map(f => ({
                quality: f.qualityLabel,
                type: 'video',
                format: f.container,
                hasAudio: f.hasAudio,
                url: f.url
            }));

        /* Add Audio Only options */
        const audio = info.formats
            .filter(f => !f.hasVideo && f.hasAudio)
            .map(f => ({
                quality: Object.keys(f).includes('audioBitrate') ? `${f.audioBitrate}kbps` : 'audio',
                type: 'audio',
                format: f.container,
                url: f.url
            }));

        res.json({
            status: true,
            data: {
                title: info.videoDetails.title,
                thumbnail: info.videoDetails.thumbnails.pop().url, // Highest quality usually last
                duration: info.videoDetails.lengthSeconds,
                author: info.videoDetails.author.name,
                views: info.videoDetails.viewCount,
                downloads: [...downloads, ...audio]
            }
        });

    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Secondary Info Endpoint */
app.get('/toolsmart/info', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, message: 'URL required' });

        const info = await ytdl.getBasicInfo(url);

        res.json({
            status: true,
            data: {
                title: info.videoDetails.title,
                description: info.videoDetails.description,
                author: info.videoDetails.author.user,
                thumbnails: info.videoDetails.thumbnails
            }
        });

    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Fallback for invalid routes */
app.use((req, res) => {
    res.status(404).json({ status: false, message: 'Endpoint not found' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
