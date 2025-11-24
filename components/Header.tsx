
import React, { useState, useRef, useEffect } from 'react';
import { Printer, Smartphone, Bell, Settings, BarChart3, Trash2 } from 'lucide-react';
import { useNotifications, getNotificationIcon } from '../contexts/NotificationContext';
import { SettingsModal } from './SettingsModal';

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

export const Header: React.FC = () => {
    const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotifications();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const toggleNotifications = () => {
        setIsNotificationsOpen(prev => !prev);
        if (!isNotificationsOpen && unreadCount > 0) {
            markAllAsRead();
        }
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/70 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700/50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-4">
                            <BarChart3 className="w-8 h-8 text-blue-500" />
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Business Manager</h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400">POS & Rental System</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                             <div className="relative" ref={notificationsRef}>
                                <button onClick={toggleNotifications} className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition">
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 flex h-4 w-4">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[9px] items-center justify-center">{unreadCount}</span>
                                        </span>
                                    )}
                                </button>
                                {isNotificationsOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl z-50 fade-in">
                                        <div className="flex justify-between items-center p-3 border-b border-slate-200 dark:border-slate-700">
                                            <h4 className="font-semibold">Notifications</h4>
                                            {notifications.length > 0 && <button onClick={clearNotifications} className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1"><Trash2 size={12}/> Clear All</button>}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                notifications.map(n => (
                                                    <div key={n.id} className={`flex items-start p-3 border-b border-slate-200 dark:border-slate-700/50 ${!n.read ? 'bg-blue-500/5' : ''}`}>
                                                        {getNotificationIcon(n)}
                                                        <div className="flex-1">
                                                            <p className="text-sm text-slate-800 dark:text-slate-200">{n.message}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{timeAgo(new Date(n.timestamp))}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-center text-slate-500 dark:text-slate-400 py-12">No new notifications.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition">
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
    );
};
