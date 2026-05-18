export interface CalendarEvent { id: string; title: string; start: string; end?: string; allDay?: boolean; color?: string; customer?: string; time?: string; type?: string; notes?: string; [key: string]: unknown; }

let store: CalendarEvent[] = [];

export async function getEvents(): Promise<CalendarEvent[]> { return [...store]; }
export async function createEvent(e: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
  const item = { ...e, id: `EVT-${Date.now()}` } as CalendarEvent;
  store = [item, ...store];
  return item;
}
export async function deleteEvent(id: string): Promise<void> {
  store = store.filter(e => e.id !== id);
}
