"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { formatLedgerDate, useAppSettings } from "./settings-provider";

export type LedgerColumn<Row> = {
  heading: string;
  className?: string;
  render: (row: Row, formatDate: (value: string | Date) => string) => ReactNode;
  summary?: (rows: Row[]) => ReactNode;
};

type LedgerTableProps<Row> = {
  title: string;
  endpoint: string;
  treeLabel: string;
  treeField: (row: Row) => string;
  searchPlaceholder: string;
  searchFields: (row: Row) => string[];
  dateField: (row: Row) => string;
  columns: LedgerColumn<Row>[];
  refreshKey?: number;
};

const batchSize = 50;
type DatePeriod = "day" | "week" | "month" | "year" | "all";

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string) {
  return new Date(`${value}T00:00:00`);
}

function getDateRange(value: string, period: Exclude<DatePeriod, "all">) {
  const date = parseDateInput(value);
  let start: Date;
  let end: Date;

  if (period === "day") {
    start = date;
    end = date;
  } else if (period === "week") {
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
  if (period === "month") {
    const targetMonth = new Date(date.getFullYear(), date.getMonth() + direction, 1);
    const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
    date.setFullYear(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(date.getDate(), lastDay));
  }
  if (period === "year") {
    const targetYear = date.getFullYear() + direction;
    const lastDay = new Date(targetYear, date.getMonth() + 1, 0).getDate();
    date.setFullYear(targetYear, date.getMonth(), Math.min(date.getDate(), lastDay));
  }
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

export default function LedgerTable<Row extends { id: string }>({
  title,
  endpoint,
  treeLabel,
  treeField,
  searchPlaceholder,
  searchFields,
  dateField,
  columns,
  refreshKey = 0,
}: LedgerTableProps<Row>) {
  const { settings } = useAppSettings();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTreeItem, setSelectedTreeItem] = useState("");
  const [period, setPeriod] = useState<DatePeriod>("month");
  const [periodDate, setPeriodDate] = useState(() => toDateInputValue(new Date()));
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    let active = true;

    async function loadRows() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        if (!response.ok) throw new Error("Request failed");
        const data = await response.json() as Row[];
        if (active) setRows(data);
      } catch {
        if (active) setError(`Could not load ${title.toLowerCase()}. Try refreshing the page.`);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadRows();
    return () => { active = false; };
  }, [endpoint, title, refreshKey]);

  const normalizedSearch = search.trim().toLowerCase();
  const today = toDateInputValue(new Date());
  const dateRange = period === "all" ? null : getDateRange(periodDate, period);
  const nextRange = period === "all" ? null : getDateRange(shiftDate(periodDate, period, 1), period);
  const canMoveForward = Boolean(nextRange && nextRange.start <= today);
  const rowHeight = (settings.tableDensity === "compact" ? 32 : 40)
    * (settings.fontSize === "small" ? 0.9 : settings.fontSize === "large" ? 1.12 : 1);
  const matchingRows = rows.filter((row) => {
    const matchesSearch = searchFields(row).some((value) => value.toLowerCase().includes(normalizedSearch));
    const rowDate = new Date(dateField(row)).toISOString().slice(0, 10);
    return matchesSearch && (!dateRange || (rowDate >= dateRange.start && rowDate <= dateRange.end));
  });
  const filteredRows = matchingRows.filter((row) => !selectedTreeItem || treeField(row) === selectedTreeItem);
  const treeItems = [...new Set(rows.map(treeField).filter(Boolean))].sort((left, right) => left.localeCompare(right));
  const treeCounts = new Map<string, number>();
  matchingRows.forEach((row) => {
    const value = treeField(row);
    treeCounts.set(value, (treeCounts.get(value) ?? 0) + 1);
  });
  const visibleRows = filteredRows.slice(0, visibleCount);

  function resetVisibleRows() {
    setVisibleCount(batchSize);
    if (tableScrollRef.current) tableScrollRef.current.scrollTop = 0;
  }

  function movePeriod(direction: number) {
    if (period === "all") return;
    setPeriodDate((current) => shiftDate(current, period, direction));
    resetVisibleRows();
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollContainer = sentinel?.closest(".table-scroll");
    if (!sentinel || !scrollContainer || visibleCount >= filteredRows.length) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisibleCount((count) => Math.min(count + batchSize, filteredRows.length));
      }
    }, { root: scrollContainer, rootMargin: "120px" });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredRows.length, visibleCount]);

  return <div className="ledger-table-layout">
    <aside className="ledger-tree" aria-label={`${treeLabel} tree`}>
      <details open>
        <summary>{treeLabel}<span className="tree-count">{treeItems.length}</span></summary>
        <div className="tree-children">
          <button type="button" className="tree-item" aria-pressed={!selectedTreeItem} onClick={() => {
            setSelectedTreeItem("");
            resetVisibleRows();
          }}>
            <span className="tree-item-name">All {treeLabel.toLowerCase()}</span>
            <span className="tree-count">{matchingRows.length}</span>
          </button>
          {treeItems.map((item) => <button
            key={item}
            type="button"
            className="tree-item"
            aria-pressed={selectedTreeItem === item}
            onClick={() => {
              setSelectedTreeItem(item);
              resetVisibleRows();
            }}
          >
            <span className="tree-item-name">{item}</span>
            <span className="tree-count">{treeCounts.get(item) ?? 0}</span>
          </button>)}
        </div>
      </details>
    </aside>
    <section className="panel ledger-panel">
      <div className="table-heading">
        <div className="table-heading-main">
          <h2>{title}</h2>
          <label className="search-box">
            <span>Search {title.toLowerCase()}</span>
            <input
              type="search"
              value={search}
              onChange={(event) => { setSearch(event.target.value); resetVisibleRows(); }}
              placeholder={searchPlaceholder}
            />
          </label>
        </div>
        <div className="date-toolbar" aria-label="Date navigation">
          <select className="period-select" aria-label="Date period" value={period} onChange={(event) => {
            setPeriod(event.target.value as DatePeriod);
            resetVisibleRows();
          }}>
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
            <option value="year">Annually</option>
            <option value="all">All time</option>
          </select>
          <div className="calendar-nav">
            <button type="button" aria-label="Previous period" onClick={() => movePeriod(-1)} disabled={period === "all"}>‹</button>
            <span className="calendar-range" aria-live="polite">{formatPeriod(periodDate, period)}</span>
            <button type="button" aria-label="Next period" onClick={() => movePeriod(1)} disabled={!canMoveForward}>›</button>
          </div>
          <label className="date-jump">
            <span className="visually-hidden">Go to date</span>
            <input type="date" aria-label="Go to date" value={periodDate} max={today} onChange={(event) => {
              if (event.target.value && event.target.value <= today) setPeriodDate(event.target.value);
              resetVisibleRows();
            }} />
          </label>
          <button className="today-button" type="button" onClick={() => {
            setPeriodDate(toDateInputValue(new Date()));
            resetVisibleRows();
          }}>Today</button>
        </div>
        <p className="table-record-count">{loading ? "Loading records..." : `${filteredRows.length.toLocaleString()} records`}</p>
      </div>
      {error ? <p className="table-message error-message">{error}</p> : <>
        <div className="table-scroll" ref={tableScrollRef}>
          <table className="ledger-table">
            <thead><tr>{columns.map((column) => <th key={column.heading} className={column.className}>{column.heading}</th>)}</tr></thead>
            <tbody>
              {visibleRows.map((row) => <tr key={row.id}>
                {columns.map((column) => <td key={column.heading} className={column.className}>
                  {column.render(row, (value) => formatLedgerDate(value, settings.dateFormat))}
                </td>)}
              </tr>)}
              {!loading && visibleCount < filteredRows.length && <tr ref={sentinelRef} className="table-spacer" aria-hidden="true">
                <td colSpan={columns.length} style={{ height: `${(filteredRows.length - visibleCount) * rowHeight}px` }} />
              </tr>}
              {!loading && visibleRows.length === 0 && <tr>
                <td colSpan={columns.length} className="table-message">
                  {selectedTreeItem
                    ? `No ${title.toLowerCase()} for ${selectedTreeItem} in this period.`
                    : search ? `No ${title.toLowerCase()} match your search.` : `No ${title.toLowerCase()} yet.`}
                </td>
              </tr>}
            </tbody>
            {columns.some((column) => column.summary) && <tfoot><tr>
              {columns.map((column, index) => <td key={column.heading} className={column.className}>
                {column.summary ? column.summary(filteredRows) : index === 0 ? "Summary" : null}
              </td>)}
            </tr></tfoot>}
          </table>
        </div>
        <div className="table-footer">
          <span>Showing {visibleRows.length.toLocaleString()} of {filteredRows.length.toLocaleString()} records</span>
        </div>
      </>}
    </section>
  </div>;
}