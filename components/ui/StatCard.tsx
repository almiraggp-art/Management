import React from 'react';

export const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode, description?: string }> = ({ title, value, icon, description }) => (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-4">
        <div className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600/50">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
            {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{description}</p>}
        </div>
    </div>
);
