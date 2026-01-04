const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.set('json spaces', 2);

/* Helper to setup Axios instance with headers */
const createClient = () => {
    return axios.create({
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
    });
};

/* Scraper Functions */
async function searchSfile(query) {
    try {
        const client = createClient();
        const url = `https://sfile.mobi/search.php?q=${encodeURIComponent(query)}&search=Search`;
        const { data } = await client.get(url);
        const $ = cheerio.load(data);

        const results = [];
        $('.list').each((i, el) => {
            const a = $(el).find('a');
            const link = a.attr('href');
            const title = a.text().trim();
            const meta = $(el).text().replace(title, '').trim();
            /* Output example: "Size: 10MB" or similar */

            if (link && title && !link.includes('search.php')) {
                results.push({
                    title: title,
                    url: link,
                    meta: meta
                });
            }
        });

        return results;
    } catch (e) {
        throw new Error('Search failed: ' + e.message);
    }
}

async function getDownloadInfo(url) {
    try {
        const client = createClient();

        /* 1. Fetch Landing Page */
        const { data: landingHtml } = await client.get(url);
        const $ = cheerio.load(landingHtml);

        const filename = $('.intro-title, h1').first().text().trim();
        const downloadLink = $('#download').attr('href') || $('a.w3-button.w3-blue').attr('href');

        /* Parsing mimetype and size might be fragile due to layout changes */
        const mimetype = $('.list').text().split('-')[1]?.trim() || 'unknown';
        const size = $('.list').text().split('Size:')[1]?.split('\n')[0]?.trim() || 'unknown';

        if (!downloadLink) throw new Error('Download button not found. Link might be invalid or file deleted.');

        /* 2. Follow Information */
        /* Sfile usually has an intermediate page. */

        return {
            filename,
            size,
            mimetype,
            original_url: url,
            download_page: downloadLink
        };
    } catch (e) {
        throw new Error(e.message);
    }
}

/* Streaming logic from reference, upgraded with Cheerio/better flow */
async function streamFile(url, res) {
    try {
        const client = createClient();

        /* 1. Visit the verified download page */
        let targetUrl = url;
        if (url.includes('sfile.mobi') && !url.includes('download')) {
            /* It's a file page, resolve to download page first */
            const info = await getDownloadInfo(url);
            targetUrl = info.download_page;
        }

        /* 2. Request the Download Link */
        /* Axios follows redirects by default (up to 5). */

        const response = await client.get(targetUrl, {
            responseType: 'stream',
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 400
        });

        /* Extract Filename from headers if possible */
        let filename = 'file';
        const disposition = response.headers['content-disposition'];
        if (disposition) {
            const match = disposition.match(/filename=["']?([^"';]+)["']?/);
            if (match) filename = match[1];
        } else {
            /* Try to guess from URL */
            const parts = response.request.res.responseUrl.split('/');
            filename = parts[parts.length - 1];
        }

        /* Pipe data to response */
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
        res.setHeader('Content-Length', response.headers['content-length'] || '');

        response.data.pipe(res);

    } catch (e) {
        console.error('Stream Error:', e.message);
        if (!res.headersSent) res.status(500).json({ status: false, message: 'Stream failed: ' + e.message });
    }
}


/* Routes */
app.get('/', (req, res) => {
    res.json({
        status: true,
        author: 'Yemo',
        description: 'Sfile.mobi Scraper API',
        endpoints: {
            search: '/sfile/search?q=...',
            download: '/sfile/download?url=...',
            stream: '/sfile/stream?url=...'
        }
    });
});

app.get('/sfile/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ status: false, message: 'Query required' });

        const results = await searchSfile(q);
        res.json({
            status: true,
            author: 'Yemo',
            data: results
        });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

app.get('/sfile/download', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, message: 'URL required' });

        const info = await getDownloadInfo(url);

        /* Construct a stream URL for convenience */
        const streamUrl = `${req.protocol}://${req.get('host')}/sfile/stream?url=${encodeURIComponent(url)}`;

        res.json({
            status: true,
            author: 'Yemo',
            data: {
                ...info,
                stream_url: streamUrl
            }
        });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

app.get('/sfile/stream', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('URL required');
    await streamFile(url, res);
});

app.listen(PORT, () => console.log(`Sfile Scraper running on http://localhost:${PORT}`));
