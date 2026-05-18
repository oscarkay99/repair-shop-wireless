import { useState, useEffect } from 'react';
import { getEvents, createEvent, deleteEvent } from '@/services/events';
import type { CalendarEvent } from '@/services/events';
import { useToast } from '@/contexts/ToastContext';

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    getEvents().then(setEvents).finally(() => setLoading(false));
  }, []);

  const add = async (e: Omit<CalendarEvent, 'id'>): Promise<void> => {
    const created = await createEvent(e);
    setEvents(prev => [...prev, created]);
    showToast('Event added');
  };

  const remove = async (id: string) => {
    await deleteEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
    showToast('Event removed');
  };

  const update = (id: string, changes: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...changes } : e));
  };

  return { events, loading, add, remove, update };
}
