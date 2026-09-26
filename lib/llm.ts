type LlmInput = {
  summary: unknown;
};

export async function generateSalesTips(input: LlmInput) {
  const base = process.env.LLM_BASE_URL ?? "http://localhost:11434";
  const model = process.env.LLM_MODEL ?? "llama3.1:8b";

  const prompt = `You are a sales analyst. Analyze this ledger summary.
Return concise JSON with keys: summary, opportunities (array), risks (array),
actions (array), forecast (array). Forecast each period with period, expectedRevenue,
confidence, rationale. Do not invent source data. Clearly mark assumptions.

LEDGER:
${JSON.stringify(input.summary, null, 2)}`;

  const response = await fetch(`${base.replace(/\/$/, "")}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false, format: "json" }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status}`);
  }

  const data = await response.json();
  try {
    return JSON.parse(data.response);
  } catch {
    return { summary: data.response, opportunities: [], risks: [], actions: [], forecast: [] };
  }
}