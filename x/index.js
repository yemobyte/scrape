const express = require('express');
const cors = require('cors');
const { connect } = require('puppeteer-real-browser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.set('json spaces', 2);

/* Load cookies if available */
let cookies = [];
try {
    const cookiePath = path.join(__dirname, 'cookies.json');
    if (fs.existsSync(cookiePath)) {
        cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
    }
} catch (e) {
    console.log('Error loading cookies:', e.message);
}

async function scrapeX(url) {
    let browser = null;
    try {
        const { browser: connectedBrowser, page } = await connect({
            headless: 'auto',
            turnstile: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        browser = connectedBrowser;

        /* Set Cookies */
        if (cookies.length > 0) {
            /* Format cookies for Puppeteer */
            const formattedCookies = cookies.map(c => ({
                name: c.name,
                value: c.value,
                domain: c.domain || '.x.com',
                path: c.path || '/'
            }));
            await page.setCookie(...formattedCookies);
        }

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        /* Wait for video or content */
        /* X structure: 'video' tag usually presents */
        /* Or look for media container */

        await page.waitForSelector('article', { timeout: 30000 }).catch(() => { });

        /* Extract Media */
        const result = await page.evaluate(() => {
            const media = [];
            // Check for videos
            document.querySelectorAll('video').forEach(v => {
                let src = v.src;
                if (!src && v.querySelector('source')) src = v.querySelector('source').src;
                // Blob URLs need special handling (xhr fetch) but scrape via MP4 src if available?
                // X often uses blob:https://... for HLS.
                // WE might need to intercept network requests for m3u8 or mp4
                media.push({ type: 'video', url: src, blob: src.startsWith('blob:') });
            });

            // Check for images
            document.querySelectorAll('img[src*="media"]').forEach(img => {
                media.push({ type: 'image', url: img.src });
            });

            // Text
            const text = document.querySelector('[data-testid="tweetText"]')?.innerText || '';

            return { text, media };
        });

        /* If blob url, we need to find M3U8 from network request? */
        /* Since we are in Puppeteer, we could have listened to responses. */
        /* But simple page evaluate return might miss the actual mp4 link. */
        /* Let's be smart: If blob, looking for video variant requires intercepting `VideoVariants` or `Track` requests. */

        /* For this v1 antigravity scrape, we return what DOM has. */
        /* If it's a blob, we can't download it directly without the session logic for segments. */
        /* OR we use an external tool helper if this fails. */

        /* Wait, user asked to scrape "postingan x tersebut". */
        /* If I can capture the .mp4 URL request, that's best. */

        await browser.close();
        return result;

    } catch (e) {
        if (browser) await browser.close();
        throw new Error('Scrape Error: ' + e.message);
    }
}

/* We need NETWORK INTERCEPTION for X videos (m3u8/mp4) */
/* Updating scrapeX to listen to network */
async function scrapeXRobust(url) {
    let browser = null;
    let videoUrls = [];

    try {
        const { browser: connectedBrowser, page } = await connect({
            headless: 'auto',
            turnstile: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        browser = connectedBrowser;

        if (cookies.length > 0) {
            const formattedCookies = cookies.map(c => ({
                name: c.name,
                value: c.value,
                domain: c.domain || '.x.com',
                path: c.path || '/'
            }));
            await page.setCookie(...formattedCookies);
        }

        /* Listen for Mp4/M3u8 */
        page.on('response', response => {
            const url = response.url();
            if (url.includes('.mp4') || url.includes('.m3u8') || url.includes('video.twimg.com')) {
                if (!url.includes('blob:')) videoUrls.push(url);
            }
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(r => setTimeout(r, 5000)); // wait for media load

        const text = await page.evaluate(() => document.querySelector('[data-testid="tweetText"]')?.innerText || '');

        await browser.close();

        return {
            text,
            media: videoUrls.length > 0 ? videoUrls : ['No video found or only blob detected']
        };

    } catch (e) {
        if (browser) await browser.close();
        throw new Error('Scrape Error: ' + e.message);
    }
}


app.get('/', (req, res) => {
    res.json({
        status: true,
        author: 'Yemo',
        description: 'X (Twitter) Scraper',
        endpoints: {
            download: '/x/download?url=...'
        }
    });
});

app.get('/x/download', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, message: 'URL required' });

        const data = await scrapeXRobust(url);

        res.json({
            status: true,
            author: 'Yemo',
            data: data
        });

    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

app.listen(PORT, () => console.log(`X Scraper running on http://localhost:${PORT}`));
