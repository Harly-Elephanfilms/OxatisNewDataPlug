// app/analytics/components/RevenueChart.tsx
"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { SalesAnalysis } from "@/lib/oxatis-orders";

interface Props {
  revenueByDay: SalesAnalysis["revenueByDay"];
}

export function RevenueChart({ revenueByDay }: Props) {
  if (revenueByDay.length === 0) {
    return (
      <div className="card" style={{ padding: "1.5rem" }}>
        <p style={{ color: "#94a3b8", fontSize: "0.875rem", textAlign: "center" }}>Aucune donnée disponible.</p>
      </div>
    );
  }

  const data = revenueByDay.map((d) => ({
    date: d.date.slice(5),       // MM-DD
    "CA net (€)": Math.round(d.revenue * 100) / 100,
    commandes: d.orders,
  }));

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "1.25rem" }}>
        Chiffre d&apos;affaires par jour
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v} €`} />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === "CA net (€)" ? [`${value.toFixed(2)} €`, "CA net"] : [value, "Commandes"]
            }
            contentStyle={{ fontSize: 12 }}
          />
          <Line type="monotone" dataKey="CA net (€)" stroke="#6366f1" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
