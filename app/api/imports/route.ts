import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  date: z.coerce.date(),
  supplier: z.string().min(1),
  product: z.string().min(1),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative(),
  shippingCost: z.number().nonnegative().default(0),
  taxCost: z.number().nonnegative().default(0),
  notes: z.string().optional()
});

export async function GET() {
  const rows = await db.importEntry.findMany({ orderBy: { date: "desc" } });
  return Response.json(rows);
}

export async function POST(req: Request) {
  const parsed = schema.parse(await req.json());
  const row = await db.importEntry.create({ data: parsed });
  return Response.json(row, { status: 201 });
}