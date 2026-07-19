import { useState, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'sale' | 'lead' | 'repair' | 'payment' | 'alert';
  title: string;
  message: string;
  amount?: number;
  time: Date;
  read: boolean;
}

let notifCounter = 0;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Notification[]>([]);

  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const newNotif: Notification = {
      ...notif,
      id: `notif-${++notifCounter}-${Date.now()}`,
      time: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
    setToasts(prev => [...prev, newNotif]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newNotif.id));
    }, 4500);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, toasts, unreadCount, addNotification, markAllRead, dismissToast };
}
