import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useWirelessCustomers } from '@/hooks/useWirelessCustomers';
import { useParts } from '@/hooks/useParts';
import type { Repair } from '@/types/repair';
import type { WCustomer } from '@/types/wireless';
import CustomerPicker from '@/components/shared/CustomerPicker';
import DevicePicker from '@/components/shared/DevicePicker';
import { isCurrentlyUnavailable } from '@/utils/technicianAvailability';
import { addTicketPart } from '@/services/wireless/ticketParts';
import { errMessage } from '@/utils/errors';

interface Props {
  onSave: (r: Omit<Repair, 'id'>) => Promise<Repair>;
  onClose: () => void;
  repairs: Repair[];
  defaultJobType?: 'diagnosis_only' | 'diagnosis_to_repair' | 'straight_repair';
  initial?: Repair;
  onUpdate?: (id: string, patch: Partial<Repair>) => Promise<unknown>;
}

const ACTIVE_STATUSES = new Set<Repair['status']>([
  'received', 'diagnosis_paid', 'diagnosing', 'awaiting_approval', 'parts_pending', 'in_progress', 'ready',
]);

export default function AddRepairModal({ onSave, onClose, repairs, defaultJobType, initial, onUpdate }: Props) {
  const [form, setForm] = useState({
    customer: initial?.customer ?? '',
    customerPhone: initial?.customerPhone ?? '',
    customerEmail: initial?.customerEmail ?? '',
    device: initial?.device ?? '',
    deviceType: (initial?.deviceType ?? 'Other') as string,
    issue: initial?.issue ?? '',
    cost: initial?.cost ?? 'TBD',
    eta: initial?.eta ?? '',
    etaDate: initial?.etaDate ?? '',
    warranty: initial?.warranty ?? false,
    diagnosisFee: String(initial?.diagnosisFee ?? 200),
    jobType: (initial?.jobType ?? defaultJobType ?? 'diagnosis_to_repair') as 'diagnosis_only' | 'diagnosis_to_repair' | 'straight_repair',
  });
  const [selectedCustomer, setSelectedCustomer] = useState<WCustomer | null>(null);
  // All equal — no "primary" technician, just a set of assignees.
  const [selectedTechnicianIds, setSelectedTechnicianIds] = useState<string[]>(
    initial?.technicians?.map(t => t.id) ?? []
  );
  const toggleTechnician = (id: string) => {
    setSelectedTechnicianIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const [customerError, setCustomerError] = useState('');
  const [saving, setSaving] = useState(false);
  const { technicians } = useTechnicians();
  // Walk-ins with no existing record shouldn't need a separate trip to the
  // Customers module first — "New" creates the real customer record inline,
  // right when the ticket is submitted, same as CustomerPicker's own
  // create-new suggestion already does, just as an explicit up-front choice.
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const { add: addCustomer } = useWirelessCustomers();
  const { parts } = useParts();
  // Only auto-fills while the cost is still untouched (default 'TBD' or a
  // value we auto-filled ourselves) — once staff types their own number,
  // this stops overwriting it even if device/issue keep changing.
  const [costAutoFilled, setCostAutoFilled] = useState(false);
  const lockJobType = !!defaultJobType && !initial;

  // The part being replaced is only knowable up front for a repair job where
  // the fix is already obvious (straight repair, or a repair quote following
  // diagnosis) — a diagnosis-only job by definition doesn't know this yet.
  // Only offered when creating a new ticket; editing an existing one already
  // has its own "Add Part" flow in the ticket detail panel.
  const showPartField = !initial && form.jobType !== 'diagnosis_only';
  const [partSearch, setPartSearch] = useState('');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQuantity, setPartQuantity] = useState('1');
  const selectedPart = parts.find(p => p.id === selectedPartId) ?? null;
  const partSuggestions = useMemo(() => {
    const q = partSearch.trim().toLowerCase();
    if (!q) return [];
    return parts.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 8);
  }, [parts, partSearch]);

  // Inventory is the device catalog here — each part is normally a distinct,
  // exact device model with its own price (e.g. "iPhone 11", "iPhone 11 Pro",
  // "iPhone 11 Pro max" are three separate entries). But two rows can
  // legitimately share an identical name at different prices too (e.g. an
  // OEM vs. compatible "iPhone 13 Screen") — collapsing those down to one
  // price used to just take whichever row happened to load first, silently
  // handing out the wrong number. Instead: same name + same price collapses
  // to one clean suggestion; same name + different prices lists every one,
  // each tagged with its SKU, so the price picked is always the one actually
  // chosen, never guessed.
  const knownDevices = useMemo(() => {
    const groups = new Map<string, typeof parts>();
    for (const p of parts) {
      if (!p.name) continue;
      const key = p.name.trim().toLowerCase();
      const g = groups.get(key);
      if (g) g.push(p); else groups.set(key, [p]);
    }
    const out: { name: string; price: number; sku?: string }[] = [];
    for (const group of groups.values()) {
      const prices = new Set(group.map(p => p.selling_price));
      if (prices.size === 1) {
        out.push({ name: group[0].name, price: group[0].selling_price });
      } else {
        for (const p of group) out.push({ name: p.name, price: p.selling_price, sku: p.sku });
      }
    }
    return out.sort((a, b) => a.name.localeCompare(b.name) || a.price - b.price);
  }, [parts]);

  // Picking an exact replacement part (a specific inventory row, id and all)
  // is a far stronger price signal than matching free-text device names
  // against the catalog — it's not a guess, it's the literal part being
  // billed. Once one is chosen, its price is what drives the quote, and it
  // wins over the device-name match below even if the device text changes
  // afterwards.
  useEffect(() => {
    if (!selectedPart) return;
    if (form.cost === 'TBD' || costAutoFilled) {
      set('cost', String(selectedPart.selling_price));
      setCostAutoFilled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPart]);

  // Fallback for when no specific part has been picked yet (diagnosis-only
  // jobs don't even show that field). Not gated to "only when creating" — a
  // Diagnosis Only ticket has no cost yet when it later proceeds to repair
  // (Edit Ticket, `initial` set), so this needs to run there too. Still safe
  // either way: it only ever touches a cost that's still 'TBD' or was
  // auto-filled by this same effect, never something someone actually typed in.
  useEffect(() => {
    if (selectedPart) return; // the exact part selection above takes priority
    const exactMatches = parts.filter(p => p.name.trim().toLowerCase() === form.device.trim().toLowerCase());
    if (exactMatches.length === 0) return;
    const prices = new Set(exactMatches.map(p => p.selling_price));
    // More than one price behind the same name is ambiguous — there's no
    // correct number to silently fill in, so leave it alone and make staff
    // pick the exact (SKU-tagged) entry from the dropdown instead.
    if (prices.size > 1) return;
    if (form.cost === 'TBD' || costAutoFilled) {
      set('cost', String(exactMatches[0].selling_price));
      setCostAutoFilled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.device, parts, selectedPart]);

  // A ticket assigned to 2 technicians counts once toward each of their
  // loads — both are actually working it, no "primary" owner to credit alone.
  const activeLoadById = repairs
    .filter(r => ACTIVE_STATUSES.has(r.status))
    .reduce<Record<string, number>>((acc, r) => {
      for (const t of r.technicians) acc[t.id] = (acc[t.id] ?? 0) + 1;
      return acc;
    }, {});

  const sortedTechnicians = [...technicians].sort((a, b) =>
    (activeLoadById[a.id] ?? 0) - (activeLoadById[b.id] ?? 0)
  );

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  // The ticket is already created by the time this runs — a failure here
  // shouldn't undo that or block the flow, just surface that stock wasn't
  // deducted so staff know to add the part manually from the ticket panel.
  const attachSelectedPart = async (created: Repair) => {
    if (!showPartField || !selectedPart || !created.ticketDbId) return;
    try {
      await addTicketPart({
        ticketDbId: created.ticketDbId,
        partId: selectedPart.id,
        partName: selectedPart.name,
        quantity: parseInt(partQuantity, 10) || 1,
        unitCost: selectedPart.unit_cost,
      });
    } catch (err) {
      alert(errMessage(err, `Ticket created, but failed to attach ${selectedPart.name}. Add it manually from the ticket.`));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.device || !form.issue) return;
    if (customerMode === 'new' && !initial) {
      if (!form.customer.trim() || !form.customerPhone.trim()) {
        setCustomerError('Name and phone are required to create a new customer.');
        return;
      }
    } else if (!form.customer) {
      return;
    }
    // A typed customer name must be linked to a real customer record — either
    // picked from the dropdown, created inline through it, freshly created
    // via the New tab, or (when editing) left untouched from an already-
    // linked ticket.
    const hasLinkedCustomer = (customerMode === 'new' && !initial)
      || !!selectedCustomer
      || (!!initial?.customerId && form.customer === initial.customer);
    if (!hasLinkedCustomer) {
      setCustomerError('Select an existing customer or create a new one.');
      return;
    }
    setCustomerError('');
    setSaving(true);
    try {
      // A brand-new walk-in customer is created here, right as the ticket is
      // submitted, rather than requiring a separate trip to Customers first.
      // …unless the name they typed matched somebody already on file and they
      // picked them from the dropdown, in which case that record is reused.
      const customer = customerMode === 'new' && !initial
        ? selectedCustomer ?? await addCustomer({ name: form.customer.trim(), phone: form.customerPhone.trim(), email: form.customerEmail.trim(), address: '' })
        : selectedCustomer;

      const costNum = parseFloat(form.cost.replace(/[^0-9.]/g, '')) || 0;
      const diagnosisFeeNum = parseFloat(form.diagnosisFee) || 0;
      const selectedTechnicians = technicians
        .filter(t => selectedTechnicianIds.includes(t.id))
        .map(t => ({ id: t.id, name: t.name }));

      if (initial && onUpdate) {
        await onUpdate(initial.id, {
          customer: form.customer,
          customerId: customer?.id ?? initial.customerId,
          websiteAuthUserId: initial.websiteAuthUserId,
          customerEmail: form.customerEmail || customer?.email || initial.customerEmail,
          customerPhone: form.customerPhone || customer?.phone || initial.customerPhone,
          device: form.device,
          deviceType: form.deviceType,
          issue: form.issue,
          technicians: selectedTechnicians,
          cost: form.cost,
          costNum,
          eta: form.eta,
          etaDate: form.etaDate,
          warranty: form.warranty,
          diagnosisFee: diagnosisFeeNum,
          jobType: form.jobType,
        });
      } else if (form.jobType === 'straight_repair') {
        // No diagnosis stage, no diagnosis fee — straight to the repair queue.
        const created = await onSave({
          ...form,
          technicians: selectedTechnicians,
          customerId: customer?.id,
          customerEmail: form.customerEmail || customer?.email,
          customerPhone: form.customerPhone || customer?.phone,
          status: 'received',
          jobType: 'straight_repair',
          serviceStage: 'repair',
          quoteStatus: 'not_sent',
          diagnosisFee: 0,
          quoteAmount: costNum || undefined,
          costNum,
          started: new Date().toISOString().split('T')[0],
          parts: [],
          notes: [],
          payments: [],
        });
        await attachSelectedPart(created);
      } else {
        const created = await onSave({
          ...form,
          technicians: selectedTechnicians,
          customerId: customer?.id,
          customerEmail: form.customerEmail || customer?.email,
          customerPhone: form.customerPhone || customer?.phone,
          status: 'diagnosis_paid',
          jobType: form.jobType,
          serviceStage: 'diagnosis',
          quoteStatus: 'not_sent',
          diagnosisFee: diagnosisFeeNum,
          diagnosisPaidAt: new Date().toISOString(),
          quoteAmount: costNum || undefined,
          costNum,
          started: new Date().toISOString().split('T')[0],
          parts: [],
          notes: [],
          payments: [
            {
              id: crypto.randomUUID(),
              type: 'diagnosis_fee',
              amount: diagnosisFeeNum,
              amountLabel: `GHS ${diagnosisFeeNum}`,
              status: 'paid',
              paidAt: new Date().toISOString(),
            },
          ],
        });
        await attachSelectedPart(created);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(7,16,31,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-md max-h-[90vh] rounded-2xl overflow-hidden flex flex-col" style={{ background: 'hsl(var(--card))', boxShadow: '0 24px 80px rgba(7,16,31,0.2)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <h3 className="text-[14px] font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            {initial ? 'Edit Ticket' : defaultJobType === 'diagnosis_only' ? 'New Diagnosis' : 'New Ticket'}
          </h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ background: 'rgba(236,1,24,0.08)' }}>
            <i className="ri-close-line text-sm" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {!initial && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Customer</label>
              <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
                {(['existing', 'new'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setCustomerMode(mode);
                      setCustomerError('');
                      setSelectedCustomer(null);
                      set('customer', '');
                      set('customerPhone', '');
                      set('customerEmail', '');
                    }}
                    className="flex-1 text-xs font-bold py-2 transition-colors"
                    style={customerMode === mode
                      ? { background: 'hsl(var(--primary))', color: 'white' }
                      : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                  >
                    {mode === 'existing' ? 'Existing' : 'New'}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Job Flow</label>
            {lockJobType ? (
              <div className="w-full text-sm rounded-xl px-3 py-2"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                {defaultJobType === 'diagnosis_only' ? 'Diagnosis only' : defaultJobType === 'straight_repair' ? 'Straight repair (no diagnosis)' : 'Diagnosis then repair quote'}
              </div>
            ) : (
              <select value={form.jobType} onChange={e => set('jobType', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
                <option value="diagnosis_to_repair">Diagnosis then repair quote</option>
                <option value="diagnosis_only">Diagnosis only</option>
                <option value="straight_repair">Straight repair (no diagnosis)</option>
              </select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {customerMode === 'new' && !initial ? (
              // Same search-as-you-type flow as the Existing tab — a walk-in
              // who's actually already registered gets linked (and their phone
              // and email filled in) instead of duplicated, while a genuinely
              // new name is just typed through and created on submit.
              <CustomerPicker
                createMode
                value={form.customer}
                phone={form.customerPhone}
                onChange={(name, phone, customer) => {
                  set('customer', name);
                  if (customer) {
                    set('customerPhone', phone);
                    set('customerEmail', customer.email ?? '');
                  }
                  setSelectedCustomer(customer ?? null);
                }}
                required
                label="Customer Name"
                placeholder="Full name"
              />
            ) : (
              <CustomerPicker
                value={form.customer}
                phone={form.customerPhone}
                onChange={(name, phone, customer) => {
                  set('customer', name);
                  set('customerPhone', phone);
                  set('customerEmail', customer?.email ?? '');
                  setSelectedCustomer(customer ?? null);
                }}
                required
                label="Customer"
              />
            )}
            <DevicePicker
              value={form.device}
              onChange={(v, price) => {
                set('device', v);
                // An already-chosen replacement part is the authoritative
                // price (see the selectedPart effect above) — a device pick
                // shouldn't clobber it, same priority order either way round.
                if (selectedPart) return;
                // Otherwise picked straight from inventory, so the price is
                // known here — no need to wait on the exact-name-match effect.
                if (price !== undefined) {
                  set('cost', String(price));
                  setCostAutoFilled(true);
                }
              }}
              suggestions={knownDevices}
              required
              label="Device"
            />
          </div>
          {customerError && (
            <p className="text-xs -mt-2" style={{ color: '#dc2626' }}>{customerError}</p>
          )}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Issue *</label>
            <input required value={form.issue} onChange={e => set('issue', e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2 outline-none"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
              placeholder="Screen cracked, battery dead..." />
          </div>
          {showPartField && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Part Being Replaced <span className="normal-case font-normal opacity-70">(optional, skip if not sure yet)</span>
              </label>
              {selectedPart ? (
                <div className="w-full flex items-center justify-between gap-2 text-sm rounded-xl px-3 py-2"
                  style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
                  <span className="min-w-0 truncate">
                    {selectedPart.name} <span style={{ color: 'hsl(var(--muted-foreground))' }}>({selectedPart.sku} · {selectedPart.stock} in stock)</span>
                  </span>
                  <span className="flex-shrink-0 font-semibold" style={{ color: 'hsl(var(--primary))' }}>GHS {selectedPart.selling_price}</span>
                  <button type="button" onClick={() => { setSelectedPartId(''); setPartSearch(''); }}
                    className="flex-shrink-0 text-xs font-semibold cursor-pointer" style={{ color: '#dc2626' }}>
                    Clear
                  </button>
                </div>
              ) : (
                <input value={partSearch} onChange={e => setPartSearch(e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                  style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                  placeholder="Search inventory parts…" />
              )}
              {!selectedPart && partSearch.trim() && (
                <div className="mt-1 max-h-36 overflow-y-auto rounded-lg" style={{ border: '1px solid hsl(var(--border))' }}>
                  {partSuggestions.length === 0 ? (
                    <div className="px-3 py-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No matching parts.</div>
                  ) : partSuggestions.map(p => (
                    <button key={p.id} type="button"
                      onClick={() => { setSelectedPartId(p.id); setPartSearch(''); }}
                      className="w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 hover:bg-[hsl(var(--muted))]"
                      style={{ color: 'hsl(var(--foreground))' }}>
                      <span className="min-w-0 truncate">{p.name} <span style={{ color: 'hsl(var(--muted-foreground))' }}>({p.sku})</span></span>
                      <span className="flex-shrink-0 flex items-center gap-2">
                        <span style={{ color: 'hsl(var(--muted-foreground))' }}>{p.stock} in stock</span>
                        <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>GHS {p.selling_price}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {selectedPart && (
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Quantity</label>
                  <input type="number" min={1} value={partQuantity} onChange={e => setPartQuantity(e.target.value)}
                    className="w-20 text-sm rounded-xl px-3 py-1.5 outline-none"
                    style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }} />
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Customer Email</label>
              <input value={form.customerEmail} onChange={e => set('customerEmail', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                placeholder="customer@email.com" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Customer Phone{customerMode === 'new' && !initial ? ' *' : ''}
              </label>
              <input required={customerMode === 'new' && !initial} value={form.customerPhone} onChange={e => set('customerPhone', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                placeholder="+233..." />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Device Type</label>
            <select value={form.deviceType} onChange={e => set('deviceType', e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2 outline-none"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
              {['Phone','Tablet','Laptop','Desktop','Smartwatch','Console','Camera','Audio','Other'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={form.jobType === 'diagnosis_only' ? 'col-span-2' : ''}>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Technician{selectedTechnicianIds.length > 0 && ` (${selectedTechnicianIds.length})`}
              </label>
              <div className="rounded-xl overflow-hidden max-h-40 overflow-y-auto" style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))' }}>
                {sortedTechnicians.length === 0 ? (
                  <div className="px-3 py-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No technicians on roster.</div>
                ) : sortedTechnicians.map(t => {
                  const load = activeLoadById[t.id] ?? 0;
                  const unavailable = isCurrentlyUnavailable(t);
                  const checked = selectedTechnicianIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      disabled={unavailable && !checked}
                      onClick={() => toggleTechnician(t.id)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-[hsl(var(--muted))] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ color: 'hsl(var(--foreground))', background: checked ? 'hsl(var(--primary)/0.12)' : undefined }}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <i className={checked ? 'ri-checkbox-fill' : 'ri-checkbox-blank-line'} style={{ color: checked ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} />
                        <span className="truncate">{t.name}</span>
                      </span>
                      <span className="flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {unavailable
                          ? `Unavailable${t.unavailable_until ? ` until ${new Date(t.unavailable_until + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`
                          : load === 0 ? 'Available' : `${load} active job${load > 1 ? 's' : ''}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Repair cost isn't actionable yet for a diagnosis-only job — nothing
                to quote until the diagnosis is done and a decision is made. */}
            {form.jobType !== 'diagnosis_only' && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Quoted Repair Cost{costAutoFilled && <span style={{ color: 'hsl(var(--primary))' }}> · from inventory</span>}
                </label>
                <input value={form.cost} onChange={e => { setCostAutoFilled(false); set('cost', e.target.value); }}
                  className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                  style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                  placeholder="GHS 850 or TBD" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={form.jobType === 'straight_repair' ? 'col-span-2' : ''}>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>ETA</label>
              <input value={form.eta} onChange={e => set('eta', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none mb-1.5"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                placeholder="Apr 26" />
              <input type="date" value={form.etaDate} onChange={e => set('etaDate', e.target.value)}
                title="Turnaround date, used to flag this ticket as overdue if it slips past this date"
                className="w-full text-xs rounded-xl px-3 py-1.5 outline-none"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }} />
            </div>
            {/* Straight repair skips diagnosis entirely — no fee to enter, so
                the field is absent rather than shown disabled with "None". */}
            {form.jobType !== 'straight_repair' && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Diagnosis Fee</label>
                <input type="number" min="0" step="0.01" value={form.diagnosisFee} onChange={e => set('diagnosisFee', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                  style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                  placeholder="200" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="warranty" checked={form.warranty} onChange={e => set('warranty', e.target.checked)} className="cursor-pointer" />
            <label htmlFor="warranty" className="text-sm text-[hsl(var(--muted-foreground))] cursor-pointer">Under Warranty</label>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
            style={{ background: 'rgba(236,1,24,0.08)', color: 'hsl(var(--muted-foreground))' }}>
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer bg-[#EC0118] hover:bg-[#BD0113] disabled:opacity-70 transition-colors duration-150">
            {saving ? 'Saving…' : initial ? 'Save Changes' : defaultJobType === 'diagnosis_only' ? 'Create Diagnosis' : 'Create Ticket'}
          </button>
        </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
