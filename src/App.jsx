import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPhotoManager from './pages/admin/AdminPhotoManager';
import BulkPhotoManager from './pages/admin/BulkPhotoManager';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

export default function App() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  // ── Admin Workspace Flow ──
  if (isAdminPath) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
        <AdminRoute>
          <AdminLayout>
            <Routes>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products/:id/photos" element={<AdminPhotoManager />} />
              <Route path="/admin/bulk-upload" element={<BulkPhotoManager />} />
            </Routes>
          </AdminLayout>
        </AdminRoute>
      </>
    );
  }

  // ── Customer Showroom & Private Login Flow ──
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Layout>
    </>
  );
}
