const express = require('express');
const cors = require('cors');
const { youtubeDownloader } = require('./downloader');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
/* Increase JSON limit just in case, though we stream binary usually */
app.use(express.json({ limit: '500mb' }));

app.get('/', (req, res) => {
    res.json({
        status: true,
        author: '@ShiroNexo',
        description: 'YouTube Downloader API (Buffer Based)',
        endpoints: {
            download: '/youtube/download?url=...&quality=4'
            // Quality Map: 1=144p, 2=360p, 3=480p, 4=720p, 5=1080p, 8=Audio
        }
    });
});

app.get('/youtube/download', async (req, res) => {
    try {
        const { url, quality } = req.query;
        if (!url) return res.status(400).json({ status: false, message: 'URL required' });

        const qIndex = parseInt(quality || '2'); // Default 360p

        console.log(`Processing download for ${url} (Quality: ${qIndex})...`);
        const result = await youtubeDownloader(url, qIndex);

        if (!result.status) {
            return res.status(500).json(result);
        }

        /* The result contains the buffer in result.data.result */
        /* If the user wants the FILE, we should send it as download */
        /* If the user wants JSON with buffer (as user code implies), we send JSON */

        /* However, sending 100MB buffer in JSON is bad. */
        /* The user code returns a buffer. */
        /* I will serve the file directly if 'type=stream' is passed, else JSON? */
        /* The user's prompt implies "scrape... ini contoh kode testing". */
        /* The example code returns an object structure. I will return that structure. */
        /* Warning: Heavy JSON payload. */

        // Convert Buffer to Base64 to make it JSON safe?
        // Express res.json() handles Buffer by converting to array (bad) or we can convert to base64.
        // Or we assume the user of this API handles the raw buffer response.

        // Let's modify the response to be cleaner for API demo:
        // We will strip the buffer from JSON debugging and say "Buffer available".
        // But if I want to "download", I should probably pipe the buffer to res.

        const data = result.data;
        const buffer = data.result;

        // Check accept header?
        // Let's prioritize sending the JSON as requested by the code structure.
        // But JSON stringify of buffer array is HUGE.
        // I will Convert buffer to Base64 string for JSON.

        data.result = buffer.toString('base64');
        data.isBase64 = true;

        res.json({
            status: true,
            creator: result.creator,
            data: data
        });

    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Helper endpoint to stream the file directly which is more practical */
app.get('/youtube/stream', async (req, res) => {
    try {
        const { url, quality } = req.query;
        if (!url) return res.status(400).json({ status: false, message: 'URL required' });
        const qIndex = parseInt(quality || '2');

        const result = await youtubeDownloader(url, qIndex);
        if (!result.status) return res.status(500).json(result);

        const buffer = result.data.result;
        const filename = `${result.data.title.replace(/[^a-z0-9]/gi, '_')}.${result.data.type}`;

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', result.data.type === 'mp3' ? 'audio/mpeg' : 'video/mp4');
        res.send(buffer);

    } catch (e) {
        res.status(500).send(e.message);
    }
});

app.listen(PORT, () => console.log(`YouTube Downloader running on http://localhost:${PORT}`));
