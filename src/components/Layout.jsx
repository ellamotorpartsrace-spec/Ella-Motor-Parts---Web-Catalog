import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-mesh selection:bg-primary-500/30 selection:text-primary-900">
      <Navbar />
      <motion.main 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1"
      >
        {children}
      </motion.main>
      <Footer />
    </div>
  );
}
