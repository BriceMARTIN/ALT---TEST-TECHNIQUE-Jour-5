import * as fs from 'fs';
import * as path from 'path';
import { Customer, Order, Product, Promotion, ShippingZone } from './types';
import { fetchCustomers, fetchProducts, fetchPromotions, fetchShippingZones, fetchOrders } from './utils/fetch';
import { buildReport, ReportResult } from './services/report';

const run = (): string => {
  const base = __dirname;

  const customers: Record<string, Customer> = fetchCustomers(path.join(base, 'data', 'customers.csv'));
  const products: Record<string, Product> = fetchProducts(path.join(base, 'data', 'products.csv'));
  const shippingZones: Record<string, ShippingZone> = fetchShippingZones(path.join(base, 'data', 'shipping_zones.csv'));
  const orders: Order[] = fetchOrders(path.join(base, 'data', 'orders.csv'));
  const promotions: Record<string, Promotion> = fetchPromotions(path.join(base, 'data', 'promotions.csv'));

  const report: ReportResult = buildReport(customers, products, promotions, shippingZones, orders);
  const result = report.lines.join('\n');

  console.log(result);
  fs.writeFileSync(path.join(base, 'output.json'), JSON.stringify(report.jsonData, null, 2));

  return result;
};

if (require.main === module) {
  run();
}

export { run };
