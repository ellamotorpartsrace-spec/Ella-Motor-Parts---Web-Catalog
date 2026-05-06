import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight, ShieldCheck, Headphones,
  Wrench, ArrowRight, PackageCheck, ChevronRight
} from 'lucide-react';

import ProductCard from '../components/ProductCard';
import { getProducts } from '../api/products';
import api from '../api/axios';
import {
  Package, Zap, Settings, Droplets, Shield,
  Disc, Circle, Gauge, Activity, Cog
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([
    { category: 'Engine', count: '---' },
    { category: 'Brake', count: '---' },
    { category: 'Electrical', count: '---' },
    { category: 'Suspension', count: '---' },
    { category: 'Maintenance', count: '---' },
    { category: 'Drivetrain', count: '---' }
  ]);
  const [loading, setLoading] = useState(true);

  const getCategoryIcon = (name) => {
    const lower = name.toLowerCase();
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

  useEffect(() => {
    const load = async () => {
      try {
        const [pData, cData] = await Promise.all([
          getProducts({ featured: true, limit: 4 }),
          api.get('/products/categories')
        ]);
        setFeatured(pData.products);
        if (cData.data.categories && cData.data.categories.length > 0) {
          setCategories(cData.data.categories);
        }
      } catch (err) {
        console.error('Failed to fetch home data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="flex flex-col bg-white min-h-screen relative">

      {/* ══════════════════════════════ HERO (REVERTED TO WHITE) ══════════════════════════════ */}
      <section className="relative pt-36 pb-20 lg:pt-52 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[600px] h-[600px] rounded-full bg-primary-500/5 blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 py-1.5 px-5 rounded-full bg-secondary-50 border border-secondary-100 text-[10px] font-black text-secondary-500 uppercase tracking-[0.2em] mb-8">
              <PackageCheck size={12} className="text-primary-500" />
              Quality Motor Parts — In Stock & Ready
            </span>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-secondary-950 tracking-tight mb-8 leading-[0.9]">
              Find the Parts <br />
              <span className="text-primary-600">You Need.</span>
            </h1>

            <p className="text-lg text-secondary-500 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
              Browse hundreds of motor parts — from engines and brakes to electrical components — with live stock levels and clear pricing.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                to="/products"
                className="group flex items-center justify-center gap-3 px-10 py-5 bg-secondary-950 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-black transition-all w-full sm:w-auto shadow-xl shadow-black/10"
              >
                Browse Catalog
                <ArrowUpRight size={18} />
              </Link>
              <Link
                to="/products?category=Engine Parts,Engine Block"
                className="flex items-center justify-center px-10 py-5 bg-white border border-secondary-200 text-secondary-950 font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-secondary-50 transition-all w-full sm:w-auto"
              >
                Engine Parts
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════ WHY US ══════════════════════════════ */}
      <section className="py-16 lg:py-20 border-y border-secondary-100 bg-secondary-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10"
          >
            {[
              { icon: Wrench, title: 'Wide Selection', desc: 'Hundreds of parts across all major categories' },
              { icon: ShieldCheck, title: 'Genuine Quality', desc: 'OEM-grade and aftermarket parts you can trust' },
              { icon: PackageCheck, title: 'Live Stock Levels', desc: 'Always see exactly how many items are available' },
              { icon: Headphones, title: 'Customer Support', desc: 'Our team is ready to help you find the right part' },
            ].map((feat, i) => (
              <motion.div key={i} variants={itemVariants} className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-secondary-900 shrink-0 shadow-sm border border-secondary-100">
                  <feat.icon size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-secondary-900 text-base mb-1">{feat.title}</h3>
                  <p className="text-secondary-500 text-xs font-medium leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════ COMPACT CATEGORIES (PLATINUM PREMIUM) ══════════════════════════════ */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-white via-secondary-50 to-white relative border-y border-secondary-100/50">
        <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary-100/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 text-center md:text-left">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-600 mb-3">System Groups</p>
              <h2 className="text-4xl md:text-5xl font-display font-black text-secondary-950 tracking-tighter">
                Explore <span className="text-secondary-400">Inventory</span>
              </h2>
            </div>
            <Link
              to="/products"
              className="group inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-secondary-500 hover:text-primary-600 transition-all bg-white px-6 py-3 rounded-full border border-secondary-200 shadow-sm"
            >
              See All Components <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {categories.slice(0, 6).map((cat) => {
              const Icon = getCategoryIcon(cat.category);
              return (
                <div key={cat.category} className="h-full">
                  <Link
                    to={`/products?category=${encodeURIComponent(cat.category)}`}
                    className="group relative flex flex-col items-center justify-center p-8 bg-white rounded-[2rem] border border-secondary-200/80 shadow-lg shadow-secondary-200/50 hover:border-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/20 hover:-translate-y-2 transition-all duration-500 h-full overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10 w-14 h-14 rounded-2xl bg-secondary-50 border border-secondary-100 flex items-center justify-center text-secondary-600 group-hover:bg-primary-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary-500/30 transition-all duration-500 mb-6">
                      <Icon size={28} strokeWidth={1.5} />
                    </div>
                    
                    <h3 className="relative z-10 font-display font-black text-secondary-900 text-[10px] uppercase tracking-[0.2em] text-center mb-2 group-hover:text-primary-700 transition-colors">
                      {cat.category}
                    </h3>
                    <span className="relative z-10 text-[9px] font-bold text-secondary-500 uppercase tracking-widest group-hover:text-secondary-600 transition-colors">
                      {cat.count === '---' ? 'Browse' : `${cat.count} Items`}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ COMPACT CTA BANNER (ONLY CHANGE) ══════════════════════════════ */}
      <section className="py-12 lg:py-16 mx-4 sm:mx-6 lg:mx-8 mb-12">
        <div className="max-w-5xl mx-auto px-6 py-10 lg:py-12 bg-secondary-950 rounded-[2rem] text-center relative overflow-hidden shadow-2xl shadow-black/10">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 rounded-full blur-[80px] -mr-32 -mt-32" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-4 tracking-tight">
              Can't find the <span className="text-primary-500">right part?</span>
            </h2>
            <p className="text-secondary-400 text-sm mb-8 max-w-xl mx-auto font-medium">
              Our team can help you find exactly what you need. Just reach out and we'll check our full inventory.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                to="/products"
                className="px-10 py-4 bg-white text-secondary-950 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-secondary-100 transition-all shadow-xl shadow-white/5"
              >
                Browse Catalog
              </Link>
              <a
                href="mailto:support@ellamotorparts.ph"
                className="px-10 py-4 bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
              >
                Contact Support
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
