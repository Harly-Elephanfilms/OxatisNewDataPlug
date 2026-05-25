// app/analytics/components/TopProductsChart.tsx
"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { SalesAnalysis } from "@/lib/oxatis-orders";

interface Props {
  products: SalesAnalysis["topProducts"];
}

export function TopProductsChart({ products }: Props) {
  if (products.length === 0) {
    return (
      <div className="card" style={{ padding: "1.5rem" }}>
        <p style={{ color: "#94a3b8", fontSize: "0.875rem", textAlign: "center" }}>Aucun article vendu sur cette période.</p>
      </div>
    );
  }

  const data = products.map((p) => ({
    name: p.name.length > 30 ? p.name.slice(0, 30) + "…" : p.name,
    sku: p.sku,
    quantité: p.quantity,
    revenue: p.revenue,
  }));

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "1.25rem" }}>
        Top {products.length} articles vendus
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === "quantité" ? [`${value} unités`, "Qté vendue"] : [`${value.toFixed(2)} €`, "CA net"]
            }
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="quantité" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={entry.sku} fill={i === 0 ? "#6366f1" : i < 3 ? "#818cf8" : "#c7d2fe"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
