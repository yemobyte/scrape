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

/* Helper to parse anime list from .tip/card elements */
function parseAnime($, selector) {
    const list = [];
    $(selector).each((i, el) => {
        /* Title extraction handling for various layouts */
        const title = $(el).find('img').attr('alt') || $(el).attr('title') || $(el).find('h3').text() || $(el).text();
        const link = $(el).attr('href');
        const image = $(el).find('img').attr('src');

        let cleanTitle = title;
        if (cleanTitle) {
            cleanTitle = cleanTitle.replace('Watch ', '').replace(' Online Free', '').trim();
        }

        if (link) {
            list.push({
                title: cleanTitle,
                slug: link.split('/').filter(Boolean).pop(),
                image,
                link
            });
        }
    });
    return list;
}

/* Home Endpoint */
app.get('/animedao/home', async (req, res) => {
    try {
        const $ = await getCheerio(BASE_URL);
        const latest = parseAnime($, '.tip');
        /* Popular Series usually in .series or sidebar */
        const popular = [];
        $('.series').each((i, el) => {
            const title = $(el).find('.series-title').text().trim();
            const link = $(el).attr('href');
            const image = $(el).find('img').attr('src');
            if (link) {
                popular.push({
                    title,
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

/* Movies Endpoint */
app.get('/animedao/movies', async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const url = `${BASE_URL}/series/?type=Movie&order=update&page=${page}`;
        const $ = await getCheerio(url);

        /* Movies use same structure as list usually */
        let movies = parseAnime($, '.tip');

        if (movies.length === 0) {
            /* Fallback for different layout */
            movies = parseAnime($, 'article.anime');
        }

        res.json({
            status: true,
            data: movies
        });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Schedule Endpoint */
app.get('/animedao/schedule', async (req, res) => {
    try {
        const url = `${BASE_URL}/schedule/`;
        const $ = await getCheerio(url);

        const schedule = [];
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        let currentDay = '';
        let currentAnimes = [];

        /* Traverse main content to find Headers and Items sequentially */
        const container = $('.entry-content, .post-body, article').first();

        if (container.length) {
            container.children().each((i, el) => {
                const tag = $(el).prop('tagName').toLowerCase();
                const text = $(el).text().trim();

                const isDay = days.find(d => text.includes(d));

                if ((tag.startsWith('h') || $(el).hasClass('day-name')) && isDay) {
                    if (currentDay && currentAnimes.length) {
                        schedule.push({ day: currentDay, animes: currentAnimes });
                    }
                    currentDay = isDay;
                    currentAnimes = [];
                } else if (currentDay) {
                    $(el).find('a').each((j, a) => {
                        const title = $(a).text().trim();
                        const link = $(a).attr('href');
                        const time = $(el).find('.time').text().trim() || $(a).prev('.time').text().trim();

                        if (title && link) {
                            currentAnimes.push({
                                time: time || 'Unknown',
                                title,
                                slug: link.split('/').filter(Boolean).pop(),
                                link
                            });
                        }
                    });
                }
            });
            if (currentDay && currentAnimes.length) {
                schedule.push({ day: currentDay, animes: currentAnimes });
            }
        }

        res.json({
            status: true,
            data: schedule.length ? schedule : 'No schedule data found with current selector logic'
        });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Genres Endpoint */
app.get('/animedao/genres', async (req, res) => {
    try {
        const $ = await getCheerio(BASE_URL);
        const genres = [];

        $('a[href*="/genres/"]').each((i, el) => {
            const name = $(el).text().trim();
            const link = $(el).attr('href');
            const exists = genres.find(g => g.link === link);
            if (!exists && name) {
                genres.push({
                    name,
                    slug: link.split('/').filter(Boolean).pop(),
                    link
                });
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

/* Get Anime by Genre */
app.get('/animedao/genre/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const page = req.query.page || 1;
        const url = `${BASE_URL}/genres/${slug}/page/${page}`;
        const $ = await getCheerio(url);

        const anime = parseAnime($, '.tip');

        res.json({
            status: true,
            data: anime.length ? anime : parseAnime($, '.series') /* Fallback */
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

        let synopsis = '';
        $('h2, h3, strong, b').each((i, el) => {
            if ($(el).text().includes('Description') || $(el).text().includes('Synopsis')) {
                synopsis = $(el).parent().text().replace('Description', '').replace('Synopsis', '').trim();
            }
        });
        if (!synopsis) {
            synopsis = $('.series-description').text().trim() || $('.content-more').text().trim();
        }

        const episodes = [];
        $('.ep-item').each((i, el) => {
            let link = $(el).attr('href');
            let epTitle = $(el).text().trim() || $(el).attr('title');

            if (!link) {
                link = $(el).find('a').attr('href');
                epTitle = $(el).find('a').text().trim();
            }

            if (link) {
                episodes.push({
                    title: epTitle,
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
        const url = `${BASE_URL}/${slug}`;
        const $ = await getCheerio(url);

        const title = $('h1').text().trim();
        let iframeSrc = $('iframe').attr('src');

        res.json({
            status: true,
            data: {
                title,
                stream_url: iframeSrc,
                original_url: url
            }
        });

    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Search Endpoint */
app.get('/animedao/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ status: false, message: 'Query param required' });

        const url = `${BASE_URL}/?s=${encodeURIComponent(query)}`;
        const $ = await getCheerio(url);

        const results = parseAnime($, '.tip');

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
            movies: '/animedao/movies',
            schedule: '/animedao/schedule',
            genres: '/animedao/genres',
            genre_detail: '/animedao/genre/:slug',
            anime_detail: '/animedao/anime/:slug',
            episode_stream: '/animedao/episode/:slug',
            search: '/animedao/search?query=naruto'
        },
        author: 'Yemobyte'
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
