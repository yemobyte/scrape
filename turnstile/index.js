const express = require('express');
const cors = require('cors');
const { connect } = require('puppeteer-real-browser');

const app = express();
const PORT = process.env.PORT || 7860;

app.use(cors());
app.use(express.json());
app.set('json spaces', 2);

/* Queue System for Rate Limiting */
const queue = [];
let isProcessing = false;

/* Navigation & Solve Logic */
async function processQueue() {
    if (isProcessing || queue.length === 0) return;
    isProcessing = true;

    const { url, resolve, reject } = queue.shift();

    let browser = null;
    let page = null;

    try {
        console.log(`[Queue] Processing: ${url}`);

        const { browser: connectedBrowser, page: connectedPage } = await connect({
            headless: 'auto',
            turnstile: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--window-size=1280,800'
            ]
        });
        browser = connectedBrowser;
        page = connectedPage;

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        /* Cloudflare Docs Logic: Wait for 'turnstile' object and 'getResponse' */
        let token = null;
        let retries = 0;
        const maxRetries = 40; /* 40 seconds */

        while (retries < maxRetries) {
            token = await page.evaluate(() => {
                /* Check via Official API */
                if (window.turnstile) {
                    try {
                        const response = window.turnstile.getResponse();
                        if (response) return response;
                    } catch (e) { }
                }

                /* Fallback: Hidden Input (Standard implementation) */
                const input = document.querySelector('[name="cf-turnstile-response"]');
                if (input && input.value) return input.value;

                return null;
            });

            if (token) break;

            await new Promise(r => setTimeout(r, 1000));
            retries++;
        }

        if (!token) throw new Error('Token retrieval timed out');

        /* Extract Data */
        const userAgent = await page.evaluate(() => navigator.userAgent);
        const cookies = await page.cookies();
        const cfClearance = cookies.find(c => c.name === 'cf_clearance')?.value || null;

        resolve({
            status: true,
            author: 'Yemobyte',
            message: 'Success',
            data: {
                token,
                cf_clearance: cfClearance,
                user_agent: userAgent,
                cookies
            }
        });

    } catch (error) {
        console.error(`[Error] ${error.message}`);
        resolve({
            status: false,
            author: 'Yemobyte',
            message: error.message
        });
    } finally {
        if (browser) await browser.close();

        /* 5 Seconds Delay Mechanism */
        console.log('[Queue] Waiting 5 seconds before next task...');
        setTimeout(() => {
            isProcessing = false;
            processQueue();
        }, 5000);
    }
}

/* API Endpoints */
app.get('/', (req, res) => {
    res.json({
        status: true,
        author: 'Yemobyte',
        message: 'Turnstile Solver with Queue System',
        queue_length: queue.length
    });
});

app.get('/turnstile', (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, message: 'URL required' });

    new Promise((resolve, reject) => {
        queue.push({ url, resolve, reject });
        processQueue();
    }).then(result => {
        const code = result.status ? 200 : 500;
        res.status(code).json(result);
    });
});

app.post('/turnstile', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ status: false, message: 'URL required' });

    new Promise((resolve, reject) => {
        queue.push({ url, resolve, reject });
        processQueue();
    }).then(result => {
        const code = result.status ? 200 : 500;
        res.status(code).json(result);
    });
});

app.listen(PORT, () => console.log(`Turnstile Solver with Queue running on port ${PORT}`));
