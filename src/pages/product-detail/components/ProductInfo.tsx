import { useState } from 'react';
import { productDetail } from '@/mocks/products';

export default function ProductInfo() {
  const [qty, setQty] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [reserved, setReserved] = useState(false);

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400">
        <a href="/store" className="hover:text-slate-600">Home</a>
        <i className="ri-arrow-right-s-line" />
        <a href="/store/catalog" className="hover:text-slate-600">Phones</a>
        <i className="ri-arrow-right-s-line" />
        <span className="text-slate-600">iPhone 15 Pro Max</span>
      </nav>

      {/* Name */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight tracking-tight">
          {productDetail.name}
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 flex items-center justify-center text-amber-400">
                <i className="ri-star-fill text-xs" />
              </div>
            ))}
          </div>
          <span className="text-xs text-slate-500">4.9 (47 reviews)</span>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-slate-900">{productDetail.price}</span>
        {productDetail.originalPrice && (
          <span className="text-lg text-slate-400 line-through">{productDetail.originalPrice}</span>
        )}
      </div>

      {/* Stock urgency */}
      <div className="flex items-center gap-2 text-amber-600">
        <div className="w-4 h-4 flex items-center justify-center">
          <i className="ri-fire-line text-sm" />
        </div>
        <span className="text-sm font-medium">Only {productDetail.stock} left in stock, order soon</span>
      </div>

      {/* Condition */}
      <div className="border border-slate-100 rounded-xl overflow-hidden">
        <button
          onClick={() => setConditionOpen(!conditionOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center text-emerald-600">
              <i className="ri-checkbox-circle-line text-sm" />
            </div>
            <span className="text-sm font-medium text-slate-800">Condition: {productDetail.conditionDetails.grade}</span>
          </div>
          <div className={`w-4 h-4 flex items-center justify-center text-slate-400 transition-transform ${conditionOpen ? 'rotate-180' : ''}`}>
            <i className="ri-arrow-down-s-line text-base" />
          </div>
        </button>
        {conditionOpen && (
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Battery Health</span>
              <span className="font-semibold text-emerald-600">{productDetail.conditionDetails.batteryHealth}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Cosmetic</span>
              <span className="font-medium text-slate-700">{productDetail.conditionDetails.cosmetic}</span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-1.5">What&apos;s Included:</p>
              <div className="flex flex-wrap gap-1.5">
                {productDetail.conditionDetails.includes.map((item) => (
                  <span key={item} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{item}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Warranty */}
      <div className="border-l-4 border-slate-300 bg-slate-50 rounded-r-xl px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 flex items-center justify-center text-slate-500">
            <i className="ri-shield-star-line text-sm" />
          </div>
          <span className="text-sm font-semibold text-slate-700">{productDetail.warranty}</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{productDetail.warrantyDetails}</p>
      </div>

      {/* Specs grid */}
      <div className="grid grid-cols-2 gap-2">
        {productDetail.specs.slice(0, 6).map((spec) => (
          <div key={spec.label} className="bg-slate-50 rounded-xl px-3 py-2.5">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{spec.label}</p>
            <p className="text-xs font-semibold text-slate-800 mt-0.5">{spec.value}</p>
          </div>
        ))}
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">Quantity:</span>
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-9 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer"
          >
            <i className="ri-subtract-line text-sm" />
          </button>
          <span className="w-8 text-center text-sm font-semibold text-slate-800">{qty}</span>
          <button
            onClick={() => setQty(Math.min(productDetail.stock, qty + 1))}
            className="w-9 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer"
          >
            <i className="ri-add-line text-sm" />
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2.5">
        <button
          onClick={() => setReserved(true)}
          className={`w-full py-4 rounded-xl font-semibold text-sm transition-all cursor-pointer whitespace-nowrap ${
            reserved ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {reserved ? (
            <span className="flex items-center justify-center gap-2">
              <i className="ri-checkbox-circle-fill" /> Reserved! We&apos;ll contact you shortly
            </span>
          ) : (
            'Reserve This Item'
          )}
        </button>
        <button className="w-full py-3.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap">
          Get a Quote
        </button>
        <a
          href="https://wa.me/233000000000"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#20b858] transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
        >
          <div className="w-4 h-4 flex items-center justify-center">
            <i className="ri-whatsapp-line text-sm" />
          </div>
          Chat on WhatsApp
        </a>
      </div>

      {/* Trust indicators */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
        {[
          { icon: 'ri-shield-check-line', text: 'Authentic Guarantee' },
          { icon: 'ri-secure-payment-line', text: 'Secure Payment' },
          { icon: 'ri-truck-line', text: 'Fast Delivery' },
        ].map((t) => (
          <div key={t.text} className="flex flex-col items-center gap-1 text-center">
            <div className="w-5 h-5 flex items-center justify-center text-emerald-600">
              <i className={`${t.icon} text-sm`} />
            </div>
            <span className="text-[10px] text-slate-500">{t.text}</span>
          </div>
        ))}
      </div>

      {/* Add-ons */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Complete Your Setup</h3>
        <div className="space-y-2">
          {productDetail.addOns.map((addon) => (
            <div
              key={addon.id}
              onClick={() => toggleAddOn(addon.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                selectedAddOns.includes(addon.id) ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-100 text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em]">Add</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-800">{addon.name}</p>
                <p className="text-xs text-emerald-600 font-semibold">{addon.price}</p>
              </div>
              <div className={`w-5 h-5 flex items-center justify-center rounded-full border-2 flex-shrink-0 ${
                selectedAddOns.includes(addon.id) ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
              }`}>
                {selectedAddOns.includes(addon.id) && (
                  <i className="ri-check-line text-white text-xs" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
