const express = require('express');
const cors = require('cors');
const { connect } = require('puppeteer-real-browser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.set('json spaces', 2);

/* X Scraper - No Cookies Mode */
async function scrapeX(url) {
    let browser = null;
    let videoUrls = [];

    try {
        const { browser: connectedBrowser, page } = await connect({
            headless: 'auto',
            turnstile: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        browser = connectedBrowser;

        /* Network Interception for Media */
        page.on('response', response => {
            const resUrl = response.url();
            /* Filter for video files (mp4, m3u8) */
            if (resUrl.includes('.mp4') || resUrl.includes('.m3u8') || resUrl.includes('video.twimg.com')) {
                // Exclude m3u8 playlists if we want only direct mp4? 
                // X sends M3U8 for HLS and MP4 for legacy/direct.
                // The user's log showed both. We keep both but maybe deduplicate or clean?
                // Also exclude 'map' files or segments if noisy?

                if (!resUrl.includes('blob:') && !resUrl.includes('.m4s') && !resUrl.includes('map')) {
                    videoUrls.push(resUrl);
                }
                // Actually the user's log showed a working .mp4:
                // .../cI3woNUR9wmMRQvj.mp4
                // And .m4s segments.
                // We should prioritize MP4 if available.
            }
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        /* Wait for tweet to load using robust selector strategy */
        const tweetSelector = 'article[data-testid="tweet"]';
        try {
            await page.waitForSelector(tweetSelector, { timeout: 30000 });
        } catch (e) {
            // console.log("Tweet selector not immediately found, waiting...");
            await new Promise(r => setTimeout(r, 5000));
        }

        const tweetData = await page.evaluate(() => {
            const tweet = document.querySelector('article[data-testid="tweet"]');
            if (!tweet) return null;

            const getText = (selector) => tweet.querySelector(selector)?.innerText || '';
            const getAttr = (selector, attr) => tweet.querySelector(selector)?.getAttribute(attr) || '';

            // Text Extraction - Improved
            // Try data-testid="tweetText" directly, or look for spans/divs with lang attribute
            let text = '';
            const textNode = tweet.querySelector('[data-testid="tweetText"]');
            if (textNode) {
                // Collect text from children to avoid hidden elements confusion, currently innerText is best suited
                text = textNode.innerText || textNode.textContent;
            } else {
                // Fallback: looking for main text block via class analysis is hard, try aria-label of the tweet?
                // The tweet article often has "Tweet text" in aria? No.
                // Fallback to page title or meta description if main text missing (last resort)
                // But for now, just keep empty if finding fails.
            }

            // Author
            const userNames = getText('[data-testid="User-Name"]').split('\n');
            const authorName = userNames[0] || '';
            const authorUsername = userNames[1] || '';

            // Time
            const timeEl = tweet.querySelector('time');
            const postedAt = timeEl ? timeEl.getAttribute('datetime') : '';
            const dateDisplay = timeEl ? timeEl.innerText : '';

            // Stats
            const replyCount = getAttr('[data-testid="reply"]', 'aria-label') || getText('[data-testid="reply"]');
            const retweetCount = getAttr('[data-testid="retweet"]', 'aria-label') || getText('[data-testid="retweet"]');
            const likeCount = getAttr('[data-testid="like"]', 'aria-label') || getText('[data-testid="like"]');

            // Views - Improved
            // Views are often in a link href ending with /analytics
            // OR sometimes just a group with specific aria-label "Views"
            let viewCount = '';
            const analyticsLink = tweet.querySelector('a[href*="/analytics"]');
            if (analyticsLink) {
                // Try getting text node directly involved with numbers
                // Often structure is: <div><span><span>1.2M</span></span> <span...>Views</span></div>
                // We want the number.
                const rawText = analyticsLink.innerText;
                // rawText might be "1M Views". 
                viewCount = rawText.replace(/User Analytics|Views/gi, '').trim();
            } else {
                // Try looking for stat with specific svg path (too complex) or aria-label containing "View"
                const viewGroup = Array.from(tweet.querySelectorAll('[role="group"] [aria-label*="View"]')).pop();
                if (viewGroup) {
                    viewCount = viewGroup.getAttribute('aria-label').replace(/Views?/i, '').trim();
                }
            }

            // Cleanup stats (remove "Replies", "Likes" text if present in aria-label)
            const cleanStat = (str) => str.replace(/[^0-9KnM.]/g, '').trim();

            return {
                text,
                author_name: authorName,
                author_username: authorUsername,
                posted_at: postedAt,
                date: dateDisplay,
                replies: cleanStat(replyCount),
                retweets: cleanStat(retweetCount),
                likes: cleanStat(likeCount),
                views: cleanStat(viewCount)
            };
        });

        await browser.close();

        if (!tweetData) {
            return { error: 'Tweet not found or failed to load' };
        }

        /* Deduplicate and Clean Video URLs */
        const uniqueMedia = [...new Set(videoUrls)];
        /* Filter to prefer MP4 over M3U8 if possible, or return best quality? */
        /* For now return all unique valid video links found during load */

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
            media: uniqueMedia
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

        const data = await scrapeX(url);

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
