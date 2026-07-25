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

const MAX_VISIBLE_TOASTS = 3;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Notification[]>([]);
  const seenIds = useRef<Set<string>>(new Set());
  const readIds = useRef<Set<string>>(new Set());
  const clearedIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  const poll = useCallback(async () => {
    let rows: MyNotificationRow[];
    try {
      rows = await getMyNotifications(30);
    } catch {
      return;
    }

    const wasFirstLoad = isFirstLoad.current;
    const freshlySeen: Notification[] = [];
    const mapped = rows
      // A cleared notification stays cleared across polls — otherwise it'd
      // just reappear 45s later since it's still sitting in the source data.
      .filter(row => !clearedIds.current.has(row.id))
      .map(row => {
        const firstTimeSeen = !seenIds.current.has(row.id);
        if (firstTimeSeen) seenIds.current.add(row.id);
        const notif = toNotification(row, wasFirstLoad || readIds.current.has(row.id));
        if (firstTimeSeen && !wasFirstLoad) freshlySeen.push(notif);
        return notif;
      });

    setNotifications(mapped);
    isFirstLoad.current = false;

    // Existing history loads as already-read and never toasts — only events
    // that arrive after the initial fetch are "new" and worth popping up.
    if (freshlySeen.length > 0) {
      setToasts(prev => [...prev, ...freshlySeen].slice(-MAX_VISIBLE_TOASTS));
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

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const clearNotification = useCallback((id: string) => {
    clearedIds.current.add(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications(prev => {
      prev.forEach(n => clearedIds.current.add(n.id));
      return [];
    });
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications, toasts, unreadCount, markAllRead, dismissToast, clearToasts,
    clearNotification, clearAllNotifications,
  };
}
