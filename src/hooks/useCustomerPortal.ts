import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { getCustomers } from '@/services/customers';
import { getRepairs } from '@/services/repairs';
import type { Customer } from '@/types/customer';
import type { Repair } from '@/types/repair';

// Mock credentials matching the seed customer emails (local / offline mode)
const MOCK_CREDS = [
  { email: 'kwame.a@email.com',  password: 'repair123' },
  { email: 'ama.owusu@email.com', password: 'repair123' },
  { email: 'yaw.darko@email.com', password: 'repair123' },
  { email: 'abena.f@email.com',  password: 'repair123' },
  { email: 'kofi.m@email.com',   password: 'repair123' },
];

const PORTAL_KEY = 'wireless_portal_customer';

function readStored(): Customer | null {
  try { return JSON.parse(localStorage.getItem(PORTAL_KEY) ?? 'null'); } catch { return null; }
}

export function useCustomerPortal() {
  const [customer, setCustomer] = useState<Customer | null>(readStored);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // ── Helpers ────────────────────────────────────────────────

  const persist = (c: Customer | null) => {
    setCustomer(c);
    c ? localStorage.setItem(PORTAL_KEY, JSON.stringify(c)) : localStorage.removeItem(PORTAL_KEY);
  };

  const loadRepairs = useCallback(async (cust: Customer) => {
    setLoading(true);
    try {
      const all = await getRepairs();
      setRepairs(all.filter(r =>
        r.customerId === cust.id ||
        (!!cust.websiteAuthUserId && r.websiteAuthUserId === cust.websiteAuthUserId)
      ));
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveByEmail = useCallback(async (email: string): Promise<boolean> => {
    try {
      const all = await getCustomers();
      const c = all.find(c => c.email === email);
      if (!c) { setError('No repair records found for this email. Please contact the shop.'); return false; }
      persist(c);
      return true;
    } catch {
      setError('Could not find your account. Please try again.');
      return false;
    }
  }, []);

  // ── Supabase auth listener (OAuth + magic link redirects) ──

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email) {
        await resolveByEmail(session.user.email);
      } else {
        persist(null);
        setRepairs([]);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email && !customer) {
        await resolveByEmail(session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load repairs + realtime subscription ───────────────────

  useEffect(() => {
    if (!customer) return;
    loadRepairs(customer);

    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel(`portal-${customer.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'repairs', filter: `customer_id=eq.${customer.id}` },
        () => { loadRepairs(customer); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [customer, loadRepairs]);

  // ── Auth methods ──────────────────────────────────────────

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setAuthLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); return false; }
        return true; // onAuthStateChange will resolve customer
      }
      // Local mock
      const cred = MOCK_CREDS.find(c => c.email === email && c.password === password);
      if (!cred) { setError('Invalid email or password.'); return false; }
      return resolveByEmail(email);
    } finally {
      setAuthLoading(false);
    }
  };

  const sendMagicLink = async (email: string): Promise<boolean> => {
    setAuthLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured) {
        setError('Magic link requires Supabase. Use email + password in local mode.');
        return false;
      }
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/customer/repairs` },
      });
      if (error) { setError(error.message); return false; }
      setMagicLinkSent(true);
      return true;
    } finally {
      setAuthLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    if (!isSupabaseConfigured) {
      setError('Google sign-in requires Supabase to be configured.');
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/customer/repairs` },
    });
    if (error) setError(error.message);
  };

  const signInWithApple = async () => {
    setError(null);
    if (!isSupabaseConfigured) {
      setError('Apple sign-in requires Supabase to be configured.');
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/customer/repairs` },
    });
    if (error) setError(error.message);
  };

  const signOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    persist(null);
    setRepairs([]);
    setMagicLinkSent(false);
  };

  return {
    customer,
    repairs,
    loading,
    authLoading,
    error,
    magicLinkSent,
    setError,
    setMagicLinkSent,
    isAuthenticated: !!customer,
    signIn,
    sendMagicLink,
    signInWithGoogle,
    signInWithApple,
    signOut,
    reload: () => customer && loadRepairs(customer),
  };
}
