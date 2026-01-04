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
        } else {
            console.warn("WARNING: No 'cookies.json' found or empty. X.com scraping will likely fail (Redirection to Login).");
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
        // await new Promise(r => setTimeout(r, 5000)); // wait for media load

        /* Wait for tweet to load */
        const tweetSelector = 'article[data-testid="tweet"]';
        try {
            await page.waitForSelector(tweetSelector, { timeout: 30000 });
        } catch (e) {
            console.log("Tweet selector not immediately found, waiting...");
            await new Promise(r => setTimeout(r, 5000));
        }

        const tweetData = await page.evaluate(() => {
            const tweet = document.querySelector('article[data-testid="tweet"]');
            if (!tweet) return null;

            // Helper to get text safely
            const getText = (selector) => tweet.querySelector(selector)?.innerText || '';
            const getAria = (selector) => tweet.querySelector(selector)?.getAttribute('aria-label') || '';

            // Text
            const text = getText('[data-testid="tweetText"]');

            // Author Info
            const userNames = getText('[data-testid="User-Name"]').split('\n');
            const authorName = userNames[0] || '';
            const authorUsername = userNames[1] || ''; // usually @handle

            // Time
            const timeEl = tweet.querySelector('time');
            const postedAt = timeEl ? timeEl.getAttribute('datetime') : '';
            const dateDisplay = timeEl ? timeEl.innerText : '';

            // Metrics (Reliable from Aria Label usually, e.g. "100 likes")
            // Or inner text which might be "1K"
            const replyCount = getText('[data-testid="reply"]');
            const retweetCount = getText('[data-testid="retweet"]');
            const likeCount = getText('[data-testid="like"]');
            const viewCount = getText('[href*="/analytics"]'); // Views often linked to analytics or just a stat span

            // Media
            const media = [];
            tweet.querySelectorAll('video').forEach(v => {
                let src = v.src;
                if (!src && v.querySelector('source')) src = v.querySelector('source').src;
                media.push({ type: 'video', url: src, blob: src.startsWith('blob:') });
            });
            tweet.querySelectorAll('img[src*="media"]').forEach(img => {
                media.push({ type: 'image', url: img.src });
            });

            return {
                text,
                author_name: authorName,
                author_username: authorUsername,
                posted_at: postedAt,
                date: dateDisplay,
                replies: replyCount,
                retweets: retweetCount,
                likes: likeCount,
                views: viewCount,
                media_dom: media // Fallback if network interception fails
            };
        });

        await browser.close();

        if (!tweetData) {
            return { error: 'Tweet not found or failed to load' };
        }

        /* Merge network discovered videos if available, else use DOM */
        const finalMedia = videoUrls.length > 0 ? videoUrls : tweetData.media_dom.map(m => m.url);

        return {
            text: tweetData.text,
            author: {
                name: tweetData.author_name,
                username: tweetData.author_username
            },
            stats: {
                likes: tweetData.likes,
                retweets: tweetData.retweets,
                replies: tweetData.replies,
                views: tweetData.views
            },
            posted_at: tweetData.posted_at,
            date: tweetData.date,
            media: finalMedia
        };

    } catch (e) {
        if (browser) await browser.close();
        throw new Error('Scrape Error: ' + e.message);
    }
}


app.get('/', (req, res) => {
    res.json({
        status: true,
        author: 'Yemobyte',
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
            author: 'Yemobyte',
            data: data
        });

    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

app.listen(PORT, () => console.log(`X Scraper running on http://localhost:${PORT}`));
