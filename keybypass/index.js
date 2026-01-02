const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

/* Configuration */
const SITE_URL = 'https://keybypass.net';
const API_URL = `${SITE_URL}/api/bypass`;

/* Bypass Endpoint */
app.post('/bypass', async (req, res) => {
    try {
        const { url, hcaptcha_token } = req.body;

        if (!url) {
            return res.status(400).json({ status: false, message: 'URL is required' });
        }

        if (!hcaptcha_token) {
            return res.status(400).json({ status: false, message: 'hCaptcha token is required. Use a solver service to get one.' });
        }

        const { data } = await axios.post(API_URL, {
            url,
            hcaptcha_token
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': SITE_URL,
                'Referer': `${SITE_URL}/`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (data.success) {
            res.json({
                status: true,
                data: {
                    result: data.result,
                    type: data.type,
                    credits: data.credits
                }
            });
        } else {
            res.status(400).json({ status: false, message: data.error || 'Bypass failed' });
        }
    } catch (e) {
        res.status(500).json({
            status: false,
            message: e.response ? e.response.data.error || e.response.data : e.message
        });
    }
});

/* Helper info */
app.get('/', (req, res) => {
    res.json({
        status: true,
        message: 'KeyBypass Unofficial API',
        usage: {
            method: 'POST',
            path: '/bypass',
            body: {
                url: 'https://linkvertise.com/...',
                hcaptcha_token: 'P1_eyJhbG...'
            }
        },
        note: 'You must provide a valid hCaptcha token from sitekey a32c1138-88bc-4f6a-b466-a622acba2376'
    });
});

app.listen(PORT, () => console.log(`KeyBypass API running on http://localhost:${PORT}`));
