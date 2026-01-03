const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.set('json spaces', 2);

/* Config axios with specific MediaFire headers */
const client = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.mediafire.com/'
    },
    maxRedirects: 5
});

/* Helper to fetch and load cheerio */
async function getCheerio(url) {
    /* Handle redirect properly by letting axios follow */
    const { data } = await client.get(url);
    return cheerio.load(data);
}

/* Format size helper */
function formatSize(sizeStr) {
    if (!sizeStr) return 'Unknown';
    return sizeStr.replace(/\s+/g, ' ').trim();
}

/* Main MediaFire Scraper Endpoint */
app.get('/mediafire/download', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ status: false, message: 'URL parameter required' });
        }

        /* Load Page */
        const $ = await getCheerio(url);

        /* Extract Data */
        const link = $('#downloadButton').attr('href');
        const name = $('.dl-btn-label').attr('title') ||
            $('.filename').first().text().trim() ||
            $('meta[property="og:title"]').attr('content');

        /* Extract file info from details list */
        let filesize = '';
        let uploadDate = '';
        let hash = '';

        $('.details li').each((i, el) => {
            const label = $(el).find('span').first().text().trim();
            const value = $(el).find('span').last().text().trim();

            /* File Size check */
            if (label.includes('File size') || $(el).text().includes('MB') || $(el).text().includes('KB') || $(el).text().includes('GB')) {
                if (!filesize) filesize = $(el).find('span').text().trim() || $(el).text().trim();
            }
            /* Upload Date check */
            if (label.includes('Uploaded')) {
                uploadDate = value;
            }
        });

        /* If filesize not found in list, try text inside button */
        if (!filesize) {
            const btnText = $('#downloadButton').text();
            const match = btnText.match(/\((.*?)\)/);
            if (match) filesize = match[1];
        }

        /* Check success */
        if (link) {
            res.json({
                status: true,
                data: {
                    filename: name,
                    filesize: formatSize(filesize),
                    filetype: name ? name.split('.').pop() : 'unknown',
                    upload_date: uploadDate,
                    link: link,
                    original_url: url
                }
            });
        } else {
            /* Try to find alternative download link if main button missing (e.g. folder structure or parsing error) */
            const altLink = $('a[aria-label="Download file"]').attr('href');
            if (altLink) {
                res.json({
                    status: true,
                    data: {
                        filename: name,
                        filesize: formatSize(filesize),
                        link: altLink,
                        original_url: url
                    }
                });
            } else {
                res.status(404).json({ status: false, message: 'Download link not found. File might be deleted or password protected.' });
            }
        }

    } catch (e) {
        console.error(e);
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Home Route */
app.get('/', (req, res) => {
    res.json({
        status: true,
        message: 'MediaFire Scraper Ready',
        endpoint: '/mediafire/download?url=YOUR_MEDIAFIRE_URL',
        author: 'Yemobyte'
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
