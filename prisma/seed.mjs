import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const count = Number.parseInt(process.env.FAKE_DATA_COUNT ?? "1000", 10);

if (!Number.isSafeInteger(count) || count < 0) {
  throw new Error("FAKE_DATA_COUNT must be a non-negative integer");
}

const products = [
  "Ceramic Mug",
  "Cotton Tote",
  "Desk Lamp",
  "Notebook Set",
  "Steel Bottle",
  "Wool Throw",
  "Wooden Tray",
  "Glass Vase",
];

const productCosts = new Map([
  ["Ceramic Mug", 8],
  ["Cotton Tote", 6],
  ["Desk Lamp", 24],
  ["Notebook Set", 5],
  ["Steel Bottle", 13],
  ["Wool Throw", 30],
  ["Wooden Tray", 16],
  ["Glass Vase", 18],
]);

const suppliers = [
  "Northwind Supply Co.",
  "Cedar Field Goods",
  "Harborline Wholesale",
  "Brightpath Materials",
  "Mosaic Ridge Trading",
  "Evergreen Workshop",
  "Copperleaf Distributors",
  "Bluebird Product Works",
];

const dateWithinPastYear = () => {
  const daysAgo = Math.floor(Math.random() * 365);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(12, 0, 0, 0);
  return date;
};

const amount = (min, max) =>
  Number((min + Math.random() * (max - min)).toFixed(2));

const importCost = (product) => {
  const baseCost = productCosts.get(product);
  return amount(baseCost * 0.99, baseCost * 1.01);
};

try {
  const existingImports = await db.importEntry.findMany({
    where: { notes: { startsWith: "Synthetic demo import" } },
    select: { id: true, product: true },
  });
  await db.$transaction(existingImports.map((row) => db.importEntry.update({
    where: { id: row.id },
    data: {
      unitCost: importCost(row.product),
      shippingCost: amount(0, 8),
      taxCost: amount(0, 5),
    },
  })));

  if (count > 0) {
    await db.importEntry.createMany({
      data: Array.from({ length: count }, (_, index) => {
        const product = products[index % products.length];
        return {
          date: dateWithinPastYear(),
          supplier: suppliers[index % suppliers.length],
          product,
          quantity: Number((1 + Math.random() * 49).toFixed(3)),
          unitCost: importCost(product),
          shippingCost: amount(0, 8),
          taxCost: amount(0, 5),
          notes: `Synthetic demo import ${index + 1}`,
        };
      }),
    });
  }

  const imports = await db.importEntry.findMany({
    select: { product: true, quantity: true, unitCost: true, shippingCost: true, taxCost: true },
  });
  const landedCosts = new Map();
  for (const row of imports) {
    const current = landedCosts.get(row.product) ?? { quantity: 0, total: 0 };
    const quantity = Number(row.quantity);
    current.quantity += quantity;
    current.total += quantity * Number(row.unitCost) + Number(row.shippingCost) + Number(row.taxCost);
    landedCosts.set(row.product, current);
  }

  const salePrices = new Map(products.map((product) => {
    const landed = landedCosts.get(product);
    const averageLandedCost = landed?.quantity > 0
      ? landed.total / landed.quantity
      : productCosts.get(product);
    return [product, amount(averageLandedCost * 1.19, averageLandedCost * 1.21)];
  }));

  for (const product of products) {
    const unitPrice = salePrices.get(product);
    await db.saleEntry.updateMany({
      where: { product, notes: { startsWith: "Synthetic demo sale" } },
      data: {
        unitPrice,
        discount: amount(0, unitPrice * 0.005),
        otherCost: amount(0, 2),
      },
    });
  }

  if (count > 0) {
    await db.saleEntry.createMany({
      data: Array.from({ length: count }, (_, index) => {
        const product = products[index % products.length];
        const unitPrice = salePrices.get(product);
        return {
          date: dateWithinPastYear(),
          customer: `Demo Customer ${(index % 250) + 1}`,
          product,
          quantity: Number((1 + Math.random() * 9).toFixed(3)),
          unitPrice,
          discount: amount(0, unitPrice * 0.005),
          otherCost: amount(0, 2),
          notes: `Synthetic demo sale ${index + 1}`,
        };
      }),
    });
  }

  console.log(count === 0
    ? "Repriced existing synthetic imports and sales."
    : `Inserted ${count} synthetic imports and ${count} synthetic sales.`);
} finally {
  await db.$disconnect();
}