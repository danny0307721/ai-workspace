import { db } from "@/lib/db";
import { generateSalesTips } from "@/lib/llm";
import { calculateLedgerProfit } from "@/lib/profit";

export async function GET() {
  const [imports, sales] = await Promise.all([
    db.importEntry.findMany(),
    db.saleEntry.findMany()
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

  let tips = null;
  try { tips = await generateSalesTips({ summary }); } catch {}

  return Response.json({ summary, tips });
}