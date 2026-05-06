import axios from 'axios';
import { supabase } from '../config/supabase.js';

let isSyncing = false;
let lastSyncTime = 0;
const SYNC_THROTTLE = 5 * 60 * 1000; // 5 minutes

export const syncWithPOS = async (force = false) => {
  const now = Date.now();
  
  if (isSyncing) {
    console.log('⚠️ Sync already in progress, skipping...');
    return { success: true, message: 'Sync already in progress' };
  }

  if (!force && (now - lastSyncTime < SYNC_THROTTLE)) {
    const remaining = Math.ceil((SYNC_THROTTLE - (now - lastSyncTime)) / 1000);
    console.log(`⏱️ Sync throttled. Next available in ${remaining}s`);
    return { success: true, message: 'Using cached data (throttled)' };
  }

  isSyncing = true;
  try {
    console.log('--- Starting POS Sync ---');
    
    // 1. Fetch data from POS
    const posUrl = process.env.POS_API_URL;
    const apiKey = process.env.POS_API_KEY;

    if (!posUrl) {
      console.error('❌ Sync Error: POS_API_URL is not defined in .env');
      return { success: false, error: 'POS_API_URL missing' };
    }

    console.log(`📡 Attempting to sync from: ${posUrl}`);
    
    const response = await axios.get(posUrl, {
      headers: { 'x-api-key': apiKey },
      timeout: 10000, // 10s timeout
      httpsAgent: new (await import('https')).Agent({ rejectUnauthorized: false })
    });

    if (!response.data.success) {
      console.error('❌ POS API returned success: false', response.data.message);
      throw new Error(response.data.message || 'POS API returned failure');
    }

    const posProducts = response.data.data;
    
    // 2. Prepare data for batch upsert
    const productsToUpsert = posProducts.map(posItem => {
      const fullName = posItem.variation && posItem.variation !== 'Default' 
        ? `${posItem.name} (${posItem.variation})` 
        : posItem.name;

      // Use SKU if available, fallback to a unique POS Variation ID string
      const uniqueSku = posItem.sku || `POS_VAR_${posItem.id}`;

      return {
        sku: uniqueSku,
        name: fullName,
        price: posItem.price,
        stock: posItem.stock,
        brand: posItem.brand || 'Universal',
        category: posItem.category || 'Maintenance',
        description: posItem.description || `High-performance ${fullName} for your motorcycle.`
      };
    });

    let updatedCount = 0;
    const CHUNK_SIZE = 500;

    // 3. Perform parallelized chunked batch upserts for maximum speed
    if (productsToUpsert.length > 0) {
      console.log(`📦 Starting optimized parallel sync for ${productsToUpsert.length} products...`);
      
      const chunks = [];
      for (let i = 0; i < productsToUpsert.length; i += CHUNK_SIZE) {
        chunks.push(productsToUpsert.slice(i, i + CHUNK_SIZE));
      }

      // Process batches in parallel (3 at a time to stay within DB limits)
      const CONCURRENCY = 3;
      for (let i = 0; i < chunks.length; i += CONCURRENCY) {
        const batch = chunks.slice(i, i + CONCURRENCY);
        console.log(`⏳ Syncing batches ${i + 1} through ${Math.min(i + CONCURRENCY, chunks.length)} of ${chunks.length}...`);
        
        const results = await Promise.all(batch.map(chunk => 
          supabase.from('products').upsert(chunk, { onConflict: 'sku' })
        ));

        results.forEach((res, idx) => {
          if (res.error) {
            console.error(`❌ Batch ${i + idx + 1} failed:`, res.error.message);
          } else {
            updatedCount += batch[idx].length;
          }
        });
      }
    }

    console.log(`✅ Sync Complete: ${updatedCount} products processed.`);
    lastSyncTime = Date.now();
    return { success: true, updated: updatedCount };
  } catch (error) {
    console.error('❌ POS Sync Failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    isSyncing = false;
  }
};
