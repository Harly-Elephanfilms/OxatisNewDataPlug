"use client";

import { useState, useMemo, useCallback } from "react";
import type { StockItem, CsvStockItem, ComparisonItem } from "@/lib/types";
import { useCredentials } from "@/app/contexts/CredentialsContext";
import StockImport from "@/app/components/features/stock/StockImport";
import StockComparisonTable from "@/app/components/features/stock/StockComparisonTable";

type Tab = "config" | "import" | "comparison";
type SortField = "itemSKU" | "name" | "currentStock" | "newStock" | "difference";
type SortDir = "asc" | "desc";

// Apply safety margin: subtract 5, then -4→0 becomes 1, -5 or less becomes 0
function adjustNewStock(stock: number): number {
  const adjusted = stock - 5;
  if (adjusted <= -5) return 0;
  if (adjusted <= 0) return 1;
  return adjusted;
}

// Returns true if the date string (DD/MM/YYYY or YYYY-MM-DD) is strictly in the future
function isFutureDate(dateStr: string): boolean {
  if (!dateStr) return false;
  let date: Date;
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  } else {
    date = new Date(dateStr);
  }
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
}

export default function StockPage() {
  const { appId, token, hasCredentials } = useCredentials();
  const [serverHasCredentials, setServerHasCredentials] = useState(false);

  // Fetch server credential state once
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

  // Credentials state from context (also support manual entry for config tab)
  const [localAppId, setLocalAppId] = useState("");
  const [localToken, setLocalToken] = useState("");
  const [testingCredentials, setTestingCredentials] = useState(false);
  const [credentialsTestResult, setCredentialsTestResult] = useState<"ok" | "error" | null>(null);
  const { setCredentials } = useCredentials();

  const effectiveHasCredentials = serverHasCredentials || hasCredentials;

  // Auto-fetch site stock from Oxatis daily export URL
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
      setSuccess(`Stock site : ${items.length} produits récupérés automatiquement depuis le site`);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoadingSiteStock(false);
    }
  };

  // Handle CSV import from StockImport component
  const handleImport = useCallback((items: StockItem[] | CsvStockItem[], format: string) => {
    setError("");
    if (format === "oxatis") {
      const stockItems = items as StockItem[];
      setSiteStock(stockItems);
      setSiteFileName("fichier importé");
      setSuccess(`Stock site : ${stockItems.length} produits importés`);
      setTimeout(() => setSuccess(""), 5000);
    } else if (format === "export") {
      const csvItems = items as CsvStockItem[];
      setNewStock(csvItems);
      setNewFileName("fichier importé");
      setSuccess(`Nouveau stock : ${csvItems.length} produits importés`);
      setTimeout(() => setSuccess(""), 5000);
    }
  }, []);

  // Build comparison (100% local, instantaneous)
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
      if (isPreorder) {
        status = "preorder";
      } else if (!siteItem) {
        status = "new";
      } else if (!csvItem) {
        status = "missing";
      } else if (difference === 0) {
        status = "unchanged";
      } else if (difference > 0) {
        status = "increased";
      } else {
        status = "decreased";
      }

      items.push({
        itemSKU: sku,
        name: siteItem?.name || csvItem?.title || "",
        oxatisId: siteItem?.oxatisId,
        currentStock,
        newStock: newQty,
        difference,
        dateOfAvailability,
        isPreorder,
        status,
      });
    }

    return items;
  }, [siteStock, newStock]);

  // Filtered and sorted comparison
  const filteredComparison = useMemo(() => {
    let items = [...comparison];

    if (filterPreorder) {
      items = items.filter((item) => item.isPreorder);
    }
    if (filterStatus !== "all") {
      items = items.filter((item) => item.status === filterStatus);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(
        (item) =>
          item.itemSKU.toLowerCase().includes(term) ||
          item.name.toLowerCase().includes(term)
      );
    }

    items.sort((a, b) => {
      let valA: string | number = a[sortField];
      let valB: string | number = b[sortField];
      if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
      }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return items;
  }, [comparison, filterPreorder, filterStatus, searchTerm, sortField, sortDir]);

  // Stats
  const stats = useMemo(() => {
    const unchanged = comparison.filter((i) => i.status === "unchanged").length;
    const increased = comparison.filter((i) => i.status === "increased").length;
    const decreased = comparison.filter((i) => i.status === "decreased").length;
    const newItems = comparison.filter((i) => i.status === "new").length;
    const missing = comparison.filter((i) => i.status === "missing").length;
    const preorder = comparison.filter((i) => i.status === "preorder").length;
    const toUpdate = comparison.filter((i) => i.status === "increased" || i.status === "decreased").length;
    return { unchanged, increased, decreased, new: newItems, missing, preorder, toUpdate };
  }, [comparison]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir(sortDir === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDir(field === "difference" ? "desc" : "asc");
      }
    },
    [sortField, sortDir]
  );

  // Update stock on Oxatis via API
  const handleUpdateStock = async () => {
    if (!effectiveHasCredentials) {
      setError("Veuillez configurer vos identifiants API dans l'onglet Configuration");
      setTab("config");
      return;
    }

    const itemsToUpdate = comparison.filter(
      (item) => (item.status === "increased" || item.status === "decreased") && !item.isPreorder
    );

    if (itemsToUpdate.length === 0) {
      setError("Aucun produit à mettre à jour");
      return;
    }

    setUpdating(true);
    setUpdateProgress(`Mise à jour de ${itemsToUpdate.length} produits...`);
    setError("");

    try {
      const response = await fetch("/api/oxatis/update-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(serverHasCredentials ? {} : { appId, token }),
          items: itemsToUpdate.map((item) => ({
            itemSKU: item.itemSKU,
            quantity: item.newStock,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur lors de la mise à jour");

      setUpdateProgress("");

      const failedSKUs = new Set(
        (data.errors ?? []).map((e: string) => e.split(":")[0].trim())
      );
      setSiteStock((prev) =>
        prev.map((item) => {
          const updated = itemsToUpdate.find((u) => u.itemSKU === item.itemSKU);
          if (updated && !failedSKUs.has(item.itemSKU)) {
            return { ...item, qtyInStock: updated.newStock };
          }
          return item;
        })
      );

      setSuccess(
        `${data.updated}/${data.total} produits mis à jour avec succès${
          data.errors && data.errors.length > 0
            ? `. Erreurs: ${data.errors.slice(0, 5).join(", ")}`
            : ""
        }`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setUpdating(false);
      setUpdateProgress("");
    }
  };

  const openSendPreview = () => {
    if (!effectiveHasCredentials) {
      setError("Veuillez configurer vos identifiants API");
      return;
    }
    const toSend = filteredComparison.filter(
      (item) => (item.status === "increased" || item.status === "decreased") && !item.isPreorder
    );
    if (toSend.length === 0) {
      setError("Aucun produit à mettre à jour");
      return;
    }
    setItemsToSend(toSend);
    setPreviewModalOpen(true);
  };

  const testCredentials = async () => {
    setTestingCredentials(true);
    setCredentialsTestResult(null);
    const id = localAppId || appId;
    const tok = localToken || token;
    try {
      const params = `appId=${encodeURIComponent(id)}&token=${encodeURIComponent(tok)}`;
      const res = await fetch(`/api/oxatis/test-credentials?${params}`);
      setCredentialsTestResult(res.ok ? "ok" : "error");
      if (res.ok) setCredentials(id, tok);
    } catch {
      setCredentialsTestResult("error");
    } finally {
      setTestingCredentials(false);
    }
  };

  const statusBg = (status: string) => {
    switch (status) {
      case "increased": return "bg-green-50";
      case "decreased": return "bg-red-50";
      default: return "";
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "import", label: "Import" },
    { id: "comparison", label: `Comparaison (${comparison.length})` },
    { id: "config", label: "Configuration API" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Oxatis Stock Manager</h1>
            <p className="section-subtitle mt-1">Comparaison et mise à jour des stocks</p>
          </div>
        </div>

        {/* Tabs — underline style */}
        <nav className="flex gap-0 mt-5 -mb-[1.5rem]">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors focus:outline-none ${
                tab === t.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Alerts */}
      <div className="px-8 pt-5 space-y-3">
        {error && (
          <div className="alert alert-error">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span className="flex-1 whitespace-pre-wrap">{error}</span>
            <button onClick={() => setError("")} className="btn btn-ghost btn-sm !px-1.5 !py-0.5 text-current opacity-60 hover:opacity-100">×</button>
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="flex-1">{success}</span>
            <button onClick={() => setSuccess("")} className="btn btn-ghost btn-sm !px-1.5 !py-0.5 text-current opacity-60 hover:opacity-100">×</button>
          </div>
        )}
      </div>

      {/* Content */}
      <main className="page-content">
        {/* Loading overlay */}
        {(updating || loadingSiteStock) && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="card p-8 max-w-sm w-full text-center shadow-2xl">
              <span className="spinner spinner-lg mx-auto mb-4 block"></span>
              <p className="text-gray-700 font-medium">
                {updating ? updateProgress : "Récupération du stock depuis elephantfilms.com..."}
              </p>
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
        )}

        {/* Config Tab */}
        {tab === "config" && (
          <div className="max-w-lg mx-auto">
            <div className="card p-6">
              <h2 className="section-title mb-1">Identifiants API Oxatis</h2>
              <p className="section-subtitle mb-6">
                Nécessaires uniquement pour la mise à jour du stock sur le site.
                La comparaison fonctionne sans identifiants.
              </p>
              {serverHasCredentials ? (
                <div className="flex items-center gap-3 py-4 px-4 rounded-lg bg-green-50 border border-green-200">
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block flex-shrink-0"></span>
                  <span className="text-sm font-medium text-green-800">Identifiants serveur configurés</span>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="label">App ID</label>
                      <input
                        type="text"
                        value={localAppId || appId}
                        onChange={(e) => setLocalAppId(e.target.value)}
                        className="input"
                        placeholder="Votre App ID Oxatis"
                      />
                    </div>
                    <div>
                      <label className="label">Token</label>
                      <input
                        type="password"
                        value={localToken || token}
                        onChange={(e) => setLocalToken(e.target.value)}
                        className="input"
                        placeholder="Votre Token Oxatis"
                      />
                    </div>
                  </div>
                  <div className="mt-5 flex items-center gap-3">
                    <button
                      onClick={testCredentials}
                      disabled={testingCredentials || (!(localAppId || appId) || !(localToken || token))}
                      className="btn btn-secondary btn-sm"
                    >
                      {testingCredentials ? (
                        <><span className="spinner spinner-sm" /> Vérification…</>
                      ) : "Tester la connexion"}
                    </button>
                    {credentialsTestResult === "ok" && (
                      <span className="text-sm text-green-600 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Connexion OK
                      </span>
                    )}
                    {credentialsTestResult === "error" && (
                      <span className="text-sm text-red-600 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Identifiants invalides
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-gray-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block flex-shrink-0"></span>
                    Sauvegarde automatique — les identifiants restent en mémoire entre les sessions.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Stock update preview modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl rounded-2xl overflow-hidden">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  Confirmer la mise à jour
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Cette action modifiera le stock de <strong>{itemsToSend.length}</strong> produit{itemsToSend.length > 1 ? "s" : ""} sur Oxatis.
                </p>
              </div>
              <button onClick={() => setPreviewModalOpen(false)} className="btn btn-ghost btn-sm !px-2 text-xl leading-none">×</button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="card p-3 text-center bg-green-50 border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {itemsToSend.filter((i) => i.status === "increased").length}
                </div>
                <div className="text-xs text-green-600 mt-0.5">Augmentations</div>
              </div>
              <div className="card p-3 text-center bg-red-50 border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  {itemsToSend.filter((i) => i.status === "decreased").length}
                </div>
                <div className="text-xs text-red-600 mt-0.5">Diminutions</div>
              </div>
              <div className="card p-3 text-center">
                <div className="text-2xl font-bold text-gray-700">{itemsToSend.length}</div>
                <div className="text-xs text-gray-500 mt-0.5">Total modifications</div>
              </div>
            </div>

            {/* Modal table */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th className="text-right">Actuel</th>
                      <th className="w-8 text-center"></th>
                      <th className="text-right">Nouveau</th>
                      <th className="text-right">Diff.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsToSend.map((item) => (
                      <tr key={item.itemSKU} className={statusBg(item.status)}>
                        <td className="max-w-xs">
                          <div className="font-medium text-gray-800 truncate" title={item.name || item.itemSKU}>
                            {item.name || item.itemSKU}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">{item.itemSKU}</div>
                        </td>
                        <td className="text-right font-mono text-gray-600">{item.currentStock}</td>
                        <td className="text-center text-gray-400">→</td>
                        <td className="text-right font-mono font-semibold text-gray-800">{item.newStock}</td>
                        <td className={`text-right font-mono font-bold ${item.difference > 0 ? "text-green-600" : "text-red-600"}`}>
                          {item.difference > 0 ? "+" : ""}{item.difference}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 bg-white">
              <span className="text-sm text-gray-500">{itemsToSend.length} produit{itemsToSend.length > 1 ? "s" : ""} à mettre à jour</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={() => { setPreviewModalOpen(false); handleUpdateStock(); }}
                  disabled={updating}
                  className="btn btn-primary"
                >
                  {updating ? (
                    <>
                      <span className="spinner spinner-sm"></span>
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Confirmer et envoyer
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
