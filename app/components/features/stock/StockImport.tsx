"use client";

import type { StockItem, CsvStockItem } from "@/lib/types";

interface StockImportProps {
  onImport: (items: StockItem[] | CsvStockItem[], format: string) => void;
  importing: boolean;
  error: string | null;
  siteStock: StockItem[];
  newStock: CsvStockItem[];
  siteFileName: string;
  newFileName: string;
  loadingSiteStock: boolean;
  onFetchSiteStock: () => void;
  onCompare: () => void;
  comparisonCount: number;
  toUpdateCount: number;
}

export default function StockImport({
  onImport,
  siteStock,
  newStock,
  siteFileName,
  newFileName,
  loadingSiteStock,
  onFetchSiteStock,
  onCompare,
  comparisonCount,
  toUpdateCount,
}: StockImportProps) {
  const canCompare = siteStock.length > 0 && newStock.length > 0;

  const handleSiteStockUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    parseCsvFile(file, onImport, "site");
    event.target.value = "";
  };

  const handleNewStockUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    parseCsvFile(file, onImport, "new");
    event.target.value = "";
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>

      {/* ── Step indicators ─────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: "2rem" }}>
        {[
          { n: "01", label: "STOCK SITE", done: siteStock.length > 0, count: siteStock.length },
          { n: "02", label: "NOUVEAU STOCK", done: newStock.length > 0, count: newStock.length },
          { n: "03", label: "COMPARER", done: canCompare, count: null },
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" }}>
              <div style={{
                width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `1px solid ${step.done ? "var(--primary)" : "var(--border-bright)"}`,
                background: step.done ? "rgba(0,200,232,0.12)" : "var(--bg-surface)",
                borderRadius: 3,
                fontFamily: "var(--font-geist-mono)",
                fontSize: "0.7rem",
                fontWeight: 700,
                color: step.done ? "var(--primary)" : "var(--muted)",
                boxShadow: step.done ? "0 0 10px rgba(0,200,232,0.2)" : "none",
                transition: "all 0.2s ease",
              }}>
                {step.done
                  ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  : step.n
                }
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: step.done ? "var(--primary)" : "var(--muted)" }}>
                  {step.label}
                </span>
                {step.done && step.count !== null && (
                  <span style={{ fontSize: "0.6rem", fontFamily: "var(--font-geist-mono)", color: "var(--success)" }}>
                    {step.count} lignes
                  </span>
                )}
              </div>
            </div>
            {i < 2 && (
              <div style={{ width: 48, height: 1, background: `linear-gradient(to right, ${siteStock.length > 0 && i === 0 ? "var(--primary)" : "var(--border)"}, ${canCompare && i === 1 ? "var(--primary)" : "var(--border)"})`, margin: "0 0.5rem", marginBottom: "1.25rem" }} />
            )}
          </div>
        ))}
      </div>

      {/* ── Import panels ───────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>

        {/* Panel 1 — Stock site */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--primary)", textTransform: "uppercase" }}>
              // SOURCE_01
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-bright)", marginBottom: "1rem" }}>
            Stock actuel du site
          </p>

          {/* Sync button */}
          <button
            onClick={onFetchSiteStock}
            disabled={loadingSiteStock}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginBottom: "1rem" }}
          >
            {loadingSiteStock ? (
              <><span className="spinner spinner-sm" /> SYNC EN COURS...</>
            ) : (
              <>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                SYNC DEPUIS LE SITE
              </>
            )}
          </button>

          {/* Separator */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", fontFamily: "var(--font-geist-mono)" }}>ou</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Drop zone */}
          <label style={{ display: "block", cursor: "pointer" }}>
            <div style={{
              border: `1px dashed ${siteStock.length > 0 ? "var(--success)" : "var(--border-bright)"}`,
              borderRadius: 3,
              padding: "1.25rem",
              textAlign: "center",
              background: siteStock.length > 0 ? "rgba(0,232,122,0.05)" : "var(--bg-surface)",
              transition: "all 0.2s ease",
            }}>
              {siteStock.length > 0 ? (
                <>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ margin: "0 auto 0.5rem", color: "var(--success)", display: "block" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p style={{ color: "var(--success)", fontWeight: 700, fontSize: "0.8rem", fontFamily: "var(--font-geist-mono)" }}>
                    {siteStock.length} PRODUITS CHARGÉS
                  </p>
                  <p style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: "0.25rem", fontFamily: "var(--font-geist-mono)" }}>{siteFileName}</p>
                  <p style={{ fontSize: "0.6rem", color: "var(--text-dim)", marginTop: "0.5rem", letterSpacing: "0.05em" }}>CLIQUER POUR REMPLACER</p>
                </>
              ) : (
                <>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ margin: "0 auto 0.5rem", color: "var(--muted)", display: "block" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <p style={{ color: "var(--text-main)", fontSize: "0.8rem", fontWeight: 600 }}>Import CSV</p>
                  <p style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: "0.25rem", fontFamily: "var(--font-geist-mono)" }}>OxatisId;ItemSKU;Name;Qty...</p>
                </>
              )}
            </div>
            <input type="file" accept=".csv" onChange={handleSiteStockUpload} style={{ display: "none" }} />
          </label>
        </div>

        {/* Panel 2 — Nouveau stock */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", color: "#a78bfa", textTransform: "uppercase" }}>
              // SOURCE_02
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-bright)", marginBottom: "1rem" }}>
            Nouveau stock fournisseur
          </p>
          <p style={{ fontSize: "0.7rem", color: "var(--muted)", marginBottom: "1rem", fontFamily: "var(--font-geist-mono)", lineHeight: 1.5 }}>
            Format : Réf.;EAN;Titre;Type;Regr.;Stock;...
          </p>

          {/* Drop zone */}
          <label style={{ display: "block", cursor: "pointer" }}>
            <div style={{
              border: `1px dashed ${newStock.length > 0 ? "var(--success)" : "rgba(139,92,246,0.4)"}`,
              borderRadius: 3,
              padding: "2rem 1.25rem",
              textAlign: "center",
              background: newStock.length > 0 ? "rgba(0,232,122,0.05)" : "rgba(139,92,246,0.04)",
              transition: "all 0.2s ease",
            }}>
              {newStock.length > 0 ? (
                <>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ margin: "0 auto 0.5rem", color: "var(--success)", display: "block" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p style={{ color: "var(--success)", fontWeight: 700, fontSize: "0.8rem", fontFamily: "var(--font-geist-mono)" }}>
                    {newStock.length} PRODUITS CHARGÉS
                  </p>
                  <p style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: "0.25rem", fontFamily: "var(--font-geist-mono)" }}>{newFileName}</p>
                  <p style={{ fontSize: "0.6rem", color: "var(--text-dim)", marginTop: "0.5rem", letterSpacing: "0.05em" }}>CLIQUER POUR REMPLACER</p>
                </>
              ) : (
                <>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ margin: "0 auto 0.75rem", color: "rgba(139,92,246,0.6)", display: "block" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p style={{ color: "var(--text-main)", fontSize: "0.8rem", fontWeight: 600 }}>
                    Déposer ou cliquer
                  </p>
                  <p style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: "0.25rem" }}>Séparateur : point-virgule (;)</p>
                </>
              )}
            </div>
            <input type="file" accept=".csv" onChange={handleNewStockUpload} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      {/* ── Compare button ───────────────────────────────────────────── */}
      {canCompare && (
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <button
            onClick={onCompare}
            className="btn btn-primary btn-lg glow-pulse"
            style={{ fontSize: "0.875rem", paddingLeft: "2rem", paddingRight: "2rem" }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
            ANALYSER — {comparisonCount} PRODUITS
          </button>
          {toUpdateCount > 0 && (
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.75rem", fontFamily: "var(--font-geist-mono)" }}>
              <span style={{ color: "var(--warning)" }}>{toUpdateCount}</span> produit(s) avec des différences détectées
            </p>
          )}
        </div>
      )}

      {/* ── Preview tables ───────────────────────────────────────────── */}
      {(siteStock.length > 0 || newStock.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {siteStock.length > 0 && (
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "0.625rem 0.875rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", display: "inline-block", boxShadow: "0 0 6px var(--primary)" }} />
                <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", fontFamily: "var(--font-geist-mono)" }}>
                  STOCK_SITE — APERÇU
                </span>
              </div>
              <div style={{ overflowY: "auto", maxHeight: 200 }}>
                <table className="data-table" style={{ fontSize: "0.75rem" }}>
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Nom</th>
                      <th style={{ textAlign: "right" }}>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siteStock.slice(0, 50).map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.7rem" }}>{item.itemSKU}</td>
                        <td style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.name}>{item.name}</td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-geist-mono)" }}>{item.qtyInStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {siteStock.length > 50 && (
                <div style={{ padding: "0.375rem 0.75rem", borderTop: "1px solid var(--border)", fontSize: "0.65rem", color: "var(--muted)", textAlign: "center", fontFamily: "var(--font-geist-mono)" }}>
                  +{siteStock.length - 50} lignes supplémentaires
                </div>
              )}
            </div>
          )}
          {newStock.length > 0 && (
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "0.625rem 0.875rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", display: "inline-block", boxShadow: "0 0 6px #a78bfa" }} />
                <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a78bfa", fontFamily: "var(--font-geist-mono)" }}>
                  NOUVEAU_STOCK — APERÇU
                </span>
              </div>
              <div style={{ overflowY: "auto", maxHeight: 200 }}>
                <table className="data-table" style={{ fontSize: "0.75rem" }}>
                  <thead>
                    <tr>
                      <th>Réf.</th>
                      <th>Titre</th>
                      <th style={{ textAlign: "right" }}>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newStock.slice(0, 50).map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.7rem" }}>{item.ref}</td>
                        <td style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.title}>{item.title}</td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-geist-mono)" }}>{item.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {newStock.length > 50 && (
                <div style={{ padding: "0.375rem 0.75rem", borderTop: "1px solid var(--border)", fontSize: "0.65rem", color: "var(--muted)", textAlign: "center", fontFamily: "var(--font-geist-mono)" }}>
                  +{newStock.length - 50} lignes supplémentaires
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CSV parsing helpers ──────────────────────────────────────────────────────

function readFileWithEncoding(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      if (text.includes("�")) {
        const reader2 = new FileReader();
        reader2.onload = () => resolve(reader2.result as string);
        reader2.onerror = () => reject(new Error("Erreur de lecture du fichier"));
        reader2.readAsText(file, "iso-8859-1");
      } else {
        resolve(text);
      }
    };
    reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
    reader.readAsText(file, "utf-8");
  });
}

function parseCsvFile(
  file: File,
  onSuccess: (items: CsvStockItem[] | StockItem[], format: string) => void,
  _slot: "site" | "new"
) {
  import("papaparse").then((Papa) => {
    readFileWithEncoding(file).then((text) => {
      Papa.default.parse(text, {
        header: false,
        delimiter: ";",
        skipEmptyLines: true,
        complete: (results: { data: string[][] }) => {
          const rows = results.data as string[][];
          if (rows.length === 0) return;

          const header = rows[0].map((h) => h.replace(/"/g, "").trim().toLowerCase());
          const isExportFormat = header.includes("réf.") || header.includes("ref.");
          const isOxatisFormat = header.includes("oxatisid") || header.includes("itemsku");

          if (isOxatisFormat) {
            const items: StockItem[] = [];
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i].map((v) => v.replace(/"/g, "").trim());
              if (row[1]) {
                items.push({
                  oxatisId: row[0],
                  itemSKU: row[1],
                  name: row[2] || "",
                  qtyInStock: parseInt(row[3], 10) || 0,
                  dateOfAvailability: row[12] || "",
                });
              }
            }
            onSuccess(items, "oxatis");
          } else if (isExportFormat) {
            const items: CsvStockItem[] = [];
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i].map((v) => v.replace(/"/g, "").trim());
              if (row[0]) {
                items.push({
                  ref: row[0],
                  ean: row[1],
                  title: row[2] || "",
                  type: row[3],
                  regr: row[4],
                  stock: parseInt(row[5], 10) || 0,
                  autresStocks: parseInt(row[6], 10) || 0,
                });
              }
            }
            onSuccess(items, "export");
          }
        },
      });
    });
  });
}
