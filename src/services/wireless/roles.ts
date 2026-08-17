import { isSupabaseConfigured, db } from '@/services/supabase';

export interface WirelessRole {
  id: string;
  name: string;
  color: string;
  permissions: string[];
  scope_tickets_to_technician: boolean;
  dashboard_variant: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

const now = () => new Date().toISOString();

// Mirrors the DB seed in 20260727000000_custom_roles_system.sql — used only
// when running without a live Supabase connection (demo/mock mode).
let localStore: WirelessRole[] = [
  { id: 'admin', name: 'Admin', color: '#EC0118', is_system: true, scope_tickets_to_technician: false, dashboard_variant: 'admin', created_at: now(), updated_at: now(),
    permissions: ['tickets:view','tickets:create','tickets:edit','tickets:delete','ticket_media:view','ticket_media:create','ticket_media:delete','ticket_comments:view','ticket_comments:delete','ticket_parts:view','ticket_parts:create','customers:create','customers:edit','customers:delete','invoices:create','invoices:edit','invoices:delete','invoices:items_edit','technicians:edit','parts:edit','sales:create','payments:create','expenses:view','expenses:edit','settings:edit','team:view','team:edit','team:delete','audit_logs:view'] },
  { id: 'sales_manager', name: 'Sales Manager', color: '#F59E0B', is_system: false, scope_tickets_to_technician: false, dashboard_variant: 'sales_manager', created_at: now(), updated_at: now(),
    permissions: ['tickets:view','tickets:edit','ticket_media:view','ticket_comments:view','ticket_comments:create','ticket_parts:view','ticket_parts:create','customers:create','customers:edit','customers:delete','invoices:create','invoices:edit','invoices:delete','invoices:items_edit','technicians:edit','parts:edit','sales:create','payments:create','payments:view','team:view','audit_logs:view'] },
  { id: 'technician', name: 'Technician', color: '#06B6D4', is_system: false, scope_tickets_to_technician: true, dashboard_variant: 'technician', created_at: now(), updated_at: now(),
    permissions: ['ticket_parts:create'] },
  // Kept in sync with the cumulative DB patches on top of the original seed
  // (20260728030000, 20260806070000, 20260811000000, 20260817000000):
  // items_edit, sales:create, ticket_parts:create, and parts:view were all
  // granted after the initial custom-roles migration.
  { id: 'receptionist', name: 'Receptionist', color: '#8B5CF6', is_system: false, scope_tickets_to_technician: false, dashboard_variant: 'receptionist', created_at: now(), updated_at: now(),
    permissions: ['tickets:view','tickets:create','tickets:edit','ticket_media:view','ticket_comments:view','ticket_comments:create','ticket_parts:view','ticket_parts:create','customers:create','customers:edit','invoices:create','invoices:edit','invoices:items_edit','sales:create','payments:create','payments:view','parts:view'] },
];

export async function getRoles(): Promise<WirelessRole[]> {
  if (!isSupabaseConfigured) return [...localStore];
  const { data, error } = await db.from('roles').select('*').order('created_at');
  if (error) throw error;
  localStore = (data as WirelessRole[] | null) ?? [];
  return localStore;
}

// Used by useAuth on login to resolve a profile's effective permissions.
export async function getRoleById(id: string): Promise<WirelessRole | null> {
  if (!isSupabaseConfigured) return localStore.find(r => r.id === id) ?? null;
  const { data, error } = await db.from('roles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as WirelessRole | null) ?? null;
}

export interface RoleInput {
  id: string;
  name: string;
  color: string;
  permissions: string[];
  scope_tickets_to_technician: boolean;
  dashboard_variant: string;
}

export async function createRole(input: RoleInput): Promise<WirelessRole> {
  if (!isSupabaseConfigured) {
    const role: WirelessRole = { ...input, is_system: false, created_at: now(), updated_at: now() };
    localStore = [...localStore, role];
    return role;
  }
  const { data, error } = await db.from('roles').insert({ ...input, is_system: false }).select().single();
  if (error) throw error;
  return data as WirelessRole;
}

export async function updateRole(id: string, patch: Partial<Omit<RoleInput, 'id'>>): Promise<void> {
  if (!isSupabaseConfigured) {
    localStore = localStore.map(r => r.id === id ? { ...r, ...patch, updated_at: now() } : r);
    return;
  }
  const { error } = await db.from('roles').update(patch).eq('id', id);
  if (error) throw error;
}

// The DB enforces both guards independently (a trigger blocks touching
// is_system rows at all; the profiles.role FK blocks deleting a role with
// staff still on it) — this just turns those into readable messages instead
// of raw constraint-violation text.
export async function deleteRole(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    localStore = localStore.filter(r => r.id !== id);
    return;
  }
  const { error } = await db.from('roles').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') throw new Error('This role still has staff assigned to it. Reassign them before deleting.');
    throw error;
  }
}
