
import React from 'react';
import { DynamicIcon } from '../ui/DynamicIcon';

interface IconPickerProps {
    selectedIcon: string;
    onSelectIcon: (iconName: string) => void;
}

const availableIcons = [
    'Package', 'Printer', 'FileText', 'Scan', 'Book', 'Image', 
    'PenTool', 'Scissors', 'Layers', 'Type', 'Palette', 'Award'
];

export const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelectIcon }) => {
    return (
        <div className="grid grid-cols-6 gap-2 bg-slate-100 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
            {availableIcons.map(iconName => (
                <button
                    key={iconName}
                    type="button"
                    onClick={() => onSelectIcon(iconName)}
                    className={`flex items-center justify-center aspect-square rounded-md transition-all duration-200 ${
                        selectedIcon === iconName 
                        ? 'bg-blue-600 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-blue-500' 
                        : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                    title={iconName}
                >
                    <DynamicIcon name={iconName} className={`w-6 h-6 ${
                        selectedIcon === iconName ? 'text-white' : 'text-slate-500 dark:text-slate-300'
                    }`} />
                </button>
            ))}
        </div>
    );
};