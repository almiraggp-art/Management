
import React, { useState, useEffect } from 'react';
import { Product, Variant } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Trash, Plus } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { IconPicker } from './IconPicker';

interface ProductFormProps {
  productToEdit: Product | null;
  onSave: (product: Omit<Product, 'id' | 'variants'> & { id?: number, variants: Variant[], icon?: string }) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ productToEdit, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [hasVariants, setHasVariants] = useState(false);
  const [price, setPrice] = useState('');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantName, setVariantName] = useState('');
  const [variantPrice, setVariantPrice] = useState('');
  const [icon, setIcon] = useState('Package');
  const { addToast } = useToast();

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setHasVariants(productToEdit.hasVariants);
      setPrice(productToEdit.price?.toString() || '');
      setVariants(productToEdit.variants || []);
      setIcon(productToEdit.icon || 'Package');
    } else {
      setName('');
      setHasVariants(false);
      setPrice('');
      setVariants([]);
      setIcon('Package');
    }
  }, [productToEdit]);

  const handleAddVariant = () => {
    if (!variantName || !variantPrice || parseFloat(variantPrice) <= 0) {
      addToast('Please enter a valid variant name and price.', 'error');
      return;
    }
    const newVariant: Variant = {
      id: Date.now(),
      name: variantName,
      price: parseFloat(variantPrice),
    };
    setVariants([...variants, newVariant]);
    setVariantName('');
    setVariantPrice('');
  };

  const handleRemoveVariant = (id: number) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      addToast('Product name is required.', 'error');
      return;
    }
    if (!hasVariants && (!price || parseFloat(price) <= 0)) {
        addToast('Valid price is required for products without variants.', 'error');
        return;
    }
    if (hasVariants && variants.length === 0) {
        addToast('Please add at least one variant.', 'error');
        return;
    }

    const productData = {
      id: productToEdit?.id,
      name,
      hasVariants,
      price: hasVariants ? null : parseFloat(price),
      variants: hasVariants ? variants : [],
      icon,
    };
    onSave(productData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., A4 Bond Paper"
        required
      />
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Product Icon</label>
        <IconPicker selectedIcon={icon} onSelectIcon={setIcon} />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id="hasVariants"
          checked={hasVariants}
          onChange={(e) => setHasVariants(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="hasVariants" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          This product has variants (e.g., sizes, types)
        </label>
      </div>

      {!hasVariants ? (
        <Input
          label="Price (₱)"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0.01"
          required
        />
      ) : (
        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
          <h4 className="font-semibold text-slate-900 dark:text-slate-200">Product Variants</h4>
          <div className="flex items-end gap-2">
            <Input label="Variant Name" value={variantName} onChange={e => setVariantName(e.target.value)} placeholder="e.g., A4, B&W" />
            <Input label="Price (₱)" type="number" value={variantPrice} onChange={e => setVariantPrice(e.target.value)} placeholder="0.00" step="0.01" />
            <Button type="button" variant="secondary" onClick={handleAddVariant} className="h-10 shrink-0">
              <Plus size={16} />
            </Button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {variants.map(variant => (
              <div key={variant.id} className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-2 rounded-md">
                <span className="text-sm">{variant.name} - ₱{variant.price.toFixed(2)}</span>
                <Button type="button" variant="ghost" className="h-auto p-1" onClick={() => handleRemoveVariant(variant.id)}>
                  <Trash size={14} className="text-red-400" />
                </Button>
              </div>
            ))}
             {variants.length === 0 && <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">No variants added yet.</p>}
          </div>
        </div>
      )}

       <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button type="submit">{productToEdit ? 'Update Product' : 'Save Product'}</Button>
       </div>
    </form>
  );
};