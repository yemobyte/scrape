const axios = require('axios');

async function test() {
    console.log('Testing X Scraper...');
    const url = 'https://x.com/ElonMusk/status/123456789'; // Dummy or provided url
    // Use the URL from browser state if possible? 
    // The user had multiple tabs.
    // I'll stick to a generic test or expect the user to provide one.
    // But wait, the user said "download postingan x tersebut".
    // I don't know WHICH post "tersebut" refers to unless I checked the active tab URL.
    // Active Tab: https://twitter.com/Gayle1497291/status/2007453...

    // I will use THAT URL.
    const realUrl = 'https://twitter.com/Gayle1497291/status/2007453'; // Truncated in logs, likely inaccurate.
    // The metadata said: "https://publish.twitter.com/?url=https://twitter.com/Gayle1497291/status/2007453..."
    // Wait, the active page is X Home.
    // The previous page was "Twitter Publish".
    // I'll test with a robust public tweet.

    const testUrl = 'https://x.com/SpaceX/status/1715458369680326986'; // Starship launch example

    console.log('Target:', testUrl);
    try {
        const res = await axios.get(`http://localhost:3000/x/download?url=${encodeURIComponent(testUrl)}`);
        console.log('Status:', res.data.status);
        console.log('Data:', res.data.data);
    } catch (e) {
        console.log('Error:', e.message);
    }
}

test();
