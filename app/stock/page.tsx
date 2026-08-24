"use client";

import { useState, useMemo, useCallback } from "react";
import type { StockItem, CsvStockItem, ComparisonItem, Article } from "@/lib/types";
import { useCredentials } from "@/app/contexts/CredentialsContext";
import { isFutureDate } from "@/lib/dates";
import StockImport from "@/app/components/features/stock/StockImport";
import StockComparisonTable from "@/app/components/features/stock/StockComparisonTable";
import ReleaseCategoryPanel from "@/app/components/features/stock/ReleaseCategoryPanel";

type Tab = "config" | "import" | "comparison";
type SortField = "itemSKU" | "name" | "currentStock" | "newStock" | "difference";
type SortDir = "asc" | "desc";

function adjustNewStock(stock: number): number {
  const adjusted = stock - 5;
  if (adjusted <= -5) return 0;
  if (adjusted <= 0) return 1;
  return adjusted;
}

export default function StockPage() {
  const { appId, token, hasCredentials } = useCredentials();
  const [serverHasCredentials, setServerHasCredentials] = useState(false);

  useState(() => {
    fetch("/api/oxatis/config")
      .then((r) => r.json())
      .then((d) => setServerHasCredentials(d.hasCredentials))
      .catch(() => {});
  });

  const [tab, setTab] = useState<Tab>("import");
  const [siteStock, setSiteStock] = useState<StockItem[]>([]);
  const [newStock, setNewStock] = useState<CsvStockItem[]>([]);
  const [siteFileName, setSiteFileName] = useState<string>("");
  const [newFileName, setNewFileName] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("difference");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPreorder, setFilterPreorder] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState("");
  const [loadingSiteStock, setLoadingSiteStock] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [itemsToSend, setItemsToSend] = useState<ComparisonItem[]>([]);
  // Catalogue complet : porte les catégories que le flux stock n'a pas.
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

  const [localAppId, setLocalAppId] = useState("");
  const [localToken, setLocalToken] = useState("");
  const [testingCredentials, setTestingCredentials] = useState(false);
  const [credentialsTestResult, setCredentialsTestResult] = useState<"ok" | "error" | null>(null);
  const { setCredentials } = useCredentials();

  const effectiveHasCredentials = serverHasCredentials || hasCredentials;

  const loadArticles = useCallback(async () => {
    setLoadingArticles(true);
    try {
      const res = await fetch("/api/oxatis/fetch-articles");
      const data = await res.json() as { items?: Article[]; error?: string };
      if (!res.ok || !data.items) throw new Error(data.error || "Erreur chargement du catalogue");
      setArticles(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoadingArticles(false);
    }
  }, []);

  const fetchSiteStockFromUrl = async () => {
    setLoadingSiteStock(true);
    setError("");
    try {
      const response = await fetch("/api/oxatis/fetch-site-stock");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur lors du téléchargement");
      const items: StockItem[] = data.items.map((item: { oxatisId: string; itemSKU: string; name: string; qtyInStock: number; dateOfAvailability?: string }) => ({
        oxatisId: item.oxatisId,
        itemSKU: item.itemSKU,
        name: item.name,
        qtyInStock: item.qtyInStock,
        dateOfAvailability: item.dateOfAvailability || "",
      }));
      setSiteStock(items);
      setSiteFileName(`elephantfilms.com (${new Date().toLocaleDateString("fr-FR")})`);
      loadArticles();
      setSuccess(`${items.length} produits récupérés depuis elephantfilms.com`);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoadingSiteStock(false);
    }
  };

  const handleImport = useCallback((items: StockItem[] | CsvStockItem[], format: string) => {
    setError("");
    if (format === "oxatis") {
      const stockItems = items as StockItem[];
      setSiteStock(stockItems);
      setSiteFileName("fichier importé");
      loadArticles();
      setSuccess(`${stockItems.length} produits importés (stock site)`);
      setTimeout(() => setSuccess(""), 5000);
    } else if (format === "export") {
      const csvItems = items as CsvStockItem[];
      setNewStock(csvItems);
      setNewFileName("fichier importé");
      setSuccess(`${csvItems.length} produits importés (nouveau stock)`);
      setTimeout(() => setSuccess(""), 5000);
    }
  }, [loadArticles]);

  const comparison = useMemo((): ComparisonItem[] => {
    if (siteStock.length === 0 && newStock.length === 0) return [];
    const siteMap = new Map<string, StockItem>();
    for (const item of siteStock) siteMap.set(item.itemSKU, item);
    const csvMap = new Map<string, CsvStockItem>();
    for (const item of newStock) csvMap.set(item.ref, item);
    const allSKUs = new Set([...siteMap.keys(), ...csvMap.keys()]);
    const items: ComparisonItem[] = [];
    for (const sku of allSKUs) {
      const siteItem = siteMap.get(sku);
      const csvItem = csvMap.get(sku);
      const currentStock = siteItem?.qtyInStock ?? 0;
      const dateOfAvailability = siteItem?.dateOfAvailability || "";
      if (currentStock < 0 && !dateOfAvailability) continue;
      const isPreorder = isFutureDate(dateOfAvailability);
      const rawNewQty = csvItem?.stock ?? 0;
      const newQty = isPreorder ? -9999 : adjustNewStock(rawNewQty);
      if (!isPreorder && currentStock === 0 && newQty === 0) continue;
      const difference = newQty - currentStock;
      let status: ComparisonItem["status"];
      if (isPreorder)        status = "preorder";
      else if (!siteItem)    status = "new";
      else if (!csvItem)     status = "missing";
      else if (difference === 0) status = "unchanged";
      else if (difference > 0)   status = "increased";
      else                       status = "decreased";
      items.push({ itemSKU: sku, name: siteItem?.name || csvItem?.title || "", oxatisId: siteItem?.oxatisId, currentStock, newStock: newQty, difference, dateOfAvailability, isPreorder, status });
    }
    return items;
  }, [siteStock, newStock]);

  const filteredComparison = useMemo(() => {
    let items = [...comparison];
    if (filterPreorder) items = items.filter((item) => item.isPreorder);
    if (filterStatus !== "all") items = items.filter((item) => item.status === filterStatus);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter((item) => item.itemSKU.toLowerCase().includes(term) || item.name.toLowerCase().includes(term));
    }
    items.sort((a, b) => {
      let valA: string | number = a[sortField];
      let valB: string | number = b[sortField];
      if (typeof valA === "string") { valA = valA.toLowerCase(); valB = (valB as string).toLowerCase(); }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return items;
  }, [comparison, filterPreorder, filterStatus, searchTerm, sortField, sortDir]);

  const stats = useMemo(() => ({
    unchanged: comparison.filter((i) => i.status === "unchanged").length,
    increased: comparison.filter((i) => i.status === "increased").length,
    decreased: comparison.filter((i) => i.status === "decreased").length,
    new:       comparison.filter((i) => i.status === "new").length,
    missing:   comparison.filter((i) => i.status === "missing").length,
    preorder:  comparison.filter((i) => i.status === "preorder").length,
    toUpdate:  comparison.filter((i) => i.status === "increased" || i.status === "decreased").length,
  }), [comparison]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir(field === "difference" ? "desc" : "asc"); }
  }, [sortField, sortDir]);

  const handleUpdateStock = async () => {
    if (!effectiveHasCredentials) { setError("Identifiants API requis — onglet CONFIG"); setTab("config"); return; }
    const itemsToUpdate = comparison.filter((item) => (item.status === "increased" || item.status === "decreased") && !item.isPreorder);
    if (itemsToUpdate.length === 0) { setError("Aucun produit à mettre à jour"); return; }
    setUpdating(true);
    setUpdateProgress(`Mise à jour de ${itemsToUpdate.length} produits...`);
    setError("");
    try {
      const response = await fetch("/api/oxatis/update-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(serverHasCredentials ? {} : { appId, token }),
          items: itemsToUpdate.map((item) => ({ itemSKU: item.itemSKU, quantity: item.newStock })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur lors de la mise à jour");
      setUpdateProgress("");
      const failedSKUs = new Set((data.errors ?? []).map((e: string) => e.split(":")[0].trim()));
      setSiteStock((prev) => prev.map((item) => {
        const updated = itemsToUpdate.find((u) => u.itemSKU === item.itemSKU);
        if (updated && !failedSKUs.has(item.itemSKU)) return { ...item, qtyInStock: updated.newStock };
        return item;
      }));
      setSuccess(`${data.updated}/${data.total} produits mis à jour${data.errors?.length > 0 ? ` — Erreurs: ${data.errors.slice(0, 5).join(", ")}` : ""}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setUpdating(false);
      setUpdateProgress("");
    }
  };

  const openSendPreview = () => {
    if (!effectiveHasCredentials) { setError("Identifiants API requis"); return; }
    const toSend = filteredComparison.filter((item) => (item.status === "increased" || item.status === "decreased") && !item.isPreorder);
    if (toSend.length === 0) { setError("Aucun produit à mettre à jour"); return; }
    setItemsToSend(toSend);
    setPreviewModalOpen(true);
  };

  const testCredentials = async () => {
    setTestingCredentials(true);
    setCredentialsTestResult(null);
    const id = localAppId || appId;
    const tok = localToken || token;
    try {
      const result = await setCredentials(id, tok);
      setCredentialsTestResult(result.success ? "ok" : "error");
    } catch {
      setCredentialsTestResult("error");
    } finally {
      setTestingCredentials(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "import",     label: "IMPORT" },
    { id: "comparison", label: `ANALYSE${comparison.length > 0 ? ` [${comparison.length}]` : ""}` },
    { id: "config",     label: "CONFIG API" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.6rem", color: "var(--primary)", letterSpacing: "0.1em", opacity: 0.6 }}>
                SYS://STOCK_MANAGER
              </span>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block", boxShadow: "0 0 6px var(--success)" }} />
              <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.6rem", color: "var(--success)", letterSpacing: "0.05em" }}>ONLINE</span>
            </div>
            <h1 style={{ marginTop: "0.25rem" }}>OXATIS STOCK MANAGER</h1>
          </div>
        </div>

        {/* Tabs */}
        <nav style={{ display: "flex", gap: "0.125rem", marginTop: "1.25rem" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "0.4rem 0.875rem",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                fontFamily: "var(--font-geist-mono)",
                background: tab === t.id ? "rgba(0,200,232,0.12)" : "transparent",
                color: tab === t.id ? "var(--primary)" : "var(--muted)",
                border: "1px solid",
                borderColor: tab === t.id ? "rgba(0,200,232,0.35)" : "transparent",
                borderBottom: "none",
                borderRadius: "3px 3px 0 0",
                cursor: "pointer",
                transition: "all 0.15s ease",
                position: "relative",
                bottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Alerts ───────────────────────────────────────────────────── */}
      <div style={{ padding: "0.875rem 1.5rem 0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {error && (
          <div className="alert alert-error">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span style={{ flex: 1, whiteSpace: "pre-wrap", fontFamily: "var(--font-geist-mono)", fontSize: "0.75rem" }}>{error}</span>
            <button onClick={() => setError("")} className="btn btn-ghost btn-sm" style={{ padding: "0.1rem 0.375rem", opacity: 0.6 }}>×</button>
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span style={{ flex: 1, fontFamily: "var(--font-geist-mono)", fontSize: "0.75rem" }}>{success}</span>
            <button onClick={() => setSuccess("")} className="btn btn-ghost btn-sm" style={{ padding: "0.1rem 0.375rem", opacity: 0.6 }}>×</button>
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <main className="page-content">

        {/* Loading overlay */}
        {(updating || loadingSiteStock) && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
            <div className="card" style={{ padding: "2rem", maxWidth: 320, width: "100%", textAlign: "center" }}>
              <span className="spinner spinner-lg" style={{ margin: "0 auto 1rem", display: "block" }} />
              <p style={{ color: "var(--primary)", fontFamily: "var(--font-geist-mono)", fontSize: "0.8rem", letterSpacing: "0.05em" }}>
                {updating ? updateProgress : "SYNC ELEPHANTFILMS.COM..."}
              </p>
              <div style={{ marginTop: "0.75rem", height: 2, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "var(--primary)", animation: "scan 1.5s ease-in-out infinite", width: "40%", borderRadius: 99 }} />
              </div>
            </div>
          </div>
        )}

        {/* Import Tab */}
        {tab === "import" && (
          <StockImport
            onImport={handleImport}
            importing={updating}
            error={error}
            siteStock={siteStock}
            newStock={newStock}
            siteFileName={siteFileName}
            newFileName={newFileName}
            loadingSiteStock={loadingSiteStock}
            onFetchSiteStock={fetchSiteStockFromUrl}
            onCompare={() => setTab("comparison")}
            comparisonCount={comparison.length}
            toUpdateCount={stats.toUpdate}
          />
        )}

        {/* Comparison Tab */}
        {tab === "comparison" && (
          <>
          <ReleaseCategoryPanel
            siteStock={siteStock}
            articles={articles}
            loadingArticles={loadingArticles}
            onRefreshArticles={loadArticles}
            onArticlesChange={setArticles}
            serverHasCredentials={serverHasCredentials}
            hasCredentials={hasCredentials}
            appId={appId}
            token={token}
            onError={setError}
            onSuccess={setSuccess}
          />
          <StockComparisonTable
            items={comparison}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            filterStatus={filterStatus}
            filterPreorder={filterPreorder}
            onFilterStatus={setFilterStatus}
            onFilterPreorder={setFilterPreorder}
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            stats={stats}
            filteredItems={filteredComparison}
            onOpenSendPreview={openSendPreview}
            onGoToImport={() => setTab("import")}
            updating={updating}
          />
          </>
        )}

        {/* Config Tab */}
        {tab === "config" && (
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div className="card" style={{ padding: "1.5rem" }}>
              <div style={{ marginBottom: "1.25rem" }}>
                <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.6rem", color: "var(--primary)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.375rem" }}>
                  // API_CREDENTIALS
                </p>
                <h2 className="section-title">Identifiants Oxatis</h2>
                <p className="section-subtitle">
                  Requis uniquement pour la mise à jour du stock sur le site. La comparaison fonctionne sans identifiants.
                </p>
              </div>
              {serverHasCredentials ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", border: "1px solid rgba(0,232,122,0.3)", borderRadius: 3, background: "rgba(0,232,122,0.06)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)", flexShrink: 0, boxShadow: "0 0 8px var(--success)" }} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--success)", fontFamily: "var(--font-geist-mono)" }}>
                    CREDENTIALS_SERVER — OK
                  </span>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <label className="label">App ID</label>
                      <input
                        type="text"
                        value={localAppId || appId}
                        onChange={(e) => setLocalAppId(e.target.value)}
                        className="input"
                        placeholder="OXATIS_APP_ID"
                      />
                    </div>
                    <div>
                      <label className="label">Token</label>
                      <input
                        type="password"
                        value={localToken || token}
                        onChange={(e) => setLocalToken(e.target.value)}
                        className="input"
                        placeholder="OXATIS_TOKEN"
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button
                      onClick={testCredentials}
                      disabled={testingCredentials || (!(localAppId || appId) || !(localToken || token))}
                      className="btn btn-secondary btn-sm"
                    >
                      {testingCredentials ? <><span className="spinner spinner-sm" /> TEST...</> : "TESTER"}
                    </button>
                    {credentialsTestResult === "ok" && (
                      <span style={{ fontSize: "0.75rem", color: "var(--success)", fontFamily: "var(--font-geist-mono)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} /> CONNEXION_OK
                      </span>
                    )}
                    {credentialsTestResult === "error" && (
                      <span style={{ fontSize: "0.75rem", color: "var(--danger)", fontFamily: "var(--font-geist-mono)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--danger)", display: "inline-block" }} /> IDENTIFIANTS_INVALIDES
                      </span>
                    )}
                  </div>
                  <p style={{ marginTop: "0.75rem", fontSize: "0.65rem", color: "var(--muted)", fontFamily: "var(--font-geist-mono)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
                    Sauvegarde automatique en session sécurisée (cookie httpOnly)
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Stock update preview modal ────────────────────────────────── */}
      {previewModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.88)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div className="card" style={{ maxWidth: 680, width: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column", borderColor: "rgba(0,200,232,0.2)" }}>

            {/* Modal header */}
            <div style={{ padding: "1.125rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.6rem", color: "var(--warning)", letterSpacing: "0.1em" }}>
                    // CONFIRM_UPDATE
                  </span>
                </div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-bright)" }}>
                  Confirmer la mise à jour
                </h2>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.2rem", fontFamily: "var(--font-geist-mono)" }}>
                  {itemsToSend.length} produit{itemsToSend.length > 1 ? "s" : ""} vont être modifiés sur Oxatis
                </p>
              </div>
              <button onClick={() => setPreviewModalOpen(false)} className="btn btn-ghost btn-sm" style={{ fontSize: "1.125rem", lineHeight: 1, padding: "0.25rem 0.5rem" }}>×</button>
            </div>

            {/* Summary stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.625rem", padding: "0.875rem 1.5rem", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <div className="card" style={{ padding: "0.75rem", textAlign: "center", borderColor: "rgba(0,232,122,0.2)" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--success)", fontFamily: "var(--font-geist-mono)" }}>
                  {itemsToSend.filter((i) => i.status === "increased").length}
                </div>
                <div style={{ fontSize: "0.55rem", color: "var(--success)", marginTop: "0.2rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Hausse</div>
              </div>
              <div className="card" style={{ padding: "0.75rem", textAlign: "center", borderColor: "rgba(255,45,85,0.2)" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--danger)", fontFamily: "var(--font-geist-mono)" }}>
                  {itemsToSend.filter((i) => i.status === "decreased").length}
                </div>
                <div style={{ fontSize: "0.55rem", color: "var(--danger)", marginTop: "0.2rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Baisse</div>
              </div>
              <div className="card" style={{ padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)", fontFamily: "var(--font-geist-mono)" }}>
                  {itemsToSend.length}
                </div>
                <div style={{ fontSize: "0.55rem", color: "var(--muted)", marginTop: "0.2rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Total</div>
              </div>
            </div>

            {/* Modal table */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0.875rem 1.5rem" }}>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th style={{ textAlign: "right" }}>Actuel</th>
                      <th style={{ textAlign: "center", width: 24 }}></th>
                      <th style={{ textAlign: "right" }}>Nouveau</th>
                      <th style={{ textAlign: "right" }}>Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsToSend.map((item) => (
                      <tr key={item.itemSKU}>
                        <td style={{ maxWidth: 220 }}>
                          <div style={{ fontWeight: 600, color: "var(--text-bright)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.name || item.itemSKU}>
                            {item.name || item.itemSKU}
                          </div>
                          <div style={{ fontSize: "0.65rem", fontFamily: "var(--font-geist-mono)", color: "var(--muted)", marginTop: "0.1rem" }}>{item.itemSKU}</div>
                        </td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-geist-mono)", color: "var(--muted)" }}>{item.currentStock}</td>
                        <td style={{ textAlign: "center", color: "var(--border-bright)" }}>→</td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-geist-mono)", fontWeight: 700, color: "var(--text-bright)" }}>{item.newStock}</td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-geist-mono)", fontWeight: 700, color: item.difference > 0 ? "var(--success)" : "var(--danger)" }}>
                          {item.difference > 0 ? "+" : ""}{item.difference}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding: "0.875rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: "0.7rem", color: "var(--muted)", fontFamily: "var(--font-geist-mono)" }}>
                {itemsToSend.length} enregistrement{itemsToSend.length > 1 ? "s" : ""}
              </span>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => setPreviewModalOpen(false)} className="btn btn-secondary">
                  ANNULER
                </button>
                <button
                  onClick={() => { setPreviewModalOpen(false); handleUpdateStock(); }}
                  disabled={updating}
                  className="btn btn-primary"
                >
                  {updating ? (
                    <><span className="spinner spinner-sm" /> ENVOI...</>
                  ) : (
                    <>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      CONFIRMER ET ENVOYER
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
