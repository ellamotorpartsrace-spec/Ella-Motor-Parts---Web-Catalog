import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';
import Logo from './Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Navigation',
      links: [
        { name: 'Home', path: '/' },
        { name: 'Products', path: '/products' },
        { name: 'My Profile', path: '/profile' },
        { name: 'Notifications', path: '/notifications' },
      ],
    },
    {
      title: 'Categories',
      links: [
        { name: 'Engine Parts', path: '/products?category=Engine' },
        { name: 'Brake Parts', path: '/products?category=Brake' },
        { name: 'Electrical', path: '/products?category=Electrical' },
        { name: 'Exhaust Systems', path: '/products?category=Exhaust' },
      ],
    },
    {
      title: 'Support',
      links: [
        { name: 'Customer Support', path: '/support' },
        { name: 'Privacy Policy', path: '/privacy' },
        { name: 'Terms of Service', path: '/terms' },
      ],
    },
  ];

  return (
    <footer className="bg-secondary-950 text-white border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-10 pb-6 lg:pt-12 lg:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* ── Brand Story ── */}
            <div className="lg:col-span-4 pr-8">
              <Link to="/" className="inline-block mb-6">
                <Logo scrolled={true} className="scale-110 origin-left" />
              </Link>
              <p className="text-secondary-400 text-sm font-medium leading-relaxed mb-8">
                ELLA MOTOR PARTS — Redefining reliability for the modern rider. High-performance components and genuine quality.
              </p>
              <div className="flex gap-3">
                {[
                  { name: 'Facebook', href: 'https://www.facebook.com/p/Ella-motor-parts-100057044667058/', icon: FaFacebook },
                  { name: 'Shopee', href: 'https://shopee.ph/riveraharlenejoy', logo: '/shopee.png' },
                  { name: 'Lazada', href: 'https://www.lazada.com.ph/shop/ella-motor-parts-cauayan/', logo: '/lazada.png' }
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-primary-600 transition-all border border-white/5"
                  >
                    {social.icon ? (
                      <social.icon size={18} />
                    ) : (
                      <img src={social.logo} alt={social.name} className="w-6 h-6 object-contain" />
                    )}
                  </a>
                ))}
              </div>
            </div>

            {/* ── Catalog ── */}
            <div className="lg:col-span-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500 mb-6">Catalog</h3>
              <div className="flex flex-col gap-y-4">
                {[
                  { name: 'Engine Parts', path: '/products?category=Engine' },
                  { name: 'Brake Systems', path: '/products?category=Brake' },
                  { name: 'Electrical Hub', path: '/products?category=Electrical' },
                  { name: 'Tires & Wheels', path: '/products?category=Tire' },
                ].map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className="text-xs font-bold text-secondary-500 hover:text-white transition-all uppercase tracking-widest"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* ── Legal ── */}
            <div className="lg:col-span-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500 mb-6">Legal</h3>
              <div className="flex flex-col gap-y-4">
                {[
                  { name: 'Terms of Service', path: '/terms' },
                  { name: 'Privacy Policy', path: '/privacy' },
                ].map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className="text-xs font-bold text-secondary-500 hover:text-white transition-all uppercase tracking-widest"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* ── Contact ── */}
            <div className="lg:col-span-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500 mb-6">Reach Us</h3>
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-orange-500 shrink-0" />
                  <p className="text-sm font-normal text-secondary-300 tracking-tight">+63 961 974 7449</p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-orange-500 shrink-0" />
                  <p className="text-sm font-normal text-secondary-300 tracking-tight">jarlenedoac856@gmail.com</p>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-normal text-secondary-300 tracking-tight leading-relaxed">
                    District 1, Cauayan City, Isabela, Philippines
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Bar - Very Slim */}
        <div className="py-5 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">
            © {currentYear} ELLA MOTOR PARTS. All rights reserved.
          </p>
          <p className="text-[9px] font-black text-secondary-600 uppercase tracking-widest">
            Crafted by <span className="text-secondary-400 hover:text-primary-500 transition-colors cursor-default">Lester Bucag</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
