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

        /* Network Interception for Direct MP4 */
        let directVideoUrl = null;
        const client = await page.target().createCDPSession();
        await client.send('Network.enable');

        /* Listener for video response */
        page.on('response', (response) => {
            const rUrl = response.url();
            const contentType = response.headers()['content-type'] || '';
            /* Check for video content or specific TikTok video domains */
            if ((contentType.includes('video') || rUrl.includes('.mp4')) && !rUrl.includes('blob:')) {
                /* Prioritize known video CDN domains if multiple appear */
                if (!directVideoUrl || rUrl.length > directVideoUrl.length) {
                    directVideoUrl = rUrl;
                }
            }
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        /* Attempt to parse SIGI_STATE/Universal Data for perfect metadata */
        const sigiData = await page.evaluate(() => {
            /* Helper to safely parse specific scripts */
            const parseScript = (id) => {
                const el = document.getElementById(id);
                if (el) {
                    try { return JSON.parse(el.textContent); } catch (e) { }
                }
                return null;
            };

            /* TikTok Hydration IDs */
            return parseScript('SIGI_STATE') || parseScript('__UNIVERSAL_DATA_FOR_REHYDRATION__');
        });

        /* Extract Data from Hydration if available */
        let finalResult = null;
        if (sigiData) {
            /* Handle SIGI Structure */
            /* Structure A: ItemModule */
            if (sigiData.ItemModule) {
                const vid = Object.keys(sigiData.ItemModule)[0];
                const item = sigiData.ItemModule[vid];
                if (item) {
                    finalResult = {
                        title: item.desc,
                        author: {
                            unique_id: item.author,
                            nickname: item.nickname,
                            avatar: item.authorStats?.avatarLarger || ''
                        },
                        stats: {
                            plays: item.stats.playCount,
                            likes: item.stats.diggCount,
                            comments: item.stats.commentCount,
                            shares: item.stats.shareCount
                        },
                        video: {
                            play_url: item.video.playAddr,
                            /* Fallback to playAddr usually (signed) */
                        }
                    };
                }
            }
            /* Structure B: __UNIVERSAL_DATA__ defaultScope */
            if (!finalResult && sigiData.defaultScope && sigiData.defaultScope['webapp.video-detail']) {
                const detail = sigiData.defaultScope['webapp.video-detail'].itemInfo?.itemStruct;
                if (detail) {
                    finalResult = {
                        title: detail.desc,
                        author: {
                            unique_id: detail.author.uniqueId,
                            nickname: detail.author.nickname,
                            avatar: detail.author.avatarLarger
                        },
                        stats: {
                            plays: detail.stats.playCount,
                            likes: detail.stats.diggCount,
                            comments: detail.stats.commentCount,
                            shares: detail.stats.shareCount
                        },
                        video: {
                            play_url: detail.video.playAddr
                        }
                    };
                }
            }
        }

        /* Fallback: Robust DOM Scraping with multiple selectors */
        if (!finalResult) {
            const domData = await page.evaluate(() => {
                const getText = (selectors) => {
                    for (const sel of selectors) {
                        const el = document.querySelector(sel);
                        if (el) return el.innerText || el.textContent;
                    }
                    return '';
                };
                const getSrc = (sel) => document.querySelector(sel)?.getAttribute('src');

                /* Meta Tags Fallback for Author */
                const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
                /* Meta format: "Start watching videos from Nickname (@handle) on TikTok..." or "Watch ... by Nickname (@handle)..." */
                /* Actually simply getting the H2/H1 is distinct */

                /* Selectors 2024/2025 */
                const desc = getText(['[data-e2e="video-desc"]', 'h1', '.css-1djj2wz-DivDescription']) || document.title;

                /* Author Logic */
                let uniqueId = getText(['[data-e2e="browse-username"]', '[data-e2e="user-title"]', 'a[href^="/@"]']);
                let nickname = getText(['[data-e2e="browse-user-avatar"]', '[data-e2e="user-subtitle"]', 'h2[data-e2e="user-title"]']);

                /* If selectors failed, parse from URL or Meta */
                if (!uniqueId) {
                    /* Try URL */
                    const match = window.location.href.match(/@([\w\.]+)/);
                    if (match) uniqueId = match[1];
                }
                if (!nickname && uniqueId) nickname = uniqueId; // Fallback

                const plays = getText(['[data-e2e="video-views"]']);
                const likes = getText(['[data-e2e="like-count"]', '[data-e2e="browse-like-count"]']);
                const comments = getText(['[data-e2e="comment-count"]']);
                const shares = getText(['[data-e2e="share-count"]']);

                return { desc, uniqueId, nickname, stats: { likes, comments, shares, plays }, videoSrc: document.querySelector('video')?.src };
            });

            finalResult = {
                title: domData.desc,
                author: {
                    unique_id: domData.uniqueId,
                    nickname: domData.nickname
                },
                stats: domData.stats,
                video: {
                    play_url: domData.videoSrc /* Might be blob, replaced below if network found */
                }
            };
        }

        await browser.close();

        /* Replace Video URL with Network Intercepted Direct URL (Best Quality/Real) */
        if (directVideoUrl) {
            finalResult.video.play_url = directVideoUrl;
            finalResult.video.is_direct = true;
        }

        /* Clean Stats */
        const fmt = (s) => s ? String(s).replace(/[^0-9\.KMB]/g, '') : '0';
        finalResult.stats.likes = fmt(finalResult.stats.likes);
        finalResult.stats.comments = fmt(finalResult.stats.comments);
        finalResult.stats.shares = fmt(finalResult.stats.shares);

        return {
            status: true,
            author: 'Yemobyte',
            result: finalResult
        };

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
