import { motion } from 'framer-motion';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-600 mb-4 block">
            Privacy Standards
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-black text-secondary-950 tracking-tighter mb-12">
            Privacy <span className="text-secondary-400">Policy</span>
          </h1>

          <div className="prose prose-secondary max-w-none space-y-12">
            <section>
              <h2 className="text-xl font-bold text-secondary-900 mb-4 tracking-tight uppercase">1. Information We Collect</h2>
              <p className="text-secondary-600 leading-relaxed text-sm">
                We collect information when you inquire about our products or services. This may include your name, email address, and phone number to provide you with the best possible service and accurate stock information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary-900 mb-4 tracking-tight uppercase">2. Use of Information</h2>
              <p className="text-secondary-600 leading-relaxed text-sm">
                The information we collect is used to process your inquiries, provide customer support, and improve the quality of our services. We may also use it to notify you about important inventory updates.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary-900 mb-4 tracking-tight uppercase">3. Data Security</h2>
              <p className="text-secondary-600 leading-relaxed text-sm">
                We implement industry-standard security measures to maintain the safety of your personal information. Your data is stored securely and is only accessible by authorized personnel.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary-900 mb-4 tracking-tight uppercase">4. Disclosure to Third Parties</h2>
              <p className="text-secondary-600 leading-relaxed text-sm">
                Ella Motor Parts does not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our website or conducting our business.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary-900 mb-4 tracking-tight uppercase">5. Consent</h2>
              <p className="text-secondary-600 leading-relaxed text-sm">
                By using our site, you consent to our website's privacy policy.
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
