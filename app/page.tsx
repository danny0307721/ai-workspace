"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Summary = {
  imports: { count: number; total: number; quantity: number };
  sales: { count: number; revenue: number; quantity: number };
  estimatedCOGS: number;
  estimatedProfit: number;
  estimatedMarginPct: number;
  uncostedProducts: string[];
  quantityShortfalls: { product: string; importedQuantity: number; soldQuantity: number; quantityShortfall: number }[];
  products: { product: string; revenue: number; quantity: number; estimatedCOGS: number; otherCosts: number; estimatedProfit: number }[];
};

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [tips, setTips] = useState<any>(null);

  async function refresh() {
    const response = await fetch("/api/analytics", { cache: "no-store" });
    const data = await response.json();
    setSummary(data.summary);
    setTips(data.tips);
  }

  useEffect(() => { refresh(); }, []);

  const money = (value: number) => new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(value);

  return (
    <main>
      <header className="page-heading">
        <h1>Overview</h1>
        <p>Import and sales performance at a glance.</p>
      </header>
      <section className="actions">
        <button onClick={refresh}>Analyze</button>
      </section>
      {summary && <section className="grid">
        <Card title="Sales revenue" value={money(summary.sales.revenue)} />
        <Card title="Estimated profit" value={money(summary.estimatedProfit)} />
        <Card title="Margin" value={`${summary.estimatedMarginPct.toFixed(1)}%`} />
        <Card title="Imported quantity" value={summary.imports.quantity.toFixed(2)} />
      </section>}
      {summary && <p className="calculation-note">
        Profit estimate uses weighted-average landed cost by product, including import shipping and tax, plus recorded sale costs. It does not model inventory timing.
      </p>}
      {summary && (summary.uncostedProducts.length > 0 || summary.quantityShortfalls.length > 0) && <section className="cost-warning" role="status">
        <strong>Profit estimate may be incomplete.</strong>
        {summary.uncostedProducts.length > 0 && <p>No import cost is recorded for: {summary.uncostedProducts.join(", ")}.</p>}
        {summary.quantityShortfalls.length > 0 && <p>Sales exceed recorded purchases for: {summary.quantityShortfalls.map((item) => item.product).join(", ")}.</p>}
      </section>}
      {summary && <section className="panel">
        <h2>Products</h2>
        <table><thead><tr><th>Product</th><th>Units sold</th><th>Revenue</th><th>Inventory COGS</th><th>Other sale costs</th><th>Estimated profit</th></tr></thead>
          <tbody>{summary.products.map((product) => <tr key={product.product}>
            <td>{product.product}</td><td>{product.quantity.toFixed(2)}</td><td>{money(product.revenue)}</td>
            <td>{money(product.estimatedCOGS)}</td><td>{money(product.otherCosts)}</td><td>{money(product.estimatedProfit)}</td>
          </tr>)}</tbody>
        </table>
      </section>}
      {tips && <section className="panel">
        <h2>AI sales tips</h2>
        <p>{tips.summary}</p>
        <h3>Opportunities</h3><ul>{(tips.opportunities ?? []).map((item: string, index: number) => <li key={index}>{item}</li>)}</ul>
        <h3>Risks</h3><ul>{(tips.risks ?? []).map((item: string, index: number) => <li key={index}>{item}</li>)}</ul>
        <h3>Recommended actions</h3><ul>{(tips.actions ?? []).map((item: string, index: number) => <li key={index}>{item}</li>)}</ul>
        <h3>Forecast</h3><pre>{JSON.stringify(tips.forecast ?? [], null, 2)}</pre>
      </section>}
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return <div className="card"><span>{title}</span><strong>{value}</strong></div>;
}