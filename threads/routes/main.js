/* Required Modules */
const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const router = express.Router();

/* Use Stealth Plugin */
puppeteer.use(StealthPlugin());

/* Route Definition */
router.get('/api/threads', async (req, res) => {
    const { url } = req.query;

    /* Validate URL Parameter */
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

        /* Set User Agent */
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        /* Navigate to URL */
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        /* Wait for generally useful selectors */
        /* Wait for ANY text content to ensure hydration */
        try {
            // Wait for the main post container which usually has the 'article' tag
            await page.waitForSelector('article', { timeout: 30000 });
        } catch (e) {
            console.log('Article wait failed');
        }

        /* Slight partial scroll */
        await page.evaluate(() => window.scrollBy(0, 300));
        await new Promise(r => setTimeout(r, 2000));

        /* Extract Data */
        const data = await page.evaluate(() => {
            const getSafeText = (selector, parent = document) => {
                const el = parent.querySelector(selector);
                return el ? el.innerText.trim() : null;
            };

            // Limit scope to the main article if possible to avoid picking up related posts
            const article = document.querySelector('article') || document;

            /* Author & Username */
            let username = null;
            let accountName = null;

            /* Meta Title Strategy - Most Reliable for Name */
            /* Format: "Name (@username) on Threads" */
            const metaTitle = document.querySelector('meta[property="og:title"]')?.content || document.title;
            if (metaTitle && metaTitle.includes('(@')) {
                const parts = metaTitle.split('(@');
                accountName = parts[0].trim();
                username = parts[1].split(')')[0].trim();
            }

            /* Fallback to DOM for Name */
            const authorLink = Array.from(article.querySelectorAll('a[href^="/@"]')).find(a => {
                const href = a.getAttribute('href');
                return href && !href.includes('/post/');
            });

            if (authorLink) {
                const href = authorLink.getAttribute('href');
                if (!username) username = href.replace('/@', '').replace(/\/$/, '');

                if (!accountName || accountName === 'Thread' || accountName === 'Threads') {
                    const linkText = authorLink.innerText.split('\n')[0].trim();
                    if (linkText && linkText.length > 1) accountName = linkText;
                }
            }

            /* Final cleanup */
            if (accountName === 'Thread' || accountName === 'Threads') accountName = '';

            /* Post Text */
            let text = '';

            /* Strategy 1: og:description (usually contains the full text) */
            const metaDesc = document.querySelector('meta[property="og:description"]')?.content || document.querySelector('meta[name="description"]')?.content;
            if (metaDesc) {
                /* Description usually: "100 likes, 20 comments - Name (@user) on Threads: "Post text..."" */
                /* Or just the post text if short? */
                /* Actually Threads descriptions are usually cleanly the text or "Check out this post..." */

                /* Let's try to look for the colon that separates the "header" from "content" in meta desc */
                /* Example: "Mark Zuckerberg (@zuck) on Threads: \"70 million sign ups...\"" */
                if (metaDesc.includes(': "')) {
                    text = metaDesc.split(': "')[1];
                    /* Remove trailing quote */
                    if (text.endsWith('"')) text = text.slice(0, -1);
                } else if (metaDesc.includes(': ')) {
                    /* Sometimes just colon space */
                    text = metaDesc.split(': ')[1];
                } else {
                    text = metaDesc;
                }
            }

            /* Strategy 2: DOM */
            if (!text) {
                const textEl = article.querySelector('div[dir="auto"] > span') || article.querySelector('div[dir="auto"]');
                if (textEl) text = textEl.innerText.trim();
            }

            /* Stats - Likes, Replies, Reposts */
            let likes = '0';
            let replies = '0';
            let reposts = '0';

            /* Look for buttons with numbers */
            const buttons = Array.from(article.querySelectorAll('div[role="button"]'));

            const statButtons = buttons.filter(btn => {
                const txt = btn.innerText.trim();
                return /^\d+(\.\d+)?[KMB]?$/.test(txt);
            });

            if (statButtons.length > 0) likes = statButtons[0].innerText.trim();
            if (statButtons.length > 1) replies = statButtons[1].innerText.trim();
            if (statButtons.length > 2) reposts = statButtons[2].innerText.trim();

            /* Text Regex Fallback for Stats */
            if (likes === '0') {
                const textContent = article.innerText;
                const likeMatch = textContent.match(/(\d+(?:[.,]\d+)*[KMB]?)\s*likes?/i);
                if (likeMatch) likes = likeMatch[1];

                const replyMatch = textContent.match(/(\d+(?:[.,]\d+)*[KMB]?)\s*replies?/i);
                if (replyMatch) replies = replyMatch[1];

                const repostMatch = textContent.match(/(\d+(?:[.,]\d+)*[KMB]?)\s*reposts?/i);
                if (repostMatch) reposts = repostMatch[1];
            }

            /* Media Extraction */
            const media = [];
            let type = 'text';

            /* Images */
            const images = article.querySelectorAll('img');
            images.forEach(img => {
                const src = img.src;
                /* legitimate images usually have alt text or significant size */
                if (src && img.clientWidth > 200) {
                    /* Exclude profile pic (often matches author link) */
                    if (username && src.includes(username)) return;
                    media.push(src);
                    type = 'image';
                }
            });

            /* Videos */
            const videos = article.querySelectorAll('video');
            videos.forEach(v => {
                if (v.src) {
                    media.push(v.src);
                    type = 'video';
                }
            });

            /* Clean up media duplicates if any */
            const uniqueMedia = [...new Set(media)];

            return {
                account_name: accountName,
                username: username,
                text: text,
                stats: {
                    likes: likes,
                    replies: replies,
                    reposts: reposts
                },
                media_type: type,
                media: uniqueMedia
            };
        });

        res.json({
            status: true,
            creator: "yemobyte",
            result: data
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: 'Failed to scrape Threads URL',
            error: error.message
        });
    } finally {
        if (browser) await browser.close();
    }
});

module.exports = router;
