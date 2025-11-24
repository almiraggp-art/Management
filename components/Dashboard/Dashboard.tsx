
import React, { useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { POSTransaction, RentalTransaction, Customer, Product, CombinedTransaction, PageType } from '../../types';
import { StatCard } from '../ui/StatCard';
import { RecentActivityItem } from './RecentActivityItem';
import { Button } from '../ui/Button';
import { DollarSign, Receipt, Package, User, Star, Gift, ShoppingCart, UserPlus, PackagePlus, Printer, Smartphone } from 'lucide-react';

const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

export const Dashboard: React.FC<{ onNavigate: (page: PageType) => void }> = ({ onNavigate }) => {
    const [posTransactions] = useLocalStorage<POSTransaction[]>('pos-transactions', []);
    const [rentalHistory] = useLocalStorage<RentalTransaction[]>('rental-history', []);
    const [customers] = useLocalStorage<{[key: string]: Customer}>('rental-customers', {});
    const [products] = useLocalStorage<Product[]>('pos-products', []);

    const dashboardStats = useMemo(() => {
        // POS Stats for Today
        const todaysPosTransactions = posTransactions.filter(t => isToday(t.date));
        const todaysPrintingRevenue = todaysPosTransactions.reduce((sum, t) => sum + t.total, 0);

        const productSalesToday: {[key: string]: { revenue: number, quantity: number }} = {};
        todaysPosTransactions.forEach(t => {
            t.items.forEach(item => {
                if (!productSalesToday[item.productName]) {
                    productSalesToday[item.productName] = { revenue: 0, quantity: 0 };
                }
                productSalesToday[item.productName].revenue += item.price * item.quantity;
                productSalesToday[item.productName].quantity += item.quantity;
            });
        });
        const topSellingProduct = Object.entries(productSalesToday).sort((a, b) => b[1].revenue - a[1].revenue)[0];
        
        // Rental Stats for Today
        const todaysRentalHistory = rentalHistory.filter(t => isToday(t.timestamp));
        const todaysRentalRevenue = todaysRentalHistory.filter(t => t.type === 'add').reduce((sum, t) => sum + (t.amount || 0), 0);
        const pointsAwardedToday = todaysRentalHistory.filter(t => t.type === 'add').reduce((sum, t) => sum + (t.points || 0), 0);
        const pointsRedeemedToday = todaysRentalHistory.filter(t => t.type === 'redeem').reduce((sum, t) => sum + (t.points || 0), 0);
        
        // Combined Stats
        const todaysTotalRevenue = todaysPrintingRevenue + todaysRentalRevenue;
        const totalTransactionsToday = todaysPosTransactions.length + todaysRentalHistory.length;

        // Top Customer
        const topCustomer = Object.entries(customers).sort((a, b) => b[1].points - a[1].points)[0];

        // Recent Activity
        const combinedTransactions: CombinedTransaction[] = [
            ...posTransactions.map(t => ({
                id: t.id.toString(),
                type: 'printing' as const,
                timestamp: t.date,
                description: `${t.items.length} item(s)`,
                value: `₱${t.total.toFixed(2)}`,
                Icon: Printer,
                iconColor: 'text-sky-500',
            })),
            ...rentalHistory.map(t => ({
                id: t.timestamp,
                type: 'rental' as const,
                timestamp: t.timestamp,
                description: t.name,
                value: t.type === 'add' ? `+${(t.points || 0).toFixed(1)} pts` : `-${(t.points || 0).toFixed(1)} pts`,
                Icon: Smartphone,
                iconColor: 'text-emerald-500',
            }))
        ];
        
        const recentActivity = combinedTransactions
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5);

        return {
            todaysTotalRevenue,
            totalTransactionsToday,
            topSellingProduct: topSellingProduct ? `${topSellingProduct[0]}` : 'N/A',
            topSellingProductValue: topSellingProduct ? `₱${topSellingProduct[1].revenue.toFixed(2)}` : '',
            topCustomer: topCustomer ? topCustomer[0] : 'N/A',
            topCustomerValue: topCustomer ? `${topCustomer[1].points.toFixed(2)} pts` : '',
            pointsAwardedToday,
            pointsRedeemedToday,
            recentActivity,
        };

    }, [posTransactions, rentalHistory, customers, products]);

    return (
        <div className="space-y-8 fade-in">
            <div>
                <h2 className="text-3xl font-bold">Dashboard</h2>
                <p className="text-slate-500 dark:text-slate-400">A quick overview of your business performance for today.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Today's Total Revenue" 
                    value={`₱${dashboardStats.todaysTotalRevenue.toFixed(2)}`}
                    icon={<DollarSign className="text-green-500 dark:text-green-400" />} 
                />
                <StatCard 
                    title="Today's Transactions" 
                    value={dashboardStats.totalTransactionsToday.toString()}
                    icon={<Receipt className="text-blue-500 dark:text-blue-400" />} 
                />
                <StatCard 
                    title="Top Selling Product" 
                    value={dashboardStats.topSellingProduct}
                    description={dashboardStats.topSellingProductValue}
                    icon={<Package className="text-yellow-500 dark:text-yellow-400" />} 
                />
                 <StatCard 
                    title="Top Customer by Points" 
                    value={dashboardStats.topCustomer}
                    description={dashboardStats.topCustomerValue}
                    icon={<User className="text-indigo-500 dark:text-indigo-400" />} 
                />
                <StatCard 
                    title="Points Awarded Today" 
                    value={dashboardStats.pointsAwardedToday.toFixed(2)}
                    icon={<Star className="text-orange-500 dark:text-orange-400" />} 
                />
                <StatCard 
                    title="Points Redeemed Today" 
                    value={dashboardStats.pointsRedeemedToday.toFixed(2)}
                    icon={<Gift className="text-pink-500 dark:text-pink-400" />} 
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <ShoppingCart size={18} /> Recent Activity
                    </h3>
                    <div className="space-y-3">
                        {dashboardStats.recentActivity.length > 0 ? (
                            dashboardStats.recentActivity.map(item => <RecentActivityItem key={item.id} item={item} />)
                        ) : (
                            <p className="text-center text-slate-500 dark:text-slate-400 py-12">No transactions recorded yet.</p>
                        )}
                    </div>
                </div>

                 {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <Button variant="secondary" className="w-full justify-start" onClick={() => onNavigate('business')}>
                            <PackagePlus size={16} className="mr-2" /> Add New Product
                        </Button>
                        <Button variant="secondary" className="w-full justify-start" onClick={() => onNavigate('business')}>
                           <UserPlus size={16} className="mr-2" /> Add New Customer
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
