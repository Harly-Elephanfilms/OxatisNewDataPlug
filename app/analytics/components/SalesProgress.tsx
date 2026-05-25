// app/analytics/components/SalesProgress.tsx
interface Props {
  done: number;
  total: number;
  errors: number;
}

export function SalesProgress({ done, total, errors }: Props) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.75rem" }}>
        Analyse en cours…{" "}
        <span style={{ color: "#6366f1" }}>{done}</span>
        <span style={{ color: "#94a3b8" }}> / {total} commandes</span>
      </p>
      <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            height: 8,
            background: "linear-gradient(90deg, #6366f1, #818cf8)",
            borderRadius: 4,
            width: `${pct}%`,
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{pct} %</span>
        {errors > 0 && (
          <span style={{ fontSize: "0.75rem", color: "#d97706" }}>
            {errors} commande{errors > 1 ? "s" : ""} ignorée{errors > 1 ? "s" : ""} (timeout)
          </span>
        )}
      </div>
    </div>
  );
}
