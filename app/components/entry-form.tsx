"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type EntryKind = "imports" | "sales";

type EntryFormProps = {
  kind: EntryKind;
  onSaved?: () => void;
  onCancel?: () => void;
};

export default function EntryForm({ kind, onSaved, onCancel }: EntryFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isImport = kind === "imports";
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      date: new Date(`${String(form.get("date"))}T12:00:00`),
      product: String(form.get("product")),
      quantity: Number(form.get("quantity")),
      notes: String(form.get("notes") ?? "").trim() || undefined,
      ...(isImport
        ? {
            supplier: String(form.get("supplier")),
            unitCost: Number(form.get("unitPrice")),
            shippingCost: Number(form.get("shippingCost") || 0),
            taxCost: Number(form.get("taxCost") || 0),
          }
        : {
            customer: String(form.get("customer") ?? "").trim() || undefined,
            unitPrice: Number(form.get("unitPrice")),
            discount: Number(form.get("discount") || 0),
            otherCost: Number(form.get("otherCost") || 0),
          }),
    };

    try {
      const response = await fetch(`/api/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Could not save this record. Check the values and try again.");
      if (onSaved) onSaved();
      else {
        router.push(`/${kind}`);
        router.refresh();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save this record.");
      setSaving(false);
    }
  }

  return <form className="entry-form" onSubmit={submit}>
      <div className="form-grid">
        <label className="form-field">
          Date
          <input name="date" type="date" defaultValue={today} required />
        </label>
        {isImport ? <label className="form-field">
          Supplier
          <input name="supplier" autoComplete="organization" required />
        </label> : <label className="form-field">
          Customer
          <input name="customer" autoComplete="organization" />
        </label>}
        <label className="form-field">
          Product
          <input name="product" autoFocus={isImport && Boolean(onSaved)} required />
        </label>
        <label className="form-field">
          Quantity
          <input name="quantity" type="number" min="0.001" step="0.001" required />
        </label>
        <label className="form-field">
          {isImport ? "Unit cost" : "Unit price"}
          <input name="unitPrice" type="number" min="0" step="0.01" required />
        </label>
        {isImport ? <>
          <label className="form-field">
            Shipping cost
            <input name="shippingCost" type="number" min="0" step="0.01" defaultValue="0" />
          </label>
          <label className="form-field">
            Tax cost
            <input name="taxCost" type="number" min="0" step="0.01" defaultValue="0" />
          </label>
        </> : <>
          <label className="form-field">
            Discount
            <input name="discount" type="number" min="0" step="0.01" defaultValue="0" />
          </label>
          <label className="form-field">
            Other sale cost
            <input name="otherCost" type="number" min="0" step="0.01" defaultValue="0" />
          </label>
        </>}
        <label className="form-field">
          Notes
          <textarea name="notes" />
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        <button className="primary-action" type="submit" disabled={saving}>{saving ? "Saving..." : `Save ${isImport ? "import" : "sale"}`}</button>
        {onCancel ? <button className="button" type="button" onClick={onCancel}>Cancel</button> : <Link className="button" href={`/${kind}`}>Cancel</Link>}
      </div>
    </form>;
}