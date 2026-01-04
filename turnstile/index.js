const express = require('express');
const cors = require('cors');
const { connect } = require('puppeteer-real-browser');

const app = express();
const PORT = process.env.PORT || 7860;

app.use(cors());
app.use(express.json());
app.set('json spaces', 2);

/* Global Browser Instance Lock */
let browserLock = false;

/* Turnstile Solver Logic based on Cloudflare Documentation */
/* Reference: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/ */
async function solveTurnstile(url) {
    if (browserLock) {
        return { status: false, message: 'Server busy, please try again.' };
    }
    browserLock = true;
    let browser = null;
    let page = null;

    try {
        /* Connect using Puppeteer Real Browser to mimic genuine user interaction */
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

        /* Navigate to the target URL containing the Cloudflare Turnstile widget */
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        /* Wait for the Turnstile widget to initialize and render */
        /* We monitor the window.turnstile object and the hidden input field */

        let token = null;
        let maxRetries = 40; /* 40 seconds timeout */

        while (maxRetries > 0) {
            token = await page.evaluate(() => {
                /* Method 1: Check standard hidden input field */
                /* Cloudflare automatically injects this field upon success */
                const hiddenInput = document.querySelector('[name="cf-turnstile-response"]');
                if (hiddenInput && hiddenInput.value) {
                    return hiddenInput.value;
                }

                /* Method 2: Use Official Turnstile API if available in global scope */
                if (window.turnstile && typeof window.turnstile.getResponse === 'function') {
                    const response = window.turnstile.getResponse();
                    if (response) return response;
                }

                /* Method 3: Detect and Click DOM Element if token is missing */
                /* Some sites like teraboxdl.site have a visible checkbox that needs a click */
                /* This is a "dumb" click attempt if the auto-solver didn't catch it yet */
                const checkbox = document.querySelector('.cf-turnstile iframe') || document.querySelector('.cf-turnstile');
                if (checkbox) {
                    /* Only return 'click_needed' to signal main loop to perform action */
                    /* We don't click inside evaluate context usually */
                    return 'click_needed';
                }

                return null;
            });

            if (token === 'click_needed') {
                /* Perform a real click on the widget location */
                try {
                    await page.click('.cf-turnstile');
                    await new Promise(r => setTimeout(r, 2000)); /* Wait for possible solve */
                } catch (e) { }
                token = null; /* Reset and check again */
            }

            if (token && token !== 'click_needed') break;

            /* Wait 1 second before next check */
            await new Promise(r => setTimeout(r, 1000));
            maxRetries--;
        }

        if (!token) {
            throw new Error('Timeout: Failed to retrieve Turnstile token.');
        }

        /* Extract Execution Metadata */
        const userAgent = await page.evaluate(() => navigator.userAgent);

        /* Extract Cookies including cf_clearance */
        const cookies = await page.cookies();
        const cfClearance = cookies.find(c => c.name === 'cf_clearance')?.value || null;

        await browser.close();
        browserLock = false;

        return {
            status: true,
            author: 'Yemobyte',
            message: 'Successfully solved Turnstile challenge',
            data: {
                token: token,
                cf_clearance: cfClearance,
                user_agent: userAgent,
                cookies: cookies
            }
        };

    } catch (error) {
        /* Ensure browser is closed on error */
        if (browser) await browser.close();
        browserLock = false;

        /* Error Logging */
        console.error('Turnstile Solver Error:', error.message);

        return {
            status: false,
            author: 'Yemobyte',
            message: error.message
        };
    }
}

/* API Route Definition */
app.get('/', (req, res) => {
    res.json({
        status: true,
        author: 'Yemobyte',
        documentation: 'Cloudflare Turnstile Solver based on Puppeteer Real Browser',
        endpoints: {
            method: 'GET/POST',
            path: '/turnstile',
            params: { url: 'https://example.com' }
        }
    });
});

app.get('/turnstile', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, message: 'URL parameter is required' });

    const result = await solveTurnstile(url);
    const code = result.status ? 200 : 500;
    res.status(code).json(result);
});

app.post('/turnstile', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ status: false, message: 'URL parameter is required in body' });

    const result = await solveTurnstile(url);
    const code = result.status ? 200 : 500;
    res.status(code).json(result);
});

/* Server Initialization */
app.listen(PORT, () => {
    console.log(`Turnstile Solver API running on port ${PORT}`);
});
