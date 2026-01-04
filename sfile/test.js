const axios = require('axios');

async function test() {
    console.log('Testing Sfile Scraper...');

    /* 1. Search */
    console.log('--- Search: "minecraft" ---');
    try {
        const searchRes = await axios.get('http://localhost:3000/sfile/search?q=minecraft');
        console.log('Status:', searchRes.data.status);
        console.log('Results Found:', searchRes.data.data.length);
        if (searchRes.data.data.length > 0) {
            const first = searchRes.data.data[0];
            console.log('First Result:', first);

            /* 2. Download Info */
            console.log('\n--- Download Info: ' + first.url + ' ---');
            const dlRes = await axios.get(`http://localhost:3000/sfile/download?url=${encodeURIComponent(first.url)}`);
            console.log('Status:', dlRes.data.status);
            console.log('Data:', dlRes.data.data);
        }
    } catch (e) {
        console.log('Error:', e.message);
        if (e.response) console.log('Resp:', e.response.data);
    }
}

test();
