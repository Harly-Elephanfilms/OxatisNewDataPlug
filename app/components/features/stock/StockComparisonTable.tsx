"use client";

import type { ComparisonItem } from "@/lib/types";

type SortField = "itemSKU" | "name" | "currentStock" | "newStock" | "difference";
type SortDir = "asc" | "desc";

interface StockComparisonTableProps {
  items: ComparisonItem[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  filterStatus: string;
  filterPreorder: boolean;
  onFilterStatus: (s: string) => void;
  onFilterPreorder: (v: boolean) => void;
  searchTerm: string;
  onSearch: (s: string) => void;
  stats: {
    unchanged: number;
    increased: number;
    decreased: number;
    new: number;
    missing: number;
    preorder: number;
    toUpdate: number;
  };
  filteredItems: ComparisonItem[];
  onOpenSendPreview: () => void;
  onGoToImport: () => void;
  updating: boolean;
}

function statusLabel(status: string) {
  switch (status) {
    case "unchanged": return "STABLE";
    case "increased": return "HAUSSE";
    case "decreased": return "BAISSE";
    case "new":       return "NOUVEAU";
    case "missing":   return "ABSENT";
    case "preorder":  return "PRÉCO";
    default: return status.toUpperCase();
  }
}

function statusRowStyle(status: string): React.CSSProperties {
  switch (status) {
    case "increased": return { background: "rgba(0,232,122,0.04)" };
    case "decreased": return { background: "rgba(255,45,85,0.04)" };
    case "new":       return { background: "rgba(0,200,232,0.04)" };
    case "missing":   return { background: "rgba(255,170,0,0.04)" };
    case "preorder":  return { background: "rgba(139,92,246,0.04)" };
    default: return {};
  }
}

function statusBadgeStyle(status: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center",
    fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase", padding: "0.2rem 0.45rem",
    borderRadius: 2, whiteSpace: "nowrap",
    fontFamily: "var(--font-geist-mono)",
  };
  switch (status) {
    case "increased": return { ...base, background: "rgba(0,232,122,0.12)", color: "var(--success)", border: "1px solid rgba(0,232,122,0.3)" };
    case "decreased": return { ...base, background: "rgba(255,45,85,0.12)",  color: "var(--danger)",  border: "1px solid rgba(255,45,85,0.3)" };
    case "new":       return { ...base, background: "rgba(0,200,232,0.12)",  color: "var(--primary)", border: "1px solid rgba(0,200,232,0.3)" };
    case "missing":   return { ...base, background: "rgba(255,170,0,0.12)",  color: "var(--warning)", border: "1px solid rgba(255,170,0,0.3)" };
    case "preorder":  return { ...base, background: "rgba(139,92,246,0.12)", color: "#a78bfa",         border: "1px solid rgba(139,92,246,0.3)" };
    default:          return { ...base, background: "rgba(255,255,255,0.04)", color: "var(--muted)",   border: "1px solid var(--border)" };
  }
}

const statItems = [
  { key: "unchanged", label: "STABLE",    colorVar: "var(--muted)",   glowColor: "rgba(255,255,255,0.1)" },
  { key: "increased", label: "HAUSSE",    colorVar: "var(--success)", glowColor: "rgba(0,232,122,0.2)" },
  { key: "decreased", label: "BAISSE",    colorVar: "var(--danger)",  glowColor: "rgba(255,45,85,0.2)" },
  { key: "new",       label: "NOUVEAUX",  colorVar: "var(--primary)", glowColor: "rgba(0,200,232,0.2)" },
  { key: "missing",   label: "ABSENTS",   colorVar: "var(--warning)", glowColor: "rgba(255,170,0,0.2)" },
  { key: "preorder",  label: "PRÉCO",     colorVar: "#a78bfa",        glowColor: "rgba(139,92,246,0.2)" },
] as const;

export default function StockComparisonTable({
  items,
  sortField,
  sortDir,
  onSort,
  filterStatus,
  filterPreorder,
  onFilterStatus,
  onFilterPreorder,
  searchTerm,
  onSearch,
  stats,
  filteredItems,
  onOpenSendPreview,
  onGoToImport,
  updating,
}: StockComparisonTableProps) {
  return (
    <div>
      {/* ── Header row ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-bright)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            ANALYSE DES STOCKS
          </h2>
          <p style={{ fontSize: "0.7rem", color: "var(--muted)", fontFamily: "var(--font-geist-mono)", marginTop: "0.1rem" }}>
            {items.length} entrées analysées
          </p>
        </div>
        {items.length > 0 && stats.toUpdate > 0 && (
          <button
            onClick={onOpenSendPreview}
            disabled={updating}
            className="btn btn-primary"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            ENVOYER {stats.toUpdate} MAJ
          </button>
        )}
      </div>

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {items.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <div style={{
            width: 56, height: 56, margin: "0 auto 1rem",
            border: "1px solid var(--border)", borderRadius: 4,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "var(--muted)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75-.125V5.625m0 0v.001M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75-.125V5.625m0 0v.001" />
            </svg>
          </div>
          <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Aucune donnée
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.375rem", fontFamily: "var(--font-geist-mono)" }}>
            Importez les deux sources CSV dans l&apos;onglet IMPORT
          </p>
          <button onClick={onGoToImport} className="btn btn-secondary btn-sm" style={{ marginTop: "1rem" }}>
            ← RETOUR IMPORT
          </button>
        </div>
      )}

      {items.length > 0 && (
        <>
          {/* ── Stats row ─────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem", marginBottom: "1rem" }}>
            {statItems.map((s) => {
              const count = stats[s.key];
              const active = filterStatus === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => onFilterStatus(active ? "all" : s.key)}
                  style={{
                    flexShrink: 0,
                    padding: "0.625rem 0.875rem",
                    background: active ? `rgba(${s.key === "increased" ? "0,232,122" : s.key === "decreased" ? "255,45,85" : s.key === "new" ? "0,200,232" : s.key === "missing" ? "255,170,0" : s.key === "preorder" ? "139,92,246" : "255,255,255"},0.1)` : "var(--bg-surface)",
                    border: `1px solid ${active ? s.colorVar : "var(--border)"}`,
                    borderRadius: 3,
                    cursor: "pointer",
                    textAlign: "center",
                    minWidth: 72,
                    transition: "all 0.15s ease",
                    boxShadow: active ? `0 0 10px ${s.glowColor}` : "none",
                  }}
                >
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: s.colorVar, fontFamily: "var(--font-geist-mono)", lineHeight: 1 }}>
                    {count}
                  </div>
                  <div style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: active ? s.colorVar : "var(--muted)", marginTop: "0.25rem" }}>
                    {s.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Filters ───────────────────────────────────────────── */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.875rem" }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="RECHERCHE SKU / NOM..."
              className="input"
              style={{ maxWidth: 220, fontSize: "0.75rem" }}
            />
            <select
              value={filterStatus}
              onChange={(e) => onFilterStatus(e.target.value)}
              className="input"
              style={{ width: "auto", fontSize: "0.75rem" }}
            >
              <option value="all">TOUS ({items.length})</option>
              <option value="unchanged">STABLE ({stats.unchanged})</option>
              <option value="increased">HAUSSE ({stats.increased})</option>
              <option value="decreased">BAISSE ({stats.decreased})</option>
              <option value="new">NOUVEAUX ({stats.new})</option>
              <option value="missing">ABSENTS ({stats.missing})</option>
              <option value="preorder">PRÉCO ({stats.preorder})</option>
            </select>
            <button
              onClick={() => onFilterPreorder(!filterPreorder)}
              className={`btn btn-sm ${filterPreorder ? "btn-primary" : "btn-secondary"}`}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              PRÉCO
            </button>
            <span style={{ marginLeft: "auto", fontSize: "0.65rem", fontFamily: "var(--font-geist-mono)", color: "var(--muted)" }}>
              {filteredItems.length} résultat{filteredItems.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* ── Table ─────────────────────────────────────────────── */}
          <div className="table-wrapper">
            <div style={{ overflowX: "auto", maxHeight: "60vh", overflowY: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {[
                      { field: "itemSKU" as SortField,      label: "SKU",          align: "left" },
                      { field: "name" as SortField,          label: "Désignation",  align: "left" },
                      { field: "currentStock" as SortField,  label: "Site",         align: "right" },
                      { field: "newStock" as SortField,      label: "Nouveau",      align: "right" },
                      { field: "difference" as SortField,    label: "Δ",            align: "right" },
                    ].map((col) => (
                      <th
                        key={col.field}
                        onClick={() => onSort(col.field)}
                        style={{
                          textAlign: col.align as "left" | "right",
                          cursor: "pointer",
                          color: sortField === col.field ? "var(--primary)" : undefined,
                          userSelect: "none",
                        }}
                      >
                        {col.label}
                        {sortField === col.field && (
                          <span style={{ marginLeft: "0.25rem", opacity: 0.8 }}>
                            {sortDir === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </th>
                    ))}
                    <th style={{ textAlign: "center" }}>Date</th>
                    <th style={{ textAlign: "center" }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.itemSKU} style={statusRowStyle(item.status)}>
                      <td style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.7rem", color: "var(--primary)", opacity: 0.8 }}>
                        {item.itemSKU}
                      </td>
                      <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-main)" }} title={item.name}>
                        {item.name}
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-geist-mono)", color: "var(--muted)" }}>
                        {item.currentStock}
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-geist-mono)", fontWeight: 600, color: "var(--text-bright)" }}>
                        {item.newStock}
                      </td>
                      <td style={{
                        textAlign: "right",
                        fontFamily: "var(--font-geist-mono)",
                        fontWeight: 700,
                        color: item.difference > 0 ? "var(--success)" : item.difference < 0 ? "var(--danger)" : "var(--muted)",
                      }}>
                        {item.difference > 0 ? "+" : ""}{item.difference}
                      </td>
                      <td style={{ textAlign: "center", fontSize: "0.65rem", fontFamily: "var(--font-geist-mono)", color: "var(--muted)", whiteSpace: "nowrap" }}>
                        {item.dateOfAvailability || "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={statusBadgeStyle(item.status)}>
                          {statusLabel(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
