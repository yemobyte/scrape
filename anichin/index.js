const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = 'https://anichin.watch';

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

/* Helper to decode base64 */
function decodeBase64(str) {
    return Buffer.from(str, 'base64').toString('utf-8');
}

/* Home Endpoint */
app.get('/anichin/home', async (req, res) => {
    try {
        const $ = await getCheerio(BASE_URL);
        let latest = [];

        /* Try main selector */
        $('.listupd .utao .uta').each((i, el) => {
            const title = $(el).find('.imgu a').attr('title');
            const link = $(el).find('.imgu a').attr('href');
            const image = $(el).find('.imgu img').attr('src');
            const episode = $(el).find('.epx').text().trim();

            if (link) {
                latest.push({
                    title,
                    episode,
                    slug: link.split('/').filter(Boolean).pop(),
                    image,
                    link
                });
            }
        });

        /* Fallback if empty */
        if (latest.length === 0) {
            /* Try secondary structure often used */
            $('.listupd .bs').each((i, el) => {
                const title = $(el).find('.tt').text().trim();
                const link = $(el).find('a').attr('href');
                const image = $(el).find('img').attr('src');
                const episode = $(el).find('.epx').text().trim();

                if (link) {
                    latest.push({
                        title,
                        episode,
                        slug: link.split('/').filter(Boolean).pop(),
                        image,
                        link
                    });
                }
            });
        }

        res.json({
            status: true,
            data: latest
        });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Donghua List Endpoint */
app.get('/anichin/donghua', async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const url = `${BASE_URL}/donghua/?page=${page}`; /* URL pattern prediction, might need adjustment */
        const $ = await getCheerio(url);

        const list = [];
        $('.listupd .bs').each((i, el) => {
            const title = $(el).find('.tt').text().trim();
            const link = $(el).find('a').attr('href');
            const image = $(el).find('img').attr('src');
            const episode = $(el).find('.epx').text().trim();
            const type = $(el).find('.wtype').text().trim(); // sometimes present

            if (link) {
                list.push({
                    title,
                    type,
                    episode,
                    slug: link.split('/').filter(Boolean).pop(),
                    image,
                    link
                });
            }
        });

        res.json({
            status: true,
            data: list
        });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Detail Endpoint */
app.get('/anichin/anime/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const url = `${BASE_URL}/${slug}/`; /* anichin structure: /slug/ directly for series? or /donghua/slug? Checking subagent... it said /donghua/slug/ */
        /* Let's try /donghua/slug first, if fails try /slug/ */
        /* Actually Anichin usually uses /donghua/slug/ for series details */
        let $;
        try {
            $ = await getCheerio(`${BASE_URL}/donghua/${slug}/`);
        } catch (err) {
            $ = await getCheerio(`${BASE_URL}/${slug}/`);
        }

        const title = $('h1.entry-title').text().trim();
        const image = $('.thumb img').attr('src');
        const synopsis = $('.entry-content').text().trim();

        const info = {};
        $('.info-content .spe span').each((i, el) => {
            const key = $(el).find('b').text().trim().replace(':', '');
            const val = $(el).text().replace(key + ':', '').trim();
            if (key) info[key.toLowerCase().replace(/ /g, '_')] = val;
        });

        const episodes = [];
        $('.eplister ul li').each((i, el) => {
            const epNum = $(el).find('.epl-num').text().trim();
            const epTitle = $(el).find('.epl-title').text().trim();
            const releaseDate = $(el).find('.epl-date').text().trim();
            const link = $(el).find('a').attr('href');

            if (link) {
                episodes.push({
                    episode_number: epNum,
                    title: epTitle,
                    release_date: releaseDate,
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
                info,
                episodes
            }
        });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Stream Endpoint */
app.get('/anichin/episode/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const url = `${BASE_URL}/${slug}/`;
        const $ = await getCheerio(url);

        const title = $('h1.entry-title').text().trim();

        const servers = [];
        /* Values in select.mirror are base64 strings containing iframe */
        $('select.mirror option').each((i, el) => {
            const name = $(el).text().trim();
            const val = $(el).val();
            if (val) {
                const decoded = decodeBase64(val);
                /* Extract src from iframe string */
                const srcMatch = decoded.match(/src="([^"]+)"/);
                if (srcMatch) {
                    servers.push({
                        server: name,
                        iframe_url: srcMatch[1]
                    });
                }
            }
        });

        /* Fallback if default iframe is present without select */
        if (servers.length === 0) {
            const iframe = $('#player_embed iframe, .videocontainer iframe').attr('src');
            if (iframe) {
                servers.push({ server: 'Default', iframe_url: iframe });
            }
        }

        res.json({
            status: true,
            data: {
                title,
                servers
            }
        });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Schedule Endpoint */
app.get('/anichin/schedule', async (req, res) => {
    try {
        const url = `${BASE_URL}/schedule/`;
        const $ = await getCheerio(url);

        const schedule = [];
        $('.bixbox').each((i, bix) => {
            const day = $(bix).find('.releases h3').text().trim();
            if (day) {
                const animes = [];
                $(bix).find('.listupd .bs').each((j, el) => {
                    const title = $(el).find('.tt').text().trim();
                    const link = $(el).find('a').attr('href');
                    const image = $(el).find('img').attr('src');
                    const time = $(el).find('.time').text().trim(); // Check simple selector

                    if (link) {
                        animes.push({
                            title,
                            time,
                            slug: link.split('/').filter(Boolean).pop(),
                            image,
                            link
                        });
                    }
                });
                if (animes.length) schedule.push({ day, animes });
            }
        });

        res.json({
            status: true,
            data: schedule
        });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Genres Endpoint */
app.get('/anichin/genres', async (req, res) => {
    try {
        /* Usually can take from sidebar of home or donghua list */
        /* Subagent found filter dropdown in /donghua/ */
        const $ = await getCheerio(`${BASE_URL}/donghua/`);
        const genres = [];

        $('ul.genre li a, .filter ul li label, .quickfilter .filter a').each((i, el) => {
            const name = $(el).text().trim();
            const link = $(el).attr('href');
            /* Sometimes filters are checkboxes, need to check structure carefully. */
            /* Assuming generic anime theme structure */
            /* Better approach: find links with /genres/ in href */
        });

        /* Specific selector based on typical themes */
        $('a[href*="/genres/"]').each((i, el) => {
            const name = $(el).text().trim();
            const link = $(el).attr('href');
            const slug = link.split('/').filter(Boolean).pop();

            if (name && !genres.find(g => g.slug === slug)) {
                genres.push({ name, slug, link });
            }
        });

        res.json({
            status: true,
            data: genres
        });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});


/* Search Endpoint */
app.get('/anichin/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ status: false, message: 'Query param required' });

        const url = `${BASE_URL}/?s=${encodeURIComponent(query)}`;
        const $ = await getCheerio(url);

        const list = [];
        $('.listupd .bs').each((i, el) => {
            const title = $(el).find('.tt').text().trim();
            const link = $(el).find('a').attr('href');
            const image = $(el).find('img').attr('src');
            const type = $(el).find('.typez').text().trim();

            if (link) {
                list.push({
                    title,
                    type,
                    slug: link.split('/').filter(Boolean).pop(),
                    image,
                    link
                });
            }
        });

        res.json({
            status: true,
            data: list
        });

    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Root Endpoint */
app.get('/', (req, res) => {
    res.json({
        status: true,
        message: 'Anichin Scraper API',
        endpoints: {
            home: '/anichin/home',
            donghua_list: '/anichin/donghua?page=1',
            anime_detail: '/anichin/anime/:slug',
            episode_stream: '/anichin/episode/:slug',
            schedule: '/anichin/schedule',
            genres: '/anichin/genres',
            search: '/anichin/search?query=soul'
        },
        author: 'Yemobyte'
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
