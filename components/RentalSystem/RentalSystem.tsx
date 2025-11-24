
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Customer, RentalTransaction, DeletedCustomerData, DateFilterType, Station, ParkedSession, RentalSettings, Promo } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { DateFilter } from '../ui/DateFilter';
import { StatCard } from '../ui/StatCard';
import { UserPlus, Trash2, PlusCircle, MinusCircle, Users, History, Trophy, BarChartHorizontal, Search, RotateCcw, Crown, Star, Award, Pencil, DollarSign, CalendarCheck, SlidersHorizontal, Gift, User, ChevronDown, Clock, Monitor, Play, Square, Timer as TimerIcon, AlertTriangle, BellRing, Pause, ArrowRightLeft, Minus, Plus, LogOut, PlayCircle, Check, X, ArrowRight, Split } from 'lucide-react';
import { Select } from '../ui/Select';


type RentalSystemPage = 'customers' | 'leaderboard' | 'history' | 'analytics' | 'timer';
type ModalState = {
    type: 'addPoints' | 'redeemPoints' | 'deleteCustomer' | 'addCustomer' | 'editCustomer' | 'walkInSale' | 'adjustPoints' | 'customerDetails' | 'addStationTime' | 'redeemTime' | 'reduceTime' | 'transferStation' | 'resumeSession' | 'assignNameForPark' | 'stopStation' | null;
    customerName?: string;
    stationId?: number;
};
type LeaderboardSortKey = 'points' | 'redeemed';
type HistoryFilter = 'all' | 'add' | 'redeem' | 'restore' | 'adjust';

const formatTime = (ms: number) => {
    if (ms <= 0) return "00:00:00";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const TransactionRow: React.FC<{ transaction: RentalTransaction, showDate?: boolean }> = ({ transaction: t, showDate = false }) => {
    const renderTransactionIcon = (type: RentalTransaction['type']) => {
        switch(type) {
            case 'add': return <PlusCircle size={20} className="text-green-500"/>;
            case 'redeem': return <Gift size={20} className="text-pink-500"/>;
            case 'restore': return <RotateCcw size={20} className="text-blue-500"/>;
            case 'adjust': return <SlidersHorizontal size={20} className="text-purple-500"/>;
            default: return null;
        }
    };
    const renderTransactionDetails = (t: RentalTransaction) => {
        switch(t.type) {
            case 'add': return `Purchase of ₱${t.amount?.toFixed(2)}`;
            case 'redeem': 
                if (t.amount && t.amount > 0) return `Redeemed for ₱${t.amount?.toFixed(2)} discount`;
                return `Redeemed for Time Extension`;
            case 'restore': return `Customer data restored`;
            case 'adjust': return `Manual point adjustment`;
            default: return '';
        }
    };
    const renderTransactionValue = (t: RentalTransaction) => {
        switch(t.type) {
            case 'add':
                if (t.points && t.points > 0) {
                    return <p className="font-bold text-lg text-green-500 dark:text-green-400">+{t.points.toFixed(2)} pts</p>;
                }
                return <p className="font-bold text-lg text-slate-500 dark:text-slate-400">-</p>;
            case 'redeem':
                return <p className="font-bold text-lg text-pink-500 dark:text-pink-400">-{t.points?.toFixed(2)} pts</p>;
            case 'adjust':
                return <p className="font-bold text-lg text-purple-500 dark:text-purple-400">+{t.points?.toFixed(2)} pts</p>;
            default:
                return <p className="font-bold text-lg text-slate-500 dark:text-slate-400">-</p>;
        }
    };

    return (
        <div className="flex items-center gap-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center justify-center w-8 shrink-0">
                {renderTransactionIcon(t.type)}
            </div>
            <div className="flex-grow min-w-0">
                <p className="font-bold text-slate-800 dark:text-white text-md truncate" title={t.name}>{t.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{renderTransactionDetails(t)}</p>
            </div>
            <div className="text-right shrink-0">
                 {renderTransactionValue(t)}
                 <p className="text-xs text-slate-500 dark:text-slate-400">{showDate ? new Date(t.timestamp).toLocaleString() : new Date(t.timestamp).toLocaleTimeString()}</p>
            </div>
        </div>
    );
};

interface RentalAnalyticsPageProps {
    customers: {[key: string]: Customer};
    history: RentalTransaction[];
    setCustomers: React.Dispatch<React.SetStateAction<{[key: string]: Customer}>>;
    setHistory: React.Dispatch<React.SetStateAction<RentalTransaction[]>>;
    onAddSale: () => void;
    rentalFilter: DateFilterType;
    setRentalFilter: (filter: DateFilterType) => void;
    rentalCustomStartDate: string;
    setRentalCustomStartDate: (date: string) => void;
    rentalCustomEndDate: string;
    setRentalCustomEndDate: (date: string) => void;
}

interface MonthlySales {
    [key: string]: {
        total: number;
        days: { [day: number]: number };
    };
}

const RentalAnalyticsPage: React.FC<RentalAnalyticsPageProps> = ({ 
    customers, history, setCustomers, setHistory, onAddSale,
    rentalFilter, setRentalFilter, rentalCustomStartDate, setRentalCustomStartDate, rentalCustomEndDate, setRentalCustomEndDate
}) => {
    const { addToast } = useToast();
    const [detailsMonth, setDetailsMonth] = useState<{ monthKey: string; data: MonthlySales[string] } | null>(null);

    const handleClearSales = () => {
        if (window.confirm("Are you sure you want to clear all sales data? This will delete all transaction history and reset each customer's total spent amount. Customer points will not be affected. This action cannot be undone.")) {
            setHistory([]);
            const clearedCustomers = { ...customers };
            Object.keys(clearedCustomers).forEach(name => {
                clearedCustomers[name].purchase = 0;
            });
            setCustomers(clearedCustomers);
            addToast("All sales data has been cleared.", 'success');
        }
    };

    // Combined Logic: Period Stats (from Daily Log) and Lifetime Stats (from Analytics)
    const { 
        totalCustomers, 
        totalPointsInCirculation, 
        totalRevenue,
        filteredTransactions,
        periodSales,
        periodPointsAdded,
        periodPointsRedeemed,
        periodLabel
    } = useMemo(() => {
        // Lifetime Stats
        const customerList = Object.values(customers);
        const totalCust = customerList.length;
        const totalPoints = customerList.reduce((sum: number, c) => sum + (c as Customer).points, 0);
        const addTransactions = history.filter(t => t.type === 'add');
        const totalRev = addTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

        // Period/Daily Logic
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let label = "Today's";
        switch (rentalFilter) {
            case 'week': label = "This Week's"; break;
            case 'month': label = "This Month's"; break;
            case 'custom': label = "Custom Period's"; break;
        }

        const transactions = history.filter(t => {
            const transactionDate = new Date(t.timestamp);
            switch (rentalFilter) {
                case 'today':
                    return transactionDate >= startOfToday;
                case 'week':
                    return transactionDate >= startOfWeek;
                case 'month':
                    return transactionDate >= startOfMonth;
                case 'custom': {
                    if (!rentalCustomStartDate || !rentalCustomEndDate) return false;
                    const start = new Date(rentalCustomStartDate);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(rentalCustomEndDate);
                    end.setHours(23, 59, 59, 999);
                    return transactionDate >= start && transactionDate <= end;
                }
                default:
                    return true;
            }
        });
        
        let sales = 0;
        let pointsAdded = 0;
        let pointsRedeemed = 0;

        transactions.forEach(t => {
            if (t.type === 'add') {
                sales += t.amount || 0;
                pointsAdded += t.points || 0;
            } else if (t.type === 'redeem') {
                pointsRedeemed += t.points || 0;
            }
        });

        return {
            totalCustomers: totalCust,
            totalPointsInCirculation: totalPoints,
            totalRevenue: totalRev,
            filteredTransactions: transactions,
            periodSales: sales,
            periodPointsAdded: pointsAdded,
            periodPointsRedeemed: pointsRedeemed,
            periodLabel: label,
        };
    }, [customers, history, rentalFilter, rentalCustomStartDate, rentalCustomEndDate]);

    const monthlySales = useMemo(() => {
        const salesByMonth: MonthlySales = {};
        history
            .filter(t => t.type === 'add' && t.amount)
            .forEach(t => {
                const date = new Date(t.timestamp);
                const year = date.getFullYear();
                const month = date.getMonth(); // 0-indexed
                const day = date.getDate();
                
                const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

                if (!salesByMonth[monthKey]) {
                    salesByMonth[monthKey] = { total: 0, days: {} };
                }

                salesByMonth[monthKey].total += t.amount!;
                
                if (!salesByMonth[monthKey].days[day]) {
                    salesByMonth[monthKey].days[day] = 0;
                }
                salesByMonth[monthKey].days[day] += t.amount!;
            });

        return Object.entries(salesByMonth).sort((a, b) => b[0].localeCompare(a[0]));
    }, [history]);

    return <div className="space-y-8">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-xl text-slate-900 dark:text-white">Analytics & Reports</h3>
            <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={onAddSale}>
                    <PlusCircle size={14} className="mr-2" />
                    Add Sale Record
                </Button>
                <Button variant="danger" size="sm" onClick={handleClearSales} disabled={history.length === 0}>
                    <Trash2 size={14} className="mr-2" />
                    Clear All Sales
                </Button>
            </div>
        </div>

        {/* Period / Daily Log Section */}
        <div className="space-y-4">
             <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <CalendarCheck size={20} className="text-blue-500" />
                Period Activity Log
            </h4>
            <DateFilter 
                filter={rentalFilter}
                setFilter={setRentalFilter}
                customStartDate={rentalCustomStartDate}
                setCustomStartDate={setRentalCustomStartDate}
                customEndDate={rentalCustomEndDate}
                setCustomEndDate={setRentalCustomEndDate}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={`${periodLabel} Sales`} value={`₱${periodSales.toFixed(2)}`} icon={<DollarSign className="text-green-500 dark:text-green-400"/>} />
                <StatCard title={`Points Awarded`} value={periodPointsAdded.toFixed(2)} icon={<PlusCircle className="text-yellow-500 dark:text-yellow-400"/>} />
                <StatCard title={`Points Redeemed`} value={periodPointsRedeemed.toFixed(2)} icon={<MinusCircle className="text-orange-500 dark:text-orange-400"/>} />
                <StatCard title="Transactions" value={filteredTransactions.length.toString()} icon={<History className="text-slate-500 dark:text-slate-400"/>} />
            </div>
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg max-h-[400px] overflow-y-auto">
                {filteredTransactions.length > 0 ? (
                    <div className="p-4 space-y-3">
                        {filteredTransactions.map(t => (
                            <TransactionRow key={t.timestamp} transaction={t} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <CalendarCheck size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-1">No Transactions</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">There are no transactions for the selected period.</p>
                    </div>
                )}
            </div>
        </div>
        
        {/* Lifetime Section */}
        <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <BarChartHorizontal size={20} className="text-emerald-500" />
                Lifetime Overview
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Lifetime Revenue" value={`₱${totalRevenue.toFixed(2)}`} icon={<DollarSign className="text-emerald-500 dark:text-emerald-400" />} />
                <StatCard title="Total Customers" value={totalCustomers.toString()} icon={<Users className="text-blue-500 dark:text-blue-400"/>} />
                <StatCard title="Points in Circulation" value={totalPointsInCirculation.toFixed(2)} icon={<PlusCircle className="text-yellow-500 dark:text-yellow-400"/>} />
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4">Monthly Sales Report</h3>
                {monthlySales.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {monthlySales.map(([monthKey, data]) => {
                            const monthName = new Date(monthKey + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });

                            return (
                                <button
                                    key={monthKey}
                                    onClick={() => setDetailsMonth({ monthKey, data })}
                                    className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-left transition-all hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 space-y-2"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-slate-900 dark:text-white">{monthName}</span>
                                        <div className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">
                                            <CalendarCheck size={14} />
                                            <span>{Object.keys(data.days).length} days</span>
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">₱{data.total.toFixed(2)}</p>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-[150px] flex items-center justify-center text-slate-400 dark:text-slate-500">
                        No historical sales data to generate a report.
                    </div>
                )}
            </div>
        </div>
        
        {detailsMonth && (
            <Modal
                isOpen={!!detailsMonth}
                onClose={() => setDetailsMonth(null)}
                title={`Sales Details for ${new Date(detailsMonth.monthKey + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}`}
                size="md"
            >
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                    {Object.entries(detailsMonth.data.days)
                        .sort((a,b) => Number(a[0]) - Number(b[0]))
                        .map(([day, total]) => {
                            const [year, month] = detailsMonth.monthKey.split('-');
                            return (
                                <div key={day} className="flex justify-between items-center text-sm p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                                    <span className="font-medium text-slate-800 dark:text-slate-200">
                                        {new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    <span className="font-bold text-lg text-slate-900 dark:text-white">₱{Number(total).toFixed(2)}</span>
                                </div>
                            );
                        })
                    }
                </div>
            </Modal>
        )}
    </div>;
};

// --- START Standalone Page Components ---

interface CustomerListPageProps {
    customers: { [key: string]: Customer };
    filteredCustomers: [string, Customer][];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    undoableTransaction: RentalTransaction | null;
    handleUndo: () => void;
    setModalState: React.Dispatch<React.SetStateAction<ModalState>>;
}

const CustomerListPage: React.FC<CustomerListPageProps> = ({ customers, filteredCustomers, searchQuery, setSearchQuery, undoableTransaction, handleUndo, setModalState }) => (
    <div className="space-y-4">
        <div className="flex justify-between items-center gap-4 flex-wrap">
             <div className="relative flex-grow min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                <Input
                    placeholder={`Search ${Object.keys(customers).length} customers...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>
             <div className="flex items-center gap-2">
                {undoableTransaction && undoableTransaction.type === 'add' && (
                    <Button variant="secondary" onClick={handleUndo}>
                        <RotateCcw size={16} className="mr-2"/> Undo
                    </Button>
                )}
                <Button variant="secondary" onClick={() => setModalState({type: 'walkInSale'})}>
                    Walk-in Sale
                </Button>
                <Button onClick={() => setModalState({type: 'addCustomer'})}><UserPlus size={16} className="mr-2"/> Add Customer</Button>
            </div>
        </div>
       
        <div className="flex flex-wrap gap-3">
            {filteredCustomers.length > 0 ? filteredCustomers.map(([name, data]) => (
                 <button 
                    key={name} 
                    onClick={() => setModalState({type: 'customerDetails', customerName: name})}
                    className="group flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-500 transition-all duration-200 ease-in-out hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    title={`View details for ${name}`}
                >
                    <User size={18} className="shrink-0 text-slate-500 dark:text-slate-400 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    <span className="truncate text-base">{name}</span>
                    <span className="text-sm font-mono bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full transition-transform duration-200 ease-in-out group-hover:scale-110">
                        {data.points.toFixed(2)} pts
                    </span>
                </button>
            )) : (
                 <div className="w-full text-center py-20 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                    <Users size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Customers Found</h3>
                    <p className="text-slate-500 dark:text-slate-400">{searchQuery ? 'Try adjusting your search query.' : 'Click "Add Customer" to get started.'}</p>
                 </div>
            )}
        </div>
    </div>
);

interface HistoryPageProps {
    history: RentalTransaction[];
    deletedCustomers: { [key: string]: DeletedCustomerData };
    handleRestoreCustomer: (name: string) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ history, deletedCustomers, handleRestoreCustomer }) => {
    const [filter, setFilter] = useState<HistoryFilter>('all');
    const filteredHistory = useMemo(() => history.filter(t => filter === 'all' || t.type === filter), [history, filter]);
    const deletedEntries = Object.entries(deletedCustomers);
    
    return <div className="space-y-6">
        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
             {(['all', 'add', 'redeem', 'restore', 'adjust'] as HistoryFilter[]).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-md text-sm font-semibold transition capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                    {f}
                </button>
             ))}
        </div>
         <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg max-h-[60vh] overflow-y-auto">
             {filteredHistory.length > 0 ? (
                <div className="p-4 space-y-3">
                    {filteredHistory.map(t => (
                         <TransactionRow key={t.timestamp} transaction={t} showDate />
                    ))}
                </div>
             ) : (
                <p className="text-center text-slate-500 dark:text-slate-400 p-8">No transactions found for this filter.</p>
             )}
        </div>
        {deletedEntries.length > 0 && <div className="space-y-3">
             <h3 className="font-bold text-lg">Deleted Customers</h3>
             <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-2">
                 {deletedEntries.map(([name]) => (
                    <div key={name} className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2 rounded">
                        <span className="font-semibold">{name}</span>
                        <Button variant="secondary" onClick={() => handleRestoreCustomer(name)}>
                            <RotateCcw size={14} className="mr-2"/> Restore
                        </Button>
                    </div>
                 ))}
             </div>
        </div>}
    </div>;
};

interface LeaderboardPageProps {
    customers: { [key: string]: Customer };
}

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ customers }) => {
    const [sortKey, setSortKey] = useState<LeaderboardSortKey>('points');
    
    const leaderboard = useMemo(() => {
        return Object.entries(customers)
            .map(([name, data]: [string, Customer]) => ({ name, points: data.points, redeemed: data.redeemed, purchase: data.purchase }))
            .sort((a, b) => b[sortKey] - a[sortKey]);
    }, [customers, sortKey]);

    const rankIcons = [<Crown size={20} className="text-yellow-400"/>, <Award size={20} className="text-slate-400 dark:text-slate-300"/>, <Star size={20} className="text-yellow-600"/>];

    return <div className="space-y-4">
        <div className="flex justify-end bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex gap-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-md">
                <button onClick={() => setSortKey('points')} className={`px-3 py-1 text-sm rounded transition ${sortKey === 'points' ? 'bg-blue-600 font-semibold text-white' : 'hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Current Points</button>
                <button onClick={() => setSortKey('redeemed')} className={`px-3 py-1 text-sm rounded transition ${sortKey === 'redeemed' ? 'bg-blue-600 font-semibold text-white' : 'hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Most Redeemed</button>
            </div>
        </div>
         <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
            {leaderboard.slice(0, 10).map((customer, i) => (
                <div key={customer.name} className="flex items-center gap-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                    <div className="flex items-center justify-center w-8 font-bold text-lg">
                        {i < 3 ? rankIcons[i] : <span className="text-slate-500 dark:text-slate-400">{i + 1}</span>}
                    </div>
                    <div className="flex-grow">
                        <p className="font-bold text-slate-900 dark:text-white text-md">{customer.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Current Points: {customer.points.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                         <p className="font-bold text-lg text-green-600 dark:text-green-400">{customer[sortKey].toFixed(2)}</p>
                         <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{sortKey === 'points' ? 'Current Points' : 'Points Redeemed'}</p>
                    </div>
                </div>
            ))}
            {leaderboard.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 p-8">No customer data to display.</p>}
        </div>
    </div>;
};

interface TimerPageProps {
    stations: Station[];
    customers: { [key: string]: Customer };
    parkedSessions: ParkedSession[];
    onOpenAddModal: (stationId: number) => void;
    onOpenRedeemModal: (stationId: number) => void;
    onOpenReduceModal: (stationId: number) => void;
    onOpenTransferModal: (stationId: number) => void;
    onOpenResumeModal: (stationId: number) => void;
    onStopTimer: (stationId: number) => void;
    onParkTimer: (stationId: number) => void;
    onAutoStop: (stationId: number) => void;
    onAddStation: () => void;
    onDeleteStation: (stationId: number) => void;
}

const playAlarm = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        const createBeep = (startTime: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            // Sawtooth for "Alarm" effect
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, startTime);
            osc.frequency.exponentialRampToValueAtTime(440, startTime + 0.1);
            
            gain.gain.setValueAtTime(0.1, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
            
            osc.start(startTime);
            osc.stop(startTime + 0.1);
        };

        // Play 3 rapid beeps
        const now = ctx.currentTime;
        createBeep(now);
        createBeep(now + 0.15);
        createBeep(now + 0.3);
        
        // Close the context after a second to prevent reaching the max AudioContext limit
        setTimeout(() => {
            if (ctx.state !== 'closed') {
                ctx.close();
            }
        }, 1000);
        
    } catch (e) {
        console.error("Audio playback failed", e);
    }
}

const TimerPage: React.FC<TimerPageProps> = ({ 
    stations, 
    customers, 
    parkedSessions,
    onOpenAddModal, 
    onOpenRedeemModal, 
    onOpenReduceModal,
    onOpenTransferModal,
    onOpenResumeModal,
    onStopTimer,
    onParkTimer,
    onAutoStop,
    onAddStation,
    onDeleteStation
}) => {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            const currentTime = Date.now();
            setNow(currentTime);
            
            let shouldPlayAlarm = false;

            // Audio Alert Check and Auto Stop Logic
            stations.forEach(station => {
                if (station.status === 'occupied' && station.currentSession && !station.currentSession.pausedAt) {
                    const remaining = new Date(station.currentSession.endTime).getTime() - currentTime;
                    
                    // Auto Stop when time hits zero
                    if (remaining <= 0) {
                        onAutoStop(station.id);
                        return;
                    }

                    // Trigger alarm if 5 seconds or less (and greater than 0)
                    if (remaining > 0 && remaining <= 5000) {
                        shouldPlayAlarm = true;
                    }
                }
            });
            
            if (shouldPlayAlarm) {
                playAlarm();
            }

        }, 1000);
        return () => clearInterval(interval);
    }, [stations, onAutoStop]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stations.map(station => {
                const isPaused = !!(station.status === 'occupied' && station.currentSession?.pausedAt);
                const isActive = station.status === 'occupied' && station.currentSession && !isPaused;
                
                // Calculate remaining time
                let remaining = 0;
                if (station.status === 'occupied' && station.currentSession) {
                     if (isPaused) {
                         // If paused, calculate remaining from the pause point
                         remaining = new Date(station.currentSession.endTime).getTime() - station.currentSession.pausedAt!;
                     } else {
                         remaining = new Date(station.currentSession.endTime).getTime() - now;
                     }
                }
                
                const isOverdue = remaining < 0;
                const isNearExpiry = remaining > 0 && remaining <= 300000; // 5 minutes in ms
                const hasParkedSessions = parkedSessions.length > 0;

                let borderClass = '';
                let bgClass = '';
                let headerClass = '';

                if (station.status === 'available') {
                    borderClass = 'border-slate-200 dark:border-slate-700 hover:border-green-400 dark:hover:border-green-500';
                    bgClass = 'bg-white dark:bg-slate-800';
                    headerClass = 'bg-slate-50 dark:bg-slate-700/30';
                } else {
                    // Occupied
                    if (isPaused) {
                        borderClass = 'border-slate-400 dark:border-slate-500 border-dashed';
                        bgClass = 'bg-slate-50 dark:bg-slate-800/80';
                        headerClass = 'bg-slate-200 dark:bg-slate-600';
                    } else if (isOverdue) {
                        borderClass = 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
                        bgClass = 'bg-red-50 dark:bg-red-900/10';
                        headerClass = 'bg-red-100 dark:bg-red-900/30';
                    } else if (isNearExpiry) {
                        borderClass = 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]';
                        bgClass = 'bg-orange-50 dark:bg-orange-900/10';
                        headerClass = 'bg-orange-100 dark:bg-orange-900/30';
                    } else {
                        borderClass = 'border-blue-500 shadow-md';
                        bgClass = 'bg-blue-50 dark:bg-blue-900/10';
                        headerClass = 'bg-blue-100 dark:bg-blue-900/30';
                    }
                }

                return (
                    <div key={station.id} className={`rounded-xl border-2 flex flex-col overflow-hidden transition-all duration-300 ${borderClass} ${bgClass} relative group`}>
                        <div className={`p-3 flex justify-between items-center transition-colors ${headerClass}`}>
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 whitespace-nowrap">
                                    <Monitor size={16} />
                                    <span className="truncate">{station.name}</span>
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                                {isPaused && <Pause size={16} className="text-slate-500" />}
                                {!isPaused && isNearExpiry && <AlertTriangle size={16} className="text-orange-500 animate-bounce" />}
                                {isActive && remaining <= 5000 && remaining > 0 && <BellRing size={16} className="text-orange-600 animate-ping" />}
                                
                                <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-800 ${station.status === 'occupied' ? (isPaused ? 'bg-slate-500' : (isOverdue ? 'bg-red-500 animate-pulse' : (isNearExpiry ? 'bg-orange-500 animate-pulse' : 'bg-blue-500 animate-pulse'))) : 'bg-green-500'}`} />
                                
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteStation(station.id); }}
                                    className="text-slate-400 hover:text-red-500 transition p-0.5 rounded-full"
                                    title="Delete Station"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-4 flex-grow flex flex-col items-center justify-center text-center space-y-2">
                            {station.status === 'occupied' ? (
                                <>
                                    <div className={`text-3xl font-mono font-bold tracking-wider ${isPaused ? 'text-slate-500' : (isOverdue ? 'text-red-500' : (isNearExpiry ? 'text-orange-500' : 'text-slate-900 dark:text-white'))}`}>
                                        {isOverdue ? `-${formatTime(Math.abs(remaining))}` : formatTime(remaining)}
                                    </div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate w-full px-2">
                                        {station.currentSession?.customerName}
                                    </p>
                                    {isPaused ? (
                                        <p className="text-xs font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">PAUSED</p>
                                    ) : (
                                        <p className="text-xs text-slate-400 dark:text-slate-500">
                                            Ends: {new Date(station.currentSession!.endTime).toLocaleTimeString()}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="text-3xl font-mono font-bold text-slate-300 dark:text-slate-600">
                                        --:--:--
                                    </div>
                                    {hasParkedSessions ? (
                                        <button 
                                            onClick={() => onOpenResumeModal(station.id)}
                                            className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            <PlayCircle size={14} /> Resume Session
                                        </button>
                                    ) : (
                                        <p className="text-sm font-medium text-green-600 dark:text-green-500">
                                            Available
                                        </p>
                                    )}
                                </>
                            )}
                        </div>

                        <div className={`grid grid-cols-3 divide-x divide-y divide-slate-200 dark:divide-slate-700 border-t border-slate-200 dark:border-slate-700`}>
                            {/* Row 1 */}
                            <button 
                                onClick={() => onOpenAddModal(station.id)}
                                className="p-2 flex flex-col items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition active:bg-slate-100 h-14"
                                title={station.status === 'occupied' ? "Add Time" : "Start Session"}
                            >
                                {station.status === 'occupied' ? <PlusCircle size={16} className="text-blue-500"/> : <Play size={16} className="text-green-500"/>}
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{station.status === 'occupied' ? 'Add' : 'Start'}</span>
                            </button>

                            <button 
                                onClick={() => onOpenRedeemModal(station.id)}
                                className="p-2 flex flex-col items-center justify-center gap-1 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition active:bg-purple-100 h-14"
                                title="Redeem Points for Time"
                            >
                                <Gift size={16} className="text-purple-500"/>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Redeem</span>
                            </button>
                             
                             <button 
                                onClick={() => onStopTimer(station.id)}
                                disabled={station.status !== 'occupied'}
                                className="p-2 flex flex-col items-center justify-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed active:bg-red-100 h-14"
                                title="Stop Timer"
                            >
                                <Square size={16} className="text-red-500 fill-current"/>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Stop</span>
                            </button>

                            {/* Row 2 */}
                            <button 
                                onClick={() => onParkTimer(station.id)}
                                disabled={station.status !== 'occupied'}
                                className="p-2 flex flex-col items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition disabled:opacity-50 disabled:cursor-not-allowed active:bg-slate-100 h-14 border-t border-slate-200 dark:border-slate-700"
                                title="Pause and Park Session"
                            >
                                <Pause size={16} className="text-indigo-500"/>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Park</span>
                            </button>

                            <button 
                                onClick={() => onOpenReduceModal(station.id)}
                                disabled={station.status !== 'occupied'}
                                className="p-2 flex flex-col items-center justify-center gap-1 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed active:bg-orange-100 h-14 border-t border-slate-200 dark:border-slate-700"
                                title="Reduce Time"
                            >
                                <Minus size={16} className="text-orange-500"/>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Reduce</span>
                            </button>
                            
                             <button 
                                onClick={() => onOpenTransferModal(station.id)}
                                disabled={station.status !== 'occupied'}
                                className="p-2 flex flex-col items-center justify-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-100 h-14 border-t border-slate-200 dark:border-slate-700"
                                title="Transfer to another station"
                            >
                                <ArrowRightLeft size={16} className="text-blue-500"/>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Transfer</span>
                            </button>

                        </div>
                    </div>
                );
            })}
            
            {/* Plus Card for Adding Station */}
            <button 
                onClick={onAddStation}
                className="group min-h-[250px] bg-transparent rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
                title="Add New Station"
            >
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 flex items-center justify-center mb-3 transition-colors">
                    <Plus size={32} className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors" />
                </div>
                <p className="font-semibold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">Add Station</p>
            </button>
        </div>
    );
};

// --- END Standalone Page Components ---

export const RentalSystem: React.FC = () => {
    const [customers, setCustomers] = useLocalStorage<{[key: string]: Customer}>('rental-customers', {});
    const [history, setHistory] = useLocalStorage<RentalTransaction[]>('rental-history', []);
    const [deletedCustomers, setDeletedCustomers] = useLocalStorage<{[key: string]: DeletedCustomerData}>('deleted-customers', {});
    const [stations, setStations] = useLocalStorage<Station[]>('rental-stations', Array.from({length: 12}, (_, i) => ({
        id: i + 1,
        name: `Station ${i + 1}`,
        status: 'available'
    })));
    const [parkedSessions, setParkedSessions] = useLocalStorage<ParkedSession[]>('parked-sessions', []);
    
    // Settings for Rental Rates
    const [settings] = useLocalStorage<RentalSettings>('rental-settings', {
        minutesPerPeso: 6,
        pointsPerPeso: 0.05,
        minutesPerPoint: 6,
        promos: [
            { id: '1', name: '30 Mins', price: 5, minutes: 30 },
            { id: '2', name: '1 Hour', price: 10, minutes: 60 },
        ]
    });

    const [activePage, setActivePage] = useState<RentalSystemPage>('timer');
    const [modalState, setModalState] = useState<ModalState>({ type: null });
    const [isAddSaleModalOpen, setIsAddSaleModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [undoableTransaction, setUndoableTransaction] = useState<RentalTransaction | null>(null);

    const [rentalFilter, setRentalFilter] = useState<DateFilterType>('today');
    const [rentalCustomStartDate, setRentalCustomStartDate] = useState('');
    const [rentalCustomEndDate, setRentalCustomEndDate] = useState('');

    const { addToast } = useToast();
    const { addNotification } = useNotifications();

    const PESOS_PER_POINT = 20; // Keeping this for discount redemption if needed, or could be configurable too

    // --- Core Logic Handlers ---
    const handleAddCustomer = (name: string) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            addToast('Customer name cannot be empty.', 'error');
            return;
        }
        if (customers[trimmedName]) {
            addToast('A customer with this name already exists.', 'error');
            return;
        }
        setCustomers({ ...customers, [trimmedName]: { purchase: 0, points: 0, redeemed: 0 } });
        setUndoableTransaction(null);
        addToast(`Customer "${trimmedName}" added successfully.`, 'success');
        addNotification(`New customer added: ${trimmedName}`, 'rental', 'add_customer');
        setModalState({ type: null });
    };

    const handleAddPoints = (name: string, amount: number) => {
        if (amount <= 0) {
            addToast('Purchase amount must be greater than zero.', 'error');
            return;
        }
        const pointsToAdd = amount * settings.pointsPerPeso;
        
        const updatedCustomer = {
            ...customers[name],
            purchase: customers[name].purchase + amount,
            points: customers[name].points + pointsToAdd,
        };
        const newTransaction: RentalTransaction = { type: 'add', name, amount, points: pointsToAdd, timestamp: new Date().toISOString() };
        
        setCustomers({ ...customers, [name]: updatedCustomer });
        setHistory([newTransaction, ...history]);
        setUndoableTransaction(newTransaction);
        
        addToast(`${pointsToAdd.toFixed(2)} points added to ${name}.`, 'success');
        addNotification(`${name} spent ₱${amount.toFixed(2)}`, 'rental', 'add_spent');
        setModalState({ type: null });
    };

    const handleAdjustPoints = (name: string, points: number) => {
        if (points <= 0) {
            addToast('Points to add must be greater than zero.', 'error');
            return;
        }
        
        const updatedCustomer = {
            ...customers[name],
            points: customers[name].points + points,
        };
        const newTransaction: RentalTransaction = { type: 'adjust', name, points, timestamp: new Date().toISOString() };
        
        setCustomers({ ...customers, [name]: updatedCustomer });
        setHistory([newTransaction, ...history]);
        setUndoableTransaction(null);
        
        addToast(`${points.toFixed(2)} points manually added to ${name}.`, 'success');
        addNotification(`${points.toFixed(2)} points adjusted for ${name}`, 'rental', 'adjust_points');
        setModalState({ type: null });
    };

    const handleRedeemPoints = (name: string, points: number) => {
        if (points <= 0) {
            addToast('Points to redeem must be greater than zero.', 'error');
            return;
        }
        if (points > customers[name].points) {
            addToast('Not enough points to redeem.', 'error');
            return;
        }
        
        const discountAmount = points * PESOS_PER_POINT;

        const updatedCustomer = {
            ...customers[name],
            points: customers[name].points - points,
            redeemed: customers[name].redeemed + points,
            purchase: Math.max(0, customers[name].purchase - discountAmount),
        };
        setCustomers({ ...customers, [name]: updatedCustomer });
        setHistory([{ type: 'redeem', name, points, amount: discountAmount, timestamp: new Date().toISOString() }, ...history]);
        setUndoableTransaction(null);
        addToast(`${points} points redeemed by ${name} for a ₱${discountAmount.toFixed(2)} discount.`, 'success');
        addNotification(`${name} redeemed ${points.toFixed(2)} points`, 'rental', 'redeem');
        setModalState({ type: null });
    };

    const handleDeleteCustomer = (name: string) => {
        const customerData = customers[name];
        const customerHistory = history.filter(t => t.name === name);
        const remainingHistory = history.filter(t => t.name !== name);
        const { [name]: _, ...remainingCustomers } = customers;
        
        setDeletedCustomers({ ...deletedCustomers, [name]: { data: customerData, history: customerHistory } });
        setCustomers(remainingCustomers);
        setHistory(remainingHistory);
        setUndoableTransaction(null);
        addToast(`Customer "${name}" has been deleted.`, 'info');
        setModalState({ type: null });
    };

    const handleRestoreCustomer = (name: string) => {
        if(customers[name]) {
            addToast(`Cannot restore: a customer named "${name}" already exists.`, 'error');
            return;
        }
        const { data, history: customerHistory } = deletedCustomers[name];
        const { [name]: _, ...remainingDeleted } = deletedCustomers;
        
        setCustomers({ ...customers, [name]: data });
        setHistory([...customerHistory, ...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setDeletedCustomers(remainingDeleted);
        addToast(`Customer "${name}" restored.`, 'success');
    };

    const handleEditCustomerName = (oldName: string, newName: string) => {
        const trimmedNewName = newName.trim();
        if (!trimmedNewName) {
            addToast("New name cannot be empty.", 'error');
            return;
        }
        if (trimmedNewName === oldName) {
            setModalState({ type: null });
            return;
        }
        if (customers[trimmedNewName]) {
            addToast(`A customer named "${trimmedNewName}" already exists.`, 'error');
            return;
        }
    
        const { [oldName]: customerData, ...remainingCustomers } = customers;
        const updatedCustomers = { ...remainingCustomers, [trimmedNewName]: customerData };
        setCustomers(updatedCustomers);
    
        const updatedHistory = history.map(t => t.name === oldName ? { ...t, name: trimmedNewName } : t);
        setHistory(updatedHistory);
        
        addToast(`Customer "${oldName}" renamed to "${trimmedNewName}".`, 'success');
        setModalState({ type: null });
    };

    const handleUndo = () => {
        if (!undoableTransaction || undoableTransaction.type !== 'add') return;

        const { name, amount, points } = undoableTransaction;
        
        if (customers[name]) { // It's a registered customer
            const customerToRevert: Customer = customers[name];
            if (amount === undefined || points === undefined) return;

            const revertedCustomer: Customer = {
                ...customerToRevert,
                purchase: customerToRevert.purchase - amount,
                points: customerToRevert.points - points,
            };

            setCustomers({ ...customers, [name]: revertedCustomer });
        }
        
        const newHistory = history.filter(t => t.timestamp !== undoableTransaction.timestamp);
        setHistory(newHistory);

        setUndoableTransaction(null);
        addToast(`Last transaction for ${name} was undone.`, 'info');
    };

    const handleWalkInSale = (amount: number) => {
        if (amount <= 0) {
            addToast('Purchase amount must be greater than zero.', 'error');
            return;
        }
        // Walk-in customers do not earn points, only their sales are recorded.
        const newTransaction: RentalTransaction = { type: 'add', name: 'Walk-in Customer', amount, points: 0, timestamp: new Date().toISOString() };

        setHistory([newTransaction, ...history]);
        setUndoableTransaction(newTransaction);
        addToast(`Walk-in sale of ₱${amount.toFixed(2)} recorded.`, 'success');
        addNotification(`Walk-in sale: ₱${amount.toFixed(2)}`, 'rental', 'add_spent');
        setModalState({ type: null });
    };

    const handleAddHistoricalSale = (date: string, amount: number) => {
        if (!date || amount <= 0) {
            addToast('Please provide a valid date and amount.', 'error');
            return;
        }
        const timestamp = new Date(`${date}T12:00:00`).toISOString();

        const newTransaction: RentalTransaction = {
            type: 'add',
            name: 'Manual Sale Entry',
            amount,
            points: 0, // No points for historical entries
            timestamp,
        };

        const updatedHistory = [...history, newTransaction].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setHistory(updatedHistory);
        addToast(`Sale of ₱${amount.toFixed(2)} added for ${new Date(date).toLocaleDateString()}.`, 'success');
        addNotification(`Manual sale added: ₱${amount.toFixed(2)}`, 'rental', 'add_spent');
        setIsAddSaleModalOpen(false);
    };

    // --- Station & Timer Handlers ---

    const handleAddStation = () => {
        const newId = stations.length > 0 ? Math.max(...stations.map(s => s.id)) + 1 : 1;
        const newStation: Station = {
            id: newId,
            name: `Station ${newId}`,
            status: 'available'
        };
        setStations([...stations, newStation]);
        addToast(`Station ${newId} added`, 'success');
    };

    const handleDeleteStation = (stationId: number) => {
        const station = stations.find(s => s.id === stationId);
        if (!station) return;
        
        if (station.status === 'occupied') {
            if(!window.confirm(`Station ${station.name} is currently occupied. Deleting it will stop the current timer. Are you sure?`)) {
                return;
            }
        } else {
            if(!window.confirm(`Are you sure you want to delete ${station.name}?`)) {
                return;
            }
        }
        
        setStations(stations.filter(s => s.id !== stationId));
        addToast(`${station.name} deleted`, 'info');
    };

    const handleAddStationTime = (stationId: number, amount: number, minutesToAdd: number, customerName: string) => {
        const durationMs = minutesToAdd * 60 * 1000;
        
        setStations(prev => prev.map(s => {
            if (s.id !== stationId) return s;

            const now = Date.now();
            let newEndTime = now + durationMs;

            if (s.status === 'occupied' && s.currentSession) {
                const currentEnd = new Date(s.currentSession.endTime).getTime();
                // Extend time from either the current end time or now (if overdue)
                newEndTime = Math.max(now, currentEnd) + durationMs;

                return {
                    ...s,
                    currentSession: {
                        ...s.currentSession,
                        endTime: new Date(newEndTime).toISOString(),
                        amountPaid: s.currentSession.amountPaid + amount,
                        // If it was paused, extending time doesn't necessarily unpause it, but let's keep it paused
                        pausedAt: s.currentSession.pausedAt
                    }
                };
            } else {
                return {
                    ...s,
                    status: 'occupied',
                    currentSession: {
                        customerName: customerName || 'Walk-in',
                        startTime: new Date().toISOString(),
                        endTime: new Date(newEndTime).toISOString(),
                        amountPaid: amount
                    }
                };
            }
        }));

        // Log Transaction
        if (customerName && customerName !== 'Walk-in' && customers[customerName]) {
            handleAddPoints(customerName, amount);
        } else {
            handleWalkInSale(amount);
        }
        
        setModalState({ type: null });
        addToast(`Time added to Station ${stationId}`, 'success');
    };

    const handleRedeemTime = (stationId: number, points: number, payerName: string) => {
        const station = stations.find(s => s.id === stationId);
        if (!station) return;
        
        if (!payerName || !customers[payerName]) {
            addToast('Invalid customer selected for point redemption.', 'error');
            return;
        }

        if (points <= 0) {
            addToast('Points to redeem must be greater than zero.', 'error');
            return;
        }
        if (points > customers[payerName].points) {
            addToast('Not enough points to redeem.', 'error');
            return;
        }

        const durationMs = points * settings.minutesPerPoint * 60 * 1000; 
        
        setStations(prev => prev.map(s => {
            if (s.id !== stationId) return s;
            
            const now = Date.now();
            
            if (s.status === 'occupied' && s.currentSession) {
                const currentEnd = new Date(s.currentSession.endTime).getTime();
                const newEndTime = Math.max(now, currentEnd) + durationMs;
                return {
                    ...s,
                    currentSession: {
                        ...s.currentSession,
                        endTime: new Date(newEndTime).toISOString(),
                    }
                };
            } else {
                 // Start new session, Payer is the occupant
                 const newEndTime = now + durationMs;
                 return {
                     ...s,
                     status: 'occupied',
                     currentSession: {
                         customerName: payerName,
                         startTime: new Date().toISOString(),
                         endTime: new Date(newEndTime).toISOString(),
                         amountPaid: 0 // Redemption means no cash paid
                     }
                 };
            }
        }));

        const updatedCustomer = {
            ...customers[payerName],
            points: customers[payerName].points - points,
            redeemed: customers[payerName].redeemed + points,
        };
        setCustomers({ ...customers, [payerName]: updatedCustomer });
        
        // Log transaction with amount 0 but record points
        setHistory([{ type: 'redeem', name: payerName, points, amount: 0, timestamp: new Date().toISOString() }, ...history]);
        setUndoableTransaction(null);

        addToast(`${payerName} redeemed ${points} points. Added ${(durationMs / 60000).toFixed(0)} mins to Station ${stationId}.`, 'success');
        addNotification(`${payerName} redeemed ${points.toFixed(2)} pts for time`, 'rental', 'redeem');
        setModalState({ type: null });
    };

    const handleStopStation = (stationId: number) => {
        setModalState({ type: 'stopStation', stationId });
    };

    const confirmStopStation = () => {
        const stationId = modalState.stationId;
        if (!stationId) return;

        setStations(prev => prev.map(s => {
            if (s.id !== stationId) return s;
            return { ...s, status: 'available', currentSession: undefined };
        }));

        addToast(`Station ${stationId} stopped`, 'info');
        setModalState({ type: null });
    };
    
    const handleAutoStop = (stationId: number) => {
        setStations(prev => prev.map(s => {
            if (s.id !== stationId) return s;
            return { ...s, status: 'available', currentSession: undefined };
        }));
    };

    const handleParkSession = (stationId: number, customName?: string) => {
        const station = stations.find(s => s.id === stationId);
        if (!station || !station.currentSession) return;

        const currentSession = station.currentSession;
        let remainingTime = 0;
        const now = Date.now();

        if (currentSession.pausedAt) {
            // Already paused? Use calculated diff
            remainingTime = new Date(currentSession.endTime).getTime() - currentSession.pausedAt;
        } else {
            remainingTime = new Date(currentSession.endTime).getTime() - now;
        }

        if (remainingTime <= 0) {
            addToast('Time already expired, stopping instead of parking.', 'info');
            handleStopStation(stationId);
            return;
        }

        const parkedSession: ParkedSession = {
            id: Date.now().toString(),
            customerName: customName || currentSession.customerName,
            remainingTime,
            amountPaid: currentSession.amountPaid,
            originalStationName: station.name,
            parkedAt: new Date().toISOString()
        };

        setParkedSessions([parkedSession, ...parkedSessions]);

        // Clear station
        setStations(prev => prev.map(s => {
            if (s.id !== stationId) return s;
            return { ...s, status: 'available', currentSession: undefined };
        }));

        setModalState({ type: null });
        addToast(`Session for ${parkedSession.customerName} parked.`, 'info');
    };

    const handleInitiatePark = (stationId: number) => {
        const station = stations.find(s => s.id === stationId);
        if (station?.currentSession?.customerName === 'Walk-in' || station?.currentSession?.customerName === 'Walk-in Customer') {
            setModalState({ type: 'assignNameForPark', stationId });
        } else {
            handleParkSession(stationId);
        }
    };

    const handleResumeSession = (stationId: number, parkedSessionId: string) => {
        const sessionToResume = parkedSessions.find(s => s.id === parkedSessionId);
        if (!sessionToResume) return;

        const now = Date.now();
        const newEndTime = new Date(now + sessionToResume.remainingTime).toISOString();

        setStations(prev => prev.map(s => {
            if (s.id !== stationId) return s;
            return {
                ...s,
                status: 'occupied',
                currentSession: {
                    customerName: sessionToResume.customerName,
                    startTime: new Date().toISOString(), // New start time
                    endTime: newEndTime,
                    amountPaid: sessionToResume.amountPaid
                }
            };
        }));
        
        setParkedSessions(prev => prev.filter(s => s.id !== parkedSessionId));
        setModalState({ type: null });
        addToast(`Resumed session for ${sessionToResume.customerName} on Station ${stationId}`, 'success');
    };

    const handleReduceTime = (stationId: number, minutes: number) => {
        const durationMs = minutes * 60 * 1000;
        setStations(prev => prev.map(s => {
            if (s.id !== stationId || !s.currentSession) return s;
            
            const currentEndTime = new Date(s.currentSession.endTime).getTime();
            const newEndTime = new Date(currentEndTime - durationMs).toISOString();
            
            return {
                ...s,
                currentSession: { ...s.currentSession, endTime: newEndTime }
            };
        }));
        setModalState({ type: null });
        addToast(`Reduced ${minutes} minutes from Station ${stationId}`, 'info');
    };

    const handleTransferStation = (fromId: number, toId: number, minutesToTransfer?: number) => {
        setStations(prev => {
            const fromStation = prev.find(s => s.id === fromId);
            const toStation = prev.find(s => s.id === toId);

            if (!fromStation || !fromStation.currentSession || !toStation) return prev;

            const now = Date.now();
            let fromRemaining = 0;
            if (fromStation.currentSession.pausedAt) {
                fromRemaining = new Date(fromStation.currentSession.endTime).getTime() - fromStation.currentSession.pausedAt;
            } else {
                fromRemaining = new Date(fromStation.currentSession.endTime).getTime() - now;
            }

            if (fromRemaining <= 0) return prev;

            const isPartial = minutesToTransfer !== undefined;
            const transferMs = isPartial ? minutesToTransfer * 60 * 1000 : fromRemaining;

            // Validate partial amount
            if (isPartial && transferMs > fromRemaining) return prev;
            
            return prev.map(s => {
                // HANDLE SOURCE
                if (s.id === fromId) {
                    if (isPartial) {
                         // Reduce time on source
                         const oldEnd = new Date(s.currentSession!.endTime).getTime();
                         const newEnd = new Date(oldEnd - transferMs).toISOString();
                         return {
                             ...s,
                             currentSession: { ...s.currentSession!, endTime: newEnd }
                         };
                    } else {
                         // Move All -> Clear source
                         return { ...s, status: 'available', currentSession: undefined };
                    }
                }
                
                // HANDLE TARGET
                if (s.id === toId) {
                    if (s.status === 'occupied' && s.currentSession) {
                        // Merge with existing session (Transfer Time to Customer)
                        const currentEnd = new Date(s.currentSession.endTime).getTime();
                        // If target is expired, we base added time from Now, otherwise from end
                        const baseTime = Math.max(now, currentEnd);
                        const newEndTime = new Date(baseTime + transferMs).toISOString();
                        
                        return {
                            ...s,
                            currentSession: {
                                ...s.currentSession,
                                endTime: newEndTime,
                                amountPaid: s.currentSession.amountPaid + (isPartial ? 0 : (fromStation.currentSession?.amountPaid || 0))
                            }
                        };
                    } else {
                        // Move to Available Station
                        const newEndTime = new Date(now + transferMs).toISOString();

                        if (isPartial) {
                             // Partial -> New Session (Split)
                             return {
                                ...s,
                                status: 'occupied',
                                currentSession: {
                                    customerName: fromStation.currentSession!.customerName + ' (Split)',
                                    startTime: new Date().toISOString(),
                                    endTime: newEndTime,
                                    amountPaid: 0 // Sales record stays with source
                                }
                            };
                        } else {
                            // Move All
                            return { 
                                ...s, 
                                status: 'occupied', 
                                currentSession: {
                                    ...fromStation.currentSession!,
                                    startTime: new Date().toISOString(), // Reset start for this station
                                    endTime: newEndTime,
                                    pausedAt: undefined // Unpause if it was paused
                                }
                            };
                        }
                    }
                }
                return s;
            });
        });
        
        const toStation = stations.find(s => s.id === toId);
        const minutes = minutesToTransfer ? `${minutesToTransfer} mins` : 'session';
        if (toStation?.status === 'occupied') {
             addToast(`Transferred ${minutes} from Station ${fromId} to ${toStation.currentSession?.customerName} (Station ${toId})`, 'success');
        } else {
             addToast(`Moved ${minutes} from Station ${fromId} to Station ${toId}`, 'success');
        }
        setModalState({ type: null });
    };


    // --- Memoized data for rendering ---
    const filteredCustomers = useMemo(() => {
        return Object.entries(customers)
            .filter(([name]) => name.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => a[0].localeCompare(b[0]));
    }, [customers, searchQuery]);

    const customerForModal = useMemo(() => {
        if (!modalState.customerName) return null;
        return { name: modalState.customerName, ...customers[modalState.customerName] };
    }, [modalState.customerName, customers]);


    // --- Page Switching ---
    const PageContent = useMemo(() => {
        const defaultPage = <CustomerListPage 
            customers={customers}
            filteredCustomers={filteredCustomers}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            undoableTransaction={undoableTransaction}
            handleUndo={handleUndo}
            setModalState={setModalState}
        />;
        switch (activePage) {
            case 'timer': return <TimerPage 
                stations={stations}
                customers={customers}
                parkedSessions={parkedSessions}
                onOpenAddModal={(stationId) => setModalState({ type: 'addStationTime', stationId })}
                onOpenRedeemModal={(stationId) => setModalState({ type: 'redeemTime', stationId })}
                onOpenReduceModal={(stationId) => setModalState({ type: 'reduceTime', stationId })}
                onOpenTransferModal={(stationId) => setModalState({ type: 'transferStation', stationId })}
                onOpenResumeModal={(stationId) => setModalState({ type: 'resumeSession', stationId })}
                onStopTimer={handleStopStation}
                onParkTimer={handleInitiatePark}
                onAutoStop={handleAutoStop}
                onAddStation={handleAddStation}
                onDeleteStation={handleDeleteStation}
            />;
            case 'customers': return defaultPage;
            case 'history': return <HistoryPage 
                history={history}
                deletedCustomers={deletedCustomers}
                handleRestoreCustomer={handleRestoreCustomer}
            />;
            case 'leaderboard': return <LeaderboardPage customers={customers} />;
            case 'analytics': return <RentalAnalyticsPage 
                customers={customers} 
                history={history} 
                setCustomers={setCustomers} 
                setHistory={setHistory} 
                onAddSale={() => setIsAddSaleModalOpen(true)}
                rentalFilter={rentalFilter}
                setRentalFilter={setRentalFilter}
                rentalCustomStartDate={rentalCustomStartDate}
                setRentalCustomStartDate={setRentalCustomStartDate}
                rentalCustomEndDate={rentalCustomEndDate}
                setRentalCustomEndDate={setRentalCustomEndDate}
            />;
            default: return defaultPage;
        }
    }, [activePage, customers, history, deletedCustomers, searchQuery, undoableTransaction, rentalFilter, rentalCustomStartDate, rentalCustomEndDate, filteredCustomers, stations, parkedSessions]);


    // --- Modal Components ---
    const AddSaleModal = () => {
        const [date, setDate] = useState('');
        const [amount, setAmount] = useState('');
        
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            handleAddHistoricalSale(date, Number(amount));
        };

        return (
            <Modal isOpen={isAddSaleModalOpen} onClose={() => setIsAddSaleModalOpen(false)} title="Add Historical Sale Record" size="sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Date of Sale" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                    <Input label="Total Sales for Day (₱)" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" step="0.01" min="0.01" required autoFocus/>
                    <p className="text-xs text-slate-500 dark:text-slate-400">This will add a transaction record for the selected date. This action does not award points and is intended for inputting past sales data.</p>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsAddSaleModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Record</Button>
                    </div>
                </form>
            </Modal>
        );
    };

    const CustomerDetailsModal = () => {
        if (!customerForModal) return null;
        const { name, purchase, points, redeemed } = customerForModal;
        
        const DetailStat: React.FC<{label: string, value: string, icon: React.ReactNode}> = ({label, value, icon}) => (
            <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg text-center border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                    {icon}
                    <span className="text-sm font-medium">{label}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
            </div>
        );

        return (
            <Modal isOpen={modalState.type === 'customerDetails'} onClose={() => setModalState({ type: null })} title={name} size="md">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <DetailStat label="Total Spent" value={`₱${purchase.toFixed(2)}`} icon={<DollarSign size={16} />} />
                        <DetailStat label="Current Points" value={points.toFixed(2)} icon={<Star size={16} />} />
                        <DetailStat label="Redeemed Points" value={redeemed.toFixed(2)} icon={<Gift size={16} />} />
                    </div>
                    
                    <div>
                        <h4 className="font-semibold text-center mb-3 text-slate-600 dark:text-slate-400">Actions</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <Button size="md" variant="secondary" onClick={() => setModalState({type: 'addPoints', customerName: name})}>
                                <PlusCircle size={16} className="mr-2"/> Add Spent
                            </Button>
                            <Button size="md" variant="secondary" onClick={() => setModalState({type: 'adjustPoints', customerName: name})}>
                                <SlidersHorizontal size={16} className="mr-2"/> Adjust
                            </Button>
                            <Button size="md" variant="primary" onClick={() => setModalState({type: 'redeemPoints', customerName: name})}>
                                <MinusCircle size={16} className="mr-2"/> Redeem
                            </Button>
                        </div>
                    </div>
                </div>
                 <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-slate-200 dark:border-slate-700">
                    <Button variant="ghost" className="text-sm" onClick={() => setModalState({type: 'editCustomer', customerName: name})}>
                        <Pencil size={14} className="mr-2"/> Edit Name
                    </Button>
                    <Button variant="danger" className="text-sm" onClick={() => setModalState({type: 'deleteCustomer', customerName: name})}>
                        <Trash2 size={14} className="mr-2"/> Delete Customer
                    </Button>
                </div>
            </Modal>
        );
    };

    const AddCustomerModal = () => {
        const [name, setName] = useState('');
        return <Modal isOpen={modalState.type === 'addCustomer'} onClose={() => setModalState({ type: null })} title="Add New Customer" size="sm">
            <form onSubmit={(e) => { e.preventDefault(); handleAddCustomer(name); }} className="space-y-4">
                <Input label="Customer Name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter full name" autoFocus/>
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={() => setModalState({ type: null })}>Cancel</Button>
                    <Button type="submit">Add Customer</Button>
                </div>
            </form>
        </Modal>
    };
    
    const WalkInSaleModal = () => {
        const [amount, setAmount] = useState('');
        return <Modal isOpen={modalState.type === 'walkInSale'} onClose={() => setModalState({ type: null })} title="Record Walk-in Sale" size="sm">
            <form onSubmit={(e) => { e.preventDefault(); handleWalkInSale(Number(amount)); }} className="space-y-4">
                <Input label="Purchase Amount (₱)" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" autoFocus/>
                <p className="text-center text-slate-600 dark:text-slate-300 text-sm">This transaction will be recorded without a customer profile.</p>
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={() => setModalState({ type: null })}>Cancel</Button>
                    <Button type="submit" disabled={Number(amount) <= 0}>Record Sale</Button>
                </div>
            </form>
        </Modal>
    };

    const AddStationTimeModal = () => {
        const [amount, setAmount] = useState('');
        const [mode, setMode] = useState<'walk-in' | 'registered'>('walk-in');
        const [selectedCustomer, setSelectedCustomer] = useState('Walk-in');
        const [filterName, setFilterName] = useState('');
        const [quantity, setQuantity] = useState<number>(1);
        
        // Handle mode switching logic
        useEffect(() => {
            if (mode === 'walk-in') {
                setSelectedCustomer('Walk-in');
            } else {
                setSelectedCustomer(''); // Reset when switching to registered to force selection
            }
        }, [mode]);

        // Filter customers based on search
        const filteredCustomerList = useMemo(() => {
            if (!filterName) return [];
            return Object.keys(customers)
                .filter(name => name.toLowerCase().includes(filterName.toLowerCase()))
                .sort();
        }, [customers, filterName]);

        // Amount / Time logic
        const [minutesToAddState, setMinutesToAddState] = useState<number>(0);
        
        useEffect(() => {
             if (amount) {
                 // Recalculate based on input only if not set by quick select logic which might have distinct rates
                 // For now, simpler to assume input changes always reset to base rate
                 setMinutesToAddState(Number(amount) * settings.minutesPerPeso);
             } else {
                 setMinutesToAddState(0);
             }
        }, [amount, settings.minutesPerPeso]);

        const handleQuickSelect = (promo: Promo) => {
            setAmount(promo.price.toString());
            setMinutesToAddState(promo.minutes);
        };

        const handleSelectCustomer = (name: string) => {
            setSelectedCustomer(name);
            setFilterName(''); // Optional: clear filter after selection
        };

        const totalAmount = Number(amount) * quantity;
        const totalMinutes = minutesToAddState * quantity;

        return (
            <Modal isOpen={modalState.type === 'addStationTime'} onClose={() => setModalState({ type: null })} title={`Add Time to Station ${modalState.stationId}`} size="sm">
                <form onSubmit={(e) => { e.preventDefault(); handleAddStationTime(modalState.stationId!, totalAmount, totalMinutes, selectedCustomer); }} className="space-y-6">
                    
                    {/* Customer Selection Tabs */}
                    <div className="flex rounded-md bg-slate-100 dark:bg-slate-700/50 p-1">
                        <button
                            type="button"
                            onClick={() => setMode('walk-in')}
                            className={`flex-1 py-2 text-sm font-medium rounded transition ${mode === 'walk-in' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            Walk-in
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('registered')}
                            className={`flex-1 py-2 text-sm font-medium rounded transition ${mode === 'registered' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            Registered Customer
                        </button>
                    </div>

                    {/* Customer Input Section */}
                    <div className="min-h-[80px]">
                        {mode === 'walk-in' ? (
                            <div className="flex items-center justify-center h-full p-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                <p className="text-slate-500 dark:text-slate-400 font-medium">Guest / Walk-in Customer (No Points)</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedCustomer && selectedCustomer !== 'Walk-in' ? (
                                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                                                <User size={16} className="text-blue-600 dark:text-blue-300"/>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedCustomer}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{customers[selectedCustomer]?.points.toFixed(2)} pts available</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setSelectedCustomer('')} className="text-xs text-red-500 hover:underline">Change</button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Input 
                                            placeholder="Search customer name..." 
                                            value={filterName}
                                            onChange={e => setFilterName(e.target.value)}
                                            className="pr-8"
                                            autoFocus
                                        />
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        
                                        {/* Filter Results */}
                                        {filterName && (
                                            <div className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-10">
                                                {filteredCustomerList.length > 0 ? (
                                                    filteredCustomerList.map(name => (
                                                        <button
                                                            key={name}
                                                            type="button"
                                                            onClick={() => handleSelectCustomer(name)}
                                                            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                                                        >
                                                            {name}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <p className="px-4 py-2 text-sm text-slate-500">No customers found.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Rates & Amount Section */}
                    <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                        {settings.promos.length > 0 && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Quick Select Rates</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {settings.promos.map(promo => (
                                        <button
                                            key={promo.id}
                                            type="button"
                                            onClick={() => handleQuickSelect(promo)}
                                            className="p-2 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition text-blue-700 dark:text-blue-300 flex flex-col items-center"
                                        >
                                            <span className="font-bold">{promo.name}</span>
                                            <span className="text-xs opacity-80">₱{promo.price} / {promo.minutes}m</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <Input 
                                label="Unit Price (₱)" 
                                type="number" 
                                value={amount} 
                                onChange={e => { 
                                    setAmount(e.target.value); 
                                }} 
                                placeholder="0.00" 
                            />
                            <Input 
                                label="Quantity" 
                                type="number" 
                                value={quantity} 
                                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
                                min="1"
                            />
                        </div>
                        
                        <div className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg flex justify-between items-center">
                            <div className="text-center flex-1 border-r border-slate-300 dark:border-slate-600 pr-2">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total to Pay</p>
                                <p className="text-xl font-bold text-green-600 dark:text-green-400">₱{totalAmount.toFixed(2)}</p>
                            </div>
                            <div className="text-center flex-1 pl-2">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total Time</p>
                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                    {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                                </p>
                            </div>
                        </div>
                         <p className="text-xs text-slate-500 text-center">Unit Breakdown: ₱{amount || 0} x {quantity} qty</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setModalState({ type: null })}>Cancel</Button>
                        <Button type="submit" disabled={totalAmount <= 0 && totalMinutes <= 0 || (mode === 'registered' && !selectedCustomer)}>
                            <Check size={16} className="mr-2"/> Confirm
                        </Button>
                    </div>
                </form>
            </Modal>
        );
    };

    const RedeemTimeModal = () => {
        const [points, setPoints] = useState('');
        const [filterName, setFilterName] = useState('');
        const [payerName, setPayerName] = useState('');

        const station = stations.find(s => s.id === modalState.stationId);
        const isOccupied = station?.status === 'occupied';
        const currentOccupant = station?.currentSession?.customerName;

        // On open, default Payer to the current occupant if they are a registered customer
        useEffect(() => {
            if (isOccupied && currentOccupant && customers[currentOccupant]) {
                setPayerName(currentOccupant);
            } else if (!isOccupied) {
                // If not occupied, we wait for user selection
                setPayerName('');
            }
        }, [isOccupied, currentOccupant, customers]);

        const currentPoints = payerName && customers[payerName] ? customers[payerName].points : 0;
        const timeToAdd = Number(points) * settings.minutesPerPoint;

        // Filter customers based on search
        const filteredCustomerList = useMemo(() => {
            if (!filterName) return [];
            return Object.keys(customers)
                .filter(name => name.toLowerCase().includes(filterName.toLowerCase()))
                .sort();
        }, [customers, filterName]);

        const handleSelectPayer = (name: string) => {
            setPayerName(name);
            setFilterName(''); 
        };

        const title = isOccupied ? `Redeem Points for Time Extension` : `Start Session via Redemption`;

        return (
            <Modal isOpen={modalState.type === 'redeemTime'} onClose={() => setModalState({ type: null })} title={title} size="sm">
                <form onSubmit={(e) => { e.preventDefault(); handleRedeemTime(modalState.stationId!, Number(points), payerName); }} className="space-y-4">
                    
                    {isOccupied && (
                        <div className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg flex justify-between items-center mb-4">
                             <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Adding time to active session:</p>
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Station {modalState.stationId} - {currentOccupant}</p>
                             </div>
                             <ArrowRight className="text-slate-400" size={16}/>
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                             {isOccupied ? "Redeem Points From Account" : "Select Customer Account"}
                        </label>
                        {payerName ? (
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                                        <User size={16} className="text-blue-600 dark:text-blue-300"/>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200">{payerName}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{currentPoints.toFixed(2)} pts available</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setPayerName('')} className="text-xs text-red-500 hover:underline">Change</button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Input 
                                    placeholder="Search customer to redeem from..." 
                                    value={filterName}
                                    onChange={e => setFilterName(e.target.value)}
                                    className="pr-8"
                                    autoFocus
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                
                                {filterName && (
                                    <div className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-10">
                                        {filteredCustomerList.length > 0 ? (
                                            filteredCustomerList.map(name => (
                                                <button
                                                    key={name}
                                                    type="button"
                                                    onClick={() => handleSelectPayer(name)}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                                                >
                                                    {name}
                                                </button>
                                            ))
                                        ) : (
                                            <p className="px-4 py-2 text-sm text-slate-500">No customers found.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <Input 
                        label="Points to Redeem" 
                        type="number" 
                        value={points} 
                        onChange={e => setPoints(e.target.value)} 
                        placeholder="0.00" 
                        max={currentPoints}
                        step="0.1"
                        disabled={!payerName}
                    />
                    
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg text-center border border-purple-100 dark:border-purple-800/30">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Time to Add</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {Math.floor(timeToAdd / 60)}h {Math.floor(timeToAdd % 60)}m
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Rate: 1 Point = {settings.minutesPerPoint} Minutes</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setModalState({ type: null })}>Cancel</Button>
                        <Button type="submit" disabled={!payerName || Number(points) <= 0 || Number(points) > currentPoints}>
                            {isOccupied ? "Redeem & Extend" : "Start Session"}
                        </Button>
                    </div>
                </form>
            </Modal>
        );
    };

    const ReduceTimeModal = () => {
        const [minutes, setMinutes] = useState('');
        
        return (
            <Modal isOpen={modalState.type === 'reduceTime'} onClose={() => setModalState({ type: null })} title={`Reduce Time (Station ${modalState.stationId})`} size="sm">
                <form onSubmit={(e) => { e.preventDefault(); handleReduceTime(modalState.stationId!, Number(minutes)); }} className="space-y-4">
                    <Input label="Minutes to Remove" type="number" value={minutes} onChange={e => setMinutes(e.target.value)} placeholder="0" min="1" autoFocus />
                    <p className="text-xs text-slate-500">This will subtract time from the current session end date.</p>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setModalState({ type: null })}>Cancel</Button>
                        <Button type="submit" variant="danger" disabled={Number(minutes) <= 0}>Reduce Time</Button>
                    </div>
                </form>
            </Modal>
        );
    };

    const AssignNameForParkModal = () => {
        const [name, setName] = useState('');
        
        return (
            <Modal isOpen={modalState.type === 'assignNameForPark'} onClose={() => setModalState({ type: null })} title={`Park Session (Station ${modalState.stationId})`} size="sm">
                <form onSubmit={(e) => { e.preventDefault(); handleParkSession(modalState.stationId!, name); }} className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">This station is currently occupied by a Walk-in. Please assign a name to reference this parked session later.</p>
                    <Input label="Enter Name for Reference" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe / Guy in Blue Shirt" autoFocus />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setModalState({ type: null })}>Cancel</Button>
                        <Button type="submit" disabled={!name.trim()}>Park Session</Button>
                    </div>
                </form>
            </Modal>
        );
    };

    const TransferStationModal = () => {
        const [targetStationId, setTargetStationId] = useState<string>('');
        const [transferMode, setTransferMode] = useState<'all' | 'partial'>('all');
        const [minutesToTransfer, setMinutesToTransfer] = useState('');
        
        const sourceStation = stations.find(s => s.id === modalState.stationId);
        
        // Calculate remaining minutes for validation
        const now = Date.now();
        let remainingMs = 0;
        if (sourceStation?.currentSession) {
             if (sourceStation.currentSession.pausedAt) {
                remainingMs = new Date(sourceStation.currentSession.endTime).getTime() - sourceStation.currentSession.pausedAt;
            } else {
                remainingMs = new Date(sourceStation.currentSession.endTime).getTime() - now;
            }
        }
        const remainingMinutes = Math.floor(Math.max(0, remainingMs) / 60000);

        // Filter out current station, but include both occupied and available
        const targetStations = stations
            .filter(s => s.id !== modalState.stationId)
            .map(s => {
                let label = s.name;
                if (s.status === 'occupied' && s.currentSession) {
                    label += ` (Occupied by ${s.currentSession.customerName})`;
                } else {
                    label += ` (Available)`;
                }
                return { value: s.id.toString(), label, status: s.status };
            });

        const selectedTarget = targetStations.find(s => s.value === targetStationId);
        const isMerge = selectedTarget?.status === 'occupied';

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            const minutes = transferMode === 'partial' ? Number(minutesToTransfer) : undefined;
            handleTransferStation(modalState.stationId!, Number(targetStationId), minutes);
        };

        return (
            <Modal isOpen={modalState.type === 'transferStation'} onClose={() => setModalState({ type: null })} title={`Transfer from Station ${modalState.stationId}`} size="sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded text-sm text-center border border-slate-200 dark:border-slate-600">
                        <p className="text-slate-500 dark:text-slate-400">Available to Transfer</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{remainingMinutes} mins</p>
                    </div>

                    <Select 
                        label="Transfer To"
                        value={targetStationId}
                        onChange={e => setTargetStationId(e.target.value)}
                        options={[{ value: '', label: 'Select a station' }, ...targetStations.map(s => ({ value: s.value, label: s.label }))]}
                    />

                    {targetStationId && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Transfer Mode</label>
                            <div className="flex rounded-md bg-slate-100 dark:bg-slate-700/50 p-1">
                                <button
                                    type="button"
                                    onClick={() => setTransferMode('all')}
                                    className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded transition ${transferMode === 'all' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                >
                                    Move Entire Session
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTransferMode('partial')}
                                    className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded transition ${transferMode === 'partial' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                >
                                    Transfer Time Amount
                                </button>
                            </div>
                        </div>
                    )}

                    {transferMode === 'partial' && targetStationId && (
                        <Input 
                            label="Minutes to Transfer" 
                            type="number" 
                            value={minutesToTransfer} 
                            onChange={e => setMinutesToTransfer(e.target.value)} 
                            max={remainingMinutes}
                            min="1"
                            placeholder="e.g. 30"
                            autoFocus
                        />
                    )}
                    
                    {targetStationId && (
                        <div className={`p-3 rounded-lg text-sm border ${isMerge ? 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/10 dark:border-orange-800 dark:text-orange-300' : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/10 dark:border-blue-800 dark:text-blue-300'}`}>
                            <p className="font-semibold flex items-center gap-2">
                                <Split size={14} />
                                {transferMode === 'all' 
                                    ? (isMerge ? 'Action: Merge Full Session' : 'Action: Move Session') 
                                    : (isMerge ? `Action: Transfer ${minutesToTransfer || 0} mins` : `Action: Split & Move ${minutesToTransfer || 0} mins`)
                                }
                            </p>
                            <p className="mt-1 opacity-90 text-xs">
                                {transferMode === 'all'
                                    ? (isMerge 
                                        ? "Remaining time will be added to target. Source station will be cleared." 
                                        : "Session will be moved completely. Source station will become available.")
                                    : (isMerge 
                                        ? "Selected time will be added to the target customer. Source session continues with reduced time."
                                        : "Selected time will be moved to a new session on the target station. Source session continues.")
                                }
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setModalState({ type: null })}>Cancel</Button>
                        <Button type="submit" disabled={!targetStationId || (transferMode === 'partial' && (!minutesToTransfer || Number(minutesToTransfer) > remainingMinutes || Number(minutesToTransfer) <= 0))}>
                            {transferMode === 'all' 
                                ? (isMerge ? 'Transfer & Merge' : 'Move Session') 
                                : 'Transfer Time'
                            }
                        </Button>
                    </div>
                </form>
            </Modal>
        );
    };

    const ResumeSessionModal = () => {
        const [selectedSessionId, setSelectedSessionId] = useState<string>('');
        
        return (
             <Modal isOpen={modalState.type === 'resumeSession'} onClose={() => setModalState({ type: null })} title={`Resume Session on Station ${modalState.stationId}`} size="sm">
                {parkedSessions.length > 0 ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleResumeSession(modalState.stationId!, selectedSessionId); }} className="space-y-4">
                         <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {parkedSessions.map(session => (
                                <div 
                                    key={session.id}
                                    onClick={() => setSelectedSessionId(session.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                        selectedSessionId === session.id 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' 
                                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{session.customerName}</span>
                                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{formatTime(session.remainingTime)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                                        <span>From: {session.originalStationName}</span>
                                        <span>{new Date(session.parkedAt).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="secondary" onClick={() => setModalState({ type: null })}>Cancel</Button>
                            <Button type="submit" disabled={!selectedSessionId}>Resume Session</Button>
                        </div>
                    </form>
                ) : (
                    <div className="text-center py-6">
                        <p className="text-slate-500">No parked sessions available.</p>
                        <Button variant="secondary" className="mt-4" onClick={() => setModalState({ type: null })}>Close</Button>
                    </div>
                )}
            </Modal>
        );
    };

    const EditCustomerModal = () => {
        const [newName, setNewName] = useState(modalState.customerName || '');
        useEffect(() => {
            if(modalState.type === 'editCustomer') {
                setNewName(modalState.customerName || '');
            }
        }, [modalState]);
    
        return <Modal isOpen={modalState.type === 'editCustomer'} onClose={() => setModalState({ type: null })} title={`Edit Customer Name`} size="sm">
            <form onSubmit={(e) => { e.preventDefault(); handleEditCustomerName(modalState.customerName!, newName); }} className="space-y-4">
                <Input label="New Customer Name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Enter new name" autoFocus/>
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={() => setModalState({ type: null })}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </div>
            </form>
        </Modal>
    };

    const AddPointsModal = () => {
        const [amount, setAmount] = useState('');
        const points = Number(amount) * settings.pointsPerPeso;
        return <Modal isOpen={modalState.type === 'addPoints'} onClose={() => setModalState({ type: null })} title={`Add Spent for ${modalState.customerName}`} size="sm">
            <form onSubmit={(e) => { e.preventDefault(); handleAddPoints(modalState.customerName!, Number(amount)); }} className="space-y-4">
                <Input label="Purchase Amount (₱)" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" autoFocus/>
                <p className="text-center text-slate-600 dark:text-slate-300">Will earn <span className="font-bold text-green-600 dark:text-green-400">{points.toFixed(2)}</span> points</p>
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={() => setModalState({ type: null })}>Cancel</Button>
                    <Button type="submit" disabled={Number(amount) <= 0}>Confirm Purchase</Button>
                </div>
            </form>
        </Modal>
    };
    
    const AdjustPointsModal = () => {
        const [points, setPoints] = useState('');
        return <Modal isOpen={modalState.type === 'adjustPoints'} onClose={() => setModalState({ type: null })} title={`Adjust Points for ${modalState.customerName}`} size="sm">
            <form onSubmit={(e) => { e.preventDefault(); handleAdjustPoints(modalState.customerName!, Number(points)); }} className="space-y-4">
                <p className="text-center text-slate-600 dark:text-slate-300">Current points: <span className="font-bold text-green-600 dark:text-green-400">{customerForModal?.points.toFixed(2)}</span></p>
                <Input label="Points to Add" type="number" step="0.01" value={points} onChange={e => setPoints(e.target.value)} placeholder="0.00" autoFocus/>
                <p className="text-center text-slate-600 dark:text-slate-300 text-sm">This will not be recorded as a sale.</p>
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={() => setModalState({ type: null })}>Cancel</Button>
                    <Button type="submit" disabled={Number(points) <= 0}>Add Points</Button>
                </div>
            </form>
        </Modal>
    };

    const RedeemPointsModal = () => {
        const [points, setPoints] = useState('');
        const maxPoints = customerForModal?.points || 0;
        return <Modal isOpen={modalState.type === 'redeemPoints'} onClose={() => setModalState({ type: null })} title={`Redeem Points for ${modalState.customerName}`} size="sm">
             <form onSubmit={(e) => { e.preventDefault(); handleRedeemPoints(modalState.customerName!, Number(points)); }} className="space-y-4">
                <p className="text-center text-slate-600 dark:text-slate-300">Available points: <span className="font-bold text-green-600 dark:text-green-400">{maxPoints.toFixed(2)}</span></p>
                <Input label="Points to Redeem" type="number" step="0.01" max={maxPoints} value={points} onChange={e => setPoints(e.target.value)} placeholder="0.00" autoFocus/>
                 <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={() => setModalState({ type: null })}>Cancel</Button>
                    <Button type="submit" disabled={Number(points) <= 0 || Number(points) > maxPoints}>Redeem Points</Button>
                </div>
            </form>
        </Modal>
    };

    const ConfirmDeleteModal = () => (
         <Modal isOpen={modalState.type === 'deleteCustomer'} onClose={() => setModalState({ type: null })} title={`Delete ${modalState.customerName}?`} size="sm">
             <div className="space-y-4">
                <p>Are you sure you want to delete this customer? Their points and history will be archived and can be restored later from the History page.</p>
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={() => setModalState({ type: null })}>Cancel</Button>
                    <Button variant="danger" onClick={() => handleDeleteCustomer(modalState.customerName!)}>Confirm Delete</Button>
                </div>
             </div>
         </Modal>
    );

    const StopStationModal = () => {
        const station = stations.find(s => s.id === modalState.stationId);
        
        return (
             <Modal isOpen={modalState.type === 'stopStation'} onClose={() => setModalState({ type: null })} title="Confirm Stop Session" size="sm">
                 <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                            <Square size={32} className="text-red-600 dark:text-red-500 fill-current" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Stop Station {station?.name}?</h4>
                        <p className="text-slate-500 dark:text-slate-400">
                            Are you sure you want to end this session immediately? This action cannot be undone.
                        </p>
                    </div>
                    
                    {station?.currentSession && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
                            <div className="flex justify-between mb-1">
                                <span className="text-slate-500">Customer:</span>
                                <span className="font-medium">{station.currentSession.customerName}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-slate-500">Scheduled End:</span>
                                <span className="font-medium">{new Date(station.currentSession.endTime).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setModalState({ type: null })}>Cancel</Button>
                        <Button variant="danger" onClick={confirmStopStation}>Yes, Stop Timer</Button>
                    </div>
                 </div>
             </Modal>
        );
    };

    const navItems = [
        { id: 'timer', label: 'Timer', icon: Clock },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
        { id: 'history', label: 'History', icon: History },
        { id: 'analytics', label: 'Analytics & Log', icon: BarChartHorizontal },
    ];
    
    return (
        <div className="space-y-6 fade-in">
             <div>
                <h2 className="text-3xl font-bold">Phone Rental Points System</h2>
                <p className="text-slate-500 dark:text-slate-400">Manage customer points, track rentals, and reward loyalty</p>
            </div>
            
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-wrap gap-2">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActivePage(item.id as RentalSystemPage)}
                        className={`flex-1 flex items-center justify-center gap-2 min-w-max py-2 px-4 rounded-md text-sm font-semibold capitalize transition ${activePage === item.id ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                        <item.icon size={16} />
                        {item.label}
                    </button>
                ))}
            </div>

            {PageContent}

            {/* Modals */}
            <AddSaleModal />
            <AddCustomerModal />
            <WalkInSaleModal />
            <AddStationTimeModal />
            <RedeemTimeModal />
            <ReduceTimeModal />
            <TransferStationModal />
            <ResumeSessionModal />
            <AssignNameForParkModal />
            <StopStationModal />
            {customerForModal && <>
                <CustomerDetailsModal />
                <EditCustomerModal />
                <AddPointsModal />
                <AdjustPointsModal />
                <RedeemPointsModal />
                <ConfirmDeleteModal />
            </>}
        </div>
    );
};
