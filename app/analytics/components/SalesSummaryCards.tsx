// app/analytics/components/SalesSummaryCards.tsx
import type { SalesAnalysis } from "@/lib/oxatis-orders";

interface Props {
  summary: SalesAnalysis["summary"];
}

function formatEuro(n: number): string {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

export function SalesSummaryCards({ summary }: Props) {
  const promoPct =
    summary.totalOrders > 0
      ? Math.round((summary.ordersWithPromo / summary.totalOrders) * 100)
      : 0;

  const cards = [
    { label: "Total commandes", value: summary.totalOrders.toString(), color: "#6366f1", bg: "#eef2ff" },
    { label: "CA net", value: formatEuro(summary.totalRevenue), color: "#16a34a", bg: "#f0fdf4" },
    { label: "Panier moyen", value: formatEuro(summary.avgOrderValue), color: "#0891b2", bg: "#ecfeff" },
    {
      label: "Avec code promo",
      value: `${summary.ordersWithPromo}`,
      sub: `${promoPct} % des commandes`,
      color: "#7c3aed",
      bg: "#faf5ff",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
      {cards.map((card) => (
        <div key={card.label} className="card" style={{ padding: "1.25rem" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 800, color: card.color }}>{card.value}</span>
          </div>
          <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>{card.label}</p>
          {"sub" in card && card.sub && <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.2rem 0 0" }}>{card.sub}</p>}
        </div>
      ))}
    </div>
  );
}
