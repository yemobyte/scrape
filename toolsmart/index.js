const express = require('express');
const axios = require('axios');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const instagramGetUrl = require('instagram-url-direct');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = 'https://www.toolsmart.ai';

app.use(cors());
app.set('json spaces', 2);

/* Config axios for generic scraping */
const client = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Referer': BASE_URL
    }
});

/* Helper: Validate YouTube URL */
function isYoutubeUrl(url) {
    return ytdl.validateURL(url);
}

/* Helper: Scrape Facebook */
async function scrapeFacebook(url) {
    try {
        const { data } = await client.get(url);
        let hd = data.match(/hd_src:"([^"]+)"/);
        let sd = data.match(/sd_src:"([^"]+)"/);

        /* fallback for other patterns */
        if (!hd) hd = data.match(/"playable_url_quality_hd":"([^"]+)"/);
        if (!sd) sd = data.match(/"playable_url":"([^"]+)"/);

        const links = [];
        if (hd && hd[1]) links.push({ quality: 'HD', url: hd[1].replace(/\\/g, '') });
        if (sd && sd[1]) links.push({ quality: 'SD', url: sd[1].replace(/\\/g, '') });

        return links.length > 0 ? { title: 'Facebook Video', downloads: links } : null;
    } catch (e) {
        return null;
    }
}

/* Helper: Scrape Pinterest */
async function scrapePinterest(url) {
    try {
        const { data } = await client.get(url);
        const video = data.match(/<video[^>]+src="([^"]+)"/);
        const image = data.match(/<meta property="og:image" content="([^"]+)"/);

        if (video && video[1]) {
            return {
                title: 'Pinterest Video',
                thumbnail: image ? image[1] : null,
                downloads: [{ quality: 'auto', url: video[1] }]
            };
        }
        return null;
    } catch (e) {
        return null;
    }
}

/* Root Endpoint */
app.get('/', (req, res) => {
    res.json({
        status: true,
        author: 'Yemobyte',
        endpoints: {
            youtube_video: '/toolsmart/youtube/video?url=',
            youtube_mp3: '/toolsmart/youtube/mp3?url=',
            youtube_thumbnail: '/toolsmart/youtube/thumbnail?url=',
            facebook: '/toolsmart/facebook?url=',
            instagram: '/toolsmart/instagram?url=',
            pinterest: '/toolsmart/pinterest?url='
        }
    });
});

/* 1. YouTube Video Downloader */
app.get('/toolsmart/youtube/video', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url || !isYoutubeUrl(url)) return res.status(400).json({ status: false, message: 'Invalid YouTube URL' });

        const info = await ytdl.getInfo(url);
        const downloads = info.formats
            .filter(f => f.hasVideo && f.container === 'mp4')
            .map(f => ({
                quality: f.qualityLabel,
                hasAudio: f.hasAudio,
                url: f.url
            }));

        res.json({
            status: true,
            data: {
                title: info.videoDetails.title,
                thumbnail: info.videoDetails.thumbnails.pop().url,
                duration: info.videoDetails.lengthSeconds,
                downloads
            }
        });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* 2. YouTube MP3 (Audio) */
app.get('/toolsmart/youtube/mp3', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url || !isYoutubeUrl(url)) return res.status(400).json({ status: false, message: 'Invalid YouTube URL' });

        const info = await ytdl.getInfo(url);
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

        const downloads = audioFormats.map(f => ({
            bitrate: `${f.audioBitrate}kbps`,
            format: f.container,
            url: f.url
        }));

        res.json({
            status: true,
            data: {
                title: info.videoDetails.title,
                thumbnail: info.videoDetails.thumbnails.pop().url,
                downloads
            }
        });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* 3. YouTube Thumbnail */
app.get('/toolsmart/youtube/thumbnail', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url || !isYoutubeUrl(url)) return res.status(400).json({ status: false, message: 'Invalid YouTube URL' });

        const info = await ytdl.getBasicInfo(url);

        res.json({
            status: true,
            data: {
                title: info.videoDetails.title,
                thumbnails: info.videoDetails.thumbnails
            }
        });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* 4. Instagram Downloader */
app.get('/toolsmart/instagram', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, message: 'URL required' });

        const data = await instagramGetUrl(url);

        if (data && data.url_list && data.url_list.length > 0) {
            res.json({
                status: true,
                data: {
                    title: 'Instagram Content',
                    media: data.url_list
                }
            });
        } else {
            res.status(404).json({ status: false, message: 'No media found or private account' });
        }
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* 5. Facebook Downloader */
app.get('/toolsmart/facebook', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, message: 'URL required' });

        const data = await scrapeFacebook(url);
        if (data) {
            res.json({ status: true, data });
        } else {
            res.status(404).json({ status: false, message: 'Video not found or private' });
        }
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* 6. Pinterest Downloader */
app.get('/toolsmart/pinterest', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, message: 'URL required' });

        /* Handle short links usually used by Pinterest app */
        let finalUrl = url;
        if (url.includes('pin.it')) {
            const r = await client.head(url, { maxRedirects: 5 });
            finalUrl = r.request.res.responseUrl || url;
        }

        const data = await scrapePinterest(finalUrl);
        if (data) {
            res.json({ status: true, data });
        } else {
            res.status(404).json({ status: false, message: 'Video not found' });
        }
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
