const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.set('json spaces', 2);

async function teraboxdl(url) {
    try {
        if (!url.includes('terabox') && !url.includes('1024tera') && !url.includes('surl')) {
            throw new Error('Invalid Terabox URL.');
        }

        /* 1. Get Turnstile Token from Nekolabs */
        /* Using the exact logic provided by user */
        const { data: cf } = await axios.post('https://api.nekolabs.web.id/tools/bypass/cf-turnstile', {
            url: 'https://teraboxdl.site/',
            siteKey: '0x4AAAAAACG0B7jzIiua8JFj'
        });

        if (!cf || !cf.result) {
            throw new Error('Failed to get Cloudflare Turnstile token from Nekolabs.');
        }

        /* 2. Proxy Request to TeraboxDL.site */
        const { data } = await axios.post('https://teraboxdl.site/api/proxy', {
            url: url,
            cf_token: cf.result
        }, {
            headers: {
                'origin': 'https://teraboxdl.site',
                'referer': 'https://teraboxdl.site/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
                'Content-Type': 'application/json'
            }
        });

        return data;
    } catch (error) {
        throw new Error(error.message);
    }
}

app.get('/', (req, res) => {
    res.json({
        status: true,
        author: 'YT',
        description: 'Terabox Scraper (Using TeraboxDL + Nekolabs Bypass)',
        endpoints: {
            download: '/terabox/download?url=...'
        }
    });
});

app.get('/terabox/download', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, message: 'URL required' });

        const data = await teraboxdl(url);

        if (!data) {
            return res.status(404).json({ status: false, message: 'No data returned.' });
        }

        res.json({
            status: true,
            data: data
        });

    } catch (e) {
        /* Handle specific 500s or timeouts */
        res.status(500).json({ status: false, message: e.message });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
