import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  date: z.coerce.date(),
  customer: z.string().optional(),
  product: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  otherCost: z.number().nonnegative().default(0),
  notes: z.string().optional()
});

export async function GET() {
  const rows = await db.saleEntry.findMany({ orderBy: { date: "desc" } });
  return Response.json(rows);
}

export async function POST(req: Request) {
  const parsed = schema.parse(await req.json());
  const row = await db.saleEntry.create({ data: parsed });
  return Response.json(row, { status: 201 });
}