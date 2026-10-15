"use client";

import { useState } from "react";
import DecisionResult from "@/components/DecisionResult";
import RawOutput from "@/components/RawOutput";
import TransactionForm from "@/components/TransactionForm";
import type { LoanResult } from "@/lib/jev";

export default function Home() {
  const [result, setResult] = useState<LoanResult | null>(null);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Jev Eligibility Lab home"><span className="brand-mark">j</span><span>jev<span className="brand-light"> / eligibility lab</span></span></a>
        <div className="topbar-status"><span className="status-dot" />LOAN DECISION DEMO</div>
      </header>

      <div className="content-wrap" id="top">
        <section className="intro">
          <div className="intro-copy">
            <span className="eyebrow"><span className="eyebrow-line" /> AI ENGINEERING STUDIO <span className="intro-index">01 / LOAN ELIGIBILITY</span></span>
            <h1>Make the decision<br /><em>clearer to understand.</em></h1>
            <p>Explore how financial indicators can support a cautious loan application review—with the assumptions and model output in view.</p>
          </div>
          <div className="flow-note"><span className="flow-number">01</span><span>APPLICATION<br />DETAILS</span><span className="flow-arrow">→</span><span className="flow-number">02</span><span>JEV<br />ASSESSMENT</span></div>
        </section>

        <div className="demo-notice"><span aria-hidden="true">i</span><p><strong>Illustrative demo only.</strong> This is not a real lending decision, approval, denial, or loan offer. No protected characteristics are used.</p></div>

        <div className="workspace-grid">
          <section className="input-panel">
            <div className="panel-heading"><div><span className="panel-kicker">SYNTHETIC APPLICATION</span><h2>Applicant indicators</h2></div><span className="step-chip">STEP 01</span></div>
            <p className="panel-description">Load a sample scenario or adjust the financial and repayment details.</p>
            <TransactionForm onResult={setResult} />
          </section>

          <section className="output-panel" aria-label="Loan eligibility assessment output">
            {result ? <><DecisionResult result={result} /><RawOutput raw={result.raw} /></> : (
              <div className="empty-state">
                <div className="empty-illustration" aria-hidden="true"><span className="empty-ring ring-one" /><span className="empty-ring ring-two" /><span className="empty-core">J</span><span className="empty-orbit orbit-one" /><span className="empty-orbit orbit-two" /></div>
                <span className="panel-kicker">ASSESSMENT OUTPUT</span>
                <h2>Your application<br />indicators will appear here.</h2>
                <p>Choose a sample scenario to explore estimated payment, monthly commitments, surfaced factors, and a suggested next step.</p>
                <div className="empty-footer"><span className="status-dot" /> READY WHEN YOU ARE</div>
              </div>
            )}
          </section>
        </div>

        <footer className="page-footer"><span>JEV LOAN ELIGIBILITY DEMO</span><span>Illustrative assumptions · LKR · Human review</span></footer>
      </div>
    </main>
  );
}