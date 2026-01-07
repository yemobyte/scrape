/* Required dependencies */
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

/* Base URL */
const BASE_URL = 'https://gamebrott.com/berita/';

/* Main route handler */
router.get('/api/berita', async (req, res) => {
    try {
        /* Fetch the HTML content */
        const { data } = await axios.get(BASE_URL);
        const $ = cheerio.load(data);
        const articles = [];

        /* Iterate over each news item */
        $('.jeg_post').each((index, element) => {
            const titleElement = $(element).find('.jeg_post_title a');
            const imageElement = $(element).find('.jeg_thumb img');
            const dateElement = $(element).find('.jeg_meta_date a');

            /* Extract data */
            const title = titleElement.text().trim();
            const link = titleElement.attr('href');
            /* Handle lazy loading for images - prioritized data-src */
            const image = imageElement.attr('data-src') || imageElement.attr('src');
            const date = dateElement.text().trim();

            /* Push valid items */
            if (title && link) {
                articles.push({
                    title,
                    link,
                    image,
                    date
                });
            }
        });

        /* Return JSON response */
        res.json({
            status: true,
            creator: "yemobyte",
            data: articles
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        });
    }
});

/* Detail route handler */
router.get('/api/detail', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({
                status: false,
                message: 'URL parameter is required'
            });
        }

        /* Fetch the HTML content */
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        /* Extract data */
        /* Title - try multiple selectors with strict cleaning */
        const title = ($('.jeg_post_title').first().text() || $('h1').first().text()).replace(/\s+/g, ' ').trim();

        /* Content */
        /* Remove unwanted elements */
        $('script').remove();
        $('style').remove();
        $('.jeg_ad').remove();

        const contentElement = $('.content-inner').length ? $('.content-inner') : $('.jeg_post_content');

        /* Get text content and clean up newlines/excessive spaces for cleaner output */
        const content = contentElement.text().replace(/\s+/g, ' ').trim();

        /* Image */
        const imageElement = $('.jeg_featured_img img').first();
        const image = imageElement.attr('data-src') || imageElement.attr('src') || $('.wp-post-image').attr('src');

        /* Meta */
        const author = $('.jeg_author_name a').first().text().replace(/\s+/g, ' ').trim();
        const date = $('.jeg_meta_date a').first().text().replace(/\s+/g, ' ').trim();

        res.json({
            status: true,
            creator: "yemobyte",
            data: {
                title,
                image,
                author,
                date,
                content
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: 'Internal Server Error or Invalid URL'
        });
    }
});

module.exports = router;
