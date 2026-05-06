import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, Info, PackageCheck, PackageX,
  ShieldCheck, Mail, Tag, Box, Zap, ShoppingBag,
  Phone, MessageCircle, X
} from 'lucide-react';
import { getProductById } from '../api/products';
import ProductCard from '../components/ProductCard';
import { IMAGE_URL } from '../utils/constants';
import api from '../api/axios';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const thumbnailsRef = useRef(null);

  const scrollThumbnails = (direction) => {
    if (thumbnailsRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      thumbnailsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentImageIndex(0);
    
    const load = async (isInitial = true) => {
      if (isInitial) setLoading(true);
      try {
        // For initial load, get full details
        const data = await getProductById(id);
        setProduct(data.product);
        if (isInitial) setRelated(data.related || []);

        // For polling, perform a LIVE-CHECK against the POS directly
        if (!isInitial) {
          const { data: liveData } = await api.get(`/sync/live-check/${id}`);
          if (liveData.success) {
            setProduct(prev => ({ ...prev, stock: liveData.stock, price: liveData.price }));
          }
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    load();

    // Live Stock Polling - Every 5 seconds
    const interval = setInterval(() => {
      load(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className="min-h-screen bg-white pt-32 text-center text-sm font-bold text-secondary-400 font-display">Loading Component Data...</div>;
  if (!product) return <div className="min-h-screen bg-white pt-32 text-center text-sm font-bold text-secondary-400 font-display">Component Not Found</div>;

  let allImages = [];
  if (product.image && product.image !== '/images/default-product.png') {
    try {
      const parsed = JSON.parse(product.image);
      allImages = Array.isArray(parsed) ? parsed : [product.image];
    } catch {
      allImages = product.image.includes(',') ? product.image.split(',').map(s => s.trim()) : [product.image];
    }
  } else {
    allImages = ['/placeholder.png'];
  }
  
  allImages = allImages.map(url => url.startsWith('/uploads') ? `${IMAGE_URL}${url}` : url);

  const displayImage = allImages[currentImageIndex] || allImages[0] || '/placeholder.png';

  const handlePrevImage = (e) => {
    if (e) e.stopPropagation();
    setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1);
  };

  const handleNextImage = (e) => {
    if (e) e.stopPropagation();
    setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1);
  };

  return (
    <div className="bg-white min-h-screen relative">
      
      {/* ── Background Detail ── */}
      <div className="fixed inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:40px_40px] pointer-events-none opacity-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 lg:pt-32 pb-16 lg:pb-24 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-24">
          
          {/* ── Left: Image Stage ── */}
          <div className="lg:w-1/2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="sticky top-32"
            >
              <nav className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">
                <Link to="/products" className="hover:text-primary-600 transition-colors">Catalog</Link>
                <ChevronRight size={10} />
                <span className="text-secondary-900 truncate max-w-[200px]">{product.name}</span>
              </nav>

              <div 
                onClick={() => setIsPreviewOpen(true)}
                className="w-full aspect-[4/3] max-h-[450px] bg-[#F8F9FA] rounded-[2rem] p-6 sm:p-8 lg:p-12 flex items-center justify-center border border-secondary-200 shadow-sm relative overflow-hidden group cursor-zoom-in"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent opacity-60" />
                <img
                  src={displayImage}
                  alt={product.name}
                  className="w-full h-full object-contain relative z-10 drop-shadow-xl transition-transform duration-700 group-hover:scale-[1.03]"
                />
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-secondary-900 rounded-[0.75rem] shadow-lg opacity-0 group-hover:opacity-100 transition-all z-20"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-secondary-900 rounded-[0.75rem] shadow-lg opacity-0 group-hover:opacity-100 transition-all z-20"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails Gallery */}
              {allImages.length > 1 && (
                <div className="relative mt-6 group/thumbs">
                  <div 
                    ref={thumbnailsRef}
                    className="flex overflow-x-auto gap-3 sm:gap-4 pb-2 snap-x scroll-smooth w-full"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {/* Add a style tag just in case we need webkit scrollbar hiding */}
                    <style>{`
                      .group\\/thumbs > div::-webkit-scrollbar { display: none; }
                    `}</style>

                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#F8F9FA] border-2 flex items-center justify-center p-2 overflow-hidden transition-all snap-start ${
                          currentImageIndex === idx ? 'border-primary-500 shadow-md shadow-primary-500/20' : 'border-secondary-100 hover:border-secondary-300'
                        }`}
                      >
                        <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>

                  {/* Thumbnail Navigation Arrows */}
                  <button 
                    onClick={() => scrollThumbnails('left')}
                    className="absolute left-0 top-1/2 -translate-y-[60%] -translate-x-3 w-8 h-8 rounded-full bg-white border border-secondary-200 text-secondary-600 flex items-center justify-center shadow-lg opacity-0 group-hover/thumbs:opacity-100 transition-all hover:bg-secondary-50 hover:text-secondary-950 z-10"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => scrollThumbnails('right')}
                    className="absolute right-0 top-1/2 -translate-y-[60%] translate-x-3 w-8 h-8 rounded-full bg-white border border-secondary-200 text-secondary-600 flex items-center justify-center shadow-lg opacity-0 group-hover/thumbs:opacity-100 transition-all hover:bg-secondary-50 hover:text-secondary-950 z-10"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Right: Information ── */}
          <div className="lg:w-1/2 flex flex-col pt-0 lg:pt-12">
            <div className="mb-8 lg:mb-10">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-primary-100">
                  <ShieldCheck size={12} />
                  {product.brand || 'Premium Brand'}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-100 text-secondary-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-secondary-200">
                  <Tag size={12} />
                  {product.category || 'General'}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-secondary-950 tracking-tighter leading-[0.9] mb-8">
                {product.name}
              </h1>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <p className="text-3xl font-black text-secondary-950">
                  {product.price ? `₱${Number(product.price).toLocaleString()}` : 'Price on Request'}
                </p>
                
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={product.stock}
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm ${
                      product.stock > 0 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                        : 'bg-rose-50 border-rose-100 text-rose-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full animate-pulse ${
                      product.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                      {product.stock > 0 ? `${product.stock} Units Available` : 'Out of Stock'}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-8 mb-12">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400 mb-3">Overview</h3>
                <p className="text-secondary-600 text-sm leading-relaxed font-medium max-w-lg">
                  {product.description || 'Premium engineered component for maximum reliability and vehicle performance.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <a
                  href={`mailto:support@ellamotorparts.ph?subject=Inquiry: ${product.name}`}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-secondary-950 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-xl shadow-secondary-950/20"
                >
                  <Mail size={16} />
                  Inquire Now
                </a>

                <div className="grid grid-cols-2 gap-4">
                  <a
                    href="jarlenedoac856@gmail.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-[#EAF2FF] border border-[#BFD5FF] text-[#0A47B8] font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#0A47B8] hover:text-white transition-all shadow-sm"
                  >
                    <MessageCircle size={14} />
                    Ask via Messenger
                  </a>
                  <a
                    href="https://www.facebook.com/p/Ella-motor-parts-100057044667058/"
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#15803D] hover:text-white transition-all shadow-sm"
                  >
                    <Phone size={14} />
                    Call Store
                  </a>
                </div>
              </div>
            </div>

            {/* ── Unified Spec Sheet ── */}
            <div className="bg-secondary-50/50 rounded-3xl p-8 border border-secondary-100">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary-400 mb-6 flex items-center gap-2">
                <Info size={12} />
                Technical Specifications
              </h3>
              
              <div className="space-y-6">
                {[
                  { label: 'SKU Identifier', val: product.sku || 'N/A', icon: Tag },
                  { label: 'Manufacturer', val: product.brand || 'Universal', icon: ShieldCheck },
                  { label: 'Category', val: product.category || 'Maintenance', icon: Box },
                  { label: 'Condition', val: 'Factory Original', icon: Info },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="text-secondary-400 group-hover:text-primary-600 transition-colors">
                        <item.icon size={16} strokeWidth={1.5} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">{item.label}</span>
                    </div>
                    <span className="text-xs font-black text-secondary-950">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Related Section ── */}
        {related.length > 0 && (
          <div className="mt-20 lg:mt-32 pt-16 lg:pt-24 border-t border-secondary-100">
            <div className="flex items-center justify-between mb-8 lg:mb-12">
              <h2 className="text-2xl lg:text-3xl font-display font-black text-secondary-950 tracking-tighter">Related Components</h2>
              <Link to="/products" className="text-[10px] font-black uppercase tracking-widest text-secondary-400 hover:text-secondary-900 transition-colors">See all</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {related.map(item => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Fullscreen Image Preview Modal ── */}
      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8"
            onClick={() => setIsPreviewOpen(false)}
          >
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50"
            >
              <X size={24} />
            </button>
            
            {allImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-6 sm:left-12 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            <motion.img
              key={currentImageIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-contain max-w-6xl mx-auto cursor-default relative z-40"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
