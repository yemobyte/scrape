const axios = require('axios');

async function test() {
    console.log('Testing YouTube Downloader...');
    const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'; // Me at the zoo (short)

    console.log('Fetching 360p video...');
    try {
        /* Use stream endpoint to avoid console flooding with base64 */
        const res = await axios.get(`http://localhost:3000/youtube/stream?url=${url}&quality=2`, {
            responseType: 'arraybuffer'
        });

        console.log('Status:', res.status);
        console.log('Headers:', res.headers);
        console.log('Data Length:', res.data.length);
        console.log('SUCCESS: Video downloaded in memory.');
    } catch (e) {
        console.log('Error:', e.message);
    }
}

test();
