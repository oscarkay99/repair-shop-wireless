interface NotificationsSectionProps {
  autoFollowUp: boolean;
  setAutoFollowUp: (v: boolean) => void;
  lowStockAlert: boolean;
  setLowStockAlert: (v: boolean) => void;
  paymentReminder: boolean;
  setPaymentReminder: (v: boolean) => void;
  repairUpdates: boolean;
  setRepairUpdates: (v: boolean) => void;
}

export default function NotificationsSection({
  autoFollowUp, setAutoFollowUp,
  lowStockAlert, setLowStockAlert,
  paymentReminder, setPaymentReminder,
  repairUpdates, setRepairUpdates,
}: NotificationsSectionProps) {
  const items = [
    { label: 'Auto Follow-up Reminders', desc: "Get notified when leads haven't been contacted in 48 hours", value: autoFollowUp, set: setAutoFollowUp },
    { label: 'Low Stock Alerts', desc: 'Alert when any product drops below threshold', value: lowStockAlert, set: setLowStockAlert },
    { label: 'Payment Reminders', desc: 'Remind customers with outstanding balances', value: paymentReminder, set: setPaymentReminder },
    { label: 'Repair Status Updates', desc: 'Notify customers when repair status changes', value: repairUpdates, set: setRepairUpdates },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h3 className="text-sm font-bold text-slate-800 mb-5">Notification Preferences</h3>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between py-4 border-b border-slate-50">
            <div>
              <p className="text-sm font-medium text-slate-800">{item.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
            </div>
            <button onClick={() => item.set(!item.value)} className={`relative w-11 h-6 rounded-full transition-all cursor-pointer flex-shrink-0 ${item.value ? 'bg-[#EC0118]' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${item.value ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
