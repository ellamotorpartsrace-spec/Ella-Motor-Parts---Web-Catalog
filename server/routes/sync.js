import express from 'express';
import axios from 'axios';
import { supabase } from '../config/supabase.js';
import { syncWithPOS } from '../utils/posSync.js';
import { isAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * MANUAL SYNC (Triggered by Admin)
 */
router.post('/pos-now', isAdmin, async (req, res) => {
  const result = await syncWithPOS();
  if (result.success) {
    res.json({ message: `Successfully synced ${result.updated} products.` });
  } else {
    res.status(500).json({ message: 'Sync failed', error: result.error });
  }
});

/**
 * LIVE WEBHOOK (Triggered by Ella POS instantly after a sale)
 */
router.post('/webhook', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  
  // Basic Security Check (Must match the key set in POS)
  if (apiKey !== process.env.POS_API_KEY) {
    return res.status(401).json({ message: 'Unauthorized Webhook' });
  }

  const { event, updates } = req.body;

  if (event === 'stock_update' && Array.isArray(updates)) {
    console.log(`📡 Live Webhook Received: Syncing ${updates.length} items...`);
    
    try {
      for (const item of updates) {
        if (!item.sku) continue;

        const { error } = await supabase
          .from('products')
          .update({
            stock: item.stock,
            price: item.price,
            updated_at: new Date().toISOString()
          })
          .eq('sku', item.sku);

        if (error) console.error(`Error updating SKU ${item.sku}:`, error.message);
      }
      
      return res.json({ success: true, message: 'Website catalog updated live' });
    } catch (err) {
      console.error('Webhook processing error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  res.status(400).json({ message: 'Invalid webhook event' });
});

/**
 * ON-DEMAND LIVE CHECK (Used by Product Detail page for instant accuracy)
 */
router.get('/live-check/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get the SKU from our database
    const { data: product, error: dbError } = await supabase
      .from('products')
      .select('sku')
      .eq('id', id)
      .single();

    if (dbError || !product) return res.status(404).json({ message: 'Product not found' });

    // 2. Fetch the latest from POS API
    const response = await axios.get(process.env.POS_API_URL, {
      headers: { 'x-api-key': process.env.POS_API_KEY },
      httpsAgent: new (await import('https')).Agent({ rejectUnauthorized: false })
    });

    if (response.data.success) {
      const posItem = response.data.data.find(p => p.sku === product.sku || `POS_VAR_${p.id}` === product.sku);
      
      if (posItem) {
        // 3. Update our DB instantly
        const { error: updateError } = await supabase
          .from('products')
          .update({
            stock: posItem.stock,
            price: posItem.price
          })
          .eq('sku', product.sku);

        if (!updateError) {
          return res.json({ 
            success: true, 
            stock: posItem.stock, 
            price: posItem.price,
            source: 'pos_live'
          });
        }
      }
    }

    res.json({ success: false, message: 'Could not reach POS for live update' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
