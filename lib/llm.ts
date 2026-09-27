type LlmInput = {
  summary: unknown;
  inventory: unknown;
};

export async function generateSalesTips(input: LlmInput) {
  const base = process.env.LLM_BASE_URL ?? "http://localhost:11434";
  const model = process.env.LLM_MODEL ?? "llama3.1:8b";

  const prompt = `You are an inventory analyst. Analyze the current inventory and sales data.
Return only concise JSON with one key: importRecommendations (array).
Each recommendation must contain product, urgency, reason, and suggestedQuantity.
Only recommend products with zero or low stock based on the supplied inventory.
Do not invent source data. Clearly mark assumptions.

LEDGER:
${JSON.stringify(input.summary, null, 2)}

CURRENT INVENTORY:
${JSON.stringify(input.inventory, null, 2)}`;

  const response = await fetch(`${base.replace(/\/$/, "")}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false, format: "json" }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status}`);
  }

  const data = await response.json();
  try {
    return JSON.parse(data.response);
  } catch {
    return { importRecommendations: [] };
  }
}