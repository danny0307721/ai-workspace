"use client";

import { useEffect, useState, type CSSProperties } from "react";
import CombinedLedger, { type LedgerDateRange } from "../components/combined-ledger";
import LedgerDashboard from "../components/ledger-dashboard";
import EntryForm from "../components/entry-form";

export default function ImportsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKind, setModalKind] = useState<"imports" | "sales">("imports");
  const [refreshKey, setRefreshKey] = useState(0);
  const [dateRange, setDateRange] = useState<LedgerDateRange>(null);
  const [dashboardWidth, setDashboardWidth] = useState(290);
  const [resizingDashboard, setResizingDashboard] = useState(false);

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

  useEffect(() => {
    if (!resizingDashboard) return;
    const handlePointerMove = (event: PointerEvent) => {
      const workspace = document.querySelector<HTMLElement>(".ledger-workspace");
      if (!workspace) return;
      const bounds = workspace.getBoundingClientRect();
      setDashboardWidth(Math.min(480, Math.max(220, bounds.right - event.clientX)));
    };
    const stopResizing = () => setResizingDashboard(false);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);
    document.body.classList.add("is-resizing-dashboard");
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
      document.body.classList.remove("is-resizing-dashboard");
    };
  }, [resizingDashboard]);

  function adjustDashboardWidth(amount: number) {
    setDashboardWidth((width) => Math.min(480, Math.max(220, width + amount)));
  }

  return <main>
    <div className="ledger-workspace" style={{ "--dashboard-width": `${dashboardWidth}px` } as CSSProperties}>
      <CombinedLedger refreshKey={refreshKey} onAddImport={() => { setModalKind("imports"); setModalOpen(true); }} onAddSale={() => { setModalKind("sales"); setModalOpen(true); }} onDateRangeChange={setDateRange} />
      <div
        role="separator"
        tabIndex={0}
        className="dashboard-resizer"
        aria-label="Resize dashboard sidebar"
        aria-orientation="vertical"
        aria-valuemin={220}
        aria-valuemax={480}
        aria-valuenow={dashboardWidth}
        onPointerDown={(event) => {
          event.preventDefault();
          setResizingDashboard(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") adjustDashboardWidth(20);
          if (event.key === "ArrowRight") adjustDashboardWidth(-20);
        }}
      />
      <LedgerDashboard refreshKey={refreshKey} dateRange={dateRange} />
    </div>
    {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setModalOpen(false);
    }}>
      <section className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="new-entry-title">
        <div className="modal-heading">
          <div>
            <h2 id="new-entry-title">{modalKind === "imports" ? "New import" : "New sale"}</h2>
            <p>{modalKind === "imports" ? "Record a supplier purchase and its landed costs." : "Record a customer sale, discount, and other costs."}</p>
          </div>
          <button className="modal-close" type="button" aria-label="Close dialog" onClick={() => setModalOpen(false)}>×</button>
        </div>
        <EntryForm
          kind={modalKind}
          onSaved={() => { setModalOpen(false); setRefreshKey((key) => key + 1); }}
          onCancel={() => setModalOpen(false)}
        />
      </section>
    </div>}
  </main>;
}