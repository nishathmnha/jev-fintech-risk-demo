"use client";

import { useState, type FormEvent } from "react";
import type { LoanApplication, LoanResult } from "@/lib/jev";

const examples: { label: string; value: LoanApplication }[] = [
  {
    label: "Comfortable repayment",
    value: { monthlyIncome: 300000, existingMonthlyDebt: 35000, requestedAmount: 1200000, termMonths: 24, employmentMonths: 36, incomeType: "salaried", repaymentHistory: "clean" },
  },
  {
    label: "High existing debt",
    value: { monthlyIncome: 300000, existingMonthlyDebt: 100000, requestedAmount: 2000000, termMonths: 24, employmentMonths: 48, incomeType: "salaried", repaymentHistory: "one_late_payment" },
  },
  {
    label: "Limited repayment history",
    value: { monthlyIncome: 220000, existingMonthlyDebt: 35000, requestedAmount: 500000, termMonths: 24, employmentMonths: 3, incomeType: "salaried", repaymentHistory: "limited_history" },
  },
  {
    label: "Variable income",
    value: { monthlyIncome: 280000, existingMonthlyDebt: 50000, requestedAmount: 900000, termMonths: 24, employmentMonths: 8, incomeType: "self_employed", repaymentHistory: "clean" },
  },
];

type Props = { onResult: (result: LoanResult) => void };

export default function TransactionForm({ onResult }: Props) {
  const [form, setForm] = useState<LoanApplication>(examples[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof LoanApplication>(key: K, value: LoanApplication[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/loan-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The assessment could not be completed.");
      onResult(data as LoanResult);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="transaction-form" onSubmit={submit}>
      <div className="preset-row" aria-label="Example applications">
        <span className="field-caption">LOAD A SCENARIO</span>
        {examples.map((example) => (
          <button className="preset-button" key={example.label} type="button" onClick={() => { setForm(example.value); setError(""); }}>
            {example.label}
          </button>
        ))}
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Gross monthly income <small>LKR</small></span>
          <input required min="1" max="1000000000" step="any" type="number" value={form.monthlyIncome} onChange={(event) => update("monthlyIncome", Number(event.target.value))} />
        </label>
        <label className="field">
          <span>Existing monthly debt <small>LKR</small></span>
          <input required min="0" max="1000000000" step="any" type="number" value={form.existingMonthlyDebt} onChange={(event) => update("existingMonthlyDebt", Number(event.target.value))} />
        </label>
        <label className="field">
          <span>Requested loan amount <small>LKR</small></span>
          <input required min="1" max="10000000000" step="any" type="number" value={form.requestedAmount} onChange={(event) => update("requestedAmount", Number(event.target.value))} />
        </label>
        <label className="field">
          <span>Requested term <small>MONTHS</small></span>
          <input required min="3" max="360" step="1" type="number" value={form.termMonths} onChange={(event) => update("termMonths", Number(event.target.value))} />
        </label>
        <label className="field">
          <span>Time in current employment <small>MONTHS</small></span>
          <input required min="0" max="1200" step="1" type="number" value={form.employmentMonths} onChange={(event) => update("employmentMonths", Number(event.target.value))} />
        </label>
        <label className="field">
          <span>Income type</span>
          <select value={form.incomeType} onChange={(event) => update("incomeType", event.target.value as LoanApplication["incomeType"])}>
            <option value="salaried">Salaried</option>
            <option value="self_employed">Self-employed</option>
          </select>
        </label>
        <label className="field field-wide">
          <span>Repayment history</span>
          <select value={form.repaymentHistory} onChange={(event) => update("repaymentHistory", event.target.value as LoanApplication["repaymentHistory"])}>
            <option value="clean">No recent missed payments</option>
            <option value="one_late_payment">One recent late payment</option>
            <option value="multiple_late_payments">Multiple recent late payments</option>
            <option value="limited_history">Limited repayment history</option>
          </select>
        </label>
      </div>

      {error && <div className="form-error" role="alert"><span aria-hidden="true">!</span>{error}</div>}
      <button className="submit-button" type="submit" disabled={loading}>
        {loading ? <><span className="spinner" /> Assessing application…</> : <>Assess demo application <span aria-hidden="true">→</span></>}
      </button>
      <p className="form-footnote">Payment estimate uses an illustrative 18% APR. This is not a loan offer.</p>
    </form>
  );
}