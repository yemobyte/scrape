const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;
const BASE_URL = 'https://runthegauntlet.org';

/* Enable pretty printing for JSON responses */
app.set('json spaces', 2);

/*
 * Helper function to fetch HTML from URL
 */
async function fetchHTML(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        return data;
    } catch (error) {
        throw new Error(`Failed to fetch ${url}: ${error.message}`);
    }
}

/*
 * Helper function to parse video items from listing pages
 */
function parseVideoItems($) {
    const videos = [];

    $('.plug').each((i, elem) => {
        const $elem = $(elem);
        const link = $elem.find('.plugtitle a').attr('href');
        const title = $elem.find('.plugtitle h3').text().trim();
        const description = $elem.find('.plugdesc h4').text().trim();
        const thumbnail = $elem.find('.plugthumb img').attr('src');

        /* Extract metadata from pluginfo */
        const pluginfo = $elem.find('.pluginfo');
        const infoText = pluginfo.text();

        const dateMatch = infoText.match(/[A-Z][a-z]{2}\.\d{2}/);
        const durationMatch = infoText.match(/\d{1,2}:\d{2}/);
        const viewsMatch = infoText.match(/([\d,]+)/);

        if (link && title) {
            videos.push({
                title: title,
                slug: link.replace('/view/', ''),
                url: `${BASE_URL}${link}`,
                thumbnail: thumbnail ? (thumbnail.startsWith('http') ? thumbnail : `${BASE_URL}${thumbnail}`) : '',
                description: description || '',
                date: dateMatch ? dateMatch[0] : '',
                duration: durationMatch ? durationMatch[0] : '',
                views: viewsMatch ? viewsMatch[1].replace(/,/g, '') : '0'
            });
        }
    });

    return videos;
}

/*
 * GET / - API Info
 */
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'RunTheGauntlet Scraper API',
        endpoints: {
            home: '/home',
            browse: '/browse/:page?',
            video: '/video/:slug',
            gauntlet: '/gauntlet',
            cringe: '/cringe/:page?',
            search: '/search/:query'
        }
    });
});

/*
 * GET /home - Get homepage videos
 */
app.get('/home', async (req, res) => {
    try {
        const html = await fetchHTML(BASE_URL);
        const $ = cheerio.load(html);

        const videos = parseVideoItems($);

        if (videos.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No videos found'
            });
        }

        res.json({
            status: 'success',
            data: videos
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/*
 * GET /browse/:page? - Browse all videos with pagination
 */
app.get('/browse/:page?', async (req, res) => {
    try {
        const page = parseInt(req.params.page) || 1;
        const url = page === 1 ? `${BASE_URL}/browse` : `${BASE_URL}/page-${page}`;

        const html = await fetchHTML(url);
        const $ = cheerio.load(html);

        const videos = parseVideoItems($);

        /* Check for next page */
        const hasNextPage = $('a').filter((i, el) => {
            return $(el).attr('href') === `/page-${page + 1}`;
        }).length > 0;

        if (videos.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No videos found on this page'
            });
        }

        res.json({
            status: 'success',
            currentPage: page,
            hasNextPage: hasNextPage,
            data: videos
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/*
 * GET /video/:slug - Get video details and source
 */
app.get('/video/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const url = `${BASE_URL}/view/${slug}`;

        const html = await fetchHTML(url);
        const $ = cheerio.load(html);

        const title = $('.videotitle h1').first().text().trim();
        const description = $('.videodescription h2').first().text().trim();

        /* Extract video source */
        const videoSource = $('video source').attr('src');

        /* Extract metadata from pluginfo */
        const pluginfo = $('.pluginfo');
        const infoText = pluginfo.text();
        const durationMatch = infoText.match(/\d{1,2}:\d{2}/);
        const viewsMatch = infoText.match(/([\d,]+)/);

        if (!title || !videoSource) {
            return res.status(404).json({
                status: 'error',
                message: 'Video not found or could not extract video source'
            });
        }

        res.json({
            status: 'success',
            data: {
                title: title,
                slug: slug,
                description: description,
                videoUrl: videoSource,
                duration: durationMatch ? durationMatch[0] : '',
                views: viewsMatch ? viewsMatch[1].replace(/,/g, '') : '0',
                pageUrl: url
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/*
 * GET /gauntlet - Get gauntlet challenge info
 */
app.get('/gauntlet', async (req, res) => {
    try {
        const url = `${BASE_URL}/gauntlet`;
        const html = await fetchHTML(url);
        const $ = cheerio.load(html);

        const title = $('h1, h2').first().text().trim();
        const description = $('p').first().text().trim();

        /* Extract gauntlet levels from .plug containers */
        const levels = [];
        const seen = new Set();

        $('.plug').each((i, elem) => {
            const $elem = $(elem);
            const link = $elem.find('.plugtitle a').attr('href');
            const videoTitle = $elem.find('.plugtitle h3').text().trim();

            if (link && videoTitle && !seen.has(link)) {
                seen.add(link);
                levels.push({
                    level: levels.length + 1,
                    title: videoTitle,
                    slug: link.replace('/view/', ''),
                    url: `${BASE_URL}${link}`
                });
            }
        });

        if (levels.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No gauntlet levels found'
            });
        }

        res.json({
            status: 'success',
            data: {
                title: title,
                description: description,
                totalLevels: levels.length,
                levels: levels
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/*
 * GET /cringe/:page? - Get cringe category videos
 */
app.get('/cringe/:page?', async (req, res) => {
    try {
        const page = parseInt(req.params.page) || 1;
        const url = page === 1 ? `${BASE_URL}/cringe` : `${BASE_URL}/cringe/page-${page}`;

        const html = await fetchHTML(url);
        const $ = cheerio.load(html);

        const videos = parseVideoItems($);

        /* Check for next page */
        const hasNextPage = $('a').filter((i, el) => {
            return $(el).attr('href')?.includes(`/page-${page + 1}`);
        }).length > 0;

        if (videos.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No cringe videos found'
            });
        }

        res.json({
            status: 'success',
            category: 'cringe',
            currentPage: page,
            hasNextPage: hasNextPage,
            data: videos
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/*
 * GET /search/:query - Search videos
 */
app.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;

        if (!query || query.trim() === '') {
            return res.status(400).json({
                status: 'error',
                message: 'Search query is required'
            });
        }

        /* Fetch browse page and filter */
        const html = await fetchHTML(`${BASE_URL}/browse`);
        const $ = cheerio.load(html);

        const allVideos = parseVideoItems($);
        const searchTerm = query.toLowerCase();

        const results = allVideos.filter(video =>
            video.title.toLowerCase().includes(searchTerm)
        );

        if (results.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No videos found matching your search'
            });
        }

        res.json({
            status: 'success',
            query: query,
            totalResults: results.length,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/*
 * Start server
 */
app.listen(PORT, () => {
    console.log(`RunTheGauntlet scraper running on http://localhost:${PORT}`);
});
