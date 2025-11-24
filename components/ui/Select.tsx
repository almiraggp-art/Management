
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({ label, id, className, options, ...props }) => {
    const { theme } = useTheme();
    const arrowColor = theme === 'dark' ? '#9ca3af' : '#6b7280';
    const encodedArrowColor = encodeURIComponent(arrowColor);

    return (
        <div className="w-full">
            {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>}
            <select
                id={id}
                className={`w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none bg-no-repeat bg-right pr-8 ${className}`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='${encodedArrowColor}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '1.5em 1.5em',
                }}
                {...props}
            >
                {options.map(option => (
                    <option key={option.value} value={option.value} className="bg-white dark:bg-slate-800">
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};