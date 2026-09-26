"use client";

import { useEffect, useState } from "react";
import LedgerTable, { type LedgerColumn } from "../components/ledger-table";
import EntryForm from "../components/entry-form";

type SaleRow = {
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

const money = (value: number) => new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
}).format(value);

const columns: LedgerColumn<SaleRow>[] = [
  { heading: "Date", className: "date-cell", render: (row) => new Date(row.date).toLocaleDateString() },
  { heading: "Customer", render: (row) => row.customer || "—" },
  { heading: "Product", className: "product-cell", render: (row) => row.product },
  { heading: "Quantity", className: "numeric", render: (row) => Number(row.quantity).toLocaleString(undefined, { maximumFractionDigits: 3 }) },
  { heading: "Unit price", className: "numeric", render: (row) => money(Number(row.unitPrice)) },
  { heading: "Discount", className: "numeric", render: (row) => money(Number(row.discount)) },
  { heading: "Other cost", className: "numeric", render: (row) => money(Number(row.otherCost)) },
  { heading: "Revenue", className: "numeric total-cell", render: (row) => money(Number(row.quantity) * Number(row.unitPrice) - Number(row.discount)) },
  { heading: "Notes", className: "notes-cell", render: (row) => row.notes || "—" },
];

export default function SalesPage() {
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
        <h1>Sales</h1>
        <p>Customer orders, discounts, and net revenue.</p>
      </header>
      <button className="primary-action" onClick={() => setModalOpen(true)}>+ Add sale</button>
    </div>
    <LedgerTable<SaleRow>
      title="Sales"
      endpoint="/api/sales"
      refreshKey={refreshKey}
      searchPlaceholder="Customer, product, or note"
      searchFields={(row) => [row.customer ?? "", row.product, row.notes ?? ""]}
      columns={columns}
    />
    {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setModalOpen(false);
    }}>
      <section className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="new-sale-title">
        <div className="modal-heading">
          <div>
            <h2 id="new-sale-title">New sale</h2>
            <p>Record a customer sale, discount, and other costs.</p>
          </div>
          <button className="modal-close" type="button" aria-label="Close dialog" onClick={() => setModalOpen(false)}>×</button>
        </div>
        <EntryForm
          kind="sales"
          onSaved={() => { setModalOpen(false); setRefreshKey((key) => key + 1); }}
          onCancel={() => setModalOpen(false)}
        />
      </section>
    </div>}
  </main>;
}