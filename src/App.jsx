import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminPhotoManager from './pages/admin/AdminPhotoManager';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

export default function App() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  // ── Admin Workspace Flow ──
  if (isAdminPath) {
    return (
      <AdminRoute>
        <AdminLayout>
          <Routes>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products/:id/photos" element={<AdminPhotoManager />} />
            <Route path="/admin/products/new" element={<AdminProductForm />} />
            <Route path="/admin/products/edit/:id" element={<AdminProductForm />} />
          </Routes>
        </AdminLayout>
      </AdminRoute>
    );
  }

  // ── Customer Showroom & Private Login Flow ──
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        
        {/* The Private Entrance - Standalone */}
        <Route path="/admin/login" element={<Login />} />
        
        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  );
}
