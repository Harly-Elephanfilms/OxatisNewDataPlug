"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SalesAnalysis, SalesProduct } from "@/lib/oxatis-orders";

function euro(value: number): string {
  return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export function ProductSalesBreakdown({ products }: { products: SalesAnalysis["allProducts"] }) {
  const [query, setQuery] = useState("");
  const [selectedSku, setSelectedSku] = useState("");
  const choices = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("fr-FR");
    return products.filter((product) => !term || `${product.sku} ${product.name}`.toLocaleLowerCase("fr-FR").includes(term));
  }, [products, query]);
  const selected = products.find((product) => product.sku === selectedSku);

  return (
    <section className="card" style={{ padding: "1.5rem", marginTop: "1.5rem" }} aria-label="Ventes par article et code promo">
      <div style={{ marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "0.35rem" }}>
          Ventes d’un article
        </p>
        <p style={{ color: "#64748b", fontSize: "0.8125rem", margin: 0 }}>Recherchez un titre ou une référence pour comparer les ventes dans les commandes avec et sans code promo.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="sales-product-search">Rechercher un article</label>
          <input id="sales-product-search" className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titre ou référence…" />
        </div>
        <div>
          <label className="label" htmlFor="sales-product-select">Article</label>
          <select id="sales-product-select" className="input" value={selectedSku} onChange={(event) => setSelectedSku(event.target.value)}>
            <option value="">Choisir un article ({choices.length} résultat(s))</option>
            {choices.map((product) => <option key={product.sku} value={product.sku}>{product.sku} — {product.name}</option>)}
          </select>
        </div>
      </div>
      {!selected ? (
        <p style={{ color: "#94a3b8", fontSize: "0.875rem", textAlign: "center", padding: "2rem 0 0" }}>
          {products.length ? "Sélectionnez un article pour voir ses ventes." : "Aucun article vendu sur cette période."}
        </p>
      ) : <ProductBreakdown product={selected} />}
    </section>
  );
}

function ProductBreakdown({ product }: { product: SalesProduct }) {
  const chart = [
    { type: "Avec code promo", unités: product.promoQuantity, ca: product.promoRevenue },
    { type: "Sans code promo", unités: product.noPromoQuantity, ca: product.noPromoRevenue },
  ];
  return (
    <div style={{ marginTop: "1.25rem" }}>
      <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.75rem" }}>{product.name} <span style={{ color: "#64748b", fontWeight: 500 }}>({product.sku})</span></h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3" style={{ marginBottom: "1rem" }}>
        <div style={{ padding: "0.875rem", background: "#f8fafc", borderRadius: 10 }}><strong style={{ display: "block", fontSize: "1.3rem" }}>{product.quantity.toLocaleString("fr-FR")}</strong><span style={{ color: "#64748b", fontSize: "0.8rem" }}>unités vendues dans {product.orderCount} commande(s)</span></div>
        <div style={{ padding: "0.875rem", background: "#f5f3ff", borderRadius: 10 }}><strong style={{ display: "block", fontSize: "1.3rem", color: "#7c3aed" }}>{product.promoQuantity.toLocaleString("fr-FR")}</strong><span style={{ color: "#64748b", fontSize: "0.8rem" }}>unités dans commandes avec promo · {product.promoOrderCount} commande(s) · {euro(product.promoRevenue)}</span></div>
        <div style={{ padding: "0.875rem", background: "#eff6ff", borderRadius: 10 }}><strong style={{ display: "block", fontSize: "1.3rem", color: "#2563eb" }}>{product.noPromoQuantity.toLocaleString("fr-FR")}</strong><span style={{ color: "#64748b", fontSize: "0.8rem" }}>unités dans commandes sans promo · {product.noPromoOrderCount} commande(s) · {euro(product.noPromoRevenue)}</span></div>
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={chart} margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="type" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value: number, name: string) => name === "unités" ? [`${value} unité(s)`, "Quantité vendue"] : [euro(value), "CA net"]} />
          <Bar dataKey="unités" fill="#6366f1" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "0.5rem" }}>Le code promo est enregistré au niveau de la commande : le graphique classe donc les unités selon la présence d’un code sur la commande, sans attribuer la remise à un article précis.</p>
    </div>
  );
}
