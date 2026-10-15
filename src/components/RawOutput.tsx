type Props = { raw: unknown };

export default function RawOutput({ raw }: Props) {
  return (
    <details className="raw-card">
      <summary><span><span className="raw-dot" />Raw Jev response</span><span className="raw-summary-hint">Inspect model output <span aria-hidden="true">⌄</span></span></summary>
      <div className="raw-body">
        <p>Unmodified response from the Jev API for this assessment.</p>
        <pre>{JSON.stringify(raw, null, 2)}</pre>
      </div>
    </details>
  );
}
