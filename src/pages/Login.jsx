import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, RefreshCw, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('admin@ellamotorparts.ph');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.user, data.token);
      toast.success('Access Authorized.');
      window.location.href = '/admin';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 pt-32 pb-20 relative overflow-hidden">
      
      {/* Premium Background Detail */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')]" />

      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important;
          -webkit-text-fill-color: #0f172a !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-3xl border border-primary-100 mb-6 text-primary-600">
            <ShieldCheck size={32} strokeWidth={2} />
          </div>
          <h1 className="text-secondary-950 font-display font-black text-3xl tracking-tighter uppercase">Admin Console</h1>
          <p className="text-secondary-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Ella Motor Parts Management</p>
        </div>

        <div className="bg-white p-8 sm:p-12 rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] border border-secondary-100/50">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-2">Email Terminal</label>
                <div className="flex items-center bg-secondary-50/50 rounded-2xl border-2 border-transparent focus-within:border-primary-500 focus-within:bg-white transition-all overflow-hidden h-[60px]">
                  <div className="pl-6 pr-4 text-secondary-300">
                    <Mail size={20} strokeWidth={2} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-full bg-transparent font-bold text-secondary-900 text-sm outline-none placeholder:text-secondary-200"
                    placeholder="admin@ellamotorparts.ph"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-2">Security Key</label>
                <div className="flex items-center bg-secondary-50/50 rounded-2xl border-2 border-transparent focus-within:border-primary-500 focus-within:bg-white transition-all overflow-hidden h-[60px]">
                  <div className="pl-6 pr-4 text-secondary-300">
                    <Lock size={20} strokeWidth={2} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-full bg-transparent font-bold text-secondary-900 text-sm outline-none placeholder:text-secondary-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-6 text-secondary-300 hover:text-primary-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[64px] bg-secondary-950 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-secondary-950/20 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={20} />
              ) : (
                "Authorize Login"
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-12 text-[10px] font-black text-secondary-300 uppercase tracking-[0.4em] opacity-50">
          V4.0.2 Stable Build
        </p>
      </motion.div>
    </div>
  );
}
