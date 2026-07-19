type OrderStatus = 'pending' | 'in_transit' | 'delivered';

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:    { label: 'Pending',     color: 'text-amber-600',  bg: 'bg-amber-100',  icon: 'ri-time-line' },
  in_transit: { label: 'In Transit',  color: 'text-sky-600',    bg: 'bg-sky-100',    icon: 'ri-truck-line' },
  delivered:  { label: 'Delivered',   color: 'text-emerald-600',bg: 'bg-emerald-100',icon: 'ri-checkbox-circle-line' },
};

interface DeliveryOrder {
  id: string;
  customer: string;
  phone: string;
  status: string;
  address: string;
  eta: string;
  driver: string;
  total: number;
  items: string[];
  notes?: string;
}

interface Driver {
  id: string;
  name: string;
  status: string;
  deliveries: number;
  completed: number;
  rating: number;
}

interface DeliveryZone {
  name: string;
  fee: number;
  eta: string;
}

interface Props {
  order: DeliveryOrder;
  drivers: Driver[];
  zones: DeliveryZone[];
}

export default function DeliveryDetail({ order, drivers, zones }: Props) {
  const sc = statusConfig[order.status as OrderStatus];

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold text-[hsl(var(--foreground))]">Live Route Map — Greater Accra</span>
          </div>
          <button className="text-xs text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-1">
            <i className="ri-route-line" />Optimize Route
          </button>
        </div>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127521.47!2d-0.2057!3d5.5913!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9084b2b7a773%3A0xbed14ed8650e2dd3!2sAccra%2C+Ghana!5e0!3m2!1sen!2sgh!4v1"
          width="100%"
          height="280"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          title="Delivery Map"
        />
      </div>

      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">{order.customer}</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{order.id} · {order.phone}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}>
              <i className={`${sc.icon} mr-1`} />{sc.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[hsl(var(--muted))] rounded-xl p-3">
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">Delivery Address</p>
            <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{order.address}</p>
          </div>
          <div className="bg-[hsl(var(--muted))] rounded-xl p-3">
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">ETA</p>
            <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{order.eta} today</p>
          </div>
          <div className="bg-[hsl(var(--muted))] rounded-xl p-3">
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">Driver</p>
            <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{order.driver}</p>
          </div>
          <div className="bg-[hsl(var(--muted))] rounded-xl p-3">
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">Order Value</p>
            <p className="text-xs font-semibold text-emerald-600">GHS {order.total.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-[hsl(var(--muted))] rounded-xl p-3 mb-4">
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-1">Items</p>
          {order.items.map((item, i) => (
            <p key={i} className="text-xs text-[hsl(var(--foreground))]">• {item}</p>
          ))}
        </div>

        {order.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
            <p className="text-[10px] text-amber-600 font-semibold mb-0.5">Driver Note</p>
            <p className="text-xs text-[hsl(var(--foreground))]">{order.notes}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold cursor-pointer whitespace-nowrap hover:opacity-90" style={{ background: '#EC0118' }}>
            <i className="ri-whatsapp-line mr-1" />Notify Customer
          </button>
          <button className="flex-1 py-2.5 rounded-xl border border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] cursor-pointer whitespace-nowrap">
            <i className="ri-phone-line mr-1" />Call Driver
          </button>
          <button className="flex-1 py-2.5 rounded-xl border border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] cursor-pointer whitespace-nowrap">
            <i className="ri-checkbox-circle-line mr-1" />Mark Delivered
          </button>
        </div>
      </div>

      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5">
        <h4 className="text-sm font-bold text-[hsl(var(--foreground))] mb-3">Drivers</h4>
        <div className="grid grid-cols-3 gap-3">
          {drivers.map(driver => (
            <div key={driver.id} className="bg-[hsl(var(--muted))] rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <i className="ri-user-line text-emerald-600 text-sm" />
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${driver.status === 'active' ? 'bg-emerald-100 text-emerald-600' : driver.status === 'idle' ? 'bg-sky-100 text-sky-600' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}>
                  {driver.status === 'active' ? 'Active' : driver.status === 'idle' ? 'Idle' : 'Off Duty'}
                </span>
              </div>
              <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{driver.name}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{driver.deliveries} active · {driver.completed} done</p>
              <div className="flex items-center gap-1 mt-1">
                <i className="ri-star-fill text-amber-400 text-[10px]" />
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{driver.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5">
        <h4 className="text-sm font-bold text-[hsl(var(--foreground))] mb-3">Delivery Zones & Fees</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {zones.map(zone => (
            <div key={zone.name} className="bg-[hsl(var(--muted))] rounded-xl p-3">
              <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{zone.name}</p>
              <p className="text-sm font-bold text-emerald-600">GHS {zone.fee}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{zone.eta}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
