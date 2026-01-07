const axios = require('axios');

async function testDetail() {
    try {
        console.log('Testing Gamebrott Detail Scraper...');
        // First get the list to find a URL
        const listResponse = await axios.get('http://localhost:3000/api/berita');
        if (listResponse.data.data.length === 0) {
            console.log('No articles found to test detail.');
            return;
        }

        const firstArticleUrl = listResponse.data.data[0].link;
        console.log('Testing detail for:', firstArticleUrl);

        const detailResponse = await axios.get('http://localhost:3000/api/detail', {
            params: { url: firstArticleUrl }
        });

        if (detailResponse.data.status) {
            console.log('Success!');
            console.log('Title:', detailResponse.data.data.title);
            console.log('Author:', detailResponse.data.data.author);
            console.log('Content Preview:', detailResponse.data.data.content.substring(0, 100) + '...');
        } else {
            console.log('Failed:', detailResponse.data);
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.log('Response data:', error.response.data);
        }
    }
}

testDetail();
