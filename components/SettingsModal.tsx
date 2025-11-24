
import React, { useState, useRef } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useToast } from '../contexts/ToastContext';
import { Download, Upload, FileJson, AlertTriangle, Moon, Sun, Clock, Plus, Trash2, Settings2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { RentalSettings, Promo } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DATA_KEYS = {
    printing: ['pos-products', 'pos-transactions', 'pos-sales'],
    rental: ['rental-customers', 'rental-history', 'deleted-customers', 'rental-stations', 'parked-sessions', 'rental-settings'],
};

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
            <span className="font-medium text-sm text-slate-900 dark:text-white">Interface Theme</span>
            <button
                onClick={toggleTheme}
                className="relative inline-flex items-center h-8 w-14 rounded-full bg-slate-300 dark:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800"
                aria-label="Toggle theme"
            >
                <span className={`absolute left-1 top-1 flex items-center justify-center h-6 w-6 rounded-full bg-white dark:bg-slate-700 shadow-sm transition-transform duration-300 ease-in-out ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}>
                    <Sun size={14} className="text-yellow-500 dark:hidden" />
                    <Moon size={14} className="text-slate-300 hidden dark:block" />
                </span>
            </button>
        </div>
    );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileToImport, setFileToImport] = useState<File | null>(null);

    // Rental Settings
    const [rentalSettings, setRentalSettings] = useLocalStorage<RentalSettings>('rental-settings', {
        minutesPerPeso: 6,
        pointsPerPeso: 0.05,
        minutesPerPoint: 6,
        promos: [
            { id: '1', name: '30 Mins', price: 5, minutes: 30 },
            { id: '2', name: '1 Hour', price: 10, minutes: 60 },
        ]
    });
    const [newPromo, setNewPromo] = useState<Partial<Promo>>({ name: '', price: 0, minutes: 0 });

    const handleAddPromo = () => {
        if (!newPromo.name || !newPromo.price || !newPromo.minutes) {
            addToast('Please fill in all promo fields.', 'error');
            return;
        }
        const promo: Promo = {
            id: Date.now().toString(),
            name: newPromo.name,
            price: Number(newPromo.price),
            minutes: Number(newPromo.minutes)
        };
        setRentalSettings(prev => ({ ...prev, promos: [...prev.promos, promo] }));
        setNewPromo({ name: '', price: 0, minutes: 0 });
        addToast('Promo rate added.', 'success');
    };

    const handleDeletePromo = (id: string) => {
        setRentalSettings(prev => ({ ...prev, promos: prev.promos.filter(p => p.id !== id) }));
    };

    const handleExport = (type: 'printing' | 'rental' | 'all') => {
        try {
            const keysToExport = type === 'all' ? [...DATA_KEYS.printing, ...DATA_KEYS.rental] : DATA_KEYS[type];
            const data: { [key: string]: any } = {};

            keysToExport.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) data[key] = JSON.parse(item);
            });

            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
            const link = document.createElement('a');
            link.href = jsonString;
            link.download = `bms-backup-${type}-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            addToast('Data exported successfully!', 'success');
        } catch (error) {
            console.error("Export failed:", error);
            addToast('Data export failed. See console for details.', 'error');
        }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setFileToImport(event.target.files[0]);
        }
    };

    const handleImport = () => {
        if (!fileToImport) {
            addToast('Please select a file to import.', 'error');
            return;
        }

        if (!window.confirm('Are you sure you want to import this data? This will overwrite all current data in the application. This action cannot be undone.')) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result;
                if (typeof text !== 'string') throw new Error("File could not be read.");
                
                const data = JSON.parse(text);
                const allKeys = [...DATA_KEYS.printing, ...DATA_KEYS.rental];
                let importedKeysCount = 0;

                Object.keys(data).forEach(key => {
                    if (allKeys.includes(key)) {
                        localStorage.setItem(key, JSON.stringify(data[key]));
                        importedKeysCount++;
                    }
                });
                
                if (importedKeysCount === 0) {
                    throw new Error("The selected file does not contain valid application data.")
                }

                addToast('Data imported successfully! The application will now reload.', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);

            } catch (error) {
                console.error("Import failed:", error);
                addToast(`Import failed: ${error instanceof Error ? error.message : 'Invalid file format.'}`, 'error');
            } finally {
                setFileToImport(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(fileToImport);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Application Settings" size="lg">
            <div className="space-y-8">
                 {/* Appearance */}
                 <div>
                    <h4 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">Appearance</h4>
                    <ThemeToggle />
                </div>

                {/* Rental Configuration */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                        <Settings2 size={20} className="text-blue-500" />
                        Rental Configuration
                    </h4>
                    
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Input 
                                label="Base Rate (Minutes per ₱1)" 
                                type="number" 
                                value={rentalSettings.minutesPerPeso} 
                                onChange={e => setRentalSettings({...rentalSettings, minutesPerPeso: Number(e.target.value)})} 
                            />
                            <Input 
                                label="Points Earned per ₱1" 
                                type="number" 
                                step="0.01"
                                value={rentalSettings.pointsPerPeso} 
                                onChange={e => setRentalSettings({...rentalSettings, pointsPerPeso: Number(e.target.value)})} 
                            />
                            <Input 
                                label="Redeem Rate (Mins per Point)" 
                                type="number" 
                                value={rentalSettings.minutesPerPoint} 
                                onChange={e => setRentalSettings({...rentalSettings, minutesPerPoint: Number(e.target.value)})} 
                            />
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h5 className="font-medium mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <Clock size={16} />
                                Time Rates & Promos
                            </h5>
                            
                            <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto">
                                {rentalSettings.promos.map(promo => (
                                    <div key={promo.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-600">
                                        <div className="flex items-center gap-4">
                                            <span className="font-medium text-slate-700 dark:text-slate-300 w-32 truncate">{promo.name}</span>
                                            <span className="text-sm text-slate-500 dark:text-slate-400">₱{promo.price}</span>
                                            <span className="text-sm text-blue-600 dark:text-blue-400 font-mono">{promo.minutes} mins</span>
                                        </div>
                                        <Button variant="ghost" size="xs" onClick={() => handleDeletePromo(promo.id)}>
                                            <Trash2 size={14} className="text-red-500"/>
                                        </Button>
                                    </div>
                                ))}
                                {rentalSettings.promos.length === 0 && <p className="text-sm text-slate-400 text-center py-2">No promo rates defined.</p>}
                            </div>

                            <div className="flex items-end gap-2">
                                <div className="flex-grow grid grid-cols-3 gap-2">
                                    <Input 
                                        placeholder="Name (e.g. 1 Hour)" 
                                        value={newPromo.name} 
                                        onChange={e => setNewPromo({...newPromo, name: e.target.value})} 
                                    />
                                    <Input 
                                        placeholder="Price (₱)" 
                                        type="number" 
                                        value={newPromo.price || ''} 
                                        onChange={e => setNewPromo({...newPromo, price: Number(e.target.value)})} 
                                    />
                                    <Input 
                                        placeholder="Mins" 
                                        type="number" 
                                        value={newPromo.minutes || ''} 
                                        onChange={e => setNewPromo({...newPromo, minutes: Number(e.target.value)})} 
                                    />
                                </div>
                                <Button onClick={handleAddPromo} className="mb-[1px]"><Plus size={16}/></Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Export/Import */}
                <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-lg flex items-center gap-2 text-slate-900 dark:text-white"><Download size={18} /> Data Management</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Button variant="secondary" onClick={() => handleExport('printing')}>Export Printing Data</Button>
                        <Button variant="secondary" onClick={() => handleExport('rental')}>Export Rental Data</Button>
                        <Button variant="secondary" onClick={() => handleExport('all')}>Export All Data</Button>
                    </div>

                    <div className="mt-4 flex items-center gap-3 pt-2">
                         <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".json"
                            className="hidden"
                            id="import-file-input"
                        />
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="flex-grow justify-start">
                            <Upload size={16} className="mr-2"/>
                            {fileToImport ? fileToImport.name : 'Import Data Backup...'}
                        </Button>
                        <Button onClick={handleImport} disabled={!fileToImport}>
                            Import
                        </Button>
                    </div>
                     {fileToImport && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 text-xs p-2 rounded flex items-center gap-2 mt-2">
                            <AlertTriangle size={14}/>
                            Warning: Importing will overwrite all existing data.
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
