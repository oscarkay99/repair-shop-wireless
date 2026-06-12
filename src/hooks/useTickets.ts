import { useState, useEffect, useCallback } from 'react';
import { getTickets, createTicket, updateTicket, updateTicketStatus, deleteTicket, addTicketComment } from '@/services/wireless/tickets';
import type { Ticket, TicketStatus } from '@/types/wireless';
import { useToast } from '@/contexts/ToastContext';

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const reload = useCallback(async () => {
    setLoading(true);
    try { setTickets(await getTickets()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const add = async (input: Parameters<typeof createTicket>[0]) => {
    const t = await createTicket(input);
    setTickets(prev => [t, ...prev]);
    showToast('Ticket created');
    return t;
  };

  const setStatus = async (id: string, status: TicketStatus) => {
    await updateTicketStatus(id, status);
    setTickets(prev => prev.map(t => t.id === id
      ? { ...t, status, completed_at: status === 'completed' ? new Date().toISOString() : t.completed_at }
      : t));
    showToast('Ticket status updated');
  };

  const patch = async (id: string, data: Partial<Ticket>) => {
    await updateTicket(id, data);
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  };

  const remove = async (id: string) => {
    await deleteTicket(id);
    setTickets(prev => prev.filter(t => t.id !== id));
    showToast('Ticket deleted');
  };

  const addComment = async (ticketId: string, body: string, authorName: string, authorId?: string) => {
    return addTicketComment(ticketId, body, authorName, authorId);
  };

  return { tickets, loading, reload, add, setStatus, patch, remove, addComment };
}
