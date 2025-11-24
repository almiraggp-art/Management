
import React, { useState } from 'react';
import { PrintingPOS } from './PrintingPOS/PrintingPOS';
import { RentalSystem } from './RentalSystem/RentalSystem';
import { Printer, Smartphone } from 'lucide-react';

export const Business: React.FC = () => {
    const [activeSystem, setActiveSystem] = useState<'printing' | 'rental'>('printing');

    const navItems = [
        { id: 'printing', label: 'Printing POS', icon: Printer },
        { id: 'rental', label: 'Phone Rental System', icon: Smartphone },
    ];

    return (
        <div className="space-y-6 fade-in">
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-wrap gap-2">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveSystem(item.id as 'printing' | 'rental')}
                        className={`flex-1 flex items-center justify-center gap-2 min-w-max py-3 px-4 rounded-md text-sm font-semibold capitalize transition ${
                            activeSystem === item.id 
                            ? 'bg-blue-600 text-white' 
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        <item.icon size={16} />
                        {item.label}
                    </button>
                ))}
            </div>

            <div>
                {activeSystem === 'printing' && <PrintingPOS />}
                {activeSystem === 'rental' && <RentalSystem />}
            </div>
        </div>
    );
};
