// app/analytics/components/PromoCodeTable.tsx
import type { SalesAnalysis } from "@/lib/oxatis-orders";

interface Props {
  promoCodes: SalesAnalysis["promoCodes"];
}

export function PromoCodeTable({ promoCodes }: Props) {
  if (promoCodes.length === 0) {
    return (
      <div className="card" style={{ padding: "1.5rem" }}>
        <p style={{ color: "#94a3b8", fontSize: "0.875rem", textAlign: "center" }}>Aucun code promo utilisé sur cette période.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "1rem" }}>
        Codes promo utilisés
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              {["Code", "Utilisations", "Remise totale accordée"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "0.5rem 0.75rem", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {promoCodes.map((p) => (
              <tr key={p.code} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "0.625rem 0.75rem", fontFamily: "monospace", fontWeight: 700, color: "#6366f1" }}>
                  {p.code}
                </td>
                <td style={{ padding: "0.625rem 0.75rem", fontWeight: 600, color: "#374151" }}>
                  {p.usageCount} commande{p.usageCount > 1 ? "s" : ""}
                </td>
                <td style={{ padding: "0.625rem 0.75rem", color: "#d97706", fontWeight: 600 }}>
                  −{p.totalDiscount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
