import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure env vars are loaded
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here' || !supabaseServiceKey || supabaseServiceKey === 'your_supabase_service_role_key_here') {
  console.error('\x1b[31m%s\x1b[0m', '❌ CRITICAL ERROR: Supabase credentials are missing or using placeholders in .env');
  console.error('\x1b[33m%s\x1b[0m', 'Please update the .env file in the project root with your actual Supabase URL and Service Role Key.');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
export const STORAGE_BUCKET = 'product-images';
