const axios = require('axios');

async function test() {
    try {
        console.log('Testing Toolsmart Scraper (Port 3000)...');

        // Test Home
        console.log('[1] Testing Home Endpoint...');
        const home = await axios.get('http://localhost:3000/');
        console.log('Home Status:', home.data.status);

        // Test Download
        const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        console.log(`[2] Testing Download for ${videoUrl}...`);
        const dl = await axios.get(`http://localhost:3000/toolsmart/download?url=${videoUrl}`);

        if (dl.data.status) {
            console.log('Title:', dl.data.data.title);
            console.log('Download Options:', dl.data.data.downloads.length);
            console.log('First Option:', dl.data.data.downloads[0]);
        } else {
            console.error('Download Failed:', dl.data.message);
        }

    } catch (e) {
        console.error('Test Failed:', e.message);
        if (e.response) {
            console.error('Response Data:', e.response.data);
        }
    }
}

// Ensure server is running before running this test manually
// setTimeout(test, 2000); 
test();
