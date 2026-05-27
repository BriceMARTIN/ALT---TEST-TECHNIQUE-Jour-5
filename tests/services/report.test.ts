import {
  calculateVolumeDiscount,
  calculateTax,
  calculateShipping,
  buildLoyaltyPoints,
  getCurrencyRate,
} from '../../src/services/report';
import { makeOrder, makeProduct, shippingZones } from '../fixtures/report.fixtures';

describe('calculateVolumeDiscount', () => {
  it('should return 0 for subtotal less than 50', () => {
    expect(calculateVolumeDiscount(5, 'BASIC')).toBe(0);
  });

  it('should return 5% for subtotal between 50 and 100', () => {
    expect(calculateVolumeDiscount(80, 'BASIC')).toBe(4);
  });

  it('should return 10% for subtotal between 100 and 500', () => {
    expect(calculateVolumeDiscount(300, 'BASIC')).toBe(30);
  });

  it('should return 15% for subtotal above 500', () => {
    expect(calculateVolumeDiscount(600, 'BASIC')).toBe(90);
  });

  it('should return 20% for subtotal above 1000 and premium user', () => {
    expect(calculateVolumeDiscount(1200, 'PREMIUM')).toBe(240);
  });

  it('should only return 15% for subtotal above 1000 and basic user', () => {
    expect(calculateVolumeDiscount(1200, 'BASIC')).toBe(180);
  });
});

describe('calculateTax', () => {
  it('should return correct tax when all items are taxable', () => {
    const items = [
      makeOrder({ id: 'O1', qty: 2, unit_price: 10 }),
    ];
    const products = {
      P1: makeProduct({ id: 'P1', price: 10, taxable: true }),
    };

    expect(calculateTax(100, 10, items, products)).toBe(18);
  });

  it('should return correct tax when not all items are taxable', () => {
    const items = [
      makeOrder({ id: 'O1', product_id: 'P1', qty: 2, unit_price: 20 }),
      makeOrder({ id: 'O2', product_id: 'P2', qty: 1, unit_price: 5, time: '11:00' }),
    ];
    const products = {
      P1: makeProduct({ id: 'P1', price: 20, taxable: true }),
      P2: makeProduct({ id: 'P2', price: 5, taxable: false }),
    };

    expect(calculateTax(100, 10, items, products)).toBe(8);
  });

  it('should return 0 when no items are taxable', () => {
    const items = [
      makeOrder({ id: 'O1', qty: 3, unit_price: 15 }),
    ];
    const products = {
      P1: makeProduct({ id: 'P1', price: 15, taxable: false }),
    };

    expect(calculateTax(100, 10, items, products)).toBe(0);
  });

  it('should correctly round tax to two decimals for fractional results', () => {
    const items = [
      makeOrder({ id: 'O1', product_id: 'P1', qty: 1, unit_price: 10.333 }),
      makeOrder({ id: 'O2', product_id: 'P2', qty: 1, unit_price: 5, time: '11:00' }),
    ];
    const products = {
      P1: makeProduct({ id: 'P1', price: 10.333, taxable: true }),
      P2: makeProduct({ id: 'P2', price: 5, taxable: false }),
    };

    expect(calculateTax(100, 0, items, products)).toBe(2.07);
  });
});

describe('calculateShipping', () => {


  it('should return base shipping when weight is under 5kg', () => {
    expect(calculateShipping(40, 4, 'Z1', shippingZones)).toBe(5);
  });

  it('should add surcharge for ZONE3/ZONE4 when weight is under 5kg', () => {
    expect(calculateShipping(40, 4, 'ZONE3', shippingZones)).toBe(6);
  });

  it('should return correct shipping when weight is between 5 and 10kg', () => {
    expect(calculateShipping(40, 8.333, 'Z1', shippingZones)).toBe(6);
  });

  it('should return correct shipping when weight is between 10 and 20kg', () => {
    expect(calculateShipping(40, 12, 'Z1', shippingZones)).toBe(6);
  });

  it('should return correct shipping when weight is above 20kg', () => {
    expect(calculateShipping(60, 24, 'Z1', shippingZones)).toBe(1);
  });

  it('should return 0 shipping when subtotal is >= SHIPPING_LIMIT', () => {
    expect(calculateShipping(60, 15, 'Z1', shippingZones)).toBe(0);
  });

  it('should correctly round shipping to two decimals for fractional rates', () => {
    expect(calculateShipping(60, 20.333, 'Z1', shippingZones)).toBe(0.08);
  });
});

describe('buildLoyaltyPoints', () => {
  it('should return an empty object when there are no orders', () => {
    expect(buildLoyaltyPoints([])).toEqual({});
  });

  it('should calculate loyalty points for a single order', () => {
    const orders = [
      makeOrder({ id: 'O1', customer_id: 'C1', qty: 10, unit_price: 10 }),
    ];

    expect(buildLoyaltyPoints(orders)).toEqual({ C1: 1 });
  });

  it('should aggregate loyalty points across multiple orders for the same customer', () => {
    const orders = [
      makeOrder({ id: 'O1', customer_id: 'C1', qty: 5, unit_price: 10, time: '09:00' }),
      makeOrder({ id: 'O2', customer_id: 'C1', product_id: 'P2', qty: 10, unit_price: 10, time: '11:00' }),
    ];

    expect(buildLoyaltyPoints(orders)).toEqual({ C1: 1.5 });
  });

  it('should calculate loyalty points separately for multiple customers', () => {
    const orders = [
      makeOrder({ id: 'O1', customer_id: 'C1', qty: 10, unit_price: 10 }),
      makeOrder({ id: 'O2', customer_id: 'C2', product_id: 'P2', qty: 25, unit_price: 4, time: '11:00' }),
      makeOrder({ id: 'O3', customer_id: 'C1', product_id: 'P3', qty: 20, unit_price: 5, time: '12:00' }),
    ];

    expect(buildLoyaltyPoints(orders)).toEqual({ C1: 2, C2: 1 });
  });
});

describe('getCurrencyRate', () => {
  it('should return 1.1 for USD', () => {
    expect(getCurrencyRate('USD')).toBe(1.1);
  });

  it('should return 0.85 for GBP', () => {
    expect(getCurrencyRate('GBP')).toBe(0.85);
  });

  it('should return 1 for other currencies', () => {
    expect(getCurrencyRate('EUR')).toBe(1);
    expect(getCurrencyRate('JPY')).toBe(1);
  });
});
