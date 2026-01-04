const axios = require('axios');

async function test() {
    console.log('Testing CF Bypass...');
    // We need a URL that actually has Turnstile.
    // TeraboxDL uses it.
    const target = 'https://teraboxdl.site/';

    try {
        const { data } = await axios.post('http://localhost:3000/tools/bypass/cf-turnstile', {
            url: target,
            siteKey: '0x4AAAAAACG0B7jzIiua8JFj'
        });
        console.log('Response:', data);
    } catch (e) {
        console.log('Error:', e.response ? e.response.data : e.message);
    }
}

test();
