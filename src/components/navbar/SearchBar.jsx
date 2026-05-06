import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import api from '../../api/axios';

export default function SearchBar({ scrolled }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSuggestions([]);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (query.length >= 2) {
        try {
          const { data } = await api.get(`/products/search-suggestions?q=${query}`);
          setSuggestions(data.suggestions);
        } catch (e) { setSuggestions([]); }
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setSuggestions([]);
    }
  };

  return (
    <div ref={searchRef} className="hidden lg:block relative mr-4">
      <form onSubmit={handleSearch} className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Quick Search..."
          className={`px-6 py-2 text-xs font-medium rounded-full w-48 focus:w-64 transition-all outline-none border ${
            scrolled 
              ? 'bg-white/5 border-white/10 text-white placeholder-secondary-500 focus:bg-white/10' 
              : 'bg-secondary-50 border-secondary-100 text-secondary-900 placeholder-secondary-400 focus:bg-white'
          }`}
        />
      </form>
      
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute top-full mt-3 left-0 right-0 rounded-2xl shadow-2xl overflow-hidden z-50 border ${
              scrolled ? 'bg-secondary-900 border-white/10' : 'bg-white border-secondary-100'
            }`}
          >
            {suggestions.map((item) => (
              <Link
                key={item.id}
                to={`/products/${item.id}`}
                onClick={() => { setQuery(''); setSuggestions([]); }}
                className={`flex items-center gap-4 px-4 py-3 transition-colors ${
                  scrolled ? 'hover:bg-white/5 border-white/5' : 'hover:bg-secondary-50 border-secondary-50'
                } border-b last:border-0`}
              >
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0">
                  <ShoppingBag size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[11px] font-bold truncate ${scrolled ? 'text-white' : 'text-secondary-950'}`}>{item.name}</p>
                  <p className="text-[9px] text-secondary-500 font-medium">{item.category}</p>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
