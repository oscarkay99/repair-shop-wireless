import { useState } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import { tradeInBrands, tradeInModels, conditionMultipliers, storageOptions, storageMultipliers, recentTradeIns } from '@/mocks/tradein';
import BookingModal from './components/BookingModal';

type Condition = 'excellent' | 'good' | 'fair' | 'poor';

const conditionDetails = {
  excellent: { label: 'Excellent', desc: 'Like new, no scratches, 90%+ battery', borderColor: '#EC0118', bg: 'rgba(236,1,24,0.08)', badge: 'bg-slate-100 text-slate-700' },
  good: { label: 'Good', desc: 'Minor scratches, fully functional, 80%+ battery', borderColor: '#F59E0B', bg: '#FFFBEB', badge: 'bg-amber-100 text-amber-700' },
  fair: { label: 'Fair', desc: 'Visible wear, works fine, 70%+ battery', borderColor: '#D97706', bg: '#FEF3C7', badge: 'bg-yellow-100 text-yellow-700' },
  poor: { label: 'Poor', desc: 'Cracked screen or major damage', borderColor: '#E05A2B', bg: '#FEE2E2', badge: 'bg-red-100 text-red-700' },
};

export default function TradeInPage() {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('256GB');
  const [selectedCondition, setSelectedCondition] = useState<Condition>('good');
  const [showResult, setShowResult] = useState(false);
  const [bookingModal, setBookingModal] = useState(false);

  const models = selectedBrand ? tradeInModels[selectedBrand] || [] : [];
  const modelData = models.find(m => m.name === selectedModel);

  const calculateValue = () => {
    if (!modelData) return 0;
    const base = modelData.baseValue;
    const condMult = conditionMultipliers[selectedCondition];
    const storageMult = storageMultipliers[selectedStorage] || 1;
    return Math.round(base * condMult * storageMult);
  };

  const tradeValue = calculateValue();

  const upgradeOptions: never[] = [];

  return (
    <AdminLayout title="Trade-In Calculator" subtitle="Estimate device value and manage trade-in pipeline">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calculator */}
        <div className="lg:col-span-2 space-y-5">
          {/* Step 1: Brand */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: '#EC0118' }}>1</div>
              <h3 className="text-sm font-bold text-slate-800">Select Brand</h3>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {tradeInBrands.map(brand => (
                <button
                  key={brand.id}
                  onClick={() => { setSelectedBrand(brand.id); setSelectedModel(''); setShowResult(false); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer"
                  style={{ borderColor: selectedBrand === brand.id ? '#EC0118' : '#f1f5f9', background: selectedBrand === brand.id ? 'rgba(236,1,24,0.08)' : 'white' }}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className={`${brand.icon} text-lg`} style={{ color: selectedBrand === brand.id ? '#EC0118' : '#94a3b8' }} />
                  </div>
                  <span className="text-xs font-medium text-slate-700">{brand.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Model */}
          {selectedBrand && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: '#EC0118' }}>2</div>
                <h3 className="text-sm font-bold text-slate-800">Select Model</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {models.map(model => (
                  <button
                    key={model.name}
                    onClick={() => { setSelectedModel(model.name); setShowResult(false); }}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all cursor-pointer text-left"
                    style={{ borderColor: selectedModel === model.name ? '#EC0118' : '#f1f5f9', background: selectedModel === model.name ? 'rgba(236,1,24,0.08)' : 'white' }}
                  >
                    <span className="text-sm text-slate-700">{model.name}</span>
                    <span className="text-xs text-slate-400">up to GHS {model.baseValue.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Storage */}
          {selectedModel && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: '#EC0118' }}>3</div>
                <h3 className="text-sm font-bold text-slate-800">Storage Capacity</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {storageOptions.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedStorage(s)}
                    className="px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer whitespace-nowrap"
                    style={{ borderColor: selectedStorage === s ? '#EC0118' : '#f1f5f9', background: selectedStorage === s ? 'rgba(236,1,24,0.08)' : 'white', color: selectedStorage === s ? '#EC0118' : '#475569' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Condition */}
          {selectedModel && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: '#EC0118' }}>4</div>
                <h3 className="text-sm font-bold text-slate-800">Device Condition</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(conditionDetails) as Condition[]).map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCondition(c)}
                    className="p-4 rounded-xl border-2 text-left transition-all cursor-pointer"
                    style={{
                      borderColor: selectedCondition === c ? conditionDetails[c].borderColor : '#f1f5f9',
                      background: selectedCondition === c ? conditionDetails[c].bg : 'white',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-800">{conditionDetails[c].label}</span>
                      {selectedCondition === c && <i className="ri-checkbox-circle-fill" style={{ color: conditionDetails[c].borderColor }} />}
                    </div>
                    <p className="text-xs text-slate-500">{conditionDetails[c].desc}</p>
                    <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${conditionDetails[c].badge}`}>
                      {Math.round(conditionMultipliers[c] * 100)}% of base value
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowResult(true)}
                className="w-full mt-4 py-3 text-white rounded-xl text-sm font-bold cursor-pointer whitespace-nowrap hover:opacity-90"
                style={{ background: '#EC0118' }}
              >
                <i className="ri-calculator-line mr-2" />Calculate Trade-In Value
              </button>
            </div>
          )}

          {/* Result */}
          {showResult && tradeValue > 0 && (
            <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #EC0118 100%)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Estimated Trade-In Value</p>
                  <p className="text-4xl font-bold" style={{ color: '#F59E0B' }}>GHS {tradeValue.toLocaleString()}</p>
                  <p className="text-white/50 text-xs mt-1">{selectedModel} · {selectedStorage} · {conditionDetails[selectedCondition].label}</p>
                </div>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.2)' }}>
                  <i className="ri-exchange-line text-3xl" style={{ color: '#F59E0B' }} />
                </div>
              </div>

              <p className="text-white/60 text-xs mb-4">Use this value toward any upgrade in our store:</p>
              <div className="space-y-2 mb-4">
                {upgradeOptions.map(opt => (
                  <div key={opt.name} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <img loading="lazy" decoding="async" src={opt.img} alt={opt.name} className="w-10 h-10 rounded-lg object-cover" />
                      <span className="text-sm text-white">{opt.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/40">You pay</p>
                      <p className="text-sm font-bold" style={{ color: '#F59E0B' }}>GHS {(opt.price - tradeValue).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setBookingModal(true)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer whitespace-nowrap hover:opacity-90"
                  style={{ background: '#F59E0B' }}
                >
                  <i className="ri-calendar-check-line mr-1" />Book Appointment
                </button>
                <button
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Trade-In Valuation from Wireless\n\nDevice: ${selectedModel} (${selectedStorage})\nCondition: ${conditionDetails[selectedCondition].label}\nTrade-In Value: GHS ${tradeValue.toLocaleString()}\n\nReady to upgrade? Book an appointment at Wireless.`)}`, '_blank')}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-whatsapp-line mr-1" />Share via WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Recent Trade-Ins</h4>
            <div className="space-y-3">
              {recentTradeIns.map((t, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{t.customer}</p>
                    <p className="text-[10px] text-slate-400">{t.device} · {t.condition}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-600">GHS {t.value.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400">{t.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ background: 'rgba(236,1,24,0.08)', borderColor: 'rgba(7,16,31,0.12)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-xl" style={{ background: 'rgba(7,16,31,0.12)' }}>
                <i className="ri-bar-chart-2-line" style={{ color: '#EC0118' }} />
              </div>
              <h4 className="text-sm font-bold text-slate-800">This Month</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Trade-ins processed</span>
                <span className="text-xs font-bold text-slate-800">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Total value paid out</span>
                <span className="text-xs font-bold text-slate-800">GHS 0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Converted to upgrades</span>
                <span className="text-xs font-bold" style={{ color: '#EC0118' }}>0 (0%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Avg trade-in value</span>
                <span className="text-xs font-bold text-slate-800">GHS 0</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Top Trade-In Devices</h4>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <i className="ri-exchange-line text-2xl text-slate-200 mb-2" />
              <p className="text-xs text-slate-400">No trade-ins yet</p>
            </div>
          </div>
        </div>
      </div>

      {bookingModal && (
        <BookingModal
          selectedModel={selectedModel}
          tradeValue={tradeValue}
          onClose={() => setBookingModal(false)}
        />
      )}
    </AdminLayout>
  );
}
