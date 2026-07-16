import { Receipt, Routine, ShoppingItem, Store } from '../types';
import { uid } from '../utils/id';

/** Sensible starter routines so the app is useful on first launch. */
export function seedRoutines(): Routine[] {
  return [
    {
      id: uid(),
      name: 'Morning start',
      emoji: '☀️',
      color: '#E0A458',
      days: [1, 2, 3, 4, 5],
      time: '07:30',
      reminderEnabled: true,
      notificationIds: [],
      steps: [
        { id: uid(), text: 'Drink a glass of water' },
        { id: uid(), text: 'Take meds' },
        { id: uid(), text: 'Make the bed' },
        { id: uid(), text: 'Write today’s top 1 task' },
      ],
    },
    {
      id: uid(),
      name: 'Meds check',
      emoji: '💊',
      color: '#3BA99C',
      days: [0, 1, 2, 3, 4, 5, 6],
      time: '20:00',
      reminderEnabled: true,
      notificationIds: [],
      steps: [{ id: uid(), text: 'Take evening meds' }],
    },
    {
      id: uid(),
      name: 'Wind-down',
      emoji: '🌙',
      color: '#5B4B8A',
      days: [0, 1, 2, 3, 4, 5, 6],
      time: '22:00',
      reminderEnabled: false,
      notificationIds: [],
      steps: [
        { id: uid(), text: 'Phone on charger, out of reach' },
        { id: uid(), text: 'Lay out tomorrow’s clothes' },
        { id: uid(), text: '5 slow breaths' },
      ],
    },
  ];
}

/** Starter stores (no real coordinates until the user sets them here). */
export function seedStores(): Store[] {
  return [
    {
      id: uid(),
      name: 'Grocery Market',
      emoji: '🛒',
      color: '#3BA99C',
      location: null,
      radius: 150,
      geofenceEnabled: false,
      remindList: true,
      suggestRestock: true,
    },
    {
      id: uid(),
      name: 'Farmers Market',
      emoji: '🥕',
      color: '#7BA05B',
      location: null,
      radius: 200,
      geofenceEnabled: false,
      remindList: true,
      suggestRestock: false,
    },
  ];
}

export function seedList(): ShoppingItem[] {
  return [
    { id: uid(), name: 'Bananas', qty: 1, checked: false, storeId: null, source: 'manual' },
    { id: uid(), name: 'Oat milk', qty: 2, checked: false, storeId: null, source: 'manual' },
    { id: uid(), name: 'Coffee beans', qty: 1, checked: false, storeId: null, source: 'manual' },
  ];
}

/**
 * A couple of sample parsed receipts so spending + restock suggestions have
 * data to work with on first launch. `dateKey` is filled in by the caller so
 * the dates are recent (the seed can't call Date at import time cleanly).
 */
export function seedReceipts(recentKey: string, olderKey: string, priorWeekKey: string): Receipt[] {
  return [
    {
      id: uid(),
      storeName: 'Grocery Market',
      storeId: null,
      dateKey: recentKey,
      total: 24.36,
      source: 'parsed',
      items: [
        { id: uid(), name: 'Bananas', price: 1.29, qty: 1, size: '2 lb' },
        { id: uid(), name: 'Oat Milk', price: 3.99, qty: 2, size: '64 fl oz' },
        { id: uid(), name: 'Eggs', price: 4.49, qty: 1, size: '12 ct' },
        { id: uid(), name: 'Chicken Breast', price: 8.6, qty: 1, size: '1 lb' },
        { id: uid(), name: 'Spinach', price: 2.0, qty: 1, size: '5 oz' },
      ],
    },
    {
      id: uid(),
      storeName: 'Grocery Market',
      storeId: null,
      dateKey: olderKey,
      total: 18.72,
      source: 'parsed',
      items: [
        { id: uid(), name: 'Bananas', price: 1.35, qty: 1, size: '2 lb' },
        { id: uid(), name: 'Oat Milk', price: 3.89, qty: 1, size: '64 fl oz' },
        { id: uid(), name: 'Coffee Beans', price: 9.99, qty: 1, size: '12 oz' },
        { id: uid(), name: 'Eggs', price: 3.49, qty: 1, size: '12 ct' },
      ],
    },
    {
      // A second store so cross-store value comparison has something to compare.
      id: uid(),
      storeName: 'Farmers Market',
      storeId: null,
      dateKey: olderKey,
      total: 21.4,
      source: 'parsed',
      items: [
        { id: uid(), name: 'Bananas', price: 1.6, qty: 1, size: '2 lb' },
        { id: uid(), name: 'Oat Milk', price: 4.5, qty: 1, size: '32 fl oz' },
        { id: uid(), name: 'Eggs', price: 6.0, qty: 1, size: '12 ct' },
        { id: uid(), name: 'Chicken Breast', price: 7.2, qty: 1, size: '1 lb' },
      ],
    },
    {
      // Prior-week receipt so the spend mirror has a baseline to compare against.
      id: uid(),
      storeName: 'Grocery Market',
      storeId: null,
      dateKey: priorWeekKey,
      total: 41.18,
      source: 'parsed',
      items: [
        { id: uid(), name: 'Bananas', price: 1.29, qty: 1, size: '2 lb' },
        { id: uid(), name: 'Oat Milk', price: 3.99, qty: 2, size: '64 fl oz' },
        { id: uid(), name: 'Eggs', price: 4.49, qty: 1, size: '12 ct' },
        { id: uid(), name: 'Chicken Breast', price: 8.6, qty: 1, size: '1 lb' },
        { id: uid(), name: 'Coffee Beans', price: 9.99, qty: 1, size: '12 oz' },
        { id: uid(), name: 'Olive Oil', price: 12.82, qty: 1, size: '16 fl oz' },
      ],
    },
  ];
}

/** A realistic receipt string for the "try a sample" scan flow. */
export const SAMPLE_RECEIPT_TEXT = `GROCERY MARKET
123 Main Street
07/15/2026  14:32

Bananas                 1.29
2 Oat Milk              7.98
Eggs Large Dozen        4.49
Chicken Breast          8.60
Spinach Organic         2.00
Sourdough Bread         3.50
SUBTOTAL               27.86
TAX                     1.53
TOTAL                  29.39
VISA                   29.39
Thank you for shopping!`;
