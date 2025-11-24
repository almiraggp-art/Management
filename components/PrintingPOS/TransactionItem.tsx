
import React from 'react';
import { POSTransaction } from '../../types';
import { ChevronDown } from 'lucide-react';

interface TransactionItemProps {
    transaction: POSTransaction;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
    const transactionDate = new Date(transaction.date);
    const formattedDate = transactionDate.toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    const formattedTime = transactionDate.toLocaleTimeString(undefined, {
        hour: '2-digit', minute: '2-digit'
    });

    return (
        <details className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 open:border-blue-500 transition-colors">
            <summary className="p-4 flex justify-between items-center cursor-pointer list-none">
                <div className="flex items-center gap-4">
                     <div className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                        #{transaction.id.toString().slice(-6)}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{formattedDate}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{formattedTime}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        ₱{transaction.total.toFixed(2)}
                    </span>
                    <ChevronDown className="transition-transform transform details-arrow" size={20} />
                </div>
            </summary>
            <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700">
                <div className="mt-4 space-y-2">
                     <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Items ({transaction.items.length})</h4>
                    {transaction.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-slate-100 dark:bg-slate-700/50 rounded">
                            <div>
                                <p className="text-slate-800 dark:text-slate-200 font-medium">{item.productName} {item.variantName && `(${item.variantName})`}</p>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">{item.quantity} x ₱{item.price.toFixed(2)}</p>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 font-semibold">₱{(item.quantity * item.price).toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            </div>
            <style>{`
                details[open] > summary .details-arrow {
                    transform: rotate(180deg);
                }
            `}</style>
        </details>
    );
};