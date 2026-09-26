"use client";

import { useEffect, useState, type ReactNode } from "react";

export type LedgerColumn<Row> = {
  heading: string;
  className?: string;
  render: (row: Row) => ReactNode;
};

type LedgerTableProps<Row> = {
  title: string;
  endpoint: string;
  searchPlaceholder: string;
  searchFields: (row: Row) => string[];
  columns: LedgerColumn<Row>[];
  refreshKey?: number;
};

const pageSize = 50;

export default function LedgerTable<Row extends { id: string }>({
  title,
  endpoint,
  searchPlaceholder,
  searchFields,
  columns,
  refreshKey = 0,
}: LedgerTableProps<Row>) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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
  const filteredRows = rows.filter((row) =>
    searchFields(row).some((value) => value.toLowerCase().includes(normalizedSearch))
  );
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const firstVisible = filteredRows.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisible = Math.min(page * pageSize, filteredRows.length);

  return <section className="panel ledger-panel">
    <div className="table-heading">
      <div>
        <h2>{title}</h2>
        <p>{loading ? "Loading records..." : `${filteredRows.length.toLocaleString()} records`}</p>
      </div>
      <label className="search-box">
        <span>Search {title.toLowerCase()}</span>
        <input
          type="search"
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          placeholder={searchPlaceholder}
        />
      </label>
    </div>
    {error ? <p className="table-message error-message">{error}</p> : <>
      <div className="table-scroll">
        <table className="ledger-table">
          <thead><tr>{columns.map((column) => <th key={column.heading} className={column.className}>{column.heading}</th>)}</tr></thead>
          <tbody>
            {visibleRows.map((row) => <tr key={row.id}>
              {columns.map((column) => <td key={column.heading} className={column.className}>{column.render(row)}</td>)}
            </tr>)}
            {!loading && visibleRows.length === 0 && <tr>
              <td colSpan={columns.length} className="table-message">
                {search ? `No ${title.toLowerCase()} match your search.` : `No ${title.toLowerCase()} yet.`}
              </td>
            </tr>}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>Showing {firstVisible.toLocaleString()}–{lastVisible.toLocaleString()} of {filteredRows.length.toLocaleString()}</span>
        <div className="pagination">
          <button aria-label="Previous page" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>‹</button>
          <span>Page {page} of {pageCount}</span>
          <button aria-label="Next page" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page >= pageCount}>›</button>
        </div>
      </div>
    </>}
  </section>;
}