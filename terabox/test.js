const http = require('http');

const url = 'https://www.terabox.app/sharing/link?surl=ssWI592FxK4-93HrFFZydQ';
const apiUrl = `http://localhost:3000/terabox/download?url=${encodeURIComponent(url)}`;

console.log('Testing Terabox Scraper (Nekolabs Method)...');
console.log('Target:', apiUrl);

const req = http.get(apiUrl, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.status) {
                console.log('SUCCESS!');
                console.log(JSON.stringify(json.data, null, 2));
            } else {
                console.log('FAIL:', json.message);
            }
        } catch (e) {
            console.log('Invalid JSON Response:', data.substring(0, 200));
        }
    });
});

req.on('error', (e) => console.log('Error:', e.message));
