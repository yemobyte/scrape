const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const baseUrl = 'https://www.iq.com';

app.use(cors());
app.set('json spaces', 2);

/* Config axios with common headers */
const client = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': baseUrl,
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1'
    }
});

/* Helper to fetch and load cheerio */
async function getCheerio(url) {
    try {
        const res = await client.get(url);
        if (res.headers['set-cookie']) {
            const cookies = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
            // Persist cookies for subsequent requests in this session (simple implementation)
            client.defaults.headers.Cookie = cookies;
        }
        return cheerio.load(res.data);
    } catch (e) {
        console.error(`Request failed for ${url}: ${e.message}`);
        if (e.response) {
            console.error(`Status: ${e.response.status}`);
            /* Attempt retry without advanced headers if 400 - sometimes simpler is better or just retry */
            if (e.response.status === 400) {
                try {
                    const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    return cheerio.load(data);
                } catch (ex) {
                    // ignore secondary failure
                }
            }
        }
        throw e;
    }
}

/* Helper to extract NEXT_DATA */
function extractNextData($) {
    const script = $('#__NEXT_DATA__').html();
    if (script) {
        try {
            return JSON.parse(script);
        } catch (e) {
            return null;
        }
    }
    return null;
}

/* Pencarian Anime */
app.get('/iqiyi/search/:keyword', async (req, res) => {
    try {
        const { keyword } = req.params;
        const url = `${baseUrl}/search?query=${encodeURIComponent(keyword)}`;
        const $ = await getCheerio(url);
        const nextData = extractNextData($);

        let results = [];
        if (nextData) {
            /* 
               Structure can be: 
               props.initialState.search.result.videos OR
               props.initialState.search.searchData.list OR
               props.pageProps.data.searchData.list
            */
            const searchState = nextData.props?.initialState?.search || {};
            const searchData = searchState.result?.videos || searchState.searchData?.list ||
                nextData.props?.pageProps?.data?.searchData?.list || [];

            results = searchData.map(item => ({
                title: item.name,
                slug: item.albumId || item.qipuIdStr || item.qipuId,
                image: item.imageUrl,
                description: item.description || item.subLinkName, /* subLinkName sometimes contains desc info */
                score: item.score,
                isVip: item.isVip === 1 || item.payMark === 'VIP_MARK'
            }));
        }

        /* Fallback to simple DOM parsing if JSON fails */
        if (results.length === 0) {
            $('.search-result-item, .qy-search-result-card').each((i, el) => {
                const a = $(el).find('a').first();
                results.push({
                    title: $(el).find('.title, .result-title').text().trim(),
                    slug: a.attr('href') ? a.attr('href').split('/').pop().replace('.html', '') : '',
                    image: $(el).find('img').attr('src'),
                    isVip: $(el).find('.vip-tag, .qy-mod-label-vip').length > 0
                });
            });
        }

        res.json({ status: true, data: results });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Detail Anime */
app.get('/iqiyi/anime/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        /* Do not append .html - let headers handle content negotiation or assume clean URLs */
        const url = `${baseUrl}/album/${slug}`;
        const $ = await getCheerio(url);
        const nextData = extractNextData($);

        if (!nextData) {
            return res.status(404).json({ status: false, message: 'Could not extract NEXT_DATA' });
        }

        const album = nextData.props?.initialState?.album || {};
        const info = album.videoAlbumInfo || {};
        const cacheList = album.cacheAlbumList || {};

        /* Flatten episodes from all pages */
        const episodes = [];
        Object.keys(cacheList).forEach(page => {
            cacheList[page].forEach(ep => {
                episodes.push({
                    title: ep.name,
                    episode_number: ep.order,
                    slug: ep.albumPlayUrl ? ep.albumPlayUrl.split('/').pop().replace('.html', '').split('?')[0] : (ep.qipuIdStr || ep.tvId),
                    tvId: ep.tvId,
                    vid: ep.vid,
                    isVip: ep.vipInfo?.isVip === 1 || ep.payMark === 'VIP_MARK'
                });
            });
        });

        res.json({
            status: true,
            data: {
                title: info.name,
                description: info.desc || info.description,
                image: info.imageUrl || info.albumImage,
                genres: info.categories?.map(c => c.name) || [],
                year: info.year,
                score: info.score,
                isVip: info.vipInfo?.isVip === 1 || info.payMark === 'VIP_MARK',
                episodes: episodes.sort((a, b) => a.episode_number - b.episode_number)
            }
        });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Stream URL / Play Interface */
app.get('/iqiyi/play/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const url = `${baseUrl}/play/${slug}`;
        const $ = await getCheerio(url);
        const nextData = extractNextData($);

        if (!nextData) {
            return res.status(404).json({ status: false, message: 'Could not extract NEXT_DATA' });
        }

        const play = nextData.props?.initialState?.play || {};
        const videoInfo = play.videoInfo || {};

        res.json({
            status: true,
            data: {
                title: videoInfo.name,
                tvId: videoInfo.tvId,
                vid: videoInfo.vid,
                albumId: videoInfo.albumId,
                isVip: videoInfo.vipInfo?.isVip === 1 || videoInfo.payMark === 'VIP_MARK',
                embed_url: `${baseUrl}/play/${slug}.html`
            }
        });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

/* Recently Updated / Home */
app.get('/iqiyi/home', async (req, res) => {
    try {
        const url = `${baseUrl}/film-library?chnid=4`;
        const $ = await getCheerio(url);
        const nextData = extractNextData($);

        let results = [];
        if (nextData) {
            /* Try filmLibrary first (unlikely), then search.result (found in analysis), then pageProps */
            const filmLib = nextData.props?.initialState?.filmLibrary?.libraryData?.list;
            const searchRes = nextData.props?.initialState?.search?.result?.videos;
            const pageProps = nextData.props?.pageProps?.data?.libraryData?.list;

            const listData = filmLib || searchRes || pageProps || [];

            results = listData.map(item => ({
                title: item.name,
                slug: item.albumId || item.qipuIdStr || item.qipuId,
                image: item.imageUrl,
                status: item.period,
                score: item.score,
                isVip: item.isVip === 1 || item.payMark === 'VIP_MARK'
            }));
        }

        if (results.length === 0) {
            $('.qy-mod-li').each((i, el) => {
                const a = $(el).find('a').first();
                results.push({
                    title: $(el).find('.qy-mod-link').attr('title') || $(el).find('.title').text().trim(),
                    slug: a.attr('href') ? a.attr('href').split('/').pop().replace('.html', '') : '',
                    image: $(el).find('img').attr('src'),
                    isVip: $(el).find('.qy-mod-label-vip').length > 0
                });
            });
        }

        res.json({ status: true, data: results });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

app.listen(PORT, () => console.log(`iQIYI Scraper running on http://localhost:${PORT}`));
