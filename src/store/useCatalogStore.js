import { create } from 'zustand';

export const useCatalogStore = create((set, get) => ({
  products: [],
  pagination: { page: 1, totalPages: 1, total: 0 },
  brands: [],
  categories: [],
  lastFetch: null,
  filters: {}, // To track if we need to re-fetch when filters change

  setProductsData: (products, pagination) => set({ 
    products, 
    pagination, 
    lastFetch: Date.now() 
  }),
  
  setSidebarData: (brands, categories) => set({ 
    brands, 
    categories 
  }),

  setFilters: (filters) => set({ filters }),

  // Helper to check if cache is valid (e.g., 2 minutes TTL)
  isCacheValid: (currentFilters) => {
    const { lastFetch, filters } = get();
    if (!lastFetch) return false;
    
    // If filters changed, cache is invalid
    const filtersChanged = JSON.stringify(currentFilters) !== JSON.stringify(filters);
    if (filtersChanged) return false;

    const TTL = 2 * 60 * 1000; // 2 minutes
    return (Date.now() - lastFetch) < TTL;
  }
}));
