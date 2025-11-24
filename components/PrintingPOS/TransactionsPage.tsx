import React from 'react';
import { POSTransaction, DateFilterType } from '../../types';
import { TransactionList } from './TransactionList';
import { DateFilter } from '../ui/DateFilter';

interface TransactionsPageProps {
    transactions: POSTransaction[];
    totalSales: number;
    filter: DateFilterType;
    setFilter: (filter: DateFilterType) => void;
    customStartDate: string;
    setCustomStartDate: (date: string) => void;
    customEndDate: string;
    setCustomEndDate: (date: string) => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = (props) => {
    return (
        <div className="space-y-6">
            <DateFilter {...props} />
            <TransactionList transactions={props.transactions} />
        </div>
    );
};