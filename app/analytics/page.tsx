"use client";

import { useState, useMemo } from "react";
import type { Article } from "@/lib/types";
import { useSalesAnalysis } from "./hooks/useSalesAnalysis";
import { SalesDatePicker } from "./components/SalesDatePicker";
import { SalesProgress } from "./components/SalesProgress";
import { SalesSummaryCards } from "./components/SalesSummaryCards";
import { TopProductsChart } from "./components/TopProductsChart";
import { RevenueChart } from "./components/RevenueChart";
import { PromoCodeTable } from "./components/PromoCodeTable";

interface StatCard {
  label: string;
  value: number | string;
  sub?: string;
  color: string;
  bg: string;
}

type BrandSort = "count" | "alpha";

export default function AnalyticsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brandSort, setBrandSort] = useState<BrandSort>("count");
  const [brandSearch, setBrandSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"catalogue" | "ventes">("catalogue");
  const { status, progress, result, truncated, error: salesError, analyze } = useSalesAnalysis();

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/oxatis/fetch-articles");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setArticles(data.items);
      setSelectedBrand(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (articles.length === 0) return null;

    const total = articles.length;
    const inStock = articles.filter((a) => a.quantity > 0).length;
    const outOfStock = articles.filter((a) => a.quantity === 0).length;
    const negative = articles.filter((a) => a.quantity < 0).length;
    const hidden = articles.filter((a) => !a.visible).length;
    const noCategory = articles.filter((a) => a.categories.every((c) => !c)).length;

    // All brands sorted
    const brandCount: Record<string, number> = {};
    for (const a of articles) {
      if (a.brand) brandCount[a.brand] = (brandCount[a.brand] || 0) + 1;
    }
    const allBrands = Object.entries(brandCount);

    // Distribution des prix (TTC)
    const prices = articles
      .map((a) => parseFloat(a.price.replace(/[^\d.,]/g, "").replace(",", ".")))
      .filter((p) => !isNaN(p) && p > 0);
    const avgPrice = prices.length ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const minPrice = prices.length ? Math.min(...prices) : 0;

    // Tranches de prix
    const priceRanges = [
      { label: "< 10 €", count: prices.filter((p) => p < 10).length },
      { label: "10–30 €", count: prices.filter((p) => p >= 10 && p < 30).length },
      { label: "30–60 €", count: prices.filter((p) => p >= 30 && p < 60).length },
      { label: "60–100 €", count: prices.filter((p) => p >= 60 && p < 100).length },
      { label: "> 100 €", count: prices.filter((p) => p >= 100).length },
    ];

    // Top catégories (Category1Name)
    const catCount: Record<string, number> = {};
    for (const a of articles) {
      const cat = a.categories[0];
      if (cat) catCount[cat] = (catCount[cat] || 0) + 1;
    }
    const topCategories = Object.entries(catCount)
      .sort((x, y) => y[1] - x[1])
      .slice(0, 10);

    return { total, inStock, outOfStock, negative, hidden, noCategory, allBrands, avgPrice, maxPrice, minPrice, priceRanges, topCategories };
  }, [articles]);

  const brandDrilldown = useMemo(() => {
    if (!selectedBrand) return null;
    const items = articles.filter((a) => a.brand === selectedBrand);
    const inStock = items.filter((a) => a.quantity > 0).length;
    const outOfStock = items.filter((a) => a.quantity === 0).length;
    const hidden = items.filter((a) => !a.visible).length;
    const prices = items
      .map((a) => parseFloat(a.price.replace(/[^\d.,]/g, "").replace(",", ".")))
      .filter((p) => !isNaN(p) && p > 0);
    const avgPrice = prices.length ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;
    const catCount: Record<string, number> = {};
    for (const a of items) {
      const cat = a.categories[0];
      if (cat) catCount[cat] = (catCount[cat] || 0) + 1;
    }
    const topCats = Object.entries(catCount).sort((x, y) => y[1] - x[1]).slice(0, 5);
    return { items, inStock, outOfStock, hidden, avgPrice, topCats };
  }, [selectedBrand, articles]);

  const filteredBrands = useMemo(() => {
    if (!stats) return [];
    let list = stats.allBrands;
    if (brandSearch.trim()) {
      const q = brandSearch.toLowerCase();
      list = list.filter(([b]) => b.toLowerCase().includes(q));
    }
    if (brandSort === "count") return list.sort((a, b) => b[1] - a[1]);
    return list.sort((a, b) => a[0].localeCompare(b[0]));
  }, [stats, brandSort, brandSearch]);

  const statCards: StatCard[] = stats
    ? [
        { label: "Total articles", value: stats.total, color: "#6366f1", bg: "#eef2ff" },
        { label: "En stock", value: stats.inStock, sub: `${Math.round((stats.inStock / stats.total) * 100)} %`, color: "#16a34a", bg: "#f0fdf4" },
        { label: "Rupture (0)", value: stats.outOfStock, sub: `${Math.round((stats.outOfStock / stats.total) * 100)} %`, color: "#d97706", bg: "#fffbeb" },
        { label: "Stock négatif", value: stats.negative, sub: "ruptures / supprimés", color: "#ef4444", bg: "#fef2f2" },
        { label: "Masqués", value: stats.hidden, sub: `${Math.round((stats.hidden / stats.total) * 100)} % du catalogue`, color: "#7c3aed", bg: "#faf5ff" },
        { label: "Sans catégorie", value: stats.noCategory, sub: "aucun slot renseigné", color: "#0891b2", bg: "#ecfeff" },
      ]
    : [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)", padding: "2.5rem 2rem 3rem" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
              <svg style={{ width: 26, height: 26, color: "#a5b4fc" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.2, margin: 0 }}>Data Analyse</h1>
              <p style={{ fontSize: "0.875rem", color: "#a5b4fc", margin: "0.2rem 0 0" }}>Statistiques et performances du catalogue</p>
            </div>
          </div>
          {activeTab === "catalogue" && (
            <button
              onClick={fetchData}
              disabled={loading}
              className="btn btn-primary btn-sm"
              style={{ marginTop: "0.5rem" }}
            >
              {loading ? (
                <><span className="spinner spinner-sm" /> Chargement…</>
              ) : articles.length > 0 ? "Actualiser" : "Charger le catalogue"}
            </button>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div style={{ borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 2rem", display: "flex", gap: "0" }}>
          {[
            { id: "catalogue" as const, label: "Catalogue" },
            { id: "ventes" as const, label: "Ventes" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "0.875rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: activeTab === tab.id ? "#6366f1" : "#64748b",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid #6366f1" : "2px solid transparent",
                cursor: "pointer",
                transition: "color 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem" }}>
        {activeTab === "catalogue" && (
          <>
            {error && <div className="alert alert-error mb-6">{error}</div>}

            {!stats && !loading && (
              <div className="card p-10 text-center" style={{ color: "#94a3b8" }}>
                <p style={{ fontSize: "1rem", fontWeight: 500 }}>Cliquez sur &quot;Charger le catalogue&quot; pour afficher les statistiques.</p>
                <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Aucun appel API Oxatis nécessaire — données issues du flux catalogue.</p>
              </div>
            )}

            {stats && (
              <>
                {/* Stat cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                  {statCards.map((card) => (
                    <div key={card.label} className="card" style={{ padding: "1.25rem" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                        <span style={{ fontSize: "1.125rem", fontWeight: 800, color: card.color }}>{typeof card.value === "number" && card.value > 999 ? `${(card.value / 1000).toFixed(1)}k` : card.value}</span>
                      </div>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>{card.label}</p>
                      {card.sub && <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.2rem 0 0" }}>{card.sub}</p>}
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                  {/* Prix */}
                  <div className="card" style={{ padding: "1.5rem" }}>
                    <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "1rem" }}>Distribution des prix TTC</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                      {stats.priceRanges.map((r) => (
                        <div key={r.label}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", marginBottom: "0.25rem" }}>
                            <span style={{ color: "#374151" }}>{r.label}</span>
                            <span style={{ fontWeight: 600, color: "#6366f1" }}>{r.count}</span>
                          </div>
                          <div style={{ height: 6, background: "#e2e8f0", borderRadius: 4 }}>
                            <div style={{ height: 6, background: "#6366f1", borderRadius: 4, width: `${stats.total ? Math.round((r.count / stats.total) * 100) : 0}%`, transition: "width 0.4s ease" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: "1rem", display: "flex", gap: "1.5rem", fontSize: "0.8125rem", color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" }}>
                      <span>Moy. <strong style={{ color: "#374151" }}>{stats.avgPrice.toFixed(2)} €</strong></span>
                      <span>Min. <strong style={{ color: "#374151" }}>{stats.minPrice.toFixed(2)} €</strong></span>
                      <span>Max. <strong style={{ color: "#374151" }}>{stats.maxPrice.toFixed(2)} €</strong></span>
                    </div>
                  </div>

                  {/* Top catégories */}
                  <div className="card" style={{ padding: "1.5rem" }}>
                    <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "1rem" }}>Top catégories</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {stats.topCategories.map(([name, count]) => (
                        <div key={name} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.8rem", color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name || "(sans nom)"}</div>
                          </div>
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#7c3aed", flexShrink: 0 }}>{count}</span>
                          <div style={{ width: 60, height: 5, background: "#e2e8f0", borderRadius: 3, flexShrink: 0 }}>
                            <div style={{ height: 5, background: "#7c3aed", borderRadius: 3, width: `${stats.topCategories[0] ? Math.round((count / stats.topCategories[0][1]) * 100) : 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Marques avec filtre et drill-down */}
                <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                    <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", margin: 0 }}>
                      Marques ({filteredBrands.length})
                    </p>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <input
                        type="text"
                        placeholder="Filtrer les marques…"
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                        className="form-input"
                        style={{ fontSize: "0.8125rem", padding: "0.35rem 0.625rem" }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                      <button
                        onClick={() => setBrandSort("count")}
                        className={`btn btn-sm ${brandSort === "count" ? "btn-primary" : "btn-secondary"}`}
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.625rem" }}
                      >
                        Par quantité
                      </button>
                      <button
                        onClick={() => setBrandSort("alpha")}
                        className={`btn btn-sm ${brandSort === "alpha" ? "btn-primary" : "btn-secondary"}`}
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.625rem" }}
                      >
                        A–Z
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.625rem" }}>
                    {filteredBrands.map(([brand, count], i) => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.625rem",
                          padding: "0.625rem 0.875rem",
                          borderRadius: 8,
                          background: selectedBrand === brand ? "#eef2ff" : "#f8fafc",
                          border: selectedBrand === brand ? "1.5px solid #6366f1" : "1px solid #e2e8f0",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "border-color 0.15s, background 0.15s",
                        }}
                      >
                        {brandSort === "count" && (
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", width: 18, flexShrink: 0 }}>#{i + 1}</span>
                        )}
                        <span style={{ fontSize: "0.8125rem", color: "#374151", fontWeight: 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{brand}</span>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: selectedBrand === brand ? "#6366f1" : "#16a34a", flexShrink: 0 }}>{count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drill-down marque */}
                {selectedBrand && brandDrilldown && (
                  <div className="card" style={{ padding: "1.5rem", border: "1.5px solid #6366f1" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <div>
                        <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6366f1", margin: "0 0 0.25rem" }}>Détail marque</p>
                        <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>{selectedBrand}</h3>
                      </div>
                      <button onClick={() => setSelectedBrand(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "1.25rem", lineHeight: 1 }}>×</button>
                    </div>

                    {/* Mini stats */}
                    <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                      {[
                        { label: "Articles", value: brandDrilldown.items.length, color: "#6366f1" },
                        { label: "En stock", value: brandDrilldown.inStock, color: "#16a34a" },
                        { label: "Rupture", value: brandDrilldown.outOfStock, color: "#d97706" },
                        { label: "Masqués", value: brandDrilldown.hidden, color: "#7c3aed" },
                        { label: "Prix moy.", value: `${brandDrilldown.avgPrice.toFixed(2)} €`, color: "#374151" },
                      ].map((s) => (
                        <div key={s.label} style={{ padding: "0.5rem 1rem", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Top catégories de la marque */}
                    {brandDrilldown.topCats.length > 0 && (
                      <div style={{ marginBottom: "1rem" }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "0.5rem" }}>Catégories principales</p>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          {brandDrilldown.topCats.map(([cat, count]) => (
                            <span key={cat} style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem", background: "#eef2ff", color: "#6366f1", borderRadius: 6, fontWeight: 500 }}>
                              {cat} ({count})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Table articles */}
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                            {["SKU", "Titre", "Prix TTC", "Stock", "Visible", "Catégorie"].map((h) => (
                              <th key={h} style={{ textAlign: "left", padding: "0.5rem 0.625rem", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {brandDrilldown.items.slice(0, 50).map((a) => (
                            <tr key={a.oxatisId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "0.5rem 0.625rem", color: "#64748b", fontFamily: "monospace", fontSize: "0.75rem" }}>{a.itemSKU}</td>
                              <td style={{ padding: "0.5rem 0.625rem", color: "#374151", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</td>
                              <td style={{ padding: "0.5rem 0.625rem", color: "#374151", fontWeight: 600 }}>{a.price}</td>
                              <td style={{ padding: "0.5rem 0.625rem" }}>
                                <span style={{ fontWeight: 600, color: a.quantity > 0 ? "#16a34a" : a.quantity < 0 ? "#ef4444" : "#d97706" }}>{a.quantity}</span>
                              </td>
                              <td style={{ padding: "0.5rem 0.625rem" }}>
                                <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: 4, background: a.visible ? "#f0fdf4" : "#fef2f2", color: a.visible ? "#16a34a" : "#ef4444" }}>
                                  {a.visible ? "Oui" : "Non"}
                                </span>
                              </td>
                              <td style={{ padding: "0.5rem 0.625rem", color: "#64748b", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.categories[0] || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {brandDrilldown.items.length > 50 && (
                        <p style={{ fontSize: "0.75rem", color: "#94a3b8", textAlign: "center", padding: "0.5rem", marginTop: "0.5rem" }}>
                          Affichage limité aux 50 premiers articles (sur {brandDrilldown.items.length})
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "ventes" && (
          <div>
            {/* Sélecteur de période */}
            <div style={{ marginBottom: "1.5rem" }}>
              <SalesDatePicker onAnalyze={analyze} disabled={status === "loading"} />
            </div>

            {/* Erreur */}
            {salesError && (
              <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
                {salesError}
              </div>
            )}

            {/* Progression */}
            {status === "loading" && (
              <div style={{ marginBottom: "1.5rem" }}>
                <SalesProgress done={progress.done} total={progress.total} errors={progress.errors} />
              </div>
            )}

            {/* Avertissement de troncature */}
            {status === "done" && truncated && (
              <div className="alert alert-warning" style={{ marginBottom: "1.5rem" }}>
                Résultats partiels : {truncated.processed.toLocaleString("fr-FR")} commandes analysées sur{" "}
                {truncated.available.toLocaleString("fr-FR")} disponibles sur la période. Affinez la plage de dates pour une analyse complète.
              </div>
            )}

            {/* Résultats */}
            {status === "done" && result && (
              <>
                <SalesSummaryCards summary={result.summary} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                  <RevenueChart revenueByDay={result.revenueByDay} />
                  <PromoCodeTable promoCodes={result.promoCodes} />
                </div>
                <TopProductsChart products={result.topProducts} />
                {result.summary.totalOrders === 0 && (
                  <div className="card p-10 text-center" style={{ color: "#94a3b8", marginTop: "1.5rem" }}>
                    <p style={{ fontSize: "1rem", fontWeight: 500 }}>Aucune commande sur cette période.</p>
                  </div>
                )}
              </>
            )}

            {/* État initial */}
            {status === "idle" && (
              <div className="card" style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
                <p style={{ fontSize: "1rem", fontWeight: 500 }}>Sélectionnez une période et cliquez sur &quot;Analyser&quot;.</p>
                <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Les commandes sont récupérées en temps réel depuis Oxatis.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
