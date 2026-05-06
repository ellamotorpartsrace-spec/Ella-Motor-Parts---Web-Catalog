import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncWithPOS } from '../server/utils/posSync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the server .env
dotenv.config({ path: path.join(__dirname, '../server/.env') });

console.log('Starting Manual Sync Test...');
console.log('API URL:', process.env.POS_API_URL);

syncWithPOS().then(res => {
    console.log('Final Result:', JSON.stringify(res, null, 2));
    process.exit(res.success ? 0 : 1);
}).catch(err => {
    console.error('CRITICAL ERROR:', err);
    process.exit(1);
});
