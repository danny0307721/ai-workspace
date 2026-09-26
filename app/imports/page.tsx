"use client";

import { useEffect, useState } from "react";
import LedgerTable, { type LedgerColumn } from "../components/ledger-table";
import EntryForm from "../components/entry-form";

type ImportRow = {
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

const money = (value: number) => new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
}).format(value);

const columns: LedgerColumn<ImportRow>[] = [
  { heading: "Date", className: "date-cell", render: (row) => new Date(row.date).toLocaleDateString() },
  { heading: "Supplier", render: (row) => row.supplier },
  { heading: "Product", className: "product-cell", render: (row) => row.product },
  { heading: "Quantity", className: "numeric", render: (row) => Number(row.quantity).toLocaleString(undefined, { maximumFractionDigits: 3 }) },
  { heading: "Unit cost", className: "numeric", render: (row) => money(Number(row.unitCost)) },
  { heading: "Shipping", className: "numeric", render: (row) => money(Number(row.shippingCost)) },
  { heading: "Tax", className: "numeric", render: (row) => money(Number(row.taxCost)) },
  { heading: "Total cost", className: "numeric total-cell", render: (row) => money(Number(row.quantity) * Number(row.unitCost) + Number(row.shippingCost) + Number(row.taxCost)) },
  { heading: "Notes", className: "notes-cell", render: (row) => row.notes || "—" },
];

export default function ImportsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!modalOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [modalOpen]);

  return <main>
    <div className="page-title-row">
      <header className="page-heading">
        <h1>Imports</h1>
        <p>Supplier purchases and landed costs.</p>
      </header>
      <button className="primary-action" onClick={() => setModalOpen(true)}>+ Add import</button>
    </div>
    <LedgerTable<ImportRow>
      title="Imports"
      endpoint="/api/imports"
      refreshKey={refreshKey}
      searchPlaceholder="Supplier, product, or note"
      searchFields={(row) => [row.supplier, row.product, row.notes ?? ""]}
      columns={columns}
    />
    {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setModalOpen(false);
    }}>
      <section className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="new-import-title">
        <div className="modal-heading">
          <div>
            <h2 id="new-import-title">New import</h2>
            <p>Record a supplier purchase and its landed costs.</p>
          </div>
          <button className="modal-close" type="button" aria-label="Close dialog" onClick={() => setModalOpen(false)}>×</button>
        </div>
        <EntryForm
          kind="imports"
          onSaved={() => { setModalOpen(false); setRefreshKey((key) => key + 1); }}
          onCancel={() => setModalOpen(false)}
        />
      </section>
    </div>}
  </main>;
}