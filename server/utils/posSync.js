import axios from 'axios';
import { supabase } from '../config/supabase.js';
import { clearCache } from './cache.js';

let isSyncing = false;
let lastSyncTime = 0;
const SYNC_THROTTLE = 1 * 60 * 1000; // 1 minute

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
    console.log('--- Starting Forced POS Sync ---');
    
    // 0. Aggressively clear cache at start to prevent any stale reads
    clearCache();

    // 1. Fetch data from POS
    const posUrl = process.env.POS_API_URL;
    const apiKey = process.env.POS_API_KEY;

    if (!posUrl) {
      throw new Error('POS_API_URL is not defined in environment variables.');
    }

    console.log(`📡 Fetching from POS: ${posUrl}`);
    
    // Add a high limit to the POS URL to ensure we get everything
    const fetchUrl = posUrl.includes('?') ? `${posUrl}&limit=10000` : `${posUrl}?limit=10000`;
    
    const response = await axios.get(fetchUrl, {
      headers: { 'x-api-key': apiKey },
      timeout: 60000,
      httpsAgent: new (await import('https')).Agent({ rejectUnauthorized: false })
    });

    if (!response.data.success) {
      console.error('❌ POS API returned success: false', response.data.message);
      throw new Error(response.data.message || 'POS API returned failure');
    }

    const posProducts = response.data.data;
    console.log(`📊 POS API returned ${posProducts.length} items.`);

    // 2. SAFETY CHECK: If POS returns 0 items, ABORT. 
    // This prevents accidental mass-deletion if the POS API is temporarily empty.
    if (!posProducts || posProducts.length === 0) {
      console.warn('⚠️ POS API returned 0 items. Aborting sync to protect database integrity.');
      return { 
        success: true, 
        message: 'Sync skipped: POS catalog was empty.',
        posCount: 0,
        dbCount: (await supabase.from('products').select('*', { count: 'exact', head: true })).count
      };
    }
    
    // 3. Deduplicate POS products by SKU and track duplicates
    const uniquePosMap = new Map();
    const duplicates = [];
    
    posProducts.forEach(item => {
      const sku = item.sku || (item.id ? `POS_VAR_${item.id}` : null) || (item.product_id ? `POS_PID_${item.product_id}` : null);
      if (sku) {
        if (uniquePosMap.has(sku)) {
          duplicates.push({ sku, name: item.name });
        }
        uniquePosMap.set(sku, item);
      }
    });

    if (duplicates.length > 0) {
      console.warn(`⚠️ Found ${duplicates.length} duplicate SKUs in POS data:`, duplicates.slice(0, 3));
    }

    const dedupedProducts = Array.from(uniquePosMap.values());
    console.log(`🧹 Deduplicated to ${dedupedProducts.length} unique SKUs.`);

    // 3. Fetch ALL existing products from DB (Supabase defaults to 1000, we need more)
    const { data: existingProducts, error: fetchError } = await supabase
      .from('products')
      .select('sku')
      .limit(10000); // Set a limit high enough for the current catalog
    
    if (fetchError) {
      console.error('❌ Error fetching existing SKUs:', fetchError.message);
    }
    
    const existingSkus = new Set(existingProducts?.map(p => p.sku) || []);
    const posSkuSet = new Set(uniquePosMap.keys());

    const newProducts = [];
    const updates = [];

    dedupedProducts.forEach((posItem) => {
      const uniqueSku = posItem.sku || (posItem.id ? `POS_VAR_${posItem.id}` : null) || (posItem.product_id ? `POS_PID_${posItem.product_id}` : null);
      const variation = posItem.variation && posItem.variation !== 'Default' ? posItem.variation : '';
      const fullName = variation ? `${posItem.name} (${variation})` : posItem.name;

      if (existingSkus.has(uniqueSku)) {
        // ✅ ONLY update Price and Stock — never touch photos (they are managed manually on the web catalog)
        updates.push({
          sku: uniqueSku,
          price: posItem.price,
          stock: posItem.stock
        });
      } else {
        // New product: add with no image (photos are added manually later)
        newProducts.push({
          sku: uniqueSku,
          name: fullName,
          price: posItem.price,
          stock: posItem.stock,
          brand: posItem.brand || 'Universal',
          category: posItem.category || 'Maintenance',
          description: posItem.description || `High-performance ${fullName} for your motorcycle.`,
          specs: { variation }
        });
      }
    });

    // 4. Handle Deletions (Clean up items gone from POS)
    const skusToDelete = (existingProducts || [])
      .filter(p => !posSkuSet.has(p.sku))
      .map(p => p.sku);

    if (skusToDelete.length > 0) {
      console.log(`🗑️ Removing ${skusToDelete.length} discontinued products...`);
      const { error: delError } = await supabase.from('products').delete().in('sku', skusToDelete);
      if (delError) console.error('❌ Deletion failed:', delError.message);
    }

    let totalSavedCount = 0;
    let failedCount = 0;
    const CHUNK_SIZE = 100;
    const allWork = [...newProducts, ...updates];
    
    if (allWork.length > 0) {
      console.log(`📦 Processing ${allWork.length} items in parallel batches...`);
      
      // Use a simple concurrency limit of 5 batches at a time
      for (let i = 0; i < allWork.length; i += (CHUNK_SIZE * 5)) {
        const batchPromises = [];
        for (let j = 0; j < 5; j++) {
          const start = i + (j * CHUNK_SIZE);
          if (start >= allWork.length) break;
          
          const chunk = allWork.slice(start, start + CHUNK_SIZE);
          batchPromises.push(
            supabase.from('products')
              .upsert(chunk, { onConflict: 'sku' })
              .then(({ error }) => {
                if (error) {
                  console.error(`❌ Batch failed:`, error.message);
                  failedCount += chunk.length;
                } else {
                  totalSavedCount += chunk.length;
                }
              })
          );
        }
        await Promise.all(batchPromises);
      }
    }

    console.log(`✅ Sync Complete: ${totalSavedCount} saved, ${failedCount} failed, ${skusToDelete.length} deleted.`);
    lastSyncTime = Date.now();
    
    // 5. Verify final DB count
    const { count: finalDbCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    clearCache();
    
    return { 
      success: true, 
      posCount: posProducts.length,
      uniqueCount: dedupedProducts.length,
      duplicateCount: duplicates.length,
      totalProcessed: totalSavedCount,
      failedCount: failedCount,
      newCount: newProducts.length,
      updatedCount: updates.length,
      deleted: skusToDelete.length,
      dbCount: finalDbCount
    };
  } catch (error) {
    console.error('❌ POS Sync Failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    isSyncing = false;
  }
};
