import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StorefrontNav from '@/pages/storefront/components/StorefrontNav';
import ProductInfo from './components/ProductInfo';
import { productDetail } from '@/mocks/products';

const tabs = ['Description', 'Specifications', 'What\'s Included', 'Warranty', 'Reviews'];

export default function ProductDetailPage() {
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <StorefrontNav />

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 mb-16">
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-8 flex flex-col justify-end min-h-[420px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-3">{productDetail.category}</p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500 text-white">{productDetail.condition}</span>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white text-slate-600 border border-slate-200">{productDetail.stock} in stock</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight tracking-tight">{productDetail.name}</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Product records are text-only in this system. Use the specifications, condition notes, and warranty details to evaluate the device.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {productDetail.specs.slice(0, 4).map((spec) => (
                <div key={spec.label} className="rounded-2xl border border-white bg-white/70 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{spec.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{spec.value}</p>
                </div>
              ))}
            </div>
          </div>
          <ProductInfo />
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-100 mb-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  activeTab === i
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="max-w-3xl">
          {activeTab === 0 && (
            <div className="prose prose-sm text-slate-700 leading-relaxed space-y-4">
              <p>
                Experience the pinnacle of mobile photography and performance with the <strong>iPhone 15 Pro Max</strong>. Crafted from aerospace-grade titanium, this device represents Apple&apos;s most advanced engineering to date.
              </p>
              <p>
                The A17 Pro chip delivers unprecedented performance for gaming, photography, and productivity. The 48MP main camera with second-generation sensor-shift OIS captures stunning detail in any lighting condition.
              </p>
              <p>
                With USB-C connectivity, Action Button customization, and the largest battery ever in a Pro iPhone, the iPhone 15 Pro Max is built for power users who demand the best.
              </p>
            </div>
          )}
          {activeTab === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {productDetail.specs.map((spec) => (
                <div key={spec.label} className="flex items-center justify-between py-3 border-b border-slate-50">
                  <span className="text-sm text-slate-500">{spec.label}</span>
                  <span className="text-sm font-semibold text-slate-800">{spec.value}</span>
                </div>
              ))}
            </div>
          )}
          {activeTab === 2 && (
            <div className="space-y-2">
              {productDetail.conditionDetails.includes.map((item) => (
                <div key={item} className="flex items-center gap-3 py-2">
                  <div className="w-5 h-5 flex items-center justify-center text-emerald-500">
                    <i className="ri-checkbox-circle-fill text-sm" />
                  </div>
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          )}
          {activeTab === 3 && (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <i className="ri-shield-star-line text-lg" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{productDetail.warranty}</h3>
                  <p className="text-xs text-slate-500">Full coverage from date of purchase</p>
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{productDetail.warrantyDetails}</p>
              <button className="mt-4 text-sm text-[#EC0118] font-medium hover:text-[#BD0113] cursor-pointer">
                How to file a warranty claim →
              </button>
            </div>
          )}
          {activeTab === 4 && (
            <div className="space-y-4">
              {productDetail.reviews.map((review, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                        {review.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{review.name}</p>
                        {review.verified && (
                          <span className="text-[10px] text-emerald-600 font-medium">Verified Purchase</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(review.rating)].map((_, j) => (
                        <div key={j} className="w-3 h-3 flex items-center justify-center text-amber-400">
                          <i className="ri-star-fill text-xs" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{review.text}</p>
                  <p className="text-xs text-slate-400 mt-2">{review.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky mobile bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 flex items-center gap-3 md:hidden z-40">
        <div>
          <p className="text-xs text-slate-400">Price</p>
          <p className="text-base font-bold text-slate-900">{productDetail.price}</p>
        </div>
        <button className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm cursor-pointer whitespace-nowrap">
          Reserve Now
        </button>
        <a
          href="https://wa.me/233000000000"
          target="_blank"
          rel="noopener noreferrer"
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#25D366] text-white"
        >
          <i className="ri-whatsapp-line text-lg" />
        </a>
      </div>
    </div>
  );
}
