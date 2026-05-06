import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';

export default function Login() {
  const [email, setEmail] = useState('admin@ellamotorparts.ph');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.user, data.token);
      toast.success('Access Granted. Welcome Admin.');
      // Force full page reload so AdminRoute reads auth state fresh from localStorage
      window.location.href = '/admin';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-12 flex flex-col items-center">
          <Logo className="h-24 mb-16" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary-400 italic">Secure Management Access</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[3rem] border border-secondary-100 shadow-2xl shadow-black/5 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Email Terminal</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary-300" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-14 pr-6 py-4 bg-secondary-50/50 rounded-2xl border border-transparent focus:bg-white focus:border-secondary-900 transition-all font-bold text-sm outline-none"
                placeholder="admin@ellamotorparts.ph"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Secure Key</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary-300" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-14 pr-6 py-4 bg-secondary-50/50 rounded-2xl border border-transparent focus:bg-white focus:border-secondary-900 transition-all font-bold text-sm outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-secondary-950 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-secondary-950/20 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : (
              <>
                <LogIn size={18} /> Access System
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
