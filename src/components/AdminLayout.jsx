import { useState } from 'react';
import { LayoutDashboard, Package, LogOut, ExternalLink, Menu, X } from 'lucide-react';
import Logo from './Logo';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function AdminLayout({ children }) {
  const { logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    window.location.replace('/admin/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Bulk Upload', path: '/admin/bulk-upload', icon: Package },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      
      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-secondary-950 z-40 flex items-center justify-between px-4">
        <Logo scrolled={true} className="h-8" />
        <button onClick={() => setIsSidebarOpen(true)} className="text-white p-2">
          <Menu size={24} />
        </button>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-secondary-950 text-white flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex items-center justify-between lg:justify-center border-b border-white/5 h-16 lg:h-auto">
          <Logo scrolled={true} className="h-8 lg:h-14" />
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path))
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                  : 'text-secondary-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <item.icon size={18} />
              <span className="text-[11px] font-black uppercase tracking-widest">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-secondary-400 hover:text-white transition-colors">
            <ExternalLink size={18} />
            <span className="text-[11px] font-black uppercase tracking-widest">View Store</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:text-rose-300 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-[11px] font-black uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen overflow-y-auto pt-16 lg:pt-0 w-full lg:w-auto">
        {children}
      </main>
    </div>
  );
}
