"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { formatLedgerDate, useAppSettings } from "./settings-provider";

export type ImportRow = {
  id: string;
  date: string;
  supplier: string;
  product: string;
  quantity: number | string;
  unitCost: number | string;
  shippingCost: number | string;
  taxCost: number | string;
  notes: string | null;
};

export type SaleRow = {
  id: string;
  date: string;
  customer: string | null;
  product: string;
  quantity: number | string;
  unitPrice: number | string;
  discount: number | string;
  otherCost: number | string;
  notes: string | null;
};

type LedgerRow =
  | { kind: "imports"; row: ImportRow }
  | { kind: "sales"; row: SaleRow };

type DatePeriod = "day" | "week" | "month" | "year" | "all";
type TreeSelection = "" | `imports:${string}` | `sales:${string}`;
export type LedgerDateRange = { start: string; end: string } | null;

const money = (value: number) => new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
}).format(value);

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateInput(value: string) {
  return new Date(`${value}T00:00:00`);
}

function getDateRange(value: string, period: Exclude<DatePeriod, "all">) {
  const date = parseDateInput(value);
  let start: Date;
  let end: Date;
  if (period === "day") { start = date; end = date; }
  else if (period === "week") {
    const daysFromMonday = (date.getDay() + 6) % 7;
    start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysFromMonday);
    end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  } else if (period === "month") {
    start = new Date(date.getFullYear(), date.getMonth(), 1);
    end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  } else {
    start = new Date(date.getFullYear(), 0, 1);
    end = new Date(date.getFullYear(), 11, 31);
  }
  return { start: toDateInputValue(start), end: toDateInputValue(end) };
}

function shiftDate(value: string, period: DatePeriod, direction: number) {
  const date = parseDateInput(value);
  if (period === "day") date.setDate(date.getDate() + direction);
  if (period === "week") date.setDate(date.getDate() + direction * 7);
  if (period === "month") date.setMonth(date.getMonth() + direction);
  if (period === "year") date.setFullYear(date.getFullYear() + direction);
  return toDateInputValue(date);
}

function formatPeriod(value: string, period: DatePeriod) {
  if (period === "all") return "All dates";
  const range = getDateRange(value, period);
  const start = parseDateInput(range.start);
  const end = parseDateInput(range.end);
  if (period === "day") return start.toLocaleDateString(undefined, { dateStyle: "medium" });
  if (period === "month") return start.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  if (period === "year") return String(start.getFullYear());
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

export default function CombinedLedger({
  refreshKey = 0,
  onAddImport,
  onAddSale,
  onDateRangeChange,
}: {
  refreshKey?: number;
  onAddImport: () => void;
  onAddSale: () => void;
  onDateRangeChange?: (dateRange: LedgerDateRange) => void;
}) {
  const { settings } = useAppSettings();
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<TreeSelection>("");
  const [period, setPeriod] = useState<DatePeriod>("month");
  const [periodDate, setPeriodDate] = useState(() => toDateInputValue(new Date()));
  const [treeWidth, setTreeWidth] = useState(220);
  const [resizingTree, setResizingTree] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadRows() {
      setLoading(true);
      setError("");
      try {
        const [importsResponse, salesResponse] = await Promise.all([
          fetch("/api/imports", { cache: "no-store" }),
          fetch("/api/sales", { cache: "no-store" }),
        ]);
        if (!importsResponse.ok || !salesResponse.ok) throw new Error("Request failed");
        const [imports, sales] = await Promise.all([
          importsResponse.json() as Promise<ImportRow[]>,
          salesResponse.json() as Promise<SaleRow[]>,
        ]);
        if (active) setRows([
          ...imports.map((row) => ({ kind: "imports" as const, row })),
          ...sales.map((row) => ({ kind: "sales" as const, row })),
        ].sort((left, right) => right.row.date.localeCompare(left.row.date)));
      } catch {
        if (active) setError("Could not load imports and sales. Try refreshing the page.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadRows();
    return () => { active = false; };
  }, [refreshKey]);

  const today = toDateInputValue(new Date());
  const normalizedSearch = search.trim().toLowerCase();
  const dateRange = period === "all" ? null : getDateRange(periodDate, period);
  useEffect(() => {
    onDateRangeChange?.(dateRange);
  }, [dateRange?.start, dateRange?.end, onDateRangeChange]);
  const matchingRows = rows.filter(({ kind, row }) => {
    const values = kind === "imports"
      ? [row.supplier, row.product, row.notes ?? ""]
      : [row.customer ?? "", row.product, row.notes ?? ""];
    const matchesSearch = values.some((value) => value.toLowerCase().includes(normalizedSearch));
    const rowDate = toDateInputValue(new Date(row.date));
    return matchesSearch && (!dateRange || (rowDate >= dateRange.start && rowDate <= dateRange.end));
  });
  const filteredRows = matchingRows.filter(({ kind, row }) => {
    if (!selection) return true;
    const [selectedKind, selectedName] = selection.split(":");
    const name = kind === "imports" ? row.supplier : row.customer || "Unassigned customer";
    return kind === selectedKind && name === selectedName;
  });
  const imports = matchingRows.filter(({ kind }) => kind === "imports");
  const sales = matchingRows.filter(({ kind }) => kind === "sales");
  const nextRange = period === "all" ? null : getDateRange(shiftDate(periodDate, period, 1), period);
  const canMoveForward = Boolean(nextRange && nextRange.start <= today);

  function movePeriod(direction: number) {
    if (period !== "all") setPeriodDate((current) => shiftDate(current, period, direction));
  }

  useEffect(() => {
    if (!resizingTree) return;
    const handlePointerMove = (event: PointerEvent) => {
      const layout = document.querySelector<HTMLElement>(".combined-ledger-layout");
      if (!layout) return;
      const bounds = layout.getBoundingClientRect();
      setTreeWidth(Math.min(360, Math.max(160, event.clientX - bounds.left)));
    };
    const stopResizing = () => setResizingTree(false);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);
    document.body.classList.add("is-resizing-tree");
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
      document.body.classList.remove("is-resizing-tree");
    };
  }, [resizingTree]);

  function adjustTreeWidth(amount: number) {
    setTreeWidth((width) => Math.min(360, Math.max(160, width + amount)));
  }

  function treeButton(kind: "imports" | "sales", name: string, count: number) {
    const value = `${kind}:${name}` as TreeSelection;
    return <button key={value} type="button" className="tree-item" aria-pressed={selection === value} onClick={() => setSelection(value)}>
      <span className="tree-item-name">{name}</span><span className="tree-count">{count}</span>
    </button>;
  }

  const partyName = ({ kind, row }: LedgerRow) => kind === "imports" ? row.supplier : row.customer || "Unassigned customer";
  const groupedNames = (group: LedgerRow[]) => [...new Set(group.map(partyName))].sort((left, right) => left.localeCompare(right));
  const countFor = (kind: "imports" | "sales", name: string) => matchingRows.filter((entry) => entry.kind === kind && partyName(entry) === name).length;

  return <div className="ledger-table-layout combined-ledger-layout" style={{ "--tree-width": `${treeWidth}px` } as CSSProperties}>
    <aside className="ledger-tree" aria-label="Imports and sales tree">
      <details open><summary>Ledger<span className="tree-count">{matchingRows.length}</span></summary>
        <div className="tree-children">
          <button type="button" className="tree-item" aria-pressed={!selection} onClick={() => setSelection("")}>
            <span className="tree-item-name">All entries</span><span className="tree-count">{matchingRows.length}</span>
          </button>
          <details open><summary>Imports<span className="tree-count">{imports.length}</span></summary>
            <div className="tree-children">{groupedNames(imports).map((name) => treeButton("imports", name, countFor("imports", name)))}</div>
          </details>
          <details open><summary>Sales<span className="tree-count">{sales.length}</span></summary>
            <div className="tree-children">{groupedNames(sales).map((name) => treeButton("sales", name, countFor("sales", name)))}</div>
          </details>
        </div>
      </details>
    </aside>
    <button
      type="button"
      className="tree-resizer"
      aria-label="Resize treebox"
      aria-valuemin={160}
      aria-valuemax={360}
      aria-valuenow={treeWidth}
      onPointerDown={(event) => {
        event.preventDefault();
        setResizingTree(true);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") adjustTreeWidth(-20);
        if (event.key === "ArrowRight") adjustTreeWidth(20);
      }}
    />
    <section className="panel ledger-panel">
      <div className="table-heading">
        <div className="table-heading-main"><h2>Imports & Sales</h2><label className="search-box"><span>Search imports and sales</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Supplier, customer, product, or note" /></label></div>
        <div className="date-toolbar">
          <select className="period-select" aria-label="Date period" value={period} onChange={(event) => setPeriod(event.target.value as DatePeriod)}>
            <option value="day">Daily</option><option value="week">Weekly</option><option value="month">Monthly</option><option value="year">Annually</option><option value="all">All time</option>
          </select>
          <div className="calendar-nav"><button type="button" aria-label="Previous period" onClick={() => movePeriod(-1)} disabled={period === "all"}>‹</button><span className="calendar-range">{formatPeriod(periodDate, period)}</span><button type="button" aria-label="Next period" onClick={() => movePeriod(1)} disabled={!canMoveForward}>›</button></div>
          <label className="date-jump"><span className="visually-hidden">Go to date</span><input type="date" aria-label="Go to date" value={periodDate} max={today} onChange={(event) => { if (event.target.value <= today) setPeriodDate(event.target.value); }} /></label>
          <button className="today-button" type="button" onClick={() => setPeriodDate(today)}>Today</button>
        </div>
        <div className="combined-actions"><button type="button" onClick={onAddImport}>+ Add import</button><button className="primary-action" type="button" onClick={onAddSale}>+ Add sale</button></div>
        <p className="table-record-count">{loading ? "Loading records..." : `${filteredRows.length.toLocaleString()} records`}</p>
      </div>
      {error ? <p className="table-message error-message">{error}</p> : <div className="table-scroll">
        <table className="ledger-table"><thead><tr><th>Product</th><th>Quantity</th><th>Unit value</th><th>Total</th><th>Notes</th><th>Date</th></tr></thead><tbody>
          {filteredRows.map(({ kind, row }) => {
            const isImport = kind === "imports";
            const quantity = Number(row.quantity);
            const total = isImport ? quantity * Number(row.unitCost) + Number(row.shippingCost) + Number(row.taxCost) : quantity * Number(row.unitPrice) - Number(row.discount);
            return <tr key={`${kind}-${row.id}`}><td className="product-cell">{row.product}</td><td className="numeric">{quantity.toLocaleString(undefined, { maximumFractionDigits: 3 })}</td><td className="numeric">{money(isImport ? Number(row.unitCost) : Number(row.unitPrice))}</td><td className="numeric total-cell">{money(total)}</td><td className="notes-cell">{row.notes || "—"}</td><td className="date-cell">{formatLedgerDate(row.date, settings.dateFormat)}</td></tr>;
          })}
          {!loading && filteredRows.length === 0 && <tr><td colSpan={6} className="table-message">No entries for the selected filters.</td></tr>}
        </tbody></table>
      </div>}
      <div className="table-footer"><span>Showing {filteredRows.length.toLocaleString()} of {matchingRows.length.toLocaleString()} records</span></div>
    </section>
  </div>;
}
