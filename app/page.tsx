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

type ImportRecommendation = {
  product: string;
  urgency: string;
  reason: string;
  suggestedQuantity: number | string;
};

type InventoryItem = {
  product: string;
  importedQuantity: number;
  soldQuantity: number;
  onHand: number;
  stockStatus: string;
};

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [tips, setTips] = useState<any>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  async function refresh() {
    setAnalyzing(true);
    try {
      const response = await fetch("/api/analytics", { cache: "no-store" });
      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();
      setSummary(data.summary);
      setTips(data.tips);
      setInventory(data.inventory ?? []);
    } finally {
      setAnalyzing(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const productHighlights = summary && summary.products.length > 0 ? {
    bestSelling: [...summary.products].sort((left, right) => right.quantity - left.quantity)[0],
    highestProfit: [...summary.products].sort((left, right) => right.estimatedProfit - left.estimatedProfit)[0],
    slowestSelling: [...summary.products].sort((left, right) => left.quantity - right.quantity)[0],
    lowestProfit: [...summary.products].sort((left, right) => left.estimatedProfit - right.estimatedProfit)[0],
  } : null;

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
      {analyzing && <p className="analysis-status" role="status" aria-live="polite">Thinking...</p>}
      {summary && <section className="grid">
        <Card title="Sales revenue" value={money(summary.sales.revenue)} />
        <Card title="Estimated profit" value={money(summary.estimatedProfit)} />
        <Card title="Margin" value={`${summary.estimatedMarginPct.toFixed(1)}%`} />
        <Card title="Imported quantity" value={summary.imports.quantity.toFixed(2)} />
      </section>}
      {summary && <p className="calculation-note">
        Profit estimate uses weighted-average landed cost by product, including import shipping and tax, plus recorded sale costs. It does not model inventory timing.
      </p>}
      {inventory.length > 0 && <section className="panel">
        <h2>Lowest stock</h2>
        <ul className="stock-list">{inventory.slice(0, 10).map((item) => <li key={item.product}>
          <span>{item.product}</span><strong>{item.onHand.toFixed(3)}</strong>
        </li>)}</ul>
      </section>}
      {productHighlights && <section className="product-highlights">
        <div className="product-highlight"><span>Best-selling product</span><strong>{productHighlights.bestSelling.product}</strong><small>{productHighlights.bestSelling.quantity.toFixed(3)} units sold</small></div>
        <div className="product-highlight"><span>Highest-profit product</span><strong>{productHighlights.highestProfit.product}</strong><small>{money(productHighlights.highestProfit.estimatedProfit)} estimated profit</small></div>
        <div className="product-highlight"><span>Slowest-selling product</span><strong>{productHighlights.slowestSelling.product}</strong><small>{productHighlights.slowestSelling.quantity.toFixed(3)} units sold</small></div>
        <div className="product-highlight"><span>Lowest-profit product</span><strong>{productHighlights.lowestProfit.product}</strong><small>{money(productHighlights.lowestProfit.estimatedProfit)} estimated profit</small></div>
      </section>}
      {summary && (summary.uncostedProducts.length > 0 || summary.quantityShortfalls.length > 0) && <section className="cost-warning" role="status">
        <strong>Profit estimate may be incomplete.</strong>
        {summary.uncostedProducts.length > 0 && <p>No import cost is recorded for: {summary.uncostedProducts.join(", ")}.</p>}
        {summary.quantityShortfalls.length > 0 && <p>Sales exceed recorded purchases for: {summary.quantityShortfalls.map((item) => item.product).join(", ")}.</p>}
      </section>}
      {tips && <section className="panel">
        <h2>AI import recommendations</h2>
        {(tips.importRecommendations ?? []).length > 0
          ? <ul>{(tips.importRecommendations as ImportRecommendation[]).map((item, index) => <li key={index}><strong>{item.product}</strong> ({item.urgency}): {item.reason} Suggested quantity: {item.suggestedQuantity}.</li>)}</ul>
          : <p>No import recommendations from the current stock data.</p>}
      </section>}
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return <div className="card"><span>{title}</span><strong>{value}</strong></div>;
}