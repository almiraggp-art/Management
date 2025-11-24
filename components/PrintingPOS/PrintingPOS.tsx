import React, { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Product, CartItem, POSTransaction, POSSales, Variant, DateFilterType } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Modal } from '../ui/Modal';
import { ProductForm } from './ProductForm';
import { ProductList } from './ProductList';
import { Cart } from './Cart';
import { VariantSelectionModal } from './VariantSelectionModal';
import { TransactionsPage } from './TransactionsPage';
import { AnalyticsPage } from './AnalyticsPage';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, ShoppingCart, Receipt, LineChart, Search } from 'lucide-react';

type PrintingPOSPage = 'pos' | 'transactions' | 'analytics';

interface POSPageComponentProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    products: Product[];
    onEdit: (product: Product) => void;
    onDelete: (productId: number) => void;
    onProductSelect: (product: Product) => void;
    cartItems: CartItem[];
    onUpdateQuantity: (itemId: number, update: ((prevQuantity: number) => number) | number) => void;
    onRemoveItem: (itemId: number) => void;
    onClearCart: () => void;
    onCompleteSale: () => void;
}

const POSPageComponent: React.FC<POSPageComponentProps> = ({
    searchQuery, setSearchQuery, products, onEdit, onDelete, onProductSelect,
    cartItems, onUpdateQuantity, onRemoveItem, onClearCart, onCompleteSale
}) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                <Input
                    placeholder="Search products by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>
            <ProductList
                products={products}
                onEdit={onEdit}
                onDelete={onDelete}
                onProductSelect={onProductSelect}
            />
        </div>
        <div>
            <Cart 
                cartItems={cartItems}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
                onClearCart={onClearCart}
                onCompleteSale={onCompleteSale}
            />
        </div>
    </div>
);


export const PrintingPOS: React.FC = () => {
    const [products, setProducts] = useLocalStorage<Product[]>('pos-products', []);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [transactions, setTransactions] = useLocalStorage<POSTransaction[]>('pos-transactions', []);
    const [sales, setSales] = useLocalStorage<POSSales>('pos-sales', { daily: 0, total: 0 });
    const [lastActiveDate, setLastActiveDate] = useLocalStorage<string>('pos-last-active-date', '');
    const [activePage, setActivePage] = useState<PrintingPOSPage>('pos');

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productForVariantSelection, setProductForVariantSelection] = useState<Product | null>(null);
    
    // State for transaction filtering
    const [filter, setFilter] = useState<DateFilterType>('today');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const [searchQuery, setSearchQuery] = useState('');

    const { addToast } = useToast();
    const { addNotification } = useNotifications();

    // Reset daily sales if it's a new day
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        if (lastActiveDate !== today) {
            setSales(prev => ({ ...prev, daily: 0 }));
            setLastActiveDate(today);
        }
    }, [lastActiveDate, setLastActiveDate, setSales]);

    // Product Management Handlers
    const handleOpenAddModal = () => {
        setEditingProduct(null);
        setIsProductModalOpen(true);
    };

    const handleOpenEditModal = (product: Product) => {
        setEditingProduct(product);
        setIsProductModalOpen(true);
    };

    const handleCloseProductModal = () => {
        setIsProductModalOpen(false);
        setEditingProduct(null);
    };

    const handleSaveProduct = (productData: Omit<Product, 'id'> & { id?: number }) => {
        if (productData.id) { // Editing
            setProducts(products.map(p => p.id === productData.id ? { ...p, ...productData, id: productData.id } as Product : p));
            addToast('Product updated successfully!', 'success');
            addNotification(`Updated product: ${productData.name}`, 'printing', 'add_product');
        } else { // Adding
            const newProduct: Product = {
                ...productData,
                id: Date.now(),
            };
            setProducts([...products, newProduct]);
            addToast('Product added successfully!', 'success');
            addNotification(`Added product: ${newProduct.name}`, 'printing', 'add_product');
        }
        handleCloseProductModal();
    };

    const handleDeleteProduct = (productId: number) => {
        const productToDelete = products.find(p => p.id === productId);
        if (productToDelete && window.confirm('Are you sure you want to delete this product?')) {
            setProducts(products.filter(p => p.id !== productId));
            addToast('Product deleted.', 'info');
            addNotification(`Deleted product: ${productToDelete.name}`, 'printing', 'delete_product');
        }
    };

    // Cart Management Handlers
    const handleProductSelect = (product: Product) => {
        if (product.hasVariants) {
            setProductForVariantSelection(product);
        } else {
            handleAddToCart(product, null, 1);
        }
    };

    const handleAddToCart = (product: Product, variant: Variant | null, quantity: number) => {
        const existingCartItem = cart.find(item => 
            item.productId === product.id && item.variantName === (variant?.name || null)
        );

        if (existingCartItem) {
            setCart(cart.map(item => 
                item.id === existingCartItem.id 
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ));
        } else {
            const cartItem: CartItem = {
                id: Date.now(),
                productId: product.id,
                productName: product.name,
                variantName: variant?.name || null,
                price: variant?.price || product.price || 0,
                quantity: quantity,
                icon: product.icon
            };
            setCart([...cart, cartItem]);
        }
        addToast(`${product.name}${variant ? ` (${variant.name})` : ''} added to cart.`, 'success');
        setProductForVariantSelection(null);
    };
    
    const handleUpdateQuantity = (itemId: number, update: ((prevQuantity: number) => number) | number) => {
        setCart(prevCart => {
            const itemIndex = prevCart.findIndex(item => item.id === itemId);
            if (itemIndex === -1) return prevCart;

            const itemToUpdate = prevCart[itemIndex];
            const newQuantity = typeof update === 'function' ? update(itemToUpdate.quantity) : update;

            if (newQuantity < 1) {
                // Remove item if quantity is less than 1
                return prevCart.filter(item => item.id !== itemId);
            }

            const newCart = [...prevCart];
            newCart[itemIndex] = { ...itemToUpdate, quantity: newQuantity };
            return newCart;
        });
    };

    const handleRemoveItem = (itemId: number) => {
        setCart(cart.filter(item => item.id !== itemId));
    };

    const handleClearCart = () => {
        if (cart.length > 0) {
            const oldCart = [...cart];
            setCart([]);
            addToast('Cart cleared.', 'info', {
                label: 'Undo',
                onClick: () => {
                    setCart(oldCart);
                    addToast('Cart restored.', 'success');
                }
            });
        }
    };

    const handleCompleteSale = () => {
        if (cart.length === 0) {
            addToast('Cart is empty.', 'error');
            return;
        }
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const transaction: POSTransaction = {
            id: Date.now(),
            date: new Date().toISOString(),
            items: cart,
            total,
        };
        setTransactions([transaction, ...transactions]);
        
        setSales({
            daily: sales.daily + total,
            total: sales.total + total,
        });
        setCart([]);
        addToast(`Sale completed! Total: ₱${total.toFixed(2)}`, 'success');
        addNotification(`Sale of ₱${total.toFixed(2)} completed`, 'printing', 'sale');
    };

    // Filtered Transactions Logic
    const { filteredTransactions, filteredTotal } = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const filtered = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            switch (filter) {
                case 'today':
                    return transactionDate >= startOfToday;
                case 'week':
                    return transactionDate >= startOfWeek;
                case 'month':
                    return transactionDate >= startOfMonth;
                case 'custom':
                    if (!customStartDate || !customEndDate) return true;
                    const start = new Date(customStartDate);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(customEndDate);
                    end.setHours(23, 59, 59, 999);
                    return transactionDate >= start && transactionDate <= end;
                default:
                    return true;
            }
        });
        
        const total = filtered.reduce((sum, t) => sum + t.total, 0);
        return { filteredTransactions: filtered, filteredTotal: total };

    }, [transactions, filter, customStartDate, customEndDate]);
    
    // Filtered Products Logic
    const filteredProducts = useMemo(() => {
        if (!searchQuery) {
            return products;
        }
        return products.filter(product =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [products, searchQuery]);


    // Page Components
    const PageContent = useMemo(() => {
        switch (activePage) {
            case 'pos':
                return <POSPageComponent 
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    products={filteredProducts}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteProduct}
                    onProductSelect={handleProductSelect}
                    cartItems={cart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    onClearCart={handleClearCart}
                    onCompleteSale={handleCompleteSale}
                />;
            case 'transactions':
                return <TransactionsPage 
                            transactions={filteredTransactions}
                            totalSales={filteredTotal}
                            filter={filter}
                            setFilter={setFilter}
                            customStartDate={customStartDate}
                            setCustomStartDate={setCustomStartDate}
                            customEndDate={customEndDate}
                            setCustomEndDate={setCustomEndDate}
                       />;
            case 'analytics':
                return <AnalyticsPage transactions={transactions} setTransactions={setTransactions} setSales={setSales} />;
            default:
                return <POSPageComponent 
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    products={filteredProducts}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteProduct}
                    onProductSelect={handleProductSelect}
                    cartItems={cart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    onClearCart={handleClearCart}
                    onCompleteSale={handleCompleteSale}
                />;
        }
    }, [activePage, products, cart, transactions, filter, customStartDate, customEndDate, searchQuery, filteredProducts, filteredTotal]);

    const navItems = [
        { id: 'pos', label: 'Point of Sale', icon: ShoppingCart },
        { id: 'transactions', label: 'Transactions', icon: Receipt },
        { id: 'analytics', label: 'Analytics', icon: LineChart },
    ];

    return (
        <div className="space-y-6 fade-in">
            <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Printing POS System</h2>
                    <p className="text-slate-500 dark:text-slate-400">Manage products, process sales, and track revenue</p>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                    <Button onClick={handleOpenAddModal}><Plus size={16} className="mr-2" /> Add Product</Button>
                </div>
            </div>

            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-wrap gap-2">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActivePage(item.id as PrintingPOSPage)}
                        className={`flex-1 flex items-center justify-center gap-2 min-w-max py-2 px-4 rounded-md text-sm font-semibold capitalize transition ${activePage === item.id ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                        <item.icon size={16} />
                        {item.label}
                    </button>
                ))}
            </div>

            {PageContent}
            
            <Modal
                isOpen={isProductModalOpen}
                onClose={handleCloseProductModal}
                title={editingProduct ? 'Edit Product' : 'Add New Product'}
            >
                <ProductForm
                    productToEdit={editingProduct}
                    onSave={handleSaveProduct}
                    onCancel={handleCloseProductModal}
                />
            </Modal>

            {productForVariantSelection && (
                <VariantSelectionModal
                    isOpen={!!productForVariantSelection}
                    onClose={() => setProductForVariantSelection(null)}
                    product={productForVariantSelection}
                    onAddToCart={handleAddToCart}
                />
            )}
        </div>
    );
};