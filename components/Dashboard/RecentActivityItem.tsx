import React from 'react';
import { CombinedTransaction } from '../../types';

interface RecentActivityItemProps {
    item: CombinedTransaction;
}

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
};

export const RecentActivityItem: React.FC<RecentActivityItemProps> = ({ item }) => {
    const { Icon, iconColor, description, value, timestamp } = item;
    const activityDate = new Date(timestamp);
    
    return (
        <div className="flex items-center gap-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/50">
            <div className={`p-2 rounded-full bg-white dark:bg-slate-700`}>
                <Icon size={18} className={iconColor} />
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{description}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{timeAgo(activityDate)} ago</p>
            </div>
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                {value}
            </div>
        </div>
    );
};
