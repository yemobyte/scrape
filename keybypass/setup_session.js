const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const SESSION_FILE = path.join(__dirname, 'session.json');
const SITE_URL = 'https://keybypass.net';

(async () => {
    console.log('🚀 Opening browser for manual CAPTCHA solving...');
    console.log('Please solve the hCaptcha on the page and then close the browser window.');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    await page.goto(SITE_URL, { waitUntil: 'networkidle2' });

    /* Monitor for closing */
    browser.on('disconnected', async () => {
        console.log('✅ Browser closed. Session saved if you interacted with the site.');
        process.exit();
    });

    /* Periodically save cookies every 5 seconds in case user solves it */
    setInterval(async () => {
        try {
            const cookies = await page.cookies();
            fs.writeFileSync(SESSION_FILE, JSON.stringify(cookies, null, 2));
        } catch (e) {
            /* ignore if page closed */
        }
    }, 5000);

})();
