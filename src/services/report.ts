import { Customer, Order, Product, Promotion, ShippingZone } from '../types';
import { HANDLING_FEE, LOYALTY_RATIO, MAX_DISCOUNT, SHIPPING_LIMIT, TAX } from '../constants';

export type CustomerTotals = {
  subtotal: number;
  items: Order[];
  weight: number;
  morningBonus: number;
};

export type ReportResult = {
  lines: string[];
  jsonData: Array<Record<string, string | number>>;
  grandTotal: number;
  totalTaxCollected: number;
};

// Round a numeric value to two decimal places for currency-style totals.
const roundTwoDecimals = (value: number): number => Math.round(value * 100) / 100;

// Aggregate loyalty points per customer from order quantity and price.
export const buildLoyaltyPoints = (orders: Order[]): Record<string, number> => {
  return orders.reduce<Record<string, number>>((acc, order) => {
    const id = order.customer_id;
    const points = order.qty * order.unit_price * LOYALTY_RATIO;
    acc[id] = (acc[id] || 0) + points;
    return acc;
  }, {});
};

// Aggregate orders by customer, calculating subtotal, weight and morning bonus.
export const calculateOrderTotals = (
  orders: Order[],
  products: Record<string, Product>,
  promotions: Record<string, Promotion>
): Record<string, CustomerTotals> => {
  return orders.reduce<Record<string, CustomerTotals>>((acc, order) => {
    const product = products[order.product_id];
    const basePrice = product?.price ?? order.unit_price;
    const promo = order.promo_code ? promotions[order.promo_code] : undefined;

    const discountRate = promo?.active && promo.type === 'PERCENTAGE'
      ? parseFloat(promo.value) / 100
      : 0;

    const fixedDiscount = promo?.active && promo.type === 'FIXED'
      ? parseFloat(promo.value)
      : 0;

    const lineTotal = order.qty * basePrice * (1 - discountRate) - fixedDiscount * order.qty;
    const hour = parseInt(order.time.split(':')[0], 10) || 12;
    const morningBonus = hour < 10 ? lineTotal * 0.03 : 0;

    const existing = acc[order.customer_id] ?? {
      subtotal: 0,
      items: [],
      weight: 0,
      morningBonus: 0,
    };

    existing.subtotal += lineTotal - morningBonus;
    existing.weight += (product?.weight ?? 1.0) * order.qty;
    existing.items.push(order);
    existing.morningBonus += morningBonus;

    acc[order.customer_id] = existing;
    return acc;
  }, {});
};

// Compute the volume-based discount using thresholds and premium level rules.
export const calculateVolumeDiscount = (subtotal: number, level: string): number => {
  let discount = 0;
  if (subtotal > 50) {
    discount = subtotal * 0.05;
  }
  if (subtotal > 100) {
    discount = subtotal * 0.10;
  }
  if (subtotal > 500) {
    discount = subtotal * 0.15;
  }
  if (subtotal > 1000 && level === 'PREMIUM') {
    discount = subtotal * 0.20;
  }
  return discount;
};

// Apply a weekend bonus multiplier when the first order date is on Saturday or Sunday.
export const applyWeekendBonus = (discount: number, firstOrderDate: string): number => {
  const dayOfWeek = firstOrderDate ? new Date(firstOrderDate).getDay() : 0;
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return discount * 1.05;
  }
  return discount;
};

// Calculate a loyalty discount from accumulated customer points.
export const calculateLoyaltyDiscount = (points: number): number => {
  let loyaltyDiscount = 0;
  if (points > 100) {
    loyaltyDiscount = Math.min(points * 0.1, 50);
  }
  if (points > 500) {
    loyaltyDiscount = Math.min(points * 0.15, 100);
  }
  return loyaltyDiscount;
};

// Enforce the maximum allowed total discount and scale components proportionally.
export const enforceDiscountCap = (
  discount: number,
  loyaltyDiscount: number
): { totalDiscount: number; discount: number; loyaltyDiscount: number } => {
  const totalDiscount = discount + loyaltyDiscount;
  if (totalDiscount <= MAX_DISCOUNT) {
    return { totalDiscount, discount, loyaltyDiscount };
  }

  const ratio = MAX_DISCOUNT / totalDiscount;
  return {
    totalDiscount: MAX_DISCOUNT,
    discount: discount * ratio,
    loyaltyDiscount: loyaltyDiscount * ratio,
  };
};

// Calculate tax using either a global taxable amount or per-item tax when necessary.
export const calculateTax = (
  subtotal: number,
  totalDiscount: number,
  items: Order[],
  products: Record<string, Product>
): number => {
  const taxableAmount = subtotal - totalDiscount;
  const allTaxable = items.every(item => products[item.product_id]?.taxable !== false);

  let tax = 0;
  if (allTaxable) {
    tax = taxableAmount * TAX;
  } else {
    for (const item of items) {
      const product = products[item.product_id];
      if (product?.taxable !== false) {
        const price = product.price ?? item.unit_price;
        tax += item.qty * price * TAX;
      }
    }
  }

  return roundTwoDecimals(tax);
};

// Compute shipping cost using zone, weight thresholds, and free-shipping rules.
export const calculateShipping = (
  subtotal: number,
  weight: number,
  zone: string,
  shippingZones: Record<string, ShippingZone>
): number => {
  const shipZone = shippingZones[zone] ?? { zone, base: 5.0, per_kg: 0.5 };
  if (subtotal >= SHIPPING_LIMIT) {
    return weight > 20 ? roundTwoDecimals((weight - 20) * 0.25) : 0;
  }

  if (weight > 10) {
    return roundTwoDecimals(shipZone.base + (weight - 10) * shipZone.per_kg);
  }

  if (weight > 5) {
    return roundTwoDecimals(shipZone.base + (weight - 5) * 0.3);
  }

  const base = shipZone.base;
  return roundTwoDecimals((zone === 'ZONE3' || zone === 'ZONE4') ? base * 1.2 : base);
};

// Determine handling fees based on the number of items in the order.
export const calculateHandling = (itemCount: number): number => {
  if (itemCount > 20) {
    return HANDLING_FEE * 2;
  }
  if (itemCount > 10) {
    return HANDLING_FEE;
  }
  return 0;
};

// Return the currency conversion rate used for output totals.
export const getCurrencyRate = (currency: string): number => {
  if (currency === 'USD') {
    return 1.1;
  }
  if (currency === 'GBP') {
    return 0.85;
  }
  return 1;
};

export const buildReport = (
  customers: Record<string, Customer>,
  products: Record<string, Product>,
  promotions: Record<string, Promotion>,
  shippingZones: Record<string, ShippingZone>,
  orders: Order[]
): ReportResult => {
  const loyaltyPoints = buildLoyaltyPoints(orders);
  const totalsByCustomer = calculateOrderTotals(orders, products, promotions);
  const sortedCustomerIds = Object.keys(totalsByCustomer).sort();

  const lines: string[] = [];
  const jsonData: Array<Record<string, string | number>> = [];
  let grandTotal = 0;
  let totalTaxCollected = 0;

  for (const customerId of sortedCustomerIds) {
    const totals = totalsByCustomer[customerId];
    const customer = customers[customerId];

    const name = customer?.name ?? 'Unknown';
    const level = customer?.level ?? 'BASIC';
    const zone = customer?.shipping_zone ?? 'ZONE1';
    const currency = customer?.currency ?? 'EUR';

    const volumeDiscount = calculateVolumeDiscount(totals.subtotal, level);
    const firstOrderDate = totals.items[0]?.date ?? '';
    const weekendDiscount = applyWeekendBonus(volumeDiscount, firstOrderDate);
    const loyaltyDiscount = calculateLoyaltyDiscount(loyaltyPoints[customerId] ?? 0);
    const { totalDiscount, discount, loyaltyDiscount: adjustedLoyaltyDiscount } = enforceDiscountCap(weekendDiscount, loyaltyDiscount);

    const tax = calculateTax(totals.subtotal, totalDiscount, totals.items, products);
    const shipping = calculateShipping(totals.subtotal, totals.weight, zone, shippingZones);
    const handling = calculateHandling(totals.items.length);
    const currencyRate = getCurrencyRate(currency);
    const total = roundTwoDecimals((totals.subtotal - totalDiscount + tax + shipping + handling) * currencyRate);

    grandTotal += total;
    totalTaxCollected += tax * currencyRate;

    lines.push(`Customer: ${name} (${customerId})`);
    lines.push(`Level: ${level} | Zone: ${zone} | Currency: ${currency}`);
    lines.push(`Subtotal: ${totals.subtotal.toFixed(2)}`);
    lines.push(`Discount: ${totalDiscount.toFixed(2)}`);
    lines.push(`  - Volume discount: ${discount.toFixed(2)}`);
    lines.push(`  - Loyalty discount: ${adjustedLoyaltyDiscount.toFixed(2)}`);
    if (totals.morningBonus > 0) {
      lines.push(`  - Morning bonus: ${totals.morningBonus.toFixed(2)}`);
    }
    lines.push(`Tax: ${(tax * currencyRate).toFixed(2)}`);
    lines.push(`Shipping (${zone}, ${totals.weight.toFixed(1)}kg): ${shipping.toFixed(2)}`);
    if (handling > 0) {
      lines.push(`Handling (${totals.items.length} items): ${handling.toFixed(2)}`);
    }
    lines.push(`Total: ${total.toFixed(2)} ${currency}`);
    lines.push(`Loyalty Points: ${Math.floor(loyaltyPoints[customerId] ?? 0)}`);
    lines.push('');

    jsonData.push({
      customer_id: customerId,
      name,
      total,
      currency,
      loyalty_points: Math.floor(loyaltyPoints[customerId] ?? 0),
    });
  }

  lines.push(`Grand Total: ${roundTwoDecimals(grandTotal).toFixed(2)} EUR`);
  lines.push(`Total Tax Collected: ${roundTwoDecimals(totalTaxCollected).toFixed(2)} EUR`);

  // Return the assembled report with text lines, JSON payload, and summary totals.
  return {
    lines,
    jsonData,
    grandTotal: roundTwoDecimals(grandTotal),
    totalTaxCollected: roundTwoDecimals(totalTaxCollected),
  };
};
