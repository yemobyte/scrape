const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const baseUrl = 'https://ssstik.io';

app.use(cors());
app.set('json spaces', 2);

/* Config axios with common headers */
const client = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Referer': `${baseUrl}/en`,
        'Origin': baseUrl,
        'HX-Request': 'true',
        'HX-Trigger': '_gcaptcha_pt',
        'HX-Target': 'target',
        'HX-Current-URL': `${baseUrl}/en`,
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    withCredentials: true
});

/* Home API/Documentation */
app.get('/', (req, res) => {
    res.json({
        status: true,
        message: 'SSSTik Unofficial API',
        endpoints: {
            download: '/download?url=https://tiktok.com/...'
        },
        author: 'Yemobyte'
    });
});

/* Downloader Logic */
app.get('/download', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, message: 'URL parameter is required' });

        /* Step 1: Get Token and Cookies from Homepage */
        const pageResponse = await client.get(`${baseUrl}/en`);
        const $ = cheerio.load(pageResponse.data);
        let tt = $('input[name="tt"]').val();

        /* Attempt to find dynamic endpoint path (e.g., s_furl = 'abc') */
        let endpointPath = 'abc'; /* default */
        const scripts = $('script').map((i, el) => $(el).html()).get();
        for (const script of scripts) {
            const transformMatch = script.match(/s_furl\s*=\s*['"]([^'"]+)['"]/);
            if (transformMatch) {
                endpointPath = transformMatch[1];
                break;
            }
        }

        /* Attempt to find token in scripts if input is empty */
        if (!tt) {
            for (const script of scripts) {
                const ttMatch = script.match(/s_tt\s*=\s*['"]([^'"]+)['"]/);
                if (ttMatch) {
                    tt = ttMatch[1];
                    break;
                }
            }
        }

        if (!tt) {
            return res.status(500).json({ status: false, message: 'Failed to fetch token from homepage (input/script)' });
        }

        /* Extract cookies if needed (axios usually handles this if jar is used, but we'll manually pass if needed. Client instance persists cookies? No, not by default without cookie-jar. For now, let's try just headers since standard axios doesn't save cookies automatically across requests unless configured with a jar agent) */

        /* Manually handle cookies for the POST request from the GET response */
        const cookies = pageResponse.headers['set-cookie'];
        const cookieHeader = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';

        /* Step 2: Send POST request to API */
        const formData = new URLSearchParams();
        formData.append('id', url);
        formData.append('locale', 'en');
        formData.append('tt', tt);

        const apiResponse = await client.post(`${baseUrl}/${endpointPath}?url=dl`, formData, {
            headers: {
                'Cookie': cookieHeader
            }
        });

        /* Step 3: Parse Response */
        const html = apiResponse.data;
        const $result = cheerio.load(html);

        /* Result Check */
        if ($result('.result_overlay_text').length > 0) {
            return res.status(400).json({ status: false, message: 'Error from SSSTik: ' + $result('.result_overlay_text').text().trim() });
        }

        /* Updated Author and Stats selectors */
        const authorName = $result('h2').text().trim() || $result('.result_author').text().trim();
        const authorAvatar = $result('.result_author').attr('src');
        const description = $result('.maintext').text().trim();

        /* Stats (Likes, Comments, Shares) */
        const stats = {
            likes: $result('.trending-actions > div:nth-child(1) > div:last-child').text().trim(),
            comments: $result('.trending-actions > div:nth-child(2) > div:last-child').text().trim(),
            shares: $result('.trending-actions > div:nth-child(3) > div:last-child').text().trim()
        };

        const downloads = [];
        $result('.result_overlay_buttons a').each((i, el) => {
            const link = $(el).attr('href');
            const text = $(el).text().trim();
            if (link && link !== '#') {
                downloads.push({
                    type: text,
                    url: link.startsWith('/') ? `${baseUrl}${link}` : link
                });
            }
        });

        if (downloads.length === 0) {
            return res.status(404).json({ status: false, message: 'No download links found. Video might be private or deleted.' });
        }

        res.json({
            status: true,
            data: {
                author: {
                    name: authorName,
                    avatar: authorAvatar
                },
                description,
                stats,
                downloads
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ status: false, message: e.message });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
