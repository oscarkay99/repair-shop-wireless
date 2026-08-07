import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://readdy.ai/api/search-image?query=premium%20gadget%20store%20interior%20with%20sleek%20modern%20displays%20showing%20smartphones%20and%20laptops%2C%20dark%20elegant%20atmosphere%20with%20warm%20accent%20lighting%2C%20luxury%20retail%20environment%2C%20deep%20charcoal%20and%20warm%20tones%2C%20professional%20photography&width=1440&height=900&seq=hero1&orientation=landscape')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/90 via-[#0F172A]/70 to-[#0F172A]/30" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-20">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-emerald-400 text-xs font-semibold uppercase tracking-[0.15em]">Premium Gadgets in Accra</span>
            <div className="h-px w-12 bg-emerald-400/50" />
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold text-white leading-[1.08] tracking-tight mb-6">
            Your Trusted Source<br />
            for <span className="text-emerald-400">Authentic</span><br />
            Phones &amp; Laptops
          </h1>

          <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg">
            New, used, and refurbished gadgets, all with warranty. Serving Accra with genuine products, Mobile Money payments, and same-day delivery.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/store/catalog')}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-7 py-4 rounded-full transition-all text-sm cursor-pointer whitespace-nowrap"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-store-2-line text-sm" />
              </div>
              Browse Products
            </button>
            <a
              href="https://wa.me/233000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-7 py-4 rounded-full transition-all text-sm whitespace-nowrap"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-whatsapp-line text-sm" />
              </div>
              Chat on WhatsApp
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-4 mt-10">
            {[
              { icon: 'ri-shield-check-line', text: 'Authentic Guarantee' },
              { icon: 'ri-award-line', text: 'Warranty Included' },
              { icon: 'ri-secure-payment-line', text: 'MoMo Accepted' },
              { icon: 'ri-truck-line', text: 'Same-Day Delivery' },
            ].map((badge) => (
              <div key={badge.text} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5">
                <div className="w-4 h-4 flex items-center justify-center text-emerald-400">
                  <i className={`${badge.icon} text-xs`} />
                </div>
                <span className="text-white/80 text-xs font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40">
        <span className="text-[10px] uppercase tracking-widest">Scroll</span>
        <div className="w-4 h-4 flex items-center justify-center">
          <i className="ri-arrow-down-line text-sm animate-bounce" />
        </div>
      </div>
    </section>
  );
}
