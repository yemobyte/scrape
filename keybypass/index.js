const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cors = require('cors');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

/* Configuration */
const SITE_URL = 'https://keybypass.net';

/* Scrape Bypass Endpoint */
app.post('/bypass', async (req, res) => {
    let browser;
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ status: false, message: 'URL is required' });
        }

        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        /* Set viewport and user agent */
        await page.setViewport({ width: 1280, height: 720 });

        /* Navigate to page */
        await page.goto(SITE_URL, { waitUntil: 'networkidle2' });

        /* Input URL */
        await page.waitForSelector('input[placeholder*="Enter link"]');
        await page.type('input[placeholder*="Enter link"]', url);

        /* Solve hCaptcha manually or via extension is needed here if it blocks */
        /* Since this is a automated scrape, we trigger the bypass if possible */
        /* Note: Site strictly requires hCaptcha token. This headless method 
           will still prompt for captcha unless a solver is integrated. */

        await page.click('#bypass-btn');

        /* Wait for result or captcha challenge */
        /* This is a demonstration of how the scrape would look */

        /* Success check: result-container might appear after bypass */
        try {
            await page.waitForSelector('.result-container', { timeout: 10000 });
            const result = await page.evaluate(() => {
                const res = document.querySelector('.result-text');
                return res ? res.innerText.trim() : null;
            });

            if (result) {
                return res.json({ status: true, data: { result } });
            }
        } catch (err) {
            /* If timeout, likely blocked by hCaptcha */
            return res.status(403).json({
                status: false,
                message: 'hCaptcha challenge detected. Manual intervention or solver required.',
                note: 'Sitekey: a32c1138-88bc-4f6a-b466-a622acba2376'
            });
        }

    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    } finally {
        if (browser) await browser.close();
    }
});

/* Helper endpoint - Get Sitekey */
app.get('/sitekey', (req, res) => {
    res.json({
        status: true,
        data: {
            sitekey: 'a32c1138-88bc-4f6a-b466-a622acba2376',
            target: SITE_URL
        }
    });
});

/* Home API/Documentation */
app.get('/', (req, res) => {
    res.json({
        status: true,
        message: 'KeyBypass Scraper API (Headless)',
        endpoints: {
            bypass: {
                method: 'POST',
                path: '/bypass',
                body: { url: 'https://link-target.net/...' }
            },
            sitekey: '/sitekey'
        },
        testing_urls: {
            pastebin: 'https://pastebin.com/raw/u9mQfyz8'
        }
    });
});

app.listen(PORT, () => console.log(`KeyBypass Scraper running on http://localhost:${PORT}`));
