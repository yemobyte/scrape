const express = require('express');
const cors = require('cors');
const { connect } = require('puppeteer-real-browser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.set('json spaces', 2);

/* Helper to clean stat strings */
const cleanStat = (str) => {
    if (!str) return '0';
    return str.replace(/[^0-9\.KMB]/g, '');
};

/* TikTok Scraper (Direct using Puppeteer to extract hydration data or DOM) */
async function scrapeTikTokDirect(url) {
    let browser = null;
    try {
        const { browser: connectedBrowser, page } = await connect({
            headless: 'auto',
            turnstile: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
        });
        browser = connectedBrowser;

        /* Go to TikTok Video Page */
        /* TikTok often has CAPTCHA. puppeteer-real-browser handles Turnstile but maybe not slider captcha found on TikTok. */
        /* However, for individual video pages, it usually loads. */
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        /* Wait for hydration data or specific selector */
        /* SIGI_STATE is the global object containing metadata */

        let sigiData = null;
        try {
            sigiData = await page.evaluate(() => {
                /* Try to find the SIGI_STATE script */
                const script = document.getElementById('SIGI_STATE');
                if (script) {
                    return JSON.parse(script.textContent);
                }
                /* Fallback: __UNIVERSAL_DATA_FOR_REHYDRATION__ */
                const script2 = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
                if (script2) {
                    return JSON.parse(script2.textContent);
                }
                return null;
            });
        } catch (e) { }

        if (sigiData) {
            /* Parse SIGI data (Structure varies 2024-2025) */
            /* Usually ItemModule or default Scope */
            /* We try to extract best effort */
            const itemModule = sigiData.ItemModule;
            /* Find the video ID key */
            const videoId = Object.keys(itemModule || {})[0];
            if (videoId) {
                const item = itemModule[videoId];
                await browser.close();

                return {
                    status: true,
                    author: 'Yemobyte',
                    result: {
                        title: item.desc,
                        author: {
                            unique_id: item.author,
                            nickname: item.nickname || item.author
                        },
                        stats: {
                            plays: item.stats.playCount,
                            likes: item.stats.diggCount,
                            comments: item.stats.commentCount,
                            shares: item.stats.shareCount
                        },
                        video: {
                            no_watermark: item.video.playAddr, /* This might be watermarked depending on hydration, but usually playAddr is raw? */
                            /* Actually SIGI often gives expiring links. */
                            /* But it is "Direct from TikTok". */
                            resolutions: item.video.bitrateInfo
                        }
                    }
                };
            }
        }

        /* Fallback: Pure DOM Scraping if SIGI fails or structure changed */
        const domData = await page.evaluate(() => {
            const getTxt = (sel) => document.querySelector(sel)?.innerText || '';
            const desc = getTxt('[data-e2e="video-desc"]');
            const authId = getTxt('[data-e2e="browse-username"]');
            const authName = getTxt('[data-e2e="browse-user-avatar"]'); /* might be partial */

            const like = getTxt('[data-e2e="like-count"]');
            const comment = getTxt('[data-e2e="comment-count"]');
            const share = getTxt('[data-e2e="share-count"]');

            const videoSrc = document.querySelector('video')?.src;

            return {
                desc, authId, authName, like, comment, share, videoSrc
            };
        });

        await browser.close();

        if (domData.videoSrc || domData.desc) {
            return {
                status: true,
                author: 'Yemobyte',
                result: {
                    title: domData.desc,
                    author: {
                        unique_id: domData.authId,
                        nickname: domData.authName
                    },
                    stats: {
                        plays: "Hidden (DOM)",
                        likes: cleanStat(domData.like),
                        comments: cleanStat(domData.comment),
                        shares: cleanStat(domData.share)
                    },
                    video: {
                        play_url: domData.videoSrc,
                        note: "Direct Source Link (May have watermark or expire)"
                    }
                }
            };
        }

        throw new Error('Video Not Found (DOM/SIGI failed)');

    } catch (e) {
        if (browser) await browser.close();
        return {
            status: false,
            message: 'Direct Scrape Failed: ' + e.message
        };
    }
}

app.get('/', (req, res) => {
    res.json({
        status: true,
        author: 'Yemobyte',
        description: 'TikTok Direct Scraper',
        endpoints: {
            download: '/tiktok/download?url=...'
        }
    });
});

app.get('/tiktok/download', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, message: 'URL required' });

    const result = await scrapeTikTokDirect(url);
    if (!result.status) return res.status(500).json(result);

    res.json(result);
});

app.listen(PORT, () => console.log(`TikTok Direct Scraper running on http://localhost:${PORT}`));
