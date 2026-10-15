import type { FraudResult } from "@/lib/jev";

type Props = { result: FraudResult };
const percent = (value: number) => `${Math.round(value * 100)}%`;
const money = (value: number) => new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(value);
const actions: Record<string, string> = {
  allow: "Allow transaction",
  step_up_auth: "Request verification",
  manual_review: "Manual review",
  block: "Recommend block",
};
const riskLabels: Record<string, string> = { low: "Low", medium: "Medium", high: "High" };

export default function DecisionResult({ result }: Props) {
  const data = result.processed;
  const decision = data.decision.toLowerCase();
  const outcomeClass = decision === "allow" ? "positive" : decision === "block" ? "caution" : "review";
  const risk = data.riskLevel.toLowerCase();
  const ratio = percent(data.fraudProbability);

  return (
    <section className="assessment-card" aria-live="polite">
      <div className="assessment-heading">
        <div><span className="eyebrow">JEV FRAUD ASSESSMENT</span><h2>Transaction result</h2></div>
        <span className="model-tag">{result.raw.model}</span>
      </div>
      <div className={`outcome-banner outcome-${outcomeClass}`}>
        <div><span className="metric-label">RECOMMENDED ACTION · {percent(data.decisionConfidence)} confidence</span><strong>{actions[decision] ?? "Manual review"}</strong></div>
        <span className="outcome-marker" aria-hidden="true">{decision === "allow" ? "✓" : decision === "block" ? "!" : "↗"}</span>
      </div>
      <section className="confidence-context" aria-label="Confidence and evidence quality">
        <div className="confidence-heading"><div><span className="panel-kicker">CONFIDENCE CONTEXT</span><h3>How to read this result</h3></div><span className="evidence-quality">Unverified inputs</span></div>
        <div className="confidence-grid">
          <div className="confidence-stat"><span>Jev risk-level confidence</span><strong>{percent(data.riskConfidence)}</strong><small>Confidence in the selected risk level, not validated accuracy</small></div>
          <div className="confidence-stat"><span>Input coverage</span><strong>{data.inputCoverage.provided} / {data.inputCoverage.required}</strong><small>Required transaction fields supplied</small></div>
        </div>
      </section>
      <div className="metrics-grid loan-metrics fraud-metrics">
        <article className={`metric risk-metric risk-${risk}`}>
          <span className="metric-label">Risk level</span>
          <strong className="metric-value">{riskLabels[risk] ?? "Review"}</strong>
          <span className="metric-note">{percent(data.riskConfidence)} model confidence</span>
        </article>
        <article className="metric fraud-probability">
          <span className="metric-label">Estimated fraud likelihood</span>
          <strong className="metric-value">{ratio}</strong>
          <div className="meter" role="img" aria-label={`${ratio} estimated fraud likelihood`}><span style={{ width: ratio }} /></div>
        </article>
      </div>
      <div className="signals-block evidence-block">
        <div className="signals-title"><h3>Evidence considered</h3><span>{data.evidence.length} factors</span></div>
        <dl className="evidence-list">
          {data.evidence.map((item) => (
            <div className="evidence-row" key={item.factor}><dt>{item.factor}</dt><dd>{item.value}</dd></div>
          ))}
        </dl>
        {data.signals.length > 0 && <p className="evidence-note">Unusual indicators: {data.signals.join(" · ")}. These are signals for review, not proof of fraud.</p>}
      </div>
      <p className="result-note">Demo only. This is a model recommendation; no real payment is approved, blocked, or changed. Confirm suspicious activity through your institution’s fraud controls.</p>
    </section>
  );
}