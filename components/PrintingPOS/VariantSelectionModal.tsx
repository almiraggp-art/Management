
import React, { useState, useEffect } from 'react';
import { Product, Variant } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useToast } from '../../contexts/ToastContext';
import { ShoppingCart } from 'lucide-react';

interface VariantSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
    onAddToCart: (product: Product, variant: Variant, quantity: number) => void;
}

export const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({ isOpen, onClose, product, onAddToCart }) => {
    const [selectedVariantId, setSelectedVariantId] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(1);
    const { addToast } = useToast();

    useEffect(() => {
        if (product.variants.length > 0) {
            setSelectedVariantId(product.variants[0].id.toString());
        }
        setQuantity(1);
    }, [product]);

    const handleAddToCartClick = () => {
        if (!selectedVariantId) {
            addToast('Please select a variant.', 'error');
            return;
        }
        if (quantity < 1) {
            addToast('Quantity must be at least 1.', 'error');
            return;
        }

        const selectedVariant = product.variants.find(v => v.id.toString() === selectedVariantId);
        if (selectedVariant) {
            onAddToCart(product, selectedVariant, quantity);
            onClose();
        }
    };

    const variantOptions = product.variants.map(variant => ({
        value: variant.id.toString(),
        label: `${variant.name} - ₱${variant.price.toFixed(2)}`
    }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Select Variant for: ${product.name}`}
        >
            <div className="space-y-4">
                <Select
                    label="Available Variants"
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    options={variantOptions}
                />
                <Input
                    label="Quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full"
                />
            </div>
            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-700">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="button" onClick={handleAddToCartClick}>
                    <ShoppingCart size={16} className="mr-2" />
                    Add to Cart
                </Button>
            </div>
        </Modal>
    );
};
