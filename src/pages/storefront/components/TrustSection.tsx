import { testimonials } from '@/mocks/products';

export default function TrustSection() {
  return (
    <>
      {/* Warranty Promise */}
      <section className="py-16 bg-[#0F172A]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-emerald-500/20 mx-auto mb-5">
            <i className="ri-shield-star-line text-2xl text-emerald-400" />
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">Every Product Comes with a Warranty Promise</h2>
          <p className="text-white/60 text-base max-w-xl mx-auto mb-6">
            We stand behind every product we sell. New items come with full manufacturer warranty. Used and refurbished items include our FixHub warranty — real coverage, real support.
          </p>
          <a href="#" className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors">
            Learn about our warranty
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-arrow-right-line text-sm" />
            </div>
          </a>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Smartphones', icon: 'ri-smartphone-line', count: '48 products', color: 'bg-emerald-50 text-emerald-600' },
              { label: 'Laptops', icon: 'ri-macbook-line', count: '24 products', color: 'bg-blue-50 text-blue-600' },
              { label: 'Accessories', icon: 'ri-headphone-line', count: '86 products', color: 'bg-amber-50 text-amber-600' },
              { label: 'Repairs', icon: 'ri-tools-line', count: 'Book a repair', color: 'bg-slate-100 text-slate-600' },
            ].map((cat) => (
              <div
                key={cat.label}
                className="bg-white border border-slate-100 rounded-2xl p-6 text-center hover:shadow-md transition-all cursor-pointer group"
              >
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl mx-auto mb-3 ${cat.color} group-hover:scale-110 transition-transform`}>
                  <i className={`${cat.icon} text-xl`} />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">{cat.label}</h3>
                <p className="text-xs text-slate-400 mt-1">{cat.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-emerald-600 text-xs font-semibold uppercase tracking-[0.15em] mb-3">Customer Stories</p>
            <h2 className="text-3xl font-bold text-slate-900">Trusted by Accra's Gadget Buyers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-[#F8F9FA] rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <div key={j} className="w-4 h-4 flex items-center justify-center text-amber-400">
                      <i className="ri-star-fill text-sm" />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <img loading="lazy" decoding="async" src={t.avatar} alt={t.name} className="w-full h-full object-cover object-top" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-16 bg-[#F8F9FA]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Common Questions</h2>
          <div className="space-y-3">
            {[
              { q: 'Are your products authentic?', a: 'Yes — 100%. We source directly from authorized distributors and verified suppliers. Every product comes with authenticity documentation.' },
              { q: 'Do you accept Mobile Money?', a: 'Absolutely. We accept MTN MoMo, Vodafone Cash, AirtelTigo Money, bank transfers, and cash. Pay the way that works for you.' },
              { q: 'What warranty do used/refurbished items come with?', a: 'All used and refurbished items come with a FixHub warranty (3–6 months depending on the item). We cover hardware defects and provide free diagnosis.' },
              { q: 'Can I pick up in person?', a: 'Yes! We have a pickup location in Accra. You can also choose same-day or next-day delivery within Greater Accra.' },
              { q: 'How do I track my order?', a: 'You\'ll receive a tracking link via WhatsApp and SMS once your order is confirmed and packed.' },
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-emerald-600">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">Ready to Upgrade Your Gadget?</h2>
          <p className="text-white/80 mb-8">Chat with us on WhatsApp — we respond in minutes.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/233000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 font-semibold px-7 py-4 rounded-full hover:bg-emerald-50 transition-all text-sm whitespace-nowrap"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-whatsapp-line text-sm" />
              </div>
              Chat on WhatsApp
            </a>
            <a
              href="tel:+233000000000"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white font-semibold px-7 py-4 rounded-full hover:bg-white/20 transition-all text-sm whitespace-nowrap"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-phone-line text-sm" />
              </div>
              Call Us: +233 00 000 0000
            </a>
          </div>
          <p className="text-white/60 text-xs mt-5">Mon–Sat: 8am–8pm · Sun: 10am–6pm · Accra, Ghana</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F0F2F5] border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img
loading="lazy" decoding="async"                 src="https://public.readdy.ai/ai/img_res/7bf43506-9df4-4671-b4ee-9c6d6fc6f9c0.png"
                alt="FixHub"
                className="w-7 h-7 rounded-lg object-cover"
              />
              <span className="text-sm font-bold text-slate-700">FixHub</span>
            </div>
            <p className="text-xs text-slate-400">&copy; 2026 FixHub. Premium Gadgets in Accra, Ghana.</p>
            <div className="flex items-center gap-4">
              {['Privacy', 'Terms', 'Warranty', 'Repairs'].map((link) => (
                <a key={link} href="#" className="text-xs text-slate-500 hover:text-slate-700" rel="nofollow">{link}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
      >
        <span className="text-sm font-medium text-slate-800">{question}</span>
        <div className={`w-5 h-5 flex items-center justify-center text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>
          <i className="ri-arrow-down-s-line text-base" />
        </div>
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-slate-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
