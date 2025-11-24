import React from 'react';
import { DateFilterType } from '../../types';
import { Input } from './Input';

interface DateFilterProps {
    filter: DateFilterType;
    setFilter: (filter: DateFilterType) => void;
    customStartDate: string;
    setCustomStartDate: (date: string) => void;
    customEndDate: string;
    setCustomEndDate: (date: string) => void;
    totalSales?: number;
}

export const DateFilter: React.FC<DateFilterProps> = ({
    filter, setFilter, customStartDate, setCustomStartDate, customEndDate, setCustomEndDate, totalSales
}) => {
    const filters: { id: DateFilterType, label: string }[] = [
        { id: 'today', label: 'Today' },
        { id: 'week', label: 'This Week' },
        { id: 'month', label: 'This Month' },
        { id: 'custom', label: 'Custom' },
    ];

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                    {filters.map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setFilter(id)}
                            className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                                filter === id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                 {totalSales !== undefined && (
                    <div className="text-right">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Filtered Sales: </span>
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">₱{totalSales.toFixed(2)}</span>
                    </div>
                )}
            </div>
            {filter === 'custom' && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-md border border-slate-200 dark:border-slate-700 mt-4 fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Start Date"
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                        <Input
                            label="End Date"
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            min={customStartDate}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};