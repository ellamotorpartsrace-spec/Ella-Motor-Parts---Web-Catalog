import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function AdminRoute({ children }) {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (isAuthenticated) {
        await checkAuth();
      }
      setIsVerifying(false);
    };
    verify();
  }, []);

  if (isVerifying) {
    return <div className="min-h-screen flex items-center justify-center bg-secondary-950 text-white font-display text-xs tracking-widest uppercase">Verifying Security...</div>;
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
