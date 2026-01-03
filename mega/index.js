const express = require('express');
const cors = require('cors');
const { File } = require('megajs');
const mime = require('mime-types');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.set('json spaces', 2);

/* Helper to process Mega URL */
async function getMegaInfo(url) {
    /* Create File object from URL */
    const file = File.fromURL(url);

    /* Wait for attributes to load (decryption) */
    await file.loadAttributes();

    return {
        filename: file.name,
        size: file.size,
        type: mime.lookup(file.name) || 'application/octet-stream',
        instance: file
    };
}

/* Mega Info Endpoint */
app.get('/mega', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({
                status: false,
                message: 'URL parameter is required'
            });
        }

        const info = await getMegaInfo(url);

        res.json({
            status: true,
            data: {
                filename: info.filename,
                size: info.size,
                size_formatted: (info.size / 1024 / 1024).toFixed(2) + ' MB',
                type: info.type,
                url: url,
                download_api: `http://localhost:${PORT}/mega/download?url=${encodeURIComponent(url)}`
            }
        });

    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Mega Download Stream Endpoint */
app.get('/mega/download', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).send('URL required');
        }

        const info = await getMegaInfo(url);
        const fileStream = info.instance.download();

        /* Set headers for download */
        res.setHeader('Content-Disposition', `attachment; filename="${info.filename}"`);
        res.setHeader('Content-Type', info.type);
        res.setHeader('Content-Length', info.size);

        /* Pipe stream to response */
        fileStream.pipe(res);

    } catch (e) {
        res.status(500).send('Error: ' + e.message);
    }
});

/* Home API/Documentation */
app.get('/', (req, res) => {
    res.json({
        status: true,
        message: 'MEGA Scraper API',
        endpoints: {
            info: '/mega?url=https://mega.nz/file/...',
            download: '/mega/download?url=https://mega.nz/file/...'
        },
        author: 'Yemobyte'
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
