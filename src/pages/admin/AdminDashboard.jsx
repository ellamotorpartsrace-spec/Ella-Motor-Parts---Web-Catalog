import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  AlertCircle, 
  Layers, 
  Image as ImageIcon,
  ExternalLink,
  Search,
  Camera,
  RefreshCw,
  Clock
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { IMAGE_URL } from '../../utils/constants';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, lowStock: 0, categories: 0 });
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null); // tracks actual sync time
  const itemsPerPage = 15;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchProducts();
    
    // Live Auto-Refresh: Keep the dashboard fresh every 60 seconds
    const refreshTimer = setInterval(() => {
      fetchProducts();
      fetchStats();
    }, 60000);

    return () => clearInterval(refreshTimer);
  }, [currentPage, debouncedSearch]);

  // Separate Effect for Auto-Sync (Only on mount)
  useEffect(() => {
    const checkAutoSync = async () => {
      try {
        const { data } = await api.get('/products?limit=1&sort=created_at&order=DESC');
        if (data.products.length > 0) {
          const lastUpdate = new Date(data.products[0].created_at);
          const staleThreshold = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes
          
          if (lastUpdate < staleThreshold) {
            console.log('🔄 Inventory is stale (>15min). Triggering auto-sync...');
            handleSync(true); // Silent sync
          }
        }
      } catch (err) {
        console.error('Auto-sync check failed:', err);
      }
    };
    
    checkAutoSync();
    const interval = setInterval(checkAutoSync, 15 * 60 * 1000); // Check every 15 mins
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const [totalRes, lowStockRes, catRes] = await Promise.all([
        api.get('/products?limit=1'),
        api.get('/products?limit=1&maxStock=5'),
        api.get('/products/categories')
      ]);
      
      setStats({
        products: totalRes.data.pagination.total,
        lowStock: lowStockRes.data.pagination.total,
        categories: catRes.data.categories?.length || 0
      });
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearch,
          sort: 'created_at',
          order: 'DESC'
        }
      });
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Fetch products error:', error);
      toast.error('Failed to load components.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (silent = false) => {
    if (syncing) return;
    setSyncing(true);
    let toastId;
    if (!silent) {
      toastId = toast.loading('🔄 Connecting to Online POS...', { duration: Infinity });
    }

    try {
      const { data } = await api.post('/sync/pos-now');
      const now = new Date();
      setLastSync(now);
      if (!silent) {
        // Show a detailed breakdown of what happened
        const msg = data.message || `✅ Sync complete! ${data.dbCount ?? '?'} products now in catalog.`;
        toast.success(msg, { id: toastId, duration: 6000 });
      }
      fetchProducts();
      fetchStats();
    } catch (error) {
      console.error('Sync error:', error);
      if (!silent) {
        const errorMsg = 
          error.response?.data?.error ||
          error.response?.data?.message ||
          (error.code === 'ECONNABORTED' ? '⏱️ Sync timed out. The POS took too long to respond.' : '❌ Sync failed. Check Vercel logs for details.');
        toast.error(errorMsg, { id: toastId, duration: 8000 });
      }
    } finally {
      setSyncing(false);
    }
  };

  // Parse the first image from a product (handles JSON array or single URL)
  const getFirstImage = (imageField) => {
    if (!imageField || imageField === '/images/default-product.png') return null;
    try {
      const parsed = JSON.parse(imageField);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      return imageField;
    } catch {
      if (imageField.includes(',')) return imageField.split(',')[0].trim();
      return imageField;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-500 mb-2 italic">Management Console</p>
              <h1 className="text-4xl lg:text-5xl font-display font-black tracking-tighter flex items-center gap-3">
                <span className="text-rose-600">ELLA</span>
                <span className="text-secondary-950">MOTORPARTS</span>
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-secondary-100 rounded-xl shadow-sm">
              <Clock size={12} className={lastSync ? 'text-emerald-500' : 'text-secondary-400'} />
              <span className="text-[9px] font-black text-secondary-500 uppercase tracking-widest">
                {lastSync 
                  ? `Last Sync: ${lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` 
                  : 'Not synced yet'}
              </span>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                syncing 
                  ? 'bg-secondary-100 text-secondary-400 cursor-wait' 
                  : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-600/20'
              }`}
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync with POS'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
          {[
            { label: 'Total Inventory', value: stats.products, icon: Package, color: 'text-secondary-950', bg: 'bg-white' },
            { label: 'Low Stock Alert', value: stats.lowStock, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50/50' },
            { label: 'Active Categories', value: stats.categories, icon: Layers, color: 'text-primary-600', bg: 'bg-white' },
          ].map((stat, i) => (
            <div key={i} className={`${stat.bg} p-8 rounded-[2.5rem] border border-secondary-100 shadow-sm flex items-center gap-6`}>
              <div className={`w-14 h-14 rounded-2xl bg-white border border-secondary-100 ${stat.color} flex items-center justify-center shadow-sm`}>
                <stat.icon size={24} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-3xl font-display font-black text-secondary-950 tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-[2.5rem] border border-secondary-100 shadow-[0_40px_100px_rgba(0,0,0,0.03)] overflow-hidden">
          
          {/* Table Toolbar */}
          <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-secondary-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <h2 className="text-xl font-display font-black text-secondary-950 tracking-tight">Active Components</h2>
            <div className="flex items-center gap-3 w-full lg:w-96">
              <div className="flex-1 group flex items-center gap-3 px-5 py-3.5 bg-secondary-50/80 rounded-2xl border-2 border-transparent focus-within:bg-white focus-within:border-primary-100 focus-within:ring-4 focus-within:ring-primary-500/5 transition-all shadow-sm">
                <Search className="text-secondary-400 group-focus-within:text-primary-600 transition-colors shrink-0" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold border-none outline-none placeholder:text-secondary-400"
                />
              </div>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="lg:hidden p-4 sm:p-6 bg-secondary-50/30 space-y-4">
            {loading ? (
              <div className="p-10 text-center text-secondary-400 font-bold italic">Loading secure data...</div>
            ) : products.length === 0 ? (
              <div className="p-10 text-center text-secondary-400 font-bold italic">No matching components found.</div>
            ) : (
              products.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl border border-secondary-100 p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-secondary-50 flex items-center justify-center shrink-0 border border-secondary-100 overflow-hidden shadow-sm">
                      {(() => {
                        const firstImg = getFirstImage(product.image);
                        return firstImg ? (
                          <img 
                            src={firstImg.startsWith('/uploads') ? `${IMAGE_URL}${firstImg}` : firstImg} 
                            alt={product.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <ImageIcon size={20} className="text-secondary-200" />
                        );
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-secondary-950 leading-snug break-words">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black text-white bg-rose-600 px-2 py-0.5 rounded-md uppercase tracking-widest shadow-sm shadow-rose-600/20">SKU</span>
                        <span className="text-[10px] font-mono text-rose-600 font-black uppercase tracking-widest">{product.sku}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1.5 bg-white border border-secondary-100 text-secondary-600 text-[9px] font-black rounded-lg uppercase tracking-widest shadow-sm">
                      {product.category}
                    </span>
                    <p className="font-black text-secondary-950 text-sm tracking-tight">
                      ₱{parseFloat(product.price).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-secondary-50/50 mt-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${product.stock > 10 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-rose-500'} animate-pulse`} />
                      <span className={`text-xs font-black ${product.stock > 10 ? 'text-emerald-700' : product.stock > 0 ? 'text-amber-700' : 'text-rose-700'}`}>
                        {product.stock} Units
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Link to={`/products/${product.id}`} target="_blank" className="w-9 h-9 rounded-xl bg-white text-secondary-400 flex items-center justify-center hover:bg-secondary-50 hover:text-secondary-950 border border-secondary-100 transition-all shadow-sm" title="View live page">
                         <ExternalLink size={14} />
                       </Link>
                       <Link to={`/admin/products/${product.id}/photos`} className="w-9 h-9 rounded-xl bg-white text-secondary-400 flex items-center justify-center hover:bg-primary-600 hover:text-white border border-secondary-100 transition-all shadow-sm" title="Manage Photos">
                         <Camera size={14} />
                       </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary-50/30">
                  <th className="px-6 sm:px-10 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Component Details</th>
                  <th className="px-6 sm:px-10 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Category</th>
                  <th className="px-6 sm:px-10 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Price Point</th>
                  <th className="px-6 sm:px-10 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Live Stock</th>
                  <th className="px-6 sm:px-10 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-10 py-20 text-center text-secondary-400 font-bold italic">Loading secure data...</td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-10 py-20 text-center text-secondary-400 font-bold italic">No matching components found.</td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-secondary-50/30 transition-colors group">
                      <td className="px-6 sm:px-10 py-6">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-secondary-50 flex items-center justify-center shrink-0 border border-secondary-100 overflow-hidden shadow-sm">
                            {(() => {
                              const firstImg = getFirstImage(product.image);
                              return firstImg ? (
                                <img 
                                  src={firstImg.startsWith('/uploads') ? `${IMAGE_URL}${firstImg}` : firstImg} 
                                  alt={product.name} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <ImageIcon size={20} className="text-secondary-200" />
                              );
                            })()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-secondary-950 leading-snug break-words max-w-[320px] 2xl:max-w-[400px] group-hover:text-primary-600 transition-colors">{product.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[8px] font-black text-white bg-rose-600 px-2 py-0.5 rounded-md uppercase tracking-widest shadow-sm shadow-rose-600/20">SKU</span>
                              <span className="text-[10px] font-mono text-rose-600 font-black uppercase tracking-widest">{product.sku}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 sm:px-10 py-6">
                        <span className="px-3 py-1.5 bg-white border border-secondary-100 text-secondary-600 text-[9px] font-black rounded-lg uppercase tracking-widest shadow-sm">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 sm:px-10 py-6 font-black text-secondary-950 text-sm tracking-tight">
                        ₱{parseFloat(product.price).toLocaleString()}
                      </td>
                      <td className="px-6 sm:px-10 py-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${product.stock > 10 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-rose-500'} animate-pulse`} />
                          <span className={`text-xs font-black ${product.stock > 10 ? 'text-emerald-700' : product.stock > 0 ? 'text-amber-700' : 'text-rose-700'}`}>
                            {product.stock} Units
                          </span>
                        </div>
                      </td>
                      <td className="px-6 sm:px-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                           <Link to={`/products/${product.id}`} target="_blank" className="w-10 h-10 rounded-xl bg-white text-secondary-400 flex items-center justify-center hover:bg-secondary-50 hover:text-secondary-950 border border-secondary-100 transition-all shadow-sm" title="View live page">
                             <ExternalLink size={16} />
                           </Link>
                           <Link to={`/admin/products/${product.id}/photos`} className="w-10 h-10 rounded-xl bg-white text-secondary-400 flex items-center justify-center hover:bg-primary-600 hover:text-white border border-secondary-100 transition-all shadow-sm" title="Manage Photos">
                             <Camera size={16} />
                           </Link>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="px-6 sm:px-10 py-6 border-t border-secondary-50 flex items-center justify-between bg-secondary-50/30">
              <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest hidden sm:block">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total} entries
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 bg-white text-secondary-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-secondary-200 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Prev
                </button>
                <div className="px-4 py-2 bg-secondary-950 text-white text-[10px] font-black rounded-lg">
                  {currentPage} / {pagination.totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  disabled={currentPage >= pagination.totalPages}
                  className="px-4 py-2 bg-white text-secondary-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-secondary-200 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
