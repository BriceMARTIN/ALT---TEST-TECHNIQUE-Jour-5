import { Order, Product } from '../../src/types';

const defaultOrder: Order = {
  id: 'O1',
  customer_id: 'C1',
  product_id: 'P1',
  qty: 1,
  unit_price: 0,
  date: '2026-05-27',
  promo_code: '',
  time: '10:00',
};

export const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  ...defaultOrder,
  ...overrides,
});

const defaultProduct: Product = {
  id: 'P1',
  name: 'Product 1',
  category: 'A',
  price: 0,
  weight: 1,
  taxable: true,
};

export const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  ...defaultProduct,
  ...overrides,
});

export const shippingZones = {
  Z1: { zone: 'Z1', base: 5.0, per_kg: 0.5 },
};
