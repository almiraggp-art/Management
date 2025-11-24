
import React from 'react';
import { Product } from '../../types';
import { Button } from '../ui/Button';
import { Edit, Trash, PackagePlus, ShoppingCart, List } from 'lucide-react';
import { DynamicIcon } from '../ui/DynamicIcon';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: number) => void;
  onProductSelect: (product: Product) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ products, onEdit, onDelete, onProductSelect }) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
        <PackagePlus size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Your Product Catalog is Empty</h3>
        <p className="text-slate-500 dark:text-slate-400">Click 'Add Product' to create your first item and start selling.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product) => (
        <div 
          key={product.id} 
          className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 group relative flex flex-col transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-600/10"
        >
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button variant="secondary" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(product); }} aria-label={`Edit ${product.name}`}>
                  <Edit size={14}/>
                </Button>
                <Button variant="danger" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDelete(product.id); }} aria-label={`Delete ${product.name}`}>
                  <Trash size={14}/>
                </Button>
            </div>

            <button
                type="button"
                className="flex-grow p-4 flex flex-col items-center text-center cursor-pointer w-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-t-xl"
                onClick={() => onProductSelect(product)}
                aria-label={`View details for ${product.name}`}
            >
                <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-slate-200 dark:border-slate-600 group-hover:border-blue-500 transition-colors">
                    <DynamicIcon name={product.icon} className="w-8 h-8 text-slate-500 dark:text-slate-300 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 leading-tight flex-grow">{product.name}</h4>
                
                {product.hasVariants ? (
                  <p className="text-xs text-sky-600 dark:text-sky-300 font-medium bg-sky-100 dark:bg-sky-900/70 px-2 py-1 rounded-full">{product.variants.length} variant(s)</p>
                ) : (
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">₱{product.price?.toFixed(2)}</p>
                )}
            </button>
            <div className="p-3 border-t border-slate-200 dark:border-slate-700/50">
             <Button 
                variant={product.hasVariants ? 'secondary' : 'primary'} 
                className="w-full h-9 text-xs"
                onClick={() => onProductSelect(product)}
                aria-label={product.hasVariants ? `Select variant for ${product.name}` : `Add ${product.name} to cart`}
              >
              {product.hasVariants ? <List size={14} className="mr-2" /> : <ShoppingCart size={14} className="mr-2" />}
              {product.hasVariants ? 'Select Variant' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};