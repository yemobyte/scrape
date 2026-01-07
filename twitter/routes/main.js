const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const router = express.Router();

puppeteer.use(StealthPlugin());

router.get('/api/twitter', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({
            status: false,
            message: 'URL parameter is required'
        });
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        /* Set explicit timeout and viewport */
        await page.setDefaultNavigationTimeout(60000);
        await page.setViewport({ width: 1280, height: 800 });

        /* Intercept Video URLs */
        let videoUrl = null;
        await page.setRequestInterception(true);
        page.on('request', (req) => req.continue());
        page.on('response', (res) => {
            const contentType = res.headers()['content-type'];
            if (contentType && (contentType.includes('video/mp4') || contentType.includes('application/x-mpegURL') || contentType.includes('video/m2ts'))) {
                if (!videoUrl && res.url().includes('video.twimg.com')) {
                    videoUrl = res.url(); // Capture the first valid video URL
                }
            }
        });

        /* Navigate to URL */
        await page.goto(url, { waitUntil: 'networkidle2' });

        /* Wait for tweet text */
        await page.waitForSelector('[data-testid="tweetText"]', { timeout: 30000 });

        /* Scroll to trigger lazy loading of stats/comments */
        await page.evaluate(() => window.scrollBy(0, 500));
        await new Promise(r => setTimeout(r, 2000));

        /* Extract Data */
        const data = await page.evaluate(() => {
            const getText = (selector) => {
                const el = document.querySelector(selector);
                return el ? el.innerText.trim() : null;
            };

            const accountName = getText('[data-testid="User-Name"] span');
            const username = getText('[data-testid="User-Name"] div.r-1wbh5a2');
            const text = getText('[data-testid="tweetText"]');

            /* Stats - Trying specific testids which are usually more stable */
            const getStat = (testId) => {
                const el = document.querySelector(`[data-testid="${testId}"]`);
                if (el) {
                    const label = el.getAttribute('aria-label');
                    if (label) return label.split(' ')[0]; // Extract number from "100 likes"
                    return el.innerText.trim() || '0';
                }
                return '0';
            };

            const replies = getStat('reply');
            const reposts = getStat('retweet');
            const likes = getStat('like');

            /* Views are often separate */
            let views = '0';
            const viewsElement = Array.from(document.querySelectorAll('span, div, a')).find(el => el.textContent.includes('Views') && el.getAttribute('href') && el.getAttribute('href').includes('/analytics'));
            if (viewsElement) {
                views = viewsElement.innerText.replace('Views', '').trim();
            } else {
                /* Fallback for guest view where analytics link might be missing but text exists */
                const viewsText = Array.from(document.querySelectorAll('span')).find(el => el.innerText.includes('Views'));
                if (viewsText) views = viewsText.innerText.replace('Views', '').trim();
            }

            /* Media */
            const media = [];
            let type = 'text';

            /* Images */
            const images = document.querySelectorAll('[data-testid="tweetPhoto"] img');
            images.forEach(img => {
                const src = img.src;
                if (src) {
                    media.push(src);
                    type = 'image';
                }
            });

            /* Videos */
            /* Puppeteer usually sees the blob URL or poster. 
               Direct video extraction is hard without interception. 
               We will try to get the poster as fallback or look for specific video elements. */
            const video = document.querySelector('video');
            if (video) {
                type = 'video';
                if (video.src) media.push(video.src);
                if (video.poster) media.push(video.poster); // Provide poster if src is blob
            }

            return {
                account_name: accountName,
                username: username,
                text: text,
                stats: {
                    views,
                    likes,
                    replies,
                    reposts
                },
                media_type: type,
                media: media
            };
        });

        /* Append intercepted video if found */
        if (data.media_type !== 'image' && videoUrl) {
            data.media_type = 'video';
            data.media.push(videoUrl);
        } else if (data.media_type !== 'image') {
            /* Try to find video tag src if intercept failed (rare for blob) */
            const videoSrc = await page.evaluate(() => {
                const v = document.querySelector('video');
                return v ? v.src : null;
            });
            if (videoSrc) {
                data.media_type = 'video';
                data.media.push(videoSrc);
            }
        }

        res.json({
            status: true,
            creator: "yemobyte",
            result: data
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: 'Failed to scrape Twitter URL',
            error: error.message
        });
    } finally {
        if (browser) await browser.close();
    }
});

module.exports = router;
