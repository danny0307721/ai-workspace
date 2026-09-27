import { db } from "@/lib/db";
import { generateSalesTips } from "@/lib/llm";
import { calculateLedgerProfit } from "@/lib/profit";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const startValue = params.get("start");
  const endValue = params.get("end");
  const startDate = startValue ? new Date(`${startValue}T00:00:00`) : null;
  const endDate = endValue ? new Date(`${endValue}T00:00:00`) : null;
  const hasValidRange = Boolean(
    startDate && endDate
      && !Number.isNaN(startDate.getTime())
      && !Number.isNaN(endDate.getTime())
      && startDate <= endDate,
  );
  const dateFilter = hasValidRange
    ? { gte: startDate!, lt: new Date(endDate!.getTime() + 24 * 60 * 60 * 1000) }
    : undefined;
  const [imports, sales, allImports, allSales] = await Promise.all([
    db.importEntry.findMany({ where: { date: dateFilter } }),
    db.saleEntry.findMany({ where: { date: dateFilter } }),
    db.importEntry.findMany(),
    db.saleEntry.findMany(),
  ]);

  const summary = calculateLedgerProfit(
    imports.map((row) => ({
      product: row.product,
      quantity: Number(row.quantity),
      unitCost: Number(row.unitCost),
      shippingCost: Number(row.shippingCost),
      taxCost: Number(row.taxCost),
    })),
    sales.map((row) => ({
      product: row.product,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unitPrice),
      discount: Number(row.discount),
      otherCost: Number(row.otherCost),
    }))
  );

  const inventoryMap = new Map<string, { product: string; importedQuantity: number; soldQuantity: number }>();
  allImports.forEach((row) => {
    const key = row.product.trim().toLocaleLowerCase();
    const item = inventoryMap.get(key) ?? { product: row.product.trim(), importedQuantity: 0, soldQuantity: 0 };
    item.importedQuantity += Number(row.quantity);
    inventoryMap.set(key, item);
  });
  allSales.forEach((row) => {
    const key = row.product.trim().toLocaleLowerCase();
    const item = inventoryMap.get(key) ?? { product: row.product.trim(), importedQuantity: 0, soldQuantity: 0 };
    item.soldQuantity += Number(row.quantity);
    inventoryMap.set(key, item);
  });
  const inventory = [...inventoryMap.values()]
    .map((item) => ({
      ...item,
      onHand: item.importedQuantity - item.soldQuantity,
      stockStatus: item.importedQuantity - item.soldQuantity <= 0 ? "out_of_stock" : item.importedQuantity - item.soldQuantity <= item.soldQuantity * 0.25 ? "low_stock" : "in_stock",
    }))
    .sort((left, right) => left.onHand - right.onHand);
  const importRecommendations = inventory
    .filter((item) => item.stockStatus !== "in_stock")
    .map((item) => ({
      product: item.product,
      urgency: item.stockStatus === "out_of_stock" ? "urgent" : "soon",
      reason: item.stockStatus === "out_of_stock"
        ? `Stock is depleted by ${Math.ceil(Math.abs(item.onHand)).toLocaleString()} units.`
        : `Only ${Math.ceil(item.onHand).toLocaleString()} units remain against recent sales of ${Math.ceil(item.soldQuantity).toLocaleString()} units.`,
      suggestedQuantity: Math.max(1, Math.ceil(item.soldQuantity - item.onHand)),
    }));

  if (params.has("summaryOnly")) {
    return Response.json({ summary, inventory });
  }

  let tips = null;
  try { tips = await generateSalesTips({ summary, inventory }); } catch {}
  tips = {
    ...(tips ?? {}),
    importRecommendations: tips?.importRecommendations?.length ? tips.importRecommendations : importRecommendations,
  };

  return Response.json({ summary, inventory, tips });
}