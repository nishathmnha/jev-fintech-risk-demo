"use client";

import { useState } from "react";
import DecisionResult from "@/components/DecisionResult";
import RawOutput from "@/components/RawOutput";
import TransactionForm from "@/components/TransactionForm";
import type { FraudResult } from "@/lib/jev";

export default function Home() {
  const [result, setResult] = useState<FraudResult | null>(null);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Jev Fraud Lab home">jev <span className="brand-light">/ fraud lab</span></a>
        <span className="topbar-status">DEMO · TRANSACTIONS</span>
      </header>
      <div className="content-wrap minimal-content" id="top">
        <section className="intro minimal-intro">
          <div className="intro-copy">
            <span className="eyebrow">TRANSACTION MONITORING</span>
            <h1>Fraud detection</h1>
            <p>See which transaction signals inform Jev’s risk assessment and recommended action.</p>
          </div>
        </section>
        <div className="workspace-grid minimal-workspace">
          <section className="input-panel">
            <div className="panel-heading"><div><span className="panel-kicker">TRANSACTION DETAILS</span><h2>Enter transaction</h2></div></div>
            <TransactionForm onResult={setResult} />
          </section>
          <section className="output-panel" aria-label="Transaction fraud assessment">
            {result ? <><DecisionResult result={result} /><RawOutput raw={result.raw} /></> : (
              <div className="empty-state minimal-empty">
                <span className="panel-kicker">ASSESSMENT</span>
                <h2>No assessment yet</h2>
                <p>Submit a transaction to see its estimated risk, fraud likelihood, and recommended action.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}