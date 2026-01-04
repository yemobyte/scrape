const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
const { connect } = require('puppeteer-real-browser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const BASE_URL = 'https://www.xnxx.com';
const author = 'Yemobyte';

/* Browser Manager to reuse session */
let browser = null;
let page = null;

async function getBrowser() {
    if (!browser || !browser.isConnected()) {
        const { browser: connectedBrowser, page: connectedPage } = await connect({
            headless: 'auto',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        browser = connectedBrowser;
        page = connectedPage;
    }
    return page;
}

/* Helper to fetch HTML content using Puppeteer */
async function fetchHtml(url) {
    const p = await getBrowser();
    await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    return await p.content();
}

/* Home / Latest Function */
async function scrapeHome() {
    try {
        const html = await fetchHtml(BASE_URL);
        const $ = cheerio.load(html);
        const result = [];

        $('.thumb-block').each((i, el) => {
            const title = $(el).find('.thumb-under p a').attr('title') || $(el).find('.thumb-under p a').text();
            let link = $(el).find('.thumb-under p a').attr('href');
            if (link && !link.startsWith('http')) link = BASE_URL + link;

            const thumb = $(el).find('.thumb-inside img').attr('data-src') || $(el).find('.thumb-inside img').attr('src');
            const duration = $(el).find('.thumb-inside .duration').text();

            if (title && link) {
                result.push({ title, link, thumb, duration });
            }
        });

        return { status: true, author, data: result };
    } catch (e) {
        return { status: false, author, message: e.message };
    }
}

/* Search Function */
async function scrapeSearch(query) {
    try {
        const searchUrl = `${BASE_URL}/search/${encodeURIComponent(query)}`;
        const html = await fetchHtml(searchUrl);
        const $ = cheerio.load(html);
        const result = [];

        $('.thumb-block').each((i, el) => {
            const title = $(el).find('.thumb-under p a').attr('title') || $(el).find('.thumb-under p a').text();
            let link = $(el).find('.thumb-under p a').attr('href');
            if (link && !link.startsWith('http')) link = BASE_URL + link;

            const thumb = $(el).find('.thumb-inside img').attr('data-src') || $(el).find('.thumb-inside img').attr('src');

            if (title && link) {
                result.push({ title, link, thumb });
            }
        });

        return { status: true, author, data: result };
    } catch (e) {
        return { status: false, author, message: e.message };
    }
}

/* Category List */
async function scrapeCategories() {
    try {
        const html = await fetchHtml(`${BASE_URL}/tags`);
        const $ = cheerio.load(html);
        const result = [];

        $('#tags-cloud a').each((i, el) => {
            const name = $(el).text();
            let link = $(el).attr('href');
            if (link && !link.startsWith('http')) link = BASE_URL + link;

            if (name && link) result.push({ name, link });
        });

        return { status: true, author, data: result };
    } catch (e) {
        return { status: false, author, message: e.message };
    }
}

/* Detail & Stream (Extract High/Low/HLS) */
async function scrapeDetail(url) {
    try {
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        const title = $('meta[property="og:title"]').attr('content');
        const thumb = $('meta[property="og:image"]').attr('content');

        /* Direct extraction from text for robust setVideoUrl matching */
        const highMatch = html.match(/html5player\.setVideoUrlHigh\('([^']+)'\)/);
        const lowMatch = html.match(/html5player\.setVideoUrlLow\('([^']+)'\)/);
        const hlsMatch = html.match(/html5player\.setVideoHLS\('([^']+)'\)/);

        return {
            status: true,
            author,
            data: {
                title,
                thumb,
                streams: {
                    low: lowMatch ? lowMatch[1] : null,
                    high: highMatch ? highMatch[1] : null,
                    hls: hlsMatch ? hlsMatch[1] : null
                }
            }
        };
    } catch (e) {
        return { status: false, author, message: e.message };
    }
}

/* Routes */
app.get('/', async (req, res) => {
    const result = await scrapeHome();
    res.json(result);
});

app.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ status: false, author, message: 'Query required' });
    const result = await scrapeSearch(q);
    res.json(result);
});

app.get('/categories', async (req, res) => {
    const result = await scrapeCategories();
    res.json(result);
});

app.get('/detail', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.json({ status: false, author, message: 'URL required' });
    const result = await scrapeDetail(url);
    res.json(result);
});

app.listen(PORT, () => console.log(`XNXX Scraper (Puppeteer) running on port ${PORT}`));
