import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { IMAGE_URL } from '../utils/constants';

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function ProductCard({ product }) {
  const getFirstImage = (imageField) => {
    if (!imageField || imageField === '/images/default-product.png') return '/placeholder.png';
    let url = imageField;
    try {
      const parsed = JSON.parse(imageField);
      if (Array.isArray(parsed) && parsed.length > 0) url = parsed[0];
    } catch {
      if (imageField.includes(',')) url = imageField.split(',')[0].trim();
    }
    return url.startsWith('/uploads') ? `${IMAGE_URL}${url}` : url;
  };

  const imageSrc = getFirstImage(product.image);

  return (
    <motion.div variants={cardVariants} className="group h-full w-full max-w-[280px] mx-auto">
      <Link to={`/products/${product.id}`} className="block h-full relative">
        <div className="bg-white rounded-xl p-1 border border-secondary-100 shadow-sm transition-all duration-300 hover:shadow-md h-full flex flex-col group overflow-hidden">
          
          {/* ── Image Area (Compact Horizontal) ── */}
          <div className="relative w-full aspect-[3/2] bg-[#F8F9FA] rounded-lg flex items-center justify-center p-2 overflow-hidden border border-secondary-50/30">
            <img
              src={imageSrc}
              alt={product.name}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          
          {/* ── Info Section (Dense) ── */}
          <div className="px-2 py-2 flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[7px] font-black uppercase tracking-widest text-secondary-400 truncate pr-2">
                {product.brand || 'Original'}
              </span>
              {product.stock < 5 && product.stock > 0 && (
                <div className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
              )}
            </div>

            {product.sku && (
              <div className="mb-1.5 flex">
                <span className="px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-[4px] text-[8px] font-black uppercase tracking-widest leading-none">
                  {product.sku}
                </span>
              </div>
            )}

            <h3 className="text-[11px] font-bold text-secondary-900 leading-tight mb-2 group-hover:text-primary-600 transition-colors line-clamp-2 min-h-[1.8em]">
              {product.name}
            </h3>

            <div className="mt-auto pt-1.5 border-t border-secondary-50 flex items-center justify-between">
              <p className="text-[12px] font-black text-secondary-950">
                {product.price ? `₱${Number(product.price).toLocaleString()}` : 'Inquire'}
              </p>
              <div className="flex items-center gap-0.5 text-secondary-400 group-hover:text-secondary-950 transition-colors">
                <span className="text-[8px] font-black uppercase tracking-widest hidden sm:inline-block">Check Stock</span>
                <ChevronRight size={10} className="shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
