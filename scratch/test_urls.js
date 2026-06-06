import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const urls = [
    'https://ellamotorparts.net/api/external/sync_catalog.php',
    'https://ellamotorparts.net/external/sync_catalog.php',
    'https://ellamotorparts.ph/api/external/sync_catalog.php',
    'https://ellamotorparts.ph/external/sync_catalog.php',
    'https://ellamotorparts.net/sync_catalog.php'
];

async function testUrls() {
    for (const url of urls) {
        try {
            console.log(`Testing ${url}...`);
            const res = await axios.head(url, { timeout: 5000 });
            console.log(`  Result: ${res.status}`);
        } catch (err) {
            console.log(`  Result: ${err.response ? err.response.status : err.message}`);
        }
    }
}

testUrls();
