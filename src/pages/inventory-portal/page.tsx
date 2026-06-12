import { useEffect } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { Boxes, AlertTriangle, Package, Plus } from 'lucide-react';

const PARTS = [
  { id: 'P001', name: 'iPhone 14 Pro Screen', sku: 'SCR-IP14P', stock: 3, min: 5, cost: 280.00 },
  { id: 'P002', name: 'Samsung S23 Battery', sku: 'BAT-SS23', stock: 8, min: 5, cost: 45.00 },
  { id: 'P003', name: 'iPhone 13 Battery', sku: 'BAT-IP13', stock: 12, min: 5, cost: 38.00 },
  { id: 'P004', name: 'USB-C Charging Port', sku: 'PORT-USBC', stock: 2, min: 10, cost: 15.00 },
  { id: 'P005', name: 'Lightning Charging Port', sku: 'PORT-LTN', stock: 6, min: 5, cost: 18.00 },
  { id: 'P006', name: 'iPhone 15 Screen', sku: 'SCR-IP15', stock: 1, min: 5, cost: 320.00 },
];

export default function InventoryPortalPage() {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle({ title: 'Inventory Portal', subtitle: 'Parts and supplies management' });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  const lowStock = PARTS.filter(p => p.stock < p.min);

  return (
    <div className="space-y-6">
      {lowStock.length > 0 && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl border"
          style={{ background: 'hsl(38 70% 10%)', borderColor: 'hsl(38 70% 20%)' }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--status-pending))' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'hsl(var(--status-pending))' }}>
              {lowStock.length} item{lowStock.length > 1 ? 's' : ''} below minimum stock
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(38 60% 50%)' }}>
              {lowStock.map(p => p.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{PARTS.length} parts tracked</p>
        <button className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'hsl(var(--primary))' }}>
          <Plus className="w-3.5 h-3.5" /> Add Part
        </button>
      </div>

      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              {['Part', 'SKU', 'Stock', 'Min Stock', 'Unit Cost', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PARTS.map((p, i) => {
              const isLow = p.stock < p.min;
              return (
                <tr
                  key={p.id}
                  className="transition-colors"
                  style={{ borderBottom: i < PARTS.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                      <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.sku}</td>
                  <td className="px-4 py-3 text-xs font-bold" style={{ color: isLow ? 'hsl(0 90% 65%)' : 'hsl(var(--foreground))' }}>{p.stock}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.min}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--foreground))' }}>GH₵ {p.cost.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={isLow
                        ? { background: 'hsl(var(--status-pending-bg))', color: 'hsl(var(--status-pending))' }
                        : { background: 'hsl(var(--status-ready-bg))', color: 'hsl(var(--status-ready))' }
                      }
                    >
                      {isLow ? 'Low Stock' : 'OK'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
