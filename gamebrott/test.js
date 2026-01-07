/* Test script */
const axios = require('axios');

async function testScraper() {
    try {
        console.log('Testing Gamebrott Scraper...');
        const response = await axios.get('http://localhost:3000/api/berita');

        if (response.data.status && response.data.data.length > 0) {
            console.log('Success! Found ' + response.data.data.length + ' articles.');
            console.log('First article:', response.data.data[0]);
        } else {
            console.log('Failed: No data found or status is false.');
            console.log('Response:', response.data);
        }
    } catch (error) {
        console.error('Error testing scraper:', error.message);
    }
}

testScraper();
