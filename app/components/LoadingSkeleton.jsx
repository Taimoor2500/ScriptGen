// Static skeleton bar widths — stable across renders so React's key churn
// doesn't produce visual jitter.
const BAR_WIDTHS = ["90%", "78%", "82%", "66%", "88%", "72%", "84%", "60%"];

export function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {BAR_WIDTHS.map((w, i) => (
        <div key={i} className="h-3 rounded bg-white/5" style={{ width: w }} />
      ))}
    </div>
  );
}
