const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = 'https://9anime.me.uk';

app.use(cors());
app.set('json spaces', 2);

/* Config axios */
const client = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': BASE_URL
    },
    timeout: 10000
});

async function getCheerio(url) {
    const { data } = await client.get(url);
    return cheerio.load(data);
}

/* Home Endpoint */
app.get('/animedao/home', async (req, res) => {
    try {
        const $ = await getCheerio(BASE_URL);
        const latest = [];
        const popular = [];

        /* Latest Release */
        $('.tip').each((i, el) => {
            const title = $(el).attr('title');
            const link = $(el).attr('href');
            const image = $(el).find('img').attr('src');

            if (title && link) {
                latest.push({
                    title: title.replace('Watch ', '').replace(' Online Free', ''),
                    slug: link.split('/').filter(Boolean).pop(),
                    image,
                    link
                });
            }
        });

        /* Popular (Assuming structure based on analysis: a.series) */
        /* If .series not found, we might need to inspect popular section manually or skip */
        $('a.series').each((i, el) => {
            const title = $(el).find('.series-title').text() || $(el).attr('title') || $(el).text();
            const link = $(el).attr('href');
            const image = $(el).find('img').attr('src');

            if (link) {
                popular.push({
                    title: title.trim(),
                    slug: link.split('/').filter(Boolean).pop(),
                    image,
                    link
                });
            }
        });

        res.json({
            status: true,
            data: {
                latest,
                popular
            }
        });

    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Anime Detail Endpoint */
app.get('/animedao/anime/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const url = `${BASE_URL}/series/${slug}/`;
        const $ = await getCheerio(url);

        const title = $('h1').text().trim();
        const image = $('.series-image img').attr('src') || $('.content-more img').attr('src');

        /* Synopsis Extraction - Complex logic due to structure */
        let synopsis = '';
        /* Try finding "Description" header or similar */
        $('h2, h3, strong, b').each((i, el) => {
            if ($(el).text().includes('Description') || $(el).text().includes('Synopsis')) {
                synopsis = $(el).parent().text().replace('Description', '').replace('Synopsis', '').trim();
            }
        });
        if (!synopsis) {
            synopsis = $('.series-description').text().trim() || $('.content-more').text().trim();
        }

        /* Episodes */
        const episodes = [];
        $('.ep-item').each((i, el) => {
            const link = $(el).attr('href');
            const title = $(el).text().trim() || $(el).attr('title');
            if (link) {
                episodes.push({
                    title: title,
                    slug: link.split('/').filter(Boolean).pop(),
                    link
                });
            }
        });

        res.json({
            status: true,
            data: {
                title,
                image,
                synopsis,
                episode_count: episodes.length,
                episodes
            }
        });

    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Episode Stream Endpoint */
app.get('/animedao/episode/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        /* Handle if slug includes 'series/' or not, usually episode slug is direct */
        const url = `${BASE_URL}/${slug}`;
        const $ = await getCheerio(url);

        const title = $('h1').text().trim();
        const iframeSrc = $('iframe').attr('src');

        /* Check if iframe is from known sources */
        const stream_url = iframeSrc;

        res.json({
            status: true,
            data: {
                title,
                stream_url,
                original_url: url
            }
        });

    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Search Endpoint (Experimental) */
app.get('/animedao/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ status: false, message: 'Query param required' });

        /* Guessing search URL structure: /?s=query */
        const url = `${BASE_URL}/?s=${encodeURIComponent(query)}`;
        const $ = await getCheerio(url);

        const results = [];
        $('.tip').each((i, el) => {
            const title = $(el).attr('title');
            const link = $(el).attr('href');
            const image = $(el).find('img').attr('src');

            if (title && link) {
                results.push({
                    title: title.replace('Watch ', '').replace(' Online Free', ''),
                    slug: link.split('/').filter(Boolean).pop(),
                    image,
                    link
                });
            }
        });

        res.json({
            status: true,
            data: results
        });

    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Home API/Documentation */
app.get('/', (req, res) => {
    res.json({
        status: true,
        message: 'Animedao (9anime) Scraper API',
        endpoints: {
            home: '/animedao/home',
            anime_detail: '/animedao/anime/:slug',
            episode_stream: '/animedao/episode/:slug',
            search: '/animedao/search?query=naruto'
        },
        author: 'Yemobyte'
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
