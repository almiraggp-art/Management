
import React from 'react';

export type PageType = 'dashboard' | 'business';
export type Theme = 'dark' | 'light';

// Printing POS Types
export interface Variant {
    id: number;
    name: string;
    price: number;
}

export interface Product {
    id: number;
    name:string;
    hasVariants: boolean;
    price: number | null;
    variants: Variant[];
    icon?: string;
}

export interface CartItem {
    id: number;
    productId: number;
    productName: string;
    variantName: string | null;
    price: number;
    quantity: number;
    icon?: string;
}

export interface POSTransaction {
    id: number;
    date: string;
    items: CartItem[];
    total: number;
}

export interface POSSales {
    daily: number;
    total: number;
}

export type DateFilterType = 'today' | 'week' | 'month' | 'custom';

export type AnalyticsPeriod = 'week' | 'month' | 'year';

export interface ChartDataPoint {
    name: string;
    sales: number;
}


// Rental System Types
export interface Customer {
    purchase: number;
    points: number;
    redeemed: number;
}

export interface RentalTransaction {
    type: 'add' | 'redeem' | 'restore' | 'adjust';
    name: string;
    amount?: number;
    points?: number;
    timestamp: string;
}

export interface DeletedCustomerData {
    data: Customer;
    history: RentalTransaction[];
}

export interface ParkedSession {
    id: string;
    customerName: string;
    remainingTime: number; // ms
    originalStationName: string;
    amountPaid: number;
    parkedAt: string; // ISO String
}

export interface Station {
    id: number;
    name: string;
    status: 'available' | 'occupied';
    currentSession?: {
        customerName: string;
        startTime: string; // ISO String
        endTime: string; // ISO String
        amountPaid: number;
        pausedAt?: number; // Timestamp when pause started
    };
}

export interface Promo {
    id: string;
    name: string;
    price: number;
    minutes: number;
}

export interface RentalSettings {
    minutesPerPeso: number; // Base rate (e.g., 6 mins per 1 peso)
    pointsPerPeso: number; // Points earned per peso (e.g., 0.05)
    minutesPerPoint: number; // Minutes given per point redeemed (e.g., 6)
    promos: Promo[];
}

// Notification System Types
export type NotificationType = 'printing' | 'rental';
export type NotificationEvent = 'add_product' | 'delete_product' | 'sale' | 'add_customer' | 'add_spent' | 'redeem' | 'adjust_points';

export interface Notification {
  id: number;
  message: string;
  timestamp: string;
  type: NotificationType;
  event: NotificationEvent;
  read: boolean;
}

// Dashboard Types
export interface CombinedTransaction {
    id: string;
    type: 'printing' | 'rental';
    timestamp: string;
    description: string;
    value: string;
    Icon: React.ElementType;
    iconColor: string;
}
