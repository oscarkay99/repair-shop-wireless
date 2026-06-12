import { useState } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import { walletStats, walletTiers } from '@/mocks/wallet';
import WalletCustomerDetail from './components/WalletCustomerDetail';
import TopUpModal from './components/TopUpModal';
import AddWalletCustomerModal from './components/AddWalletCustomerModal';

interface WalletCustomer {
  id: string;
  name: string;
  phone: string;
  tier: string;
  avatar: string;
  avatarColor: string;
  balance: number;
  totalDeposited: number;
  totalSpent: number;
  transactions: never[];
}

const tierConfig: Record<string, { icon: string; color: string; bg: string }> = {
  Bronze:   { icon: 'ri-medal-line',     color: 'text-amber-700',  bg: 'bg-amber-100' },
  Silver:   { icon: 'ri-medal-2-line',   color: 'text-slate-600',  bg: 'bg-slate-100' },
  Gold:     { icon: 'ri-trophy-line',    color: 'text-yellow-600', bg: 'bg-yellow-100' },
  Platinum: { icon: 'ri-vip-crown-line', color: 'text-slate-700', bg: 'bg-slate-200' },
};

export default function WalletPage() {
  const [customers, setCustomers] = useState<WalletCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<WalletCustomer | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [topupModal, setTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');

  const totalBalance = customers.reduce((sum, c) => sum + c.balance, 0);
  const totalDeposits = customers.reduce((sum, c) => sum + c.totalDeposited, 0);
  const avgBalance = customers.length ? Math.round(totalBalance / customers.length) : 0;

  const handleAddCustomer = (customer: WalletCustomer) => {
    setCustomers(prev => [...prev, customer]);
    setSelectedCustomer(customer);
  };

  const handleTopUp = (amount: number) => {
    if (!selectedCustomer || amount <= 0) return;
    const updated: WalletCustomer = {
      ...selectedCustomer,
      balance: selectedCustomer.balance + amount,
      totalDeposited: selectedCustomer.totalDeposited + amount,
    };
    setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? updated : c));
    setSelectedCustomer(updated);
    setTopupModal(false);
    setTopupAmount('');
  };

  return (
    <AdminLayout title="Wireless Wallet" subtitle="Customer store credit, loyalty tiers & wallet management">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Wallet Balance',   value: `GHS ${totalBalance.toLocaleString()}`,     icon: 'ri-wallet-3-line',         color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Wallets',         value: customers.length.toString(),                 icon: 'ri-group-line',            color: 'text-sky-600',     bg: 'bg-sky-50' },
          { label: 'Deposits This Month',    value: `GHS ${totalDeposits.toLocaleString()}`,     icon: 'ri-arrow-down-circle-line', color: 'text-teal-600',    bg: 'bg-teal-50' },
          { label: 'Avg Balance',            value: `GHS ${avgBalance.toLocaleString()}`,        icon: 'ri-bar-chart-line',        color: 'text-amber-600',   bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-white rounded-xl">
                <i className={`${s.icon} text-base ${s.color}`} />
              </div>
              <span className="text-xs text-slate-500">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {walletTiers.map(tier => {
          const cfg = tierConfig[tier.name];
          return (
            <div key={tier.name} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 flex items-center justify-center rounded-xl ${cfg.bg}`}>
                  <i className={`${cfg.icon} text-sm ${cfg.color}`} />
                </div>
                <span className={`text-sm font-bold ${cfg.color}`}>{tier.name}</span>
              </div>
              <p className="text-xs text-slate-500">Min balance: <strong>GHS {tier.minBalance.toLocaleString()}</strong></p>
              <p className="text-xs text-slate-500">Loyalty bonus: <strong className="text-emerald-600">{tier.bonus}</strong></p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Customer List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">Wallet Holders</h3>
            <button
              onClick={() => setShowAddCustomer(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-1 font-semibold"
            >
              <i className="ri-add-line" />Add Customer
            </button>
          </div>

          {customers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-12 text-center">
              <i className="ri-wallet-3-line text-3xl text-slate-200 block mb-2" />
              <p className="text-sm text-slate-400 mb-3">No wallet holders yet.</p>
              <button
                onClick={() => setShowAddCustomer(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer"
                style={{ background: '#DC1F1F' }}
              >
                <i className="ri-add-line mr-1" />Add First Customer
              </button>
            </div>
          ) : (
            customers.map(customer => {
              const cfg = tierConfig[customer.tier];
              return (
                <button
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`w-full bg-white rounded-2xl border p-4 text-left hover:border-emerald-300 transition-all cursor-pointer ${selectedCustomer?.id === customer.id ? 'border-emerald-400' : 'border-slate-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${customer.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {customer.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-800">{customer.name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                          {customer.tier}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{customer.phone}</p>
                      <p className="text-sm font-bold text-emerald-600 mt-0.5">GHS {customer.balance.toLocaleString()}</p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Customer Detail */}
        {selectedCustomer ? (
          <WalletCustomerDetail customer={selectedCustomer} onTopUp={() => setTopupModal(true)} />
        ) : (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 flex items-center justify-center py-24">
            <div className="text-center">
              <i className="ri-wallet-3-line text-3xl text-slate-200 block mb-2" />
              <p className="text-sm text-slate-400">Select a wallet holder to view details.</p>
            </div>
          </div>
        )}
      </div>

      {showAddCustomer && (
        <AddWalletCustomerModal
          onAdd={handleAddCustomer}
          onClose={() => setShowAddCustomer(false)}
        />
      )}
      {topupModal && selectedCustomer && (
        <TopUpModal
          customer={selectedCustomer}
          topupAmount={topupAmount}
          onAmountChange={setTopupAmount}
          onClose={() => { setTopupModal(false); setTopupAmount(''); }}
          onConfirm={() => handleTopUp(parseFloat(topupAmount) || 0)}
        />
      )}
    </AdminLayout>
  );
}
