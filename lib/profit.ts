export type ImportRow = {
  product: string;
  quantity: number;
  unitCost: number;
  shippingCost: number;
  taxCost: number;
};

export type SaleRow = {
  product: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  otherCost: number;
};

export function importTotal(x: ImportRow) {
  return x.quantity * x.unitCost + x.shippingCost + x.taxCost;
}

export function saleRevenue(x: SaleRow) {
  return x.quantity * x.unitPrice - x.discount;
}

export function saleCost(x: SaleRow, estimatedUnitCost: number) {
  return x.quantity * estimatedUnitCost + x.otherCost;
}

export function grossProfit(revenue: number, cost: number) {
  return revenue - cost;
}

export function margin(revenue: number, profit: number) {
  return revenue === 0 ? 0 : (profit / revenue) * 100;
}

export function calculateLedgerProfit(imports: ImportRow[], sales: SaleRow[]) {
  const purchasesByProduct = new Map<string, {
    product: string;
    quantity: number;
    landedCost: number;
  }>();
  const salesByProduct = new Map<string, {
    product: string;
    quantity: number;
    revenue: number;
    otherCosts: number;
  }>();

  for (const row of imports) {
    const key = row.product.trim().toLocaleLowerCase();
    const purchase = purchasesByProduct.get(key) ?? {
      product: row.product.trim(),
      quantity: 0,
      landedCost: 0,
    };
    purchase.quantity += row.quantity;
    purchase.landedCost += importTotal(row);
    purchasesByProduct.set(key, purchase);
  }

  for (const row of sales) {
    const key = row.product.trim().toLocaleLowerCase();
    const sale = salesByProduct.get(key) ?? {
      product: row.product.trim(),
      quantity: 0,
      revenue: 0,
      otherCosts: 0,
    };
    sale.quantity += row.quantity;
    sale.revenue += saleRevenue(row);
    sale.otherCosts += row.otherCost;
    salesByProduct.set(key, sale);
  }

  const products = [...salesByProduct.entries()].map(([key, sale]) => {
    const purchase = purchasesByProduct.get(key);
    const averageLandedUnitCost = purchase && purchase.quantity > 0
      ? purchase.landedCost / purchase.quantity
      : null;
    const estimatedCOGS = (averageLandedUnitCost ?? 0) * sale.quantity;
    const estimatedTotalCosts = estimatedCOGS + sale.otherCosts;

    return {
      product: purchase?.product ?? sale.product,
      quantity: sale.quantity,
      revenue: sale.revenue,
      averageLandedUnitCost,
      estimatedCOGS,
      otherCosts: sale.otherCosts,
      estimatedTotalCosts,
      estimatedProfit: sale.revenue - estimatedTotalCosts,
      importedQuantity: purchase?.quantity ?? 0,
      uncosted: averageLandedUnitCost === null,
      quantityShortfall: Math.max(0, sale.quantity - (purchase?.quantity ?? 0)),
    };
  }).sort((left, right) => right.revenue - left.revenue);

  const totalImportSpend = imports.reduce((total, row) => total + importTotal(row), 0);
  const quantityImported = imports.reduce((total, row) => total + row.quantity, 0);
  const revenue = products.reduce((total, product) => total + product.revenue, 0);
  const quantitySold = products.reduce((total, product) => total + product.quantity, 0);
  const estimatedCOGS = products.reduce((total, product) => total + product.estimatedCOGS, 0);
  const salesOtherCosts = products.reduce((total, product) => total + product.otherCosts, 0);
  const estimatedTotalCosts = estimatedCOGS + salesOtherCosts;
  const estimatedProfit = revenue - estimatedTotalCosts;

  return {
    imports: { count: imports.length, total: totalImportSpend, quantity: quantityImported },
    sales: { count: sales.length, revenue, quantity: quantitySold },
    estimatedCOGS,
    salesOtherCosts,
    estimatedTotalCosts,
    estimatedProfit,
    estimatedMarginPct: margin(revenue, estimatedProfit),
    uncostedProducts: products.filter((product) => product.uncosted).map((product) => product.product),
    quantityShortfalls: products
      .filter((product) => product.quantityShortfall > 0)
      .map(({ product, importedQuantity, quantity, quantityShortfall }) => ({
        product,
        importedQuantity,
        soldQuantity: quantity,
        quantityShortfall,
      })),
    products,
  };
}