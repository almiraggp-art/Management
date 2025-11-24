
import React, { createContext, useState, useCallback, useContext, ReactNode, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Notification, NotificationType, NotificationEvent } from '../types';
import { Printer, Smartphone, PackagePlus, Trash2, CheckCircle, UserPlus, DollarSign, Gift, SlidersHorizontal } from 'lucide-react';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (message: string, type: NotificationType, event: NotificationEvent) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

const MAX_NOTIFICATIONS = 30;

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('bms-notifications', []);

  const addNotification = useCallback((message: string, type: NotificationType, event: NotificationEvent) => {
    const newNotification: Notification = {
      id: Date.now(),
      message,
      type,
      event,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, MAX_NOTIFICATIONS - 1)]);
  }, [setNotifications]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [setNotifications]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, [setNotifications]);
  
  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllAsRead, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const getNotificationIcon = (notification: Notification) => {
    const iconProps = { size: 18 };
    const baseClasses = `p-2 rounded-full mr-3`;
    
    let IconComponent;
    let colorClasses;

    switch (notification.event) {
        case 'add_product':
            IconComponent = PackagePlus;
            colorClasses = 'bg-blue-100 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400';
            break;
        case 'delete_product':
            IconComponent = Trash2;
            colorClasses = 'bg-red-100 dark:bg-red-500/10 text-red-500 dark:text-red-400';
            break;
        case 'sale':
            IconComponent = CheckCircle;
            colorClasses = 'bg-green-100 dark:bg-green-500/10 text-green-500 dark:text-green-400';
            break;
        case 'add_customer':
            IconComponent = UserPlus;
            colorClasses = 'bg-sky-100 dark:bg-sky-500/10 text-sky-500 dark:text-sky-400';
            break;
        case 'add_spent':
            IconComponent = DollarSign;
            colorClasses = 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400';
            break;
        case 'redeem':
            IconComponent = Gift;
            colorClasses = 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-500 dark:text-yellow-400';
            break;
        case 'adjust_points':
            IconComponent = SlidersHorizontal;
            colorClasses = 'bg-purple-100 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400';
            break;
        default:
            IconComponent = notification.type === 'printing' ? Printer : Smartphone;
            colorClasses = 'bg-slate-200 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400';
    }

    return <div className={`${baseClasses} ${colorClasses}`}><IconComponent {...iconProps} /></div>;
}