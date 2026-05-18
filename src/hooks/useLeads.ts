import { useState, useEffect } from 'react';
import { getLeads, createLead, updateLeadStatus } from '@/services/leads';
import type { Lead } from '@/types/lead';
import { useToast } from '@/contexts/ToastContext';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    getLeads().then(setLeads).finally(() => setLoading(false));
  }, []);

  const add = async (l: Omit<Lead, 'id'>) => {
    const created = await createLead(l);
    setLeads(prev => [created, ...prev]);
    showToast('Lead added');
    return created;
  };

  const setStatus = async (id: string, status: Lead['status']) => {
    await updateLeadStatus(id, status);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  return { leads, loading, add, setStatus };
}
