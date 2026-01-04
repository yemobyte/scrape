const express = require('express');
const cors = require('cors');
const { connect } = require('puppeteer-real-browser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

async function solveTurnstile(targetUrl, siteKey) {
    let browser = null;
    try {
        const { browser: connectedBrowser, page } = await connect({
            headless: 'auto',
            turnstile: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1200,800', '--disable-blink-features=AutomationControlled']
        });
        browser = connectedBrowser;

        // If siteKey is provided, we might want to inject a widget if it's not present?
        // But usually we just visit the URL.
        console.log('Navigating to:', targetUrl);
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for widget to appear
        try {
            await page.waitForSelector('iframe[src*="challenges"]', { timeout: 10000 });
        } catch (e) {
            console.log('Widget iframe not found immediately...');
        }

        // Wait for success token
        const token = await page.evaluate(async () => {
            const sleep = ms => new Promise(r => setTimeout(r, ms));
            let attempts = 0;
            while (attempts < 40) { // 40 seconds
                // 1. Check Input
                const input = document.querySelector('[name="cf-turnstile-response"]');
                if (input && input.value) return input.value;

                // 2. Check Global
                // @ts-ignore
                if (window.turnstile) {
                    try {
                        // @ts-ignore
                        const resp = window.turnstile.getResponse();
                        if (resp) return resp;
                    } catch (e) { }
                }

                // 3. Try clicking if unchecked
                // We can't easily click from inside evaluate if it's an iframe, 
                // but we can check if there's a click listener wrapper? 
                // Usually puppeteer-real-browser extension handles the click.

                await sleep(1000);
                attempts++;
            }
            return null;
        });

        await browser.close();

        if (token) return token;
        throw new Error('Timeout: Turnstile not solved (Token not found).');

    } catch (e) {
        if (browser) await browser.close();
        throw e;
    }
}

app.get('/', (req, res) => {
    res.json({
        status: true,
        author: 'YT',
        service: 'CF Turnstile Solver',
        desc: 'Solves Turnstile by launching a real browser',
        endpoint: 'POST /tools/bypass/cf-turnstile'
    });
});

app.post('/tools/bypass/cf-turnstile', async (req, res) => {
    try {
        const { url, siteKey } = req.body;
        if (!url) return res.status(400).json({ status: false, message: 'URL required' });

        const token = await solveTurnstile(url, siteKey);

        res.json({
            status: true,
            result: token
        });

    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

app.listen(PORT, () => console.log(`CF Bypass Server running on port ${PORT}`));
