
import React from 'react';
import { POSTransaction } from '../../types';
import { TransactionItem } from './TransactionItem';
import { Receipt } from 'lucide-react';

interface TransactionListProps {
    transactions: POSTransaction[];
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
    if (transactions.length === 0) {
        return (
            <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-lg">
                <Receipt size={48} className="mx-auto text-slate-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Transactions Found</h3>
                <p className="text-slate-400">There are no transactions for the selected period.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {transactions.map(transaction => (
                <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
        </div>
    );
};
