import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, STORAGE_BUCKET } from '../config/supabase.js';
import { isAdmin } from '../middleware/auth.js';
import { convertToWebP, getWebPFilename } from '../utils/imageProcessor.js';

const router = express.Router();
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Multer configuration for image uploads (Memory Storage for processing)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only images are allowed (jpeg, jpg, png, webp)'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Helper function to upload to Supabase Storage
const uploadToSupabase = async (buffer, filename) => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filename, buffer, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filename);

  return publicUrl;
};

// Helper: Extract URLs from DB string (handles arrays and commas)
const extractImageUrls = (imageField) => {
  if (!imageField || imageField === '/images/default-product.png') return [];
  try {
    const parsed = JSON.parse(imageField);
    return Array.isArray(parsed) ? parsed : [imageField];
  } catch {
    return imageField.includes(',') ? imageField.split(',').map(s => s.trim()) : [imageField];
  }
};

// Helper: Safely delete images from Supabase storage
const deleteImagesFromSupabase = async (urls) => {
  console.log('Attempting to delete images from Supabase:', urls);
  if (!urls || urls.length === 0) return;
  const filenames = [];
  for (const url of urls) {
    if (!url || url === '/images/default-product.png') continue;
    
    // Check if it's already a filename or path without domain
    if (!url.startsWith('http')) {
       // If it starts with /uploads/ it's local. If it's just a filename, push it
       if (!url.startsWith('/uploads/')) {
           filenames.push(url);
       }
       continue;
    }

    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split(`/${STORAGE_BUCKET}/`);
      if (pathParts.length === 2) filenames.push(decodeURIComponent(pathParts[1]));
      else {
          const parts = urlObj.pathname.split('/');
          filenames.push(decodeURIComponent(parts[parts.length - 1]));
      }
    } catch (e) {
      console.error('Failed to parse URL:', url, e);
      // Ignore invalid URLs
    }
  }
  
  console.log('Extracted filenames to delete:', filenames);
  if (filenames.length > 0) {
    try {
      const { data, error } = await supabase.storage.from(STORAGE_BUCKET).remove(filenames);
      if (error) {
         console.error('Supabase storage removal error:', error);
      } else {
         console.log('Successfully deleted from Supabase:', data);
      }
    } catch (e) {
      console.error('Failed to remove from Supabase:', e);
    }
  }
};

// GET /api/products - List products with filtering, search, and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      brand,
      minPrice,
      maxPrice,
      search,
      featured,
      sort = 'created_at',
      order = 'DESC',
      maxStock
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Optimize: Only fetch necessary columns for list view
    let query = supabase
      .from('products')
      .select('id, name, brand, category, price, image, stock, created_at, featured, sku', { count: 'exact' });

    if (category) {
      const cats = category.split(',').map(c => c.trim());
      if (cats.length > 1) {
        query = query.in('category', cats);
      } else {
        query = query.eq('category', category);
      }
    }

    if (brand) {
      query = query.eq('brand', brand);
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    if (maxStock !== undefined) {
      query = query.lte('stock', parseInt(maxStock));
    }

    if (search) {
      const terms = search.trim().split(/\s+/).filter(t => t.length > 0);
      if (terms.length > 0) {
        // Multi-keyword fuzzy search: match all terms in any order across major fields
        terms.forEach(term => {
          query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%,brand.ilike.%${term}%,category.ilike.%${term}%,description.ilike.%${term}%`);
        });
      }
    }

    if (featured === 'true' || featured === true) {
      query = query.eq('featured', true);
    }

    const allowedSort = ['price', 'name', 'created_at', 'stock', 'sku'];
    const sortField = allowedSort.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? true : false;

    if (search && (!sort || sort === 'created_at')) {
      // Prioritize alphabetical exact matches by ordering by SKU then Name ascending
      query = query
        .order('sku', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });
    } else {
      query = query.order(sortField, { ascending: sortOrder });
    }

    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: products, count, error } = await query;

    if (error) throw error;

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/products/categories - Get unique categories with accurate counts
router.get('/categories', async (req, res) => {
  try {
    const cached = getCachedData('categories');
    if (cached) return res.json({ categories: cached });

    let allCategories = [];
    let from = 0;
    const PAGE_SIZE = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .range(from, from + PAGE_SIZE - 1);
      
      if (error) throw error;
      allCategories = allCategories.concat(data);
      if (data.length < PAGE_SIZE) hasMore = false;
      from += PAGE_SIZE;
    }
    
    const counts = allCategories.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {});
    
    const categories = Object.keys(counts).map(key => ({
      category: key,
      count: counts[key]
    })).sort((a, b) => a.category.localeCompare(b.category));
    
    setCachedData('categories', categories);
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/products/brands - Get unique brands with accurate counts
router.get('/brands', async (req, res) => {
  try {
    const cached = getCachedData('brands');
    if (cached) return res.json({ brands: cached });

    let allBrands = [];
    let from = 0;
    const PAGE_SIZE = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('products')
        .select('brand')
        .range(from, from + PAGE_SIZE - 1);
      
      if (error) throw error;
      allBrands = allBrands.concat(data);
      if (data.length < PAGE_SIZE) hasMore = false;
      from += PAGE_SIZE;
    }
    
    const counts = allBrands.reduce((acc, curr) => {
      acc[curr.brand] = (acc[curr.brand] || 0) + 1;
      return acc;
    }, {});
    
    const brands = Object.keys(counts).map(key => ({
      brand: key,
      count: counts[key]
    })).sort((a, b) => a.brand.localeCompare(b.brand));
    
    setCachedData('brands', brands);
    res.json({ brands });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/products/search-suggestions
router.get('/search-suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, category, price, image')
      .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
      .limit(5);

    if (error) throw error;

    res.json({ suggestions: products });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Product not found.' });
      }
      throw error;
    }

    // Get related products in same category
    const { data: related, error: relatedError } = await supabase
      .from('products')
      .select('*')
      .eq('category', product.category)
      .neq('id', product.id)
      .limit(4);

    if (relatedError) throw relatedError;

    res.json({ product, related });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ADMIN ROUTES

// POST /api/products - Create new product (Admin)
router.post('/', isAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const { name, category, brand, price, stock, description, specs, compatibility, installation_notes, featured, sku } = req.body;
    let imagePaths = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const webpBuffer = await convertToWebP(file.buffer);
        const filename = getWebPFilename(file.originalname);
        const url = await uploadToSupabase(webpBuffer, filename);
        imagePaths.push(url);
      }
    }

    const specsJson = typeof specs === 'string' ? JSON.parse(specs || '{}') : (specs || {});
    const compatJson = typeof compatibility === 'string' ? JSON.parse(compatibility || '[]') : (compatibility || []);
    // Store as JSON array if multiple, else single string for backward compat
    const imageValue = imagePaths.length > 1 ? JSON.stringify(imagePaths) : (imagePaths[0] || '/images/default-product.png');

    const { data: result, error } = await supabase
      .from('products')
      .insert([{
        name, category, brand, price, stock, description,
        specs: specsJson, compatibility: compatJson,
        installation_notes, image: imageValue,
        featured: featured === 'true' || featured === true,
        sku
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Product created successfully.', productId: result.id });
  } catch (error) {
    console.error('Create product error details:', error);
    res.status(500).json({ message: 'Server error creating product: ' + error.message });
  }
});

// PUT /api/products/:id - Update product (Admin)
router.put('/:id', isAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const { name, category, brand, price, stock, description, specs, compatibility, installation_notes, featured, sku } = req.body;
    const productId = req.params.id;

    const specsJson = typeof specs === 'string' ? JSON.parse(specs || '{}') : (specs || {});
    const compatJson = typeof compatibility === 'string' ? JSON.parse(compatibility || '[]') : (compatibility || []);

    let updates = {
      name, category, brand, price, stock, description,
      specs: specsJson, compatibility: compatJson,
      installation_notes,
      featured: featured === 'true' || featured === true,
      sku
    };

    if (req.files && req.files.length > 0) {
      const imagePaths = [];
      for (const file of req.files) {
        const webpBuffer = await convertToWebP(file.buffer);
        const filename = getWebPFilename(file.originalname);
        const url = await uploadToSupabase(webpBuffer, filename);
        imagePaths.push(url);
      }
      
      // If we are overriding the image entirely or appending
      const existingUrls = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];
      const allUrls = [...existingUrls, ...imagePaths];
      updates.image = allUrls.length > 1 ? JSON.stringify(allUrls) : allUrls[0];
    } else if (req.body.existingImages) {
      const existingUrls = JSON.parse(req.body.existingImages);
      updates.image = existingUrls.length > 1 ? JSON.stringify(existingUrls) : (existingUrls[0] || '/images/default-product.png');
    }

    // Cleanup deleted images
    const { data: oldProduct } = await supabase.from('products').select('image').eq('id', productId).single();
    if (oldProduct) {
      const oldImages = extractImageUrls(oldProduct.image);
      let newImages = [];
      if (updates.image) {
        newImages = extractImageUrls(updates.image);
      } else {
        newImages = extractImageUrls(oldProduct.image);
      }
      const deletedImages = oldImages.filter(img => !newImages.includes(img));
      if (deletedImages.length > 0) {
        await deleteImagesFromSupabase(deletedImages);
      }
    }

    const { data: result, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select();

    if (error) throw error;
    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json({ message: 'Product updated successfully.' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error updating product.' });
  }
});

// PATCH /api/products/:id/images - Add/replace images for an existing product (Admin)
router.patch('/:id/images', isAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const productId = req.params.id;
    const { existingImages } = req.body; // JSON array string of already-saved URLs

    let currentImages = [];
    if (existingImages) {
      try { currentImages = JSON.parse(existingImages); } catch { currentImages = []; }
    }

    // Cleanup deleted images from Supabase storage
    const { data: oldProduct } = await supabase.from('products').select('image').eq('id', productId).single();
    if (oldProduct) {
      const oldImages = extractImageUrls(oldProduct.image);
      const deletedImages = oldImages.filter(img => !currentImages.includes(img));
      if (deletedImages.length > 0) {
        await deleteImagesFromSupabase(deletedImages);
      }
    }

    // Upload new files
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const webpBuffer = await convertToWebP(file.buffer);
        const filename = getWebPFilename(file.originalname);
        const url = await uploadToSupabase(webpBuffer, filename);
        currentImages.push(url);
      }
    }

    // Store as JSON array if > 1, else plain string
    const imageValue = currentImages.length > 1
      ? JSON.stringify(currentImages)
      : (currentImages[0] || '/images/default-product.png');

    const { data: result, error } = await supabase
      .from('products')
      .update({ image: imageValue })
      .eq('id', productId)
      .select();

    if (error) throw error;
    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json({ message: 'Images updated successfully.', images: currentImages });
  } catch (error) {
    console.error('Update images error:', error);
    res.status(500).json({ message: 'Server error updating images.' });
  }
});

// DELETE /api/products/:id - Delete product (Admin)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id)
      .select();
      
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    
    const deletedProduct = data[0];
    if (deletedProduct.image) {
      await deleteImagesFromSupabase(extractImageUrls(deletedProduct.image));
    }

    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error deleting product.' });
  }
});

export default router;
