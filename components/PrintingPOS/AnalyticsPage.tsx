import React, { useState, useMemo } from 'react';
import { POSTransaction, POSSales, AnalyticsPeriod, ChartDataPoint } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { DollarSign, Hash, BarChart2, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { StatCard } from '../ui/StatCard';
import { useToast } from '../../contexts/ToastContext';

interface AnalyticsPageProps {
    transactions: POSTransaction[];
    setTransactions: React.Dispatch<React.SetStateAction<POSTransaction[]>>;
    setSales: React.Dispatch<React.SetStateAction<POSSales>>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    const { theme } = useTheme();
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-700 p-3 rounded-md border border-slate-200 dark:border-slate-600">
          <p className="label text-sm text-slate-600 dark:text-slate-300">{`${label}`}</p>
          <p className="intro text-slate-900 dark:text-white font-semibold">{`Sales: ₱${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
};

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ transactions, setTransactions, setSales }) => {
    const [period, setPeriod] = useState<AnalyticsPeriod>('week');
    const { theme } = useTheme();
    const { addToast } = useToast();

    const handleClearSales = () => {
        if (window.confirm('Are you sure you want to clear all sales data? This will delete all transaction history and reset revenue stats. This action cannot be undone.')) {
            setTransactions([]);
            setSales({ daily: 0, total: 0 });
            addToast('All sales data has been cleared.', 'success');
        }
    };

    const { totalRevenue, totalTransactions, avgSaleValue, chartData } = useMemo(() => {
        const totalRev = transactions.reduce((sum, t) => sum + t.total, 0);
        const totalTrans = transactions.length;
        const avgSale = totalTrans > 0 ? totalRev / totalTrans : 0;

        let data: ChartDataPoint[] = [];
        const now = new Date();

        switch (period) {
            case 'week': {
                const last7Days: ChartDataPoint[] = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(now.getDate() - i);
                    d.setHours(0, 0, 0, 0);
                    last7Days.push({ name: d.toLocaleDateString('en-US', { weekday: 'short' }), sales: 0 });
                }

                transactions.forEach(t => {
                    const tDate = new Date(t.date);
                    const diffTime = now.getTime() - tDate.getTime();
                     const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                     if(diffDays <= 6) {
                        const dayName = tDate.toLocaleDateString('en-US', { weekday: 'short' });
                        const targetDay = last7Days.find(d => d.name === dayName);
                        if(targetDay) {
                           targetDay.sales += t.total;
                        }
                    }
                });

                data = last7Days;
                break;
            }
            case 'month': {
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const monthData: ChartDataPoint[] = [];
                for (let i = 1; i <= daysInMonth; i++) {
                    monthData.push({ name: `Day ${i}`, sales: 0 });
                }

                transactions.forEach(t => {
                    const tDate = new Date(t.date);
                    if (tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()) {
                        monthData[tDate.getDate() - 1].sales += t.total;
                    }
                });
                data = monthData;
                break;
            }
            case 'year': {
                const yearData: ChartDataPoint[] = Array.from({ length: 12 }, (_, i) => ({
                    name: new Date(0, i).toLocaleString('en-US', { month: 'short' }),
                    sales: 0
                }));

                transactions.forEach(t => {
                    const tDate = new Date(t.date);
                    if (tDate.getFullYear() === now.getFullYear()) {
                        yearData[tDate.getMonth()].sales += t.total;
                    }
                });
                data = yearData;
                break;
            }
        }

        return {
            totalRevenue: totalRev,
            totalTransactions: totalTrans,
            avgSaleValue: avgSale,
            chartData: data,
        };
    }, [transactions, period]);
    
    const tickColor = theme === 'dark' ? '#9ca3af' : '#64748b';
    const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Revenue" value={`₱${totalRevenue.toFixed(2)}`} icon={<DollarSign className="text-green-500 dark:text-green-400" />} />
                <StatCard title="Total Transactions" value={totalTransactions.toString()} icon={<Hash className="text-blue-500 dark:text-blue-400" />} />
                <StatCard title="Average Sale" value={`₱${avgSaleValue.toFixed(2)}`} icon={<BarChart2 className="text-yellow-500 dark:text-yellow-400" />} />
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Sales Overview</h3>
                    <div className="flex items-center gap-2">
                        <Button variant="danger" size="sm" onClick={handleClearSales} disabled={transactions.length === 0}>
                            <Trash2 size={14} className="mr-2" />
                            Clear All Sales
                        </Button>
                        <div className="flex gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-md">
                             {(['week', 'month', 'year'] as AnalyticsPeriod[]).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-3 py-1 text-sm rounded transition capitalize ${period === p ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {chartData.every(d => d.sales === 0) ? (
                    <div className="h-[400px] flex items-center justify-center text-center text-slate-400 dark:text-slate-500">
                        <div>
                        <BarChart2 size={48} className="mx-auto mb-4" />
                        <p>No sales data available for this period.</p>
                        </div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="name" stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₱${value}`} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}/>
                            <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};