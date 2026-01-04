const express = require('express');
const cors = require('cors');
const { connect } = require('puppeteer-real-browser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const author = 'Yemobyte';

/* iQIYI Scraper Logic */
async function scrapeIqiyi(url) {
    let browser = null;
    let m3u8Url = null;

    try {
        const { browser: connectedBrowser, page } = await connect({
            headless: 'auto',
            turnstile: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        browser = connectedBrowser;

        /* Intercept Network for M3U8 */
        page.on('response', response => {
            const resUrl = response.url();
            if (resUrl.includes('.m3u8') && !m3u8Url) {
                m3u8Url = resUrl;
            }
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        /* Extract Metadata */
        const title = await page.title();

        await browser.close();

        if (!m3u8Url) return { status: false, author, message: 'Stream not found' };

        return {
            status: true,
            author,
            data: {
                title,
                stream_url: m3u8Url
            }
        };

    } catch (e) {
        if (browser) await browser.close();
        return { status: false, author, message: e.message };
    }
}

app.get('/iqiyi', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.json({ status: false, author, message: 'URL required' });
    const result = await scrapeIqiyi(url);
    res.json(result);
});

app.listen(PORT, () => console.log(`iQIYI Scraper running on port ${PORT}`));
