import { motion } from 'framer-motion';

export default function Terms() {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-600 mb-4 block">
            Legal Document
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-black text-secondary-950 tracking-tighter mb-12">
            Terms of <span className="text-secondary-400">Service</span>
          </h1>

          <div className="prose prose-secondary max-w-none space-y-12">
            <section>
              <h2 className="text-xl font-bold text-secondary-900 mb-4 tracking-tight uppercase">1. Agreement to Terms</h2>
              <p className="text-secondary-600 leading-relaxed text-sm">
                By accessing and using the Ella Motor Parts website, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use this website.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary-900 mb-4 tracking-tight uppercase">2. Use of Site</h2>
              <p className="text-secondary-600 leading-relaxed text-sm">
                This website provides information about motorcycle parts and accessories. While we strive for accuracy in our live inventory and pricing, all information is subject to change without notice. All products are subject to availability.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary-900 mb-4 tracking-tight uppercase">3. Intellectual Property</h2>
              <p className="text-secondary-600 leading-relaxed text-sm">
                All content on this site, including text, graphics, logos, and images, is the property of Ella Motor Parts and is protected by copyright and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary-900 mb-4 tracking-tight uppercase">4. Limitation of Liability</h2>
              <p className="text-secondary-600 leading-relaxed text-sm">
                Ella Motor Parts shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our services or website.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary-900 mb-4 tracking-tight uppercase">5. Governing Law</h2>
              <p className="text-secondary-600 leading-relaxed text-sm">
                These terms are governed by the laws of the Republic of the Philippines. Any disputes shall be resolved in the courts of Cauayan City, Isabela.
              </p>
            </section>
          </div>

          <div className="mt-20 pt-10 border-t border-secondary-100">
            <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">
              Last Updated: May 2026
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
