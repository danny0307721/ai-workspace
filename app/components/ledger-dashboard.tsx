"use client";

import { useEffect, useState } from "react";

type LedgerSummary = {
  imports: { count: number; total: number; quantity: number };
  sales: { count: number; revenue: number; quantity: number };
  estimatedCOGS: number;
  salesOtherCosts: number;
  estimatedProfit: number;
  estimatedMarginPct: number;
};

const money = (value: number) => new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
}).format(value);

const quantity = (value: number) => new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 3,
}).format(value);

export default function LedgerDashboard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch("/api/analytics?summaryOnly=1", { cache: "no-store" });
        if (!response.ok) throw new Error("Request failed");
        const data = await response.json() as { summary: LedgerSummary };
        if (active) setSummary(data.summary);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSummary();
    return () => { active = false; };
  }, [refreshKey]);

  return <aside className="panel ledger-dashboard" aria-label="Ledger dashboard">
    <div className="dashboard-heading">
      <div>
        <h2>Ledger totals</h2>
        <p>All recorded entries</p>
      </div>
      {loading && <span className="dashboard-status">Updating</span>}
    </div>
    <section className="dashboard-profit" aria-label="Estimated profit and margin">
      <span>Estimated profit</span>
      <strong>{summary ? money(summary.estimatedProfit) : "--"}</strong>
      <div><span>Margin</span><b>{summary ? `${summary.estimatedMarginPct.toFixed(1)}%` : "--"}</b></div>
    </section>
    <dl className="dashboard-metrics">
      <DashboardMetric label="Import spend" value={summary ? money(summary.imports.total) : "--"} />
      <DashboardMetric label="Sales revenue" value={summary ? money(summary.sales.revenue) : "--"} />
      <DashboardMetric label="Quantity imported" value={summary ? quantity(summary.imports.quantity) : "--"} />
      <DashboardMetric label="Quantity sold" value={summary ? quantity(summary.sales.quantity) : "--"} />
      <DashboardMetric label="Inventory COGS" value={summary ? money(summary.estimatedCOGS) : "--"} />
      <DashboardMetric label="Other sale costs" value={summary ? money(summary.salesOtherCosts) : "--"} />
    </dl>
    <p className="dashboard-entry-count">
      {summary ? `${summary.imports.count.toLocaleString()} imports · ${summary.sales.count.toLocaleString()} sales` : ""}
    </p>
    {error && <p className="dashboard-error" role="status">Totals unavailable. Check the database connection.</p>}
  </aside>;
}

function DashboardMetric({ label, value }: { label: string; value: string }) {
  return <div className="dashboard-metric">
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>;
}