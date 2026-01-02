const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const baseUrl = 'https://otakudesu.best';

app.use(cors());
app.set('json spaces', 2);

/* Config axios with common headers */
const client = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Referer': baseUrl
    }
});

/* Helper to fetch and load cheerio */
async function getCheerio(url) {
    const { data } = await client.get(url);
    return cheerio.load(data);
}

/* Halaman Home */
app.get('/anime/home', async (req, res) => {
    try {
        const $ = await getCheerio(baseUrl);
        const home = [];
        $('.venz .detpost').each((i, el) => {
            const link = $(el).find('a').attr('href');
            if (!link) return;
            home.push({
                title: $(el).find('h2').text().trim(),
                slug: link.split('/').filter(Boolean).pop(),
                image: $(el).find('img').attr('src'),
                episode: $(el).find('.epz').text().trim(),
                day: $(el).find('.epztipe').text().trim(),
                date: $(el).find('.newz').text().trim()
            });
        });
        res.json({ status: true, data: home });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Jadwal Rilis Anime */
app.get('/anime/schedule', async (req, res) => {
    try {
        const $ = await getCheerio(`${baseUrl}/jadwal-rilis/`);
        const schedule = [];
        $('.kglist321').each((i, el) => {
            const day = $(el).find('h2').text().trim();
            const animes = [];
            $(el).find('ul li').each((j, li) => {
                const a = $(li).find('a');
                if (a.length) {
                    animes.push({
                        title: a.text().trim(),
                        slug: a.attr('href').split('/').filter(Boolean).pop()
                    });
                }
            });
            if (day) schedule.push({ day, animes });
        });
        res.json({ status: true, data: schedule });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Detail Lengkap Anime */
app.get('/anime/anime/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const $ = await getCheerio(`${baseUrl}/anime/${slug}/`);
        const info = {};
        $('.infozin p').each((i, el) => {
            const text = $(el).text();
            if (text.includes(':')) {
                const [key, ...val] = text.split(':');
                const k = key.trim().toLowerCase().replace(/ /g, '_');
                const v = val.join(':').trim();
                if (k === 'genre') {
                    info.genres = [];
                    $(el).find('a').each((j, a) => {
                        info.genres.push({
                            name: $(a).text().trim(),
                            slug: $(a).attr('href').split('/').filter(Boolean).pop()
                        });
                    });
                } else {
                    info[k] = v;
                }
            }
        });

        const episodes = [];
        $('.episodelist').each((idx, list) => {
            const genre = $(list).find('.mctitle').text().toLowerCase();
            $(list).find('ul li').each((i, el) => {
                const a = $(el).find('span a');
                const ep = {
                    title: a.text().trim(),
                    slug: a.attr('href').split('/').filter(Boolean).pop(),
                    date: $(el).find('.zeebr').text().trim()
                };
                if (genre.includes('complete')) {
                    if (!info.complete_episodes) info.complete_episodes = [];
                    info.complete_episodes.push(ep);
                } else {
                    episodes.push(ep);
                }
            });
        });

        res.json({
            status: true,
            data: {
                ...info,
                image: $('.fotoanime img').attr('src'),
                synopsis: $('.sinopc').text().trim(),
                episodes: episodes.length > 0 ? episodes : (info.complete_episodes || [])
            }
        });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Anime Tamat per Halaman */
app.get('/anime/complete-anime', async (req, res) => {
    try {
        const page = req.query.page || 1;
        const $ = await getCheerio(`${baseUrl}/complete-anime/page/${page}/`);
        const anime = [];
        $('.venz .detpost').each((i, el) => {
            anime.push({
                title: $(el).find('h2').text().trim(),
                slug: $(el).find('a').attr('href').split('/').filter(Boolean).pop(),
                image: $(el).find('img').attr('src'),
                episode: $(el).find('.epz').text().trim(),
                date: $(el).find('.newz').text().trim()
            });
        });
        res.json({ status: true, data: anime });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Anime yang Sedang Tayang */
app.get('/anime/ongoing-anime', async (req, res) => {
    try {
        const page = req.query.page || 1;
        const $ = await getCheerio(`${baseUrl}/ongoing-anime/page/${page}/`);
        const anime = [];
        $('.venz .detpost').each((i, el) => {
            anime.push({
                title: $(el).find('h2').text().trim(),
                slug: $(el).find('a').attr('href').split('/').filter(Boolean).pop(),
                image: $(el).find('img').attr('src'),
                episode: $(el).find('.epz').text().trim(),
                day: $(el).find('.epztipe').text().trim()
            });
        });
        res.json({ status: true, data: anime });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Daftar Semua Genre */
app.get('/anime/genre', async (req, res) => {
    try {
        const $ = await getCheerio(`${baseUrl}/genre-list/`);
        const genres = [];
        $('.genres li a').each((i, el) => {
            genres.push({
                name: $(el).text().trim(),
                slug: $(el).attr('href').split('/').filter(Boolean).pop()
            });
        });
        res.json({ status: true, data: genres });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Daftar Anime Berdasarkan Genre */
app.get('/anime/genre/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const page = req.query.page;
        const url = page && page > 1 ? `${baseUrl}/genres/${slug}/page/${page}/` : `${baseUrl}/genres/${slug}/`;
        const $ = await getCheerio(url);
        const anime = [];
        $('.col-anime-con').each((i, el) => {
            const a = $(el).find('.col-anime-title a');
            if (!a.attr('href')) return;
            anime.push({
                title: a.text().trim(),
                slug: a.attr('href').split('/').filter(Boolean).pop(),
                image: $(el).find('.col-anime-cover img').attr('src'),
                episode: $(el).find('.col-anime-eps').text().trim(),
                score: $(el).find('.col-anime-rating').text().trim()
            });
        });
        res.json({ status: true, data: anime });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Detail dan Link Nonton per Episode */
app.get('/anime/episode/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const $ = await getCheerio(`${baseUrl}/episode/${slug}/`);
        const servers = [];
        $('.mirrorstream ul li').each((i, el) => {
            const a = $(el).find('a');
            const dataContent = a.attr('data-content');
            if (dataContent) {
                const decoded = JSON.parse(Buffer.from(dataContent, 'base64').toString());
                servers.push({
                    name: a.text().trim(),
                    serverId: `${decoded.id}-${decoded.i}-${decoded.q}`
                });
            }
        });

        const downloads = [];
        $('.download ul li').each((i, el) => {
            const quality = $(el).find('strong').text().trim();
            const links = [];
            $(el).find('a').each((j, a) => {
                links.push({
                    name: $(a).text().trim(),
                    link: $(a).attr('href')
                });
            });
            downloads.push({ quality, links });
        });

        res.json({
            status: true,
            data: {
                title: $('.venutama h1').text().trim(),
                stream_url: $('.video-embed iframe').attr('src'),
                servers,
                downloads
            }
        });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Pencarian Anime */
app.get('/anime/search/:keyword', async (req, res) => {
    try {
        const { keyword } = req.params;
        const $ = await getCheerio(`${baseUrl}/?s=${keyword}&post_type=anime`);
        const anime = [];
        $('.chivsrc li').each((i, el) => {
            const a = $(el).find('h2 a');
            if (!a.attr('href')) return;
            anime.push({
                title: a.text().trim(),
                slug: a.attr('href').split('/').filter(Boolean).pop(),
                image: $(el).find('img').attr('src'),
                status: $(el).find('.set:contains("Status")').text().split(':').pop().trim(),
                rating: $(el).find('.set:contains("Rating")').text().split(':').pop().trim(),
                genres: $(el).find('.set:contains("Genres") a').map((j, a) => $(a).text().trim()).get()
            });
        });
        /* Fallback if chivsrc is not used */
        if (anime.length === 0) {
            $('.venz .detpost').each((i, el) => {
                const a = $(el).find('a');
                if (!a.attr('href')) return;
                anime.push({
                    title: $(el).find('h2').text().trim(),
                    slug: a.attr('href').split('/').filter(Boolean).pop(),
                    image: $(el).find('img').attr('src'),
                    episode: $(el).find('.epz').text().trim()
                });
            });
        }
        res.json({ status: true, data: anime });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Download Batch Anime */
app.get('/anime/batch/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const $ = await getCheerio(`${baseUrl}/batch/${slug}/`);
        const downloads = [];

        /* Find all containers that look like download areas */
        const containers = $('.batchlink, .download, .list-download');

        containers.each((idx, container) => {
            $(container).find('ul li').each((i, el) => {
                const quality = $(el).find('strong').text().trim();
                const links = [];
                $(el).find('a').each((j, a) => {
                    const link = $(a).attr('href');
                    if (link) {
                        links.push({
                            name: $(a).text().trim(),
                            link
                        });
                    }
                });
                if (quality) downloads.push({ quality, links });
            });
        });

        res.json({
            status: true,
            data: {
                title: $('.venz h1').text().trim() || $('.batchlink h4').text().trim() || $('.download h4').text().trim() || $('h1').first().text().trim(),
                downloads
            }
        });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Ambil URL Stream Server */
app.get('/anime/server/:serverId', async (req, res) => {
    try {
        const { serverId } = req.params;
        const [id, i, q] = serverId.split('-');

        /* Step 1: Get Nonce */
        const nonceData = new URLSearchParams();
        nonceData.append('action', 'aa1208d27f29ca340c92c66d1926f13f');
        const nonceRes = await client.post(`${baseUrl}/wp-admin/admin-ajax.php`, nonceData);
        const nonce = nonceRes.data.data || nonceRes.data;

        /* Step 2: Get Embed */
        const embedData = new URLSearchParams();
        embedData.append('id', id);
        embedData.append('i', i);
        embedData.append('q', q);
        embedData.append('nonce', typeof nonce === 'object' ? nonce.nonce : nonce);
        embedData.append('action', '2a3505c93b0035d3f455df82bf976b84');

        const embedRes = await client.post(`${baseUrl}/wp-admin/admin-ajax.php`, embedData);
        const html = Buffer.from(embedRes.data.data, 'base64').toString();
        const $ = cheerio.load(html);
        const url = $('iframe').attr('src');

        res.json({ status: true, data: { url } });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* All Anime */
app.get('/anime/unlimited', async (req, res) => {
    try {
        const $ = await getCheerio(`${baseUrl}/anime-list/`);
        const anime = [];
        $('.daftarkartun a.hodebgst').each((i, el) => {
            anime.push({
                title: $(el).text().trim(),
                slug: $(el).attr('href').split('/').filter(Boolean).pop()
            });
        });
        /* If specific class fails, try all links in container */
        if (anime.length === 0) {
            $('.daftarkartun a').each((i, el) => {
                const href = $(el).attr('href');
                if (href && href.includes('/anime/')) {
                    anime.push({
                        title: $(el).text().trim(),
                        slug: href.split('/').filter(Boolean).pop()
                    });
                }
            });
        }
        res.json({ status: true, data: anime });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
