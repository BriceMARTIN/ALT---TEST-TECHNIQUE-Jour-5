import { readCsvRows } from './csv';
import { Customer, Order, Product, Promotion, ShippingZone } from '../types';

const parseNumber = (value: string, fallback = 0): number => {
  const result = Number(value);
  return Number.isNaN(result) ? fallback : result;
};

export const fetchCustomers = (path: string): Record<string, Customer> => {
  const customers: Record<string, Customer> = {};
  for (const parts of readCsvRows(path)) {
    customers[parts[0]] = {
      id: parts[0],
      name: parts[1],
      level: parts[2] || 'BASIC',
      shipping_zone: parts[3] || 'ZONE1',
      currency: parts[4] || 'EUR',
    };
  }
  return customers;
};

export const fetchProducts = (path: string): Record<string, Product> => {
  const products: Record<string, Product> = {};
  for (const parts of readCsvRows(path)) {
    products[parts[0]] = {
      id: parts[0],
      name: parts[1],
      category: parts[2],
      price: parseNumber(parts[3]),
      weight: parseNumber(parts[4], 1.0),
      taxable: parts[5] === 'true',
    };
  }
  return products;
};

export const fetchShippingZones = (path: string): Record<string, ShippingZone> => {
  const shippingZones: Record<string, ShippingZone> = {};
  for (const parts of readCsvRows(path)) {
    shippingZones[parts[0]] = {
      zone: parts[0],
      base: parseNumber(parts[1]),
      per_kg: parseNumber(parts[2], 0.5),
    };
  }
  return shippingZones;
};

export const fetchPromotions = (path: string): Record<string, Promotion> => {
  const promotions: Record<string, Promotion> = {};
  try {
    for (const parts of readCsvRows(path)) {
      promotions[parts[0]] = {
        code: parts[0],
        type: parts[1],
        value: parts[2],
        active: parts[3] !== 'false',
      };
    }
  } catch (err) {
    console.info('No promotions file found, skipping this step.');
  }
  return promotions;
};

export const fetchOrders = (path: string): Order[] =>
  readCsvRows(path).map(parts => ({
    id: parts[0],
    customer_id: parts[1],
    product_id: parts[2],
    qty: parseNumber(parts[3]),
    unit_price: parseNumber(parts[4]),
    date: parts[5],
    promo_code: parts[6] || '',
    time: parts[7] || '12:00',
  }));
