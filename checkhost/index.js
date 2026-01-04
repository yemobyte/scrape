const express = require('express');
const cors = require('cors');
const { connect } = require('puppeteer-real-browser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const author = 'Yemobyte';

/* CheckHost Scraper */
async function scrapeCheckHost(domain, type = 'http') {
    let browser = null;

    try {
        const { browser: connectedBrowser, page } = await connect({
            headless: 'auto',
            turnstile: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        browser = connectedBrowser;

        /* Construct URL directly to trigger check */
        /* Types: http, ping, tcp-port, udp-port, dns, info */
        const checkUrl = `https://check-host.net/check-${type}?host=${encodeURIComponent(domain)}`;

        await page.goto(checkUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        /* Wait for results */
        try {
            /* Try waiting for the specific result container/table */
            await page.waitForSelector('#node_results', { timeout: 15000 });
        } catch (e) {
            console.log('Timeout waiting for #node_results');
        }

        /* Sometimes it requires clicking a button if direct URL is just a form */
        /* But usually check-host.net starts auto. */

        /* Wait for rows to appear */
        try {
            await page.waitForFunction(() => document.querySelectorAll('tr').length > 5, { timeout: 15000 });
        } catch (e) { }

        const resultData = await page.evaluate(() => {
            /* Try generic table search */
            const tables = document.querySelectorAll('table');
            let targetTable = null;

            /* Find the table with results (usually has many rows) */
            for (const t of tables) {
                if (t.querySelectorAll('tr').length > 3) {
                    targetTable = t;
                    break;
                }
            }

            if (!targetTable) return null;

            const rows = Array.from(targetTable.querySelectorAll('tr'));
            const data = [];

            rows.forEach(row => {
                const cols = row.querySelectorAll('td');
                if (cols.length < 2) return;

                /* Detect CheckHost table specific structure */
                const locationCell = cols[0];
                const resultCell = cols[cols.length - 1]; /* Last cell usually has result/time */

                const countryImg = locationCell.querySelector('img.flag');
                const country = countryImg ? (countryImg.alt || countryImg.title) : '';
                const location = locationCell.innerText.replace(country, '').trim();

                /* Result text */
                const result = Array.from(cols).slice(1).map(c => c.innerText.trim()).join(' | ');

                if (location && result) {
                    data.push({
                        location,
                        country,
                        result
                    });
                }
            });
            return data;
        });

        await browser.close();

        if (!resultData || resultData.length === 0) {
            return { status: false, author, message: 'No data found or timeout' };
        }

        return {
            status: true,
            author,
            check_type: type,
            target: domain,
            data: resultData
        };

    } catch (e) {
        if (browser) await browser.close();
        return { status: false, author, message: e.message };
    }
}

app.get('/checkhost', async (req, res) => {
    const { domain, type } = req.query;
    if (!domain) return res.json({ status: false, author, message: 'Domain required' });

    /* Default to HTTP check if not specified */
    const checkType = type || 'http';

    const result = await scrapeCheckHost(domain, checkType);
    res.json(result);
});

app.listen(PORT, () => console.log(`CheckHost Scraper running on port ${PORT}`));
