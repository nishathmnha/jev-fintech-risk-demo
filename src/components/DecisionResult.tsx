import type { LoanResult } from "@/lib/jev";

type Props = { result: LoanResult };
const percent = (value: number) => `${Math.round(value * 100)}%`;
const money = (value: number) => new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(value);
const eligibilityLabels: Record<string, string> = {
  approved: "Approved",
  manual_review: "Manual review",
};
const nextStepLabels: Record<string, string> = {
  verify_income: "Verify income and obligations",
  request_more_information: "Request more information",
  human_review: "Assign to a human reviewer",
  reassess_loan_terms: "Discuss different loan terms",
  continue_demo_review: "Continue to human review",
};

export default function DecisionResult({ result }: Props) {
  const data = result.processed;
  const decision = data.eligibility.toLowerCase();
  const isApproved = decision === "approved";
  const outcomeClass = isApproved ? "positive" : "review";
  const ratio = percent(data.commitmentsToIncomeRatio);

  return (
    <section className="assessment-card" aria-live="polite">
      <div className="assessment-heading">
        <div><span className="eyebrow">JEV APPLICATION ASSESSMENT</span><h2>Decision and evidence</h2></div>
        <span className="model-tag">{result.raw.model}</span>
      </div>
      <div className={`outcome-banner outcome-${outcomeClass}`}>
        <div><span className="metric-label">DEMO DECISION · {percent(data.confidence)} confidence</span><strong>{eligibilityLabels[decision] ?? "Manual review"}</strong></div>
        <span className="outcome-marker" aria-hidden="true">{isApproved ? "✓" : "↗"}</span>
      </div>
      <div className="metrics-grid loan-metrics">
        <article className="metric">
          <span className="metric-label">Estimated monthly payment</span>
          <strong className="metric-value metric-money">{money(data.estimatedMonthlyPayment)}</strong>
          <span className="metric-note">{money(data.estimatedMonthlyCommitments)} incl. existing debt</span>
        </article>
        <article className="metric">
          <span className="metric-label">Commitments / gross income</span>
          <strong className="metric-value">{ratio}</strong>
          <div className="meter" role="img" aria-label={`${ratio} estimated monthly commitments relative to gross income`}><span style={{ width: `${Math.min(100, Math.max(0, data.commitmentsToIncomeRatio * 100))}%` }} /></div>
        </article>
        <article className="metric metric-action loan-next-step">
          <span className="metric-label">Recommended next action</span>
          <strong className="metric-value">{nextStepLabels[data.nextStep.toLowerCase()] ?? "Route to a human reviewer"}</strong>
          <span className="metric-note">Jev confidence: {percent(data.nextStepConfidence)} · human review required</span>
        </article>
      </div>
      <div className="signals-block evidence-block">
        <div className="signals-title"><h3>Evidence considered</h3><span>{data.evidence.length} application factors</span></div>
        <dl className="evidence-list">
          {data.evidence.map((item) => (
            <div className="evidence-row" key={item.factor}>
              <dt>{item.factor}</dt><dd>{item.value}</dd>
            </div>
          ))}
        </dl>
        <p className="evidence-note">These are the submitted inputs and a transparent payment calculation—not proof that a factor caused the model’s outcome.</p>
      </div>
      <p className="result-note">Illustrative estimate at {percent(data.demoApr)} APR. “Approved” is a fictional demo label, not a credit decision, loan approval, denial, or offer. Any real application requires verified information, validated policy, fair-lending review, and human oversight.</p>
    </section>
  );
}