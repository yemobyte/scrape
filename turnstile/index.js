const express = require('express');
const cors = require('cors');
const { connect } = require('puppeteer-real-browser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.set('json spaces', 2);

/* Turnstile Solver Function */
async function solveTurnstile(url) {
    let browser = null;
    try {
        const { browser: connectedBrowser, page } = await connect({
            headless: 'auto',
            turnstile: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
        });
        browser = connectedBrowser;

        /* Go to validation page */
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        /* Wait for Turnstile Widget to be "solved" */
        /* The solver within puppeteer-real-browser should handle the click */
        /* We just need to wait for the token to appear in the DOM or hidden input */

        let token = null;
        let attempts = 0;

        while (!token && attempts < 30) {
            token = await page.evaluate(() => {
                /* Check hidden input often used by CF/Turnstile */
                const input = document.querySelector('[name="cf-turnstile-response"]');
                if (input && input.value) return input.value;

                /* Check global turnstile object */
                if (window.turnstile) {
                    try {
                        return window.turnstile.getResponse();
                    } catch (e) { }
                }
                return null;
            });
            await new Promise(r => setTimeout(r, 1000));
            attempts++;
        }

        /* User agent extraction */
        const userAgent = await page.evaluate(() => navigator.userAgent);

        /* Cookie Extraction (Important for cf_clearance) */
        const cookies = await page.cookies();
        const cfClearance = cookies.find(c => c.name === 'cf_clearance')?.value;

        await browser.close();

        if (!token) throw new Error('Turnstile token verification timeout.');

        return {
            status: true,
            author: 'Yemobyte',
            data: {
                token: token,
                cf_clearance: cfClearance || null,
                user_agent: userAgent,
                cookies: cookies /* Return all cookies for completeness */
            }
        };

    } catch (e) {
        console.error('Turnstile Solver Error:', e);
        if (browser) await browser.close();
        return {
            status: false,
            message: e.message
        };
    }
}

app.get('/', (req, res) => {
    res.json({
        status: true,
        author: 'Yemobyte',
        description: 'Turnstile Solver API',
        endpoints: {
            solve: '/turnstile?url=...'
        }
    });
});

/* Handle both GET and POST */
app.get('/turnstile', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, message: 'URL required' });

    const result = await solveTurnstile(url);
    if (!result.status) return res.status(500).json(result);
    res.json(result);
});

app.post('/turnstile', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ status: false, message: 'URL required' });

    const result = await solveTurnstile(url);
    if (!result.status) return res.status(500).json(result);
    res.json(result);
});

app.listen(PORT, () => console.log(`Turnstile Solver running on http://localhost:${PORT}`));
