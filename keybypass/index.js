const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = 3001;
const SESSION_FILE = path.join(__dirname, 'session.json');

app.use(cors());
app.use(express.json());

/* Configuration */
const SITE_URL = 'https://keybypass.net';

/* Scraper with Cookie Support */
app.post('/bypass', async (req, res) => {
    let browser;
    try {
        const { url, cookies } = req.body;

        if (!url) {
            return res.status(400).json({ status: false, message: 'URL is required' });
        }

        browser = await puppeteer.launch({
            headless: false, /* Headless false to allow "Prime" solve if needed */
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });

        /* Inject Cookies if provided */
        if (cookies && Array.isArray(cookies)) {
            await page.setCookie(...cookies);
        } else if (fs.existsSync(SESSION_FILE)) {
            /* Use saved session if exists */
            const savedCookies = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
            await page.setCookie(...savedCookies);
        }

        /* Navigate to page */
        await page.goto(SITE_URL, { waitUntil: 'networkidle2' });

        /* Check if we are already "solved" or need challenge */
        /* Input URL */
        await page.waitForSelector('#url-input');
        await page.type('#url-input', url);

        /* Submit */
        await page.click('#bypass-btn');

        try {
            /* Wait for result or captcha */
            await page.waitForSelector('.result-container', { timeout: 15000 });

            /* Save session after successful bypass */
            const currentCookies = await page.cookies();
            fs.writeFileSync(SESSION_FILE, JSON.stringify(currentCookies, null, 2));

            const result = await page.evaluate(() => {
                const res = document.querySelector('.result-text');
                return res ? res.innerText.trim() : null;
            });

            if (result) {
                return res.json({ status: true, data: { result } });
            }
        } catch (err) {
            /* Detect Captcha */
            const needsCaptcha = await page.evaluate(() => {
                return !!document.querySelector('iframe[src*="hcaptcha"]');
            });

            if (needsCaptcha) {
                return res.status(403).json({
                    status: false,
                    message: 'hCaptcha detected. Solve it manually in the opened browser or provide cookies.',
                    sitekey: 'a32c1138-88bc-4f6a-b466-a622acba2376'
                });
            }

            return res.status(400).json({ status: false, message: 'Bypass failed or timeout' });
        }

    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    } finally {
        /* We keep browser open for a bit if it's headful? No, better close or manage. */
        /* For this specific request, we close. */
        if (browser) await browser.close();
    }
});

/* Endpoint to save session manually */
app.post('/save-session', async (req, res) => {
    try {
        const { cookies } = req.body;
        if (!cookies) return res.status(400).json({ status: false, message: 'Cookies required' });

        fs.writeFileSync(SESSION_FILE, JSON.stringify(cookies, null, 2));
        res.json({ status: true, message: 'Session saved successfully' });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Home API/Documentation */
app.get('/', (req, res) => {
    res.json({
        status: true,
        message: 'KeyBypass Scraper API (Session Enabled)',
        endpoints: {
            bypass: 'POST /bypass {url, cookies?}',
            save_session: 'POST /save-session {cookies}',
            sitekey: 'GET /sitekey'
        }
    });
});

app.get('/sitekey', (req, res) => {
    res.json({ status: true, sitekey: 'a32c1138-88bc-4f6a-b466-a622acba2376' });
});

app.listen(PORT, () => console.log(`KeyBypass Scraper running on http://localhost:${PORT}`));
