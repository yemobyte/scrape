const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.set('json spaces', 2);

/* Config axios */
const client = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/json'
    }
});

/* Helper to fetch screenshot */
/* Helper to fetch screenshot */
async function getScreenshot(url, device = 'desktop', format = 'png') {
    const payload = {
        url: url,
        deviceType: device,
        format: format
    };

    /* 1. Request screenshot generation (returns JSON with URL) */
    const response = await client.post('https://yemobyte-sc.hf.space/api/screenshot', payload);

    if (!response.data || !response.data.status || !response.data.data || !response.data.data.url) {
        throw new Error('Failed to generate screenshot: ' + JSON.stringify(response.data));
    }

    const imageUrl = response.data.data.url;

    /* 2. Fetch the actual image */
    const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
    });

    return {
        buffer: imageResponse.data,
        contentType: imageResponse.headers['content-type']
    };
}

/* SSWeb Endpoint */
app.get('/ssweb', async (req, res) => {
    try {
        const { url, device = 'desktop', type = 'png' } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                message: 'URL parameter is required'
            });
        }

        /* Validasi device type sederhana */
        const allowedDevices = ['desktop', 'iphone-14', 'pixel-7', 'custom'];
        const deviceType = allowedDevices.includes(device) ? device : 'desktop';

        const result = await getScreenshot(url, deviceType, type);

        /* Return image directly */
        res.set('Content-Type', result.contentType);
        res.send(result.buffer);

    } catch (e) {
        /* Handle specific API errors if possible */
        if (e.response) {
            const errorData = e.response.data.toString();
            try {
                const jsonError = JSON.parse(errorData);
                return res.status(e.response.status).json({ status: false, message: jsonError.message || 'Upstream API Error' });
            } catch {
                return res.status(e.response.status).send(errorData);
            }
        }
        res.status(500).json({ status: false, message: e.message });
    }
});

/* SSWeb JSON Endpoint (Base64) */
app.get('/ssweb/json', async (req, res) => {
    try {
        const { url, device = 'desktop', type = 'png' } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                message: 'URL parameter is required'
            });
        }

        const allowedDevices = ['desktop', 'iphone-14', 'pixel-7', 'custom'];
        const deviceType = allowedDevices.includes(device) ? device : 'desktop';

        const result = await getScreenshot(url, deviceType, type);
        const base64 = Buffer.from(result.buffer).toString('base64');

        res.json({
            status: true,
            data: {
                url: url,
                device: deviceType,
                type: type,
                image: `data:${result.contentType};base64,${base64}`
            }
        });

    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Home API/Documentation */
app.get('/', (req, res) => {
    res.json({
        status: true,
        message: 'SSWeb Scraper API (Wrapper)',
        endpoints: {
            ssweb_image: '/ssweb?url=https://google.com&device=desktop',
            ssweb_json: '/ssweb/json?url=https://google.com&device=iphone-14'
        },
        supported_devices: ['desktop', 'iphone-14', 'pixel-7', 'custom'],
        author: 'Yemobyte'
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
