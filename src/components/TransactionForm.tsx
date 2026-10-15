"use client";

import { useState, type FormEvent } from "react";
import type { FraudResult, TransactionInput } from "@/lib/jev";

const scenarios: { label: string; value: TransactionInput }[] = [
  { label: "Everyday purchase", value: { amount: 2400, transactionType: "Card Payment", location: "Kandy", newBeneficiary: false, transactionsLast10Minutes: 1, typicalAmount: 5000, newDevice: false } },
  { label: "Large transfer to new payee", value: { amount: 185000, transactionType: "Bank Transfer", location: "Colombo", newBeneficiary: true, transactionsLast10Minutes: 1, typicalAmount: 15000, newDevice: false } },
  { label: "Rapid activity on new device", value: { amount: 40000, transactionType: "Card Payment", location: "Kandy", newBeneficiary: false, transactionsLast10Minutes: 4, typicalAmount: 12000, newDevice: true } },
  { label: "Multiple unusual signals", value: { amount: 250000, transactionType: "Bank Transfer", location: "Colombo", newBeneficiary: true, transactionsLast10Minutes: 5, typicalAmount: 20000, newDevice: true } },
];

type Props = { onResult: (result: FraudResult) => void };

export default function TransactionForm({ onResult }: Props) {
  const [form, setForm] = useState<TransactionInput>(scenarios[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof TransactionInput>(key: K, value: TransactionInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/transaction-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The assessment could not be completed.");
      onResult(data as FraudResult);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="transaction-form" onSubmit={submit}>
      <details className="scenario-picker">
        <summary>Load a sample transaction</summary>
        <div className="preset-row" aria-label="Example transactions">
          {scenarios.map((scenario) => (
            <button className="preset-button" key={scenario.label} type="button" onClick={() => { setForm(scenario.value); setError(""); }}>
              {scenario.label}
            </button>
          ))}
        </div>
      </details>

      <div className="form-grid">
        <label className="field">
          <span>Transaction amount <small>LKR</small></span>
          <input required min="1" max="10000000000" step="any" type="number" value={form.amount} onChange={(event) => update("amount", Number(event.target.value))} />
        </label>
        <label className="field">
          <span>Typical transaction <small>LKR</small></span>
          <input required min="1" max="10000000000" step="any" type="number" value={form.typicalAmount} onChange={(event) => update("typicalAmount", Number(event.target.value))} />
        </label>
        <label className="field">
          <span>Transaction type</span>
          <select value={form.transactionType} onChange={(event) => update("transactionType", event.target.value)}>
            {["Bank Transfer", "Card Payment", "Cash Withdrawal", "Online Purchase", "Bill Payment", "Other"].map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Location</span>
          <input required maxLength={120} value={form.location} onChange={(event) => update("location", event.target.value)} />
        </label>
        <label className="field field-wide">
          <span>Transactions in the last 10 minutes</span>
          <input required min="0" max="1000" step="1" type="number" value={form.transactionsLast10Minutes} onChange={(event) => update("transactionsLast10Minutes", Number(event.target.value))} />
        </label>
      </div>

      <div className="toggle-row">
        <label className="toggle-card">
          <input type="checkbox" checked={form.newBeneficiary} onChange={(event) => update("newBeneficiary", event.target.checked)} />
          <span className="toggle-mark" aria-hidden="true" />
          <span><strong>New beneficiary</strong><small>First transfer to this recipient</small></span>
        </label>
        <label className="toggle-card">
          <input type="checkbox" checked={form.newDevice} onChange={(event) => update("newDevice", event.target.checked)} />
          <span className="toggle-mark" aria-hidden="true" />
          <span><strong>New device</strong><small>Device not seen on this account</small></span>
        </label>
      </div>

      {error && <div className="form-error" role="alert"><span aria-hidden="true">!</span>{error}</div>}
      <button className="submit-button" type="submit" disabled={loading}>
        {loading ? <><span className="spinner" /> Analyzing transaction…</> : <>Assess transaction <span aria-hidden="true">→</span></>}
      </button>
    </form>
  );
}