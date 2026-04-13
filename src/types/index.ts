export type Customer = {
  id: string;
  name: string;
  level: string;
  shipping_zone: string;
  currency: string;
};

export type Order = {
  id: string;
  customer_id: string;
  product_id: string;
  qty: number;
  unit_price: number;
  date: string;
  promo_code: string;
  time: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  weight: number;
  taxable: boolean;
};

export type ShippingZone = {
  zone: string;
  base: number;
  per_kg: number;
};

export type Promotion = {
  code: string;
  type: string;
  value: string;
  active: boolean;
};
