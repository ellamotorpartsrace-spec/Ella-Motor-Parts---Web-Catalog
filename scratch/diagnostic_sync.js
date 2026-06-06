import { syncWithPOS } from '../api/utils/posSync.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function runSync() {
    console.log('Starting diagnostic sync...');
    const result = await syncWithPOS(true);
    console.log('Sync Result:', JSON.stringify(result, null, 2));
}

runSync().catch(console.error);
