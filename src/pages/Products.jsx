import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, X, SlidersHorizontal,
  ChevronDown, Package, ShieldCheck, Zap,
  Settings, Droplets, Shield, Disc, Circle,
  Gauge, Activity, Cog
} from 'lucide-react';
import { getProducts } from '../api/products';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

import { useCatalogStore } from '../store/useCatalogStore';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    products, setProductsData, 
    pagination, 
    brands, categories, setSidebarData,
    isCacheValid, setFilters 
  } = useCatalogStore();

  const globalTotal = categories.reduce((acc, cat) => acc + cat.count, 0);
  
  const [loading, setLoading] = useState(!isCacheValid({
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'created_at',
    order: searchParams.get('order') || 'DESC',
    page: searchParams.get('page') || '1'
  }));

  const getCategoryIcon = (name) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('engine')) return Gauge;
    if (lower.includes('brake')) return Disc;
    if (lower.includes('electrical')) return Zap;
    if (lower.includes('suspension')) return Activity;
    if (lower.includes('drivetrain') || lower.includes('gear')) return Cog;
    if (lower.includes('maintenance') || lower.includes('oil')) return Droplets;
    if (lower.includes('body')) return Shield;
    if (lower.includes('tire') || lower.includes('wheel')) return Circle;
    if (lower.includes('exhaust')) return Activity;
    return Package;
  };

  const currentCategory = searchParams.get('category') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'created_at';
  const currentOrder = searchParams.get('order') || 'DESC';
  const currentPage = parseInt(searchParams.get('page')) || 1;


  useEffect(() => {
    const currentFilters = {
      category: currentCategory,
      brand: currentBrand,
      search: currentSearch,
      sort: currentSort,
      order: currentOrder,
      page: currentPage.toString()
    };

    const loadProducts = async () => {
      // If cache is valid and we already have products, don't show loading spinner
      const cacheValid = isCacheValid(currentFilters);
      if (cacheValid && products.length > 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getProducts({
          page: currentPage,
          limit: 16,
          category: currentCategory,
          brand: currentBrand,
          search: currentSearch,
          sort: currentSort,
          order: currentOrder,
        });
        setProductsData(data.products, data.pagination);
        setFilters(currentFilters);
      } catch (err) {
        console.error('Fetch err:', err);
      } finally {
        setLoading(false);
      }
    };

    const loadSidebarData = async () => {
      try {
        const [{ data: bData }, { data: cData }] = await Promise.all([
          api.get('/products/brands'),
          api.get('/products/categories')
        ]);
        setSidebarData(bData.brands || [], cData.categories || []);
      } catch (err) {
        console.error('Sidebar err:', err);
      }
    };

    loadProducts();
    loadSidebarData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, currentCategory, currentBrand, currentSearch, currentSort, currentOrder]);

  const updateFilter = (key, value, resetPage = true) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (resetPage) params.set('page', '1');
    setSearchParams(params);
  };

  const clearAll = () => setSearchParams({});

  return (
    <div className="min-h-screen bg-[#F8F9FA] relative">
      {/* ── Suble Background Pattern ── */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 lg:pt-32 pb-16 lg:pb-24 relative z-10">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 lg:gap-8 mb-8 lg:mb-12">
          <div>
            <nav className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">
              <Link to="/" className="hover:text-primary-600 transition-colors">Showroom</Link>
              <ChevronRight size={10} />
              <span className="text-secondary-900">Components</span>
            </nav>
            <h1 className="text-3xl font-display font-black text-secondary-950 tracking-tighter">
              Precision <span className="text-primary-600">Parts</span>
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Search */}
            <div className="relative group w-full md:w-80">
              <input
                type="text"
                placeholder="Search catalog..."
                value={currentSearch}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="px-6 pr-10 py-3 bg-white border border-secondary-100 rounded-xl text-xs font-bold shadow-sm focus:border-primary-500/50 outline-none transition-all w-full"
              />
              {currentSearch && (
                <button
                  onClick={() => updateFilter('search', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-secondary-400 hover:text-secondary-950 transition-colors"
                >
                  <X size={14} strokeWidth={3} />
                </button>
              )}
            </div>

            {/* Custom Sort Dropdown */}
            <div className="relative flex items-center gap-3 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-secondary-400 hidden lg:block">Sort by:</span>
              <SortDropdown 
                currentSort={currentSort} 
                currentOrder={currentOrder} 
                onSelect={(sort, order) => {
                  const params = new URLSearchParams(searchParams);
                  params.set('sort', sort);
                  params.set('order', order);
                  setSearchParams(params);
                }} 
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* ── Sidebar Filters (Independent Scroll) ── */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-32 space-y-10">
              
              {/* Categories Section */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary-950">Categories</h3>
                </div>
                <div className="max-h-[350px] overflow-y-auto pr-4 custom-scrollbar space-y-1">
                  <SidebarButton
                    label="All Products"
                    count={globalTotal}
                    active={!currentCategory}
                    onClick={() => updateFilter('category', '')}
                    icon={Package}
                  />
                  {categories.map(cat => (
                    <SidebarButton
                      key={cat.category}
                      label={cat.category}
                      count={cat.count}
                      active={currentCategory.split(',').includes(cat.category)}
                      onClick={() => updateFilter('category', cat.category)}
                      icon={getCategoryIcon(cat.category)}
                    />
                  ))}
                </div>
              </div>

              {/* Manufacturers Section */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary-300" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary-950">Manufacturers</h3>
                </div>
                <div className="max-h-[250px] overflow-y-auto pr-4 custom-scrollbar space-y-1">
                  {brands.map(b => (
                    <SidebarButton
                      key={b.brand}
                      label={b.brand}
                      count={b.count}
                      active={currentBrand === b.brand}
                      onClick={() => updateFilter('brand', currentBrand === b.brand ? '' : b.brand)}
                      icon={ShieldCheck}
                    />
                  ))}
                </div>
              </div>

              {/* Clear All */}
              {(currentCategory || currentBrand || currentSearch) && (
                <button
                  onClick={clearAll}
                  className="w-full py-4 rounded-2xl border border-dashed border-secondary-200 text-xs font-bold text-red-500 hover:bg-red-50 hover:border-red-200 transition-all"
                >
                  Reset All Filters
                </button>
              )}

            </div>
          </aside>

          {/* ── Main Grid ── */}
          <main className="flex-1 min-w-0">
            {/* Active Filters & Counter */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex flex-wrap items-center gap-2">
                {(currentCategory || currentBrand || currentSearch) ? (
                  <>
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary-400 mr-2">Applied:</span>
                    {currentCategory && (
                      <button
                        onClick={() => updateFilter('category', '')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-secondary-100 rounded-lg text-[10px] font-bold text-secondary-900 hover:border-red-200 hover:text-red-500 transition-all group"
                      >
                        Category: {currentCategory.replace(',', ' & ')}
                        <X size={10} strokeWidth={3} className="text-secondary-300 group-hover:text-red-500" />
                      </button>
                    )}
                    {currentBrand && (
                      <button
                        onClick={() => updateFilter('brand', '')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-secondary-100 rounded-lg text-[10px] font-bold text-secondary-900 hover:border-red-200 hover:text-red-500 transition-all group"
                      >
                        Manufacturer: {currentBrand}
                        <X size={10} strokeWidth={3} className="text-secondary-300 group-hover:text-red-500" />
                      </button>
                    )}
                    {currentSearch && (
                      <button
                        onClick={() => updateFilter('search', '')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-secondary-100 rounded-lg text-[10px] font-bold text-secondary-900 hover:border-red-200 hover:text-red-500 transition-all group"
                      >
                        Search: {currentSearch}
                        <X size={10} strokeWidth={3} className="text-secondary-300 group-hover:text-red-500" />
                      </button>
                    )}
                    <button
                      onClick={clearAll}
                      className="text-[9px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 ml-2"
                    >
                      Clear All
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-widest text-secondary-400">All Shop Inventory</span>
                )}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-secondary-400">
                {currentCategory ? (
                  <>Showing <span className="text-secondary-950 font-black">{pagination.total}</span> <span className="text-primary-600">{currentCategory.replace(',', ' & ')}</span> parts <span className="text-secondary-300 ml-1">/ {globalTotal} Total in POS</span></>
                ) : (
                  <><span className="text-secondary-950 font-black">{pagination.total}</span> products available</>
                )}
              </div>
            </div>

            <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[3/2] bg-white rounded-lg border border-secondary-50" />
                      <div className="h-1.5 bg-white rounded-full mt-2 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : products && products.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full"
                >
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </motion.div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center opacity-60">
                  <Package size={24} className="text-secondary-300 mb-3" />
                  <p className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest">No products found</p>
                  <button onClick={clearAll} className="mt-2 text-primary-500 font-black text-[9px] uppercase tracking-widest hover:underline">Reset Filters</button>
                </div>
              )}
            </AnimatePresence>

            {/* ── Pagination ── */}
            {!loading && pagination.totalPages > 1 && (
              <div className="mt-20 flex justify-center items-center gap-4">
                <button
                  onClick={() => updateFilter('page', (currentPage - 1).toString(), false)}
                  disabled={currentPage <= 1}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-secondary-100 text-secondary-400 disabled:opacity-30 hover:border-secondary-300 transition-all"
                >
                  <ChevronDown size={20} className="rotate-90" />
                </button>
                
                <div className="flex gap-2">
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let start = Math.max(1, currentPage - 2);
                    let end = Math.min(pagination.totalPages, start + maxVisible - 1);
                    
                    if (end - start < maxVisible - 1) {
                      start = Math.max(1, end - maxVisible + 1);
                    }

                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => updateFilter('page', i.toString(), false)}
                          className={`w-12 h-12 rounded-2xl text-[10px] font-black transition-all ${currentPage === i ? 'bg-secondary-950 text-white shadow-xl shadow-secondary-950/20' : 'bg-white border border-secondary-100 text-secondary-400 hover:border-secondary-300'}`}
                        >
                          {i}
                        </button>
                      );
                    }
                    return pages;
                  })()}
                </div>

                <button
                  onClick={() => updateFilter('page', (currentPage + 1).toString(), false)}
                  disabled={currentPage >= pagination.totalPages}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-secondary-100 text-secondary-400 disabled:opacity-30 hover:border-secondary-300 transition-all"
                >
                  <ChevronDown size={20} className="-rotate-90" />
                </button>
              </div>
            )}
            </div>
          </main>
        </div>
      </div>

      {/* ── Mobile Logic Placeholder ── */}
      <button
        className="lg:hidden fixed bottom-8 right-8 w-14 h-14 bg-secondary-950 text-white rounded-full shadow-2xl flex items-center justify-center z-50"
      >
        <SlidersHorizontal size={20} />
      </button>
    </div>
  );
}

function SortDropdown({ currentSort, currentOrder, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const options = [
    { label: 'Newest Arrivals', sort: 'created_at', order: 'DESC', icon: Activity },
    { label: 'Price: Low to High', sort: 'price', order: 'ASC', icon: Zap },
    { label: 'Price: High to Low', sort: 'price', order: 'DESC', icon: Zap },
  ];

  const active = options.find(o => o.sort === currentSort && o.order === currentOrder) || options[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-4 px-6 py-3 bg-white border border-secondary-200 rounded-xl shadow-sm hover:border-secondary-400 transition-all min-w-[200px]"
      >
        <active.icon size={14} className="text-secondary-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-secondary-950 flex-1 text-left">{active.label}</span>
        <ChevronDown size={14} className={`text-secondary-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full right-0 mt-2 w-full min-w-[220px] bg-white border border-secondary-100 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-2">
                {options.map((opt) => (
                  <button
                    key={`${opt.sort}-${opt.order}`}
                    onClick={() => {
                      onSelect(opt.sort, opt.order);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${active.label === opt.label ? 'bg-secondary-50 text-primary-600' : 'hover:bg-secondary-50 text-secondary-600 hover:text-secondary-950'}`}
                  >
                    <opt.icon size={14} className={active.label === opt.label ? 'text-primary-500' : 'text-secondary-300'} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarButton({ label, active, onClick, icon: Icon, count }) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${active ? 'bg-white shadow-sm border border-secondary-100' : 'hover:bg-secondary-100/50'}`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-primary-500 text-white' : 'bg-secondary-50 text-secondary-400 group-hover:bg-secondary-100'}`}>
        {typeof Icon === 'string' ? (
          <span className="text-sm leading-none">{Icon}</span>
        ) : (
          <Icon size={14} />
        )}
      </div>
      <span className={`text-xs font-bold transition-colors flex-1 text-left ${active ? 'text-secondary-950' : 'text-secondary-500 group-hover:text-secondary-950'}`}>
        {label}
      </span>
      {count != null && (
        <span className="text-[10px] font-black text-secondary-300 group-hover:text-secondary-500">{count}</span>
      )}
    </button>
  );
}
