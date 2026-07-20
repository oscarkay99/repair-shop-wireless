import { useState, useEffect, useRef, useCallback } from 'react';
import { getMyNotifications, type MyNotificationRow } from '@/services/wireless/notifications';
import { summarizeAuditAction } from '@/utils/auditSummary';

export interface Notification {
  id: string;
  type: 'sale' | 'lead' | 'repair' | 'payment' | 'alert';
  title: string;
  message: string;
  amount?: number;
  time: Date;
  read: boolean;
}

const POLL_INTERVAL_MS = 45_000;

const TABLE_TYPE: Record<string, Notification['type']> = {
  tickets: 'repair',
  accessory_sales: 'sale',
  invoices: 'payment',
  transactions: 'payment',
};

const TABLE_TITLE: Record<string, string> = {
  tickets: 'Ticket',
  accessory_sales: 'Sale',
  invoices: 'Invoice',
  transactions: 'Transaction',
  customers: 'Customer',
  inventory: 'Inventory',
  products: 'Product',
  profiles: 'Team member',
  technicians: 'Technician',
  purchase_orders: 'Purchase order',
  settings: 'Settings',
  expenses: 'Expense',
};

function toNotification(row: MyNotificationRow, read: boolean): Notification {
  return {
    id: row.id,
    type: TABLE_TYPE[row.table_name] ?? 'alert',
    title: `${TABLE_TITLE[row.table_name] ?? row.table_name} ${row.action}`,
    message: summarizeAuditAction(row.actor_name, row.action, row.table_name),
    time: new Date(row.created_at),
    read,
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Notification[]>([]);
  const seenIds = useRef<Set<string>>(new Set());
  const readIds = useRef<Set<string>>(new Set());

  const poll = useCallback(async () => {
    let rows: MyNotificationRow[];
    try {
      rows = await getMyNotifications(30);
    } catch {
      return;
    }

    const freshlySeen: Notification[] = [];
    const mapped = rows.map(row => {
      const firstTimeSeen = !seenIds.current.has(row.id);
      if (firstTimeSeen) seenIds.current.add(row.id);
      const notif = toNotification(row, readIds.current.has(row.id));
      if (firstTimeSeen) freshlySeen.push(notif);
      return notif;
    });

    setNotifications(mapped);

    if (freshlySeen.length > 0) {
      setToasts(prev => [...prev, ...freshlySeen]);
      freshlySeen.forEach(n => {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== n.id));
        }, 4500);
      });
    }
  }, []);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [poll]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      prev.forEach(n => readIds.current.add(n.id));
      return prev.map(n => ({ ...n, read: true }));
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, toasts, unreadCount, markAllRead, dismissToast };
}
