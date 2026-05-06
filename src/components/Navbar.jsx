import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Catalog', path: '/products' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-4' : 'py-6'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className={`relative px-6 h-20 flex items-center justify-between rounded-[1.25rem] transition-all duration-500 ${
          scrolled ? 'glass-dark bg-secondary-950/90 shadow-2xl shadow-black/30' : 'glass bg-white/90 shadow-xl shadow-black/5'
        }`}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Logo scrolled={scrolled} className="scale-90 md:scale-100" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-xs font-black uppercase tracking-[0.2em] transition-all relative group py-2 flex items-center gap-2 ${location.pathname === link.path
                  ? (scrolled ? 'text-white' : 'text-secondary-950')
                  : (scrolled ? 'text-secondary-400 hover:text-white' : 'text-secondary-500 hover:text-secondary-950')
                  }`}
              >
                {link.name}
                {link.name === 'Catalog' && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] text-emerald-500 font-black tracking-widest">LIVE</span>
                  </span>
                )}
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Marketplace Links */}
          <div className="flex items-center gap-3">
            <motion.a
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="https://shopee.ph/riveraharlenejoy"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all duration-500 group relative overflow-hidden ${
                scrolled 
                  ? 'bg-white/10 border-white/10 backdrop-blur-md hover:bg-white/20' 
                  : 'bg-white/80 border-secondary-100 backdrop-blur-md hover:bg-white hover:border-orange-500/30'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <img 
                src="/shopee.png" 
                alt="Shopee Store" 
                className="h-7 w-auto object-contain filter drop-shadow-sm transition-transform duration-500 group-hover:scale-110"
              />
              <div className="flex flex-col">
                <span className={`text-[7px] font-black uppercase tracking-[0.3em] leading-none mb-1 ${scrolled ? 'text-white/50' : 'text-secondary-400'}`}>Official</span>
                <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${scrolled ? 'text-white' : 'text-secondary-900 group-hover:text-[#EE4D2D]'}`}>Shopee</span>
              </div>
            </motion.a>

            <motion.a
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="https://www.lazada.com.ph/shop/ella-motor-parts-cauayan/"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all duration-500 group relative overflow-hidden ${
                scrolled 
                  ? 'bg-white/10 border-white/10 backdrop-blur-md hover:bg-white/20' 
                  : 'bg-white/80 border-secondary-100 backdrop-blur-md hover:bg-white hover:border-blue-500/30'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <img 
                src="/lazada.png" 
                alt="Lazada Store" 
                className="h-7 w-auto object-contain filter drop-shadow-sm transition-transform duration-500 group-hover:scale-110"
              />
              <div className="flex flex-col">
                <span className={`text-[7px] font-black uppercase tracking-[0.3em] leading-none mb-1 ${scrolled ? 'text-white/50' : 'text-secondary-400'}`}>Official</span>
                <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${scrolled ? 'text-white' : 'text-secondary-900 group-hover:text-[#0F146D]'}`}>Lazada</span>
              </div>
            </motion.a>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 ml-1 md:hidden rounded-full transition-colors ${scrolled ? 'text-white hover:bg-white/10' : 'text-secondary-900 hover:bg-secondary-100'
                }`}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-40 bg-secondary-950 p-6 flex flex-col md:hidden"
          >
            <div className="flex justify-between items-center mb-12">
              <Logo scrolled={true} className="scale-110 origin-left" />
              <button onClick={() => setMobileMenuOpen(false)} className="text-white">
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-4xl font-display font-black text-white hover:text-primary-500 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
