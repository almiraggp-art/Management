import React, { useState, useRef, useEffect } from 'react';
import { CartItem } from '../../types';
import { Button } from '../ui/Button';
import { Trash, ShoppingCart, CheckCircle, Minus, Plus } from 'lucide-react';
import { DynamicIcon } from '../ui/DynamicIcon';

interface CartProps {
    cartItems: CartItem[];
    onUpdateQuantity: (itemId: number, update: ((prevQuantity: number) => number) | number) => void;
    onRemoveItem: (itemId: number) => void;
    onClearCart: () => void;
    onCompleteSale: () => void;
}

export const Cart: React.FC<CartProps> = ({ cartItems, onUpdateQuantity, onRemoveItem, onClearCart, onCompleteSale }) => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const [removingItems, setRemovingItems] = useState<number[]>([]);
    const [updatedItem, setUpdatedItem] = useState<{ id: number; key: number } | null>(null);
    const quantityUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);


    const handleUpdateQuantityProxy = (itemId: number, update: ((prevQuantity: number) => number) | number) => {
        onUpdateQuantity(itemId, update);
        setUpdatedItem({ id: itemId, key: Date.now() });
    };

    const handleRemoveItemProxy = (itemId: number) => {
        if (removingItems.includes(itemId)) return;
        setRemovingItems(prev => [...prev, itemId]);
        setTimeout(() => {
            onRemoveItem(itemId);
            setRemovingItems(prev => prev.filter(id => id !== itemId));
        }, 300); // Duration should match animation
    };

    const startUpdatingQuantity = (itemId: number, change: 1 | -1) => {
        handleUpdateQuantityProxy(itemId, (q) => q + change);
        quantityUpdateInterval.current = setInterval(() => {
            handleUpdateQuantityProxy(itemId, (q) => q + change);
        }, 150);
    };

    const stopUpdatingQuantity = () => {
        if (quantityUpdateInterval.current) {
            clearInterval(quantityUpdateInterval.current);
            quantityUpdateInterval.current = null;
        }
    };

    useEffect(() => {
        return () => stopUpdatingQuantity();
    }, []);

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 sticky top-24 flex flex-col" style={{height: 'calc(100vh - 7rem - 2rem)'}}>
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Current Order</h3>
                {cartItems.length > 0 && (
                    <Button variant="ghost" onClick={onClearCart} disabled={cartItems.length === 0} className="text-xs h-auto px-2 py-1 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400">
                        <Trash size={14} className="mr-1" />
                        Clear All
                    </Button>
                )}
            </div>
            
            <div className="p-3 space-y-3 flex-grow overflow-y-auto">
                {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <ShoppingCart size={48} className="text-slate-400 dark:text-slate-600 mb-4" />
                        <p className="text-slate-600 dark:text-slate-400 font-semibold">Your cart is empty.</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">Add products from the list to get started.</p>
                    </div>
                ) : (
                    cartItems.map(item => (
                        <div 
                            key={updatedItem?.id === item.id ? updatedItem.key : item.id} 
                            className={`flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 ${removingItems.includes(item.id) ? 'animate-slide-out-cart' : 'animate-slide-in-cart'} ${updatedItem?.id === item.id ? 'animate-flash-cart' : ''}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600">
                                <DynamicIcon name={item.icon} className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate text-slate-800 dark:text-white">{item.productName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {item.variantName && <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">{item.variantName}</p>}
                                    <p className="text-sm text-green-600 dark:text-green-400 font-mono font-semibold">₱{item.price.toFixed(2)}</p>
                                </div>
                            </div>
                             <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white" 
                                    onMouseDown={() => startUpdatingQuantity(item.id, -1)}
                                    onMouseUp={stopUpdatingQuantity}
                                    onMouseLeave={stopUpdatingQuantity}
                                    onTouchStart={(e) => { e.preventDefault(); startUpdatingQuantity(item.id, -1); }}
                                    onTouchEnd={stopUpdatingQuantity}
                                    aria-label="Decrease quantity"
                                >
                                    <Minus size={14} />
                                </Button>
                                <input 
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateQuantityProxy(item.id, parseInt(e.target.value) || 1)}
                                    className="w-10 h-8 text-center bg-transparent border-none text-slate-800 dark:text-white focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    min="1"
                                    aria-label="Item quantity"
                                />
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    onMouseDown={() => startUpdatingQuantity(item.id, 1)}
                                    onMouseUp={stopUpdatingQuantity}
                                    onMouseLeave={stopUpdatingQuantity}
                                    onTouchStart={(e) => { e.preventDefault(); startUpdatingQuantity(item.id, 1); }}
                                    onTouchEnd={stopUpdatingQuantity}
                                    aria-label="Increase quantity"
                                >
                                    <Plus size={14} />
                                </Button>
                            </div>
                            <Button variant="ghost" className="h-8 w-8 p-0 shrink-0" onClick={() => handleRemoveItemProxy(item.id)} aria-label="Remove item">
                                <Trash size={16} className="text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400" />
                            </Button>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4 bg-slate-100 dark:bg-slate-800 rounded-b-xl shrink-0">
                <div className="flex justify-between items-center font-semibold">
                    <span className="text-slate-600 dark:text-slate-300">Total:</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">₱{subtotal.toFixed(2)}</span>
                </div>
                <Button 
                    onClick={onCompleteSale} 
                    disabled={cartItems.length === 0} 
                    className={`w-full ${cartItems.length > 0 ? 'animate-pulse-glow-cart' : ''}`}
                    variant="success"
                >
                    <CheckCircle size={16} className="mr-2" />
                    Complete Sale
                </Button>
            </div>
             <style>{`
                @keyframes slide-in-cart {
                    from { opacity: 0; transform: translateX(-15px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-slide-in-cart { animation: slide-in-cart 0.3s ease-out forwards; }

                @keyframes slide-out-cart {
                    from { opacity: 1; transform: translateX(0); }
                    to { opacity: 0; transform: translateX(-15px); height: 0; padding: 0; margin: 0; border: 0; }
                }
                .animate-slide-out-cart { 
                    animation: slide-out-cart 0.3s ease-out forwards;
                    overflow: hidden;
                }
                
                @keyframes flash-cart {
                    0% { background-color: transparent; }
                    50% { background-color: rgba(59, 130, 246, 0.1); } /* a bit lighter */
                    100% { background-color: transparent; }
                }
                .dark .animate-flash-cart {
                     animation-name: flash-cart-dark;
                }
                @keyframes flash-cart-dark {
                    0% { background-color: #1e293b; } /* slate-800 */
                    50% { background-color: #38455a; } /* a bit lighter */
                    100% { background-color: #1e293b; }
                }
                .animate-flash-cart { animation: flash-cart 0.4s ease-in-out; }

                @keyframes pulse-glow-cart {
                    0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(22, 163, 74, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
                }
                .animate-pulse-glow-cart {
                    animation: pulse-glow-cart 2s infinite;
                }
            `}</style>
        </div>
    );
};