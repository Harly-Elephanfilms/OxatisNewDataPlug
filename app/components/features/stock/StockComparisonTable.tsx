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
    case "unchanged": return "Inchangé";
    case "increased": return "Augmenté";
    case "decreased": return "Diminué";
    case "new": return "Nouveau";
    case "missing": return "Absent";
    case "preorder": return "Précommande";
    default: return status;
  }
}

function statusBg(status: string) {
  switch (status) {
    case "increased": return "bg-green-50";
    case "decreased": return "bg-red-50";
    case "new": return "bg-blue-50";
    case "missing": return "bg-orange-50";
    case "preorder": return "bg-purple-50";
    default: return "";
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "increased": return "badge badge-green";
    case "decreased": return "badge badge-red";
    case "new": return "badge badge-indigo";
    case "missing": return "badge badge-amber";
    case "preorder": return "badge badge-purple";
    case "unchanged": return "badge badge-slate";
    default: return "badge badge-slate";
  }
}

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
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="section-title">Comparaison des stocks</h2>
        {items.length > 0 && stats.toUpdate > 0 && (
          <button
            onClick={onOpenSendPreview}
            disabled={updating}
            className="btn btn-primary"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Mettre à jour {stats.toUpdate} produit(s) sur Oxatis
          </button>
        )}
      </div>

      {items.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75-.125V5.625m0 0v.001M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75-.125V5.625m0 0v.001m15.75 3h-1.5v3.75h1.5m0-3.75V9m-1.5 0H6.75m9 0V9m0 0H9.75m3.75 0v3.75M9.75 9v3.75m0-3.75h3m-3 3.75h3" />
          </svg>
          <p className="text-lg font-medium text-gray-500">Aucune comparaison disponible</p>
          <p className="text-sm mt-1">
            Importez les deux fichiers CSV dans l&apos;onglet Import
          </p>
          <button
            onClick={onGoToImport}
            className="btn btn-secondary btn-sm mt-4"
          >
            Aller à l&apos;import
          </button>
        </div>
      )}

      {items.length > 0 && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
            <button
              onClick={() => onFilterStatus(filterStatus === "unchanged" ? "all" : "unchanged")}
              className={`card card-hover p-4 text-center transition-all ${filterStatus === "unchanged" ? "ring-2 ring-gray-400" : ""}`}
            >
              <div className="text-2xl font-bold text-gray-600">{stats.unchanged}</div>
              <div className="text-xs text-gray-500 mt-0.5">Inchangés</div>
            </button>
            <button
              onClick={() => onFilterStatus(filterStatus === "increased" ? "all" : "increased")}
              className={`card card-hover p-4 text-center transition-all ${filterStatus === "increased" ? "ring-2 ring-green-400" : ""}`}
            >
              <div className="text-2xl font-bold text-green-600">{stats.increased}</div>
              <div className="text-xs text-green-600 mt-0.5">Augmentés</div>
            </button>
            <button
              onClick={() => onFilterStatus(filterStatus === "decreased" ? "all" : "decreased")}
              className={`card card-hover p-4 text-center transition-all ${filterStatus === "decreased" ? "ring-2 ring-red-400" : ""}`}
            >
              <div className="text-2xl font-bold text-red-600">{stats.decreased}</div>
              <div className="text-xs text-red-600 mt-0.5">Diminués</div>
            </button>
            <button
              onClick={() => onFilterStatus(filterStatus === "new" ? "all" : "new")}
              className={`card card-hover p-4 text-center transition-all ${filterStatus === "new" ? "ring-2 ring-indigo-400" : ""}`}
            >
              <div className="text-2xl font-bold text-indigo-600">{stats.new}</div>
              <div className="text-xs text-indigo-600 mt-0.5">Nouveaux</div>
            </button>
            <button
              onClick={() => onFilterStatus(filterStatus === "missing" ? "all" : "missing")}
              className={`card card-hover p-4 text-center transition-all ${filterStatus === "missing" ? "ring-2 ring-amber-400" : ""}`}
            >
              <div className="text-2xl font-bold text-amber-600">{stats.missing}</div>
              <div className="text-xs text-amber-600 mt-0.5">Absents</div>
            </button>
            <button
              onClick={() => onFilterStatus(filterStatus === "preorder" ? "all" : "preorder")}
              className={`card card-hover p-4 text-center transition-all ${filterStatus === "preorder" ? "ring-2 ring-purple-400" : ""}`}
            >
              <div className="text-2xl font-bold text-purple-600">{stats.preorder}</div>
              <div className="text-xs text-purple-600 mt-0.5">Précommandes</div>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Rechercher par SKU ou nom..."
              className="input max-w-xs"
            />
            <select
              value={filterStatus}
              onChange={(e) => onFilterStatus(e.target.value)}
              className="input w-auto"
            >
              <option value="all">Tous ({items.length})</option>
              <option value="unchanged">Inchangés ({stats.unchanged})</option>
              <option value="increased">Augmentés ({stats.increased})</option>
              <option value="decreased">Diminués ({stats.decreased})</option>
              <option value="new">Nouveaux ({stats.new})</option>
              <option value="missing">Absents ({stats.missing})</option>
              <option value="preorder">Précommandes ({stats.preorder})</option>
            </select>
            <button
              onClick={() => onFilterPreorder(!filterPreorder)}
              className={`btn ${filterPreorder ? "btn-primary" : "btn-secondary"} transition-all`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Précommandes
              {filterPreorder && (
                <span className="badge badge-indigo !py-0 !px-1.5 ml-0.5">actif</span>
              )}
            </button>
            <span className="text-sm text-gray-400 ml-auto">
              {filteredItems.length} résultat{filteredItems.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    {[
                      { field: "itemSKU" as SortField, label: "SKU", align: "text-left" },
                      { field: "name" as SortField, label: "Nom", align: "text-left" },
                      { field: "currentStock" as SortField, label: "Stock Site", align: "text-right" },
                      { field: "newStock" as SortField, label: "Nouveau Stock", align: "text-right" },
                      { field: "difference" as SortField, label: "Diff.", align: "text-right" },
                    ].map((col) => (
                      <th
                        key={col.field}
                        onClick={() => onSort(col.field)}
                        className={`cursor-pointer hover:bg-gray-100 select-none ${col.align}`}
                      >
                        {col.label}
                        {sortField === col.field && (
                          <span className="ml-1 text-indigo-500">
                            {sortDir === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </th>
                    ))}
                    <th className="text-center">Date sortie</th>
                    <th className="text-center">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.itemSKU}
                      className={statusBg(item.status)}
                    >
                      <td className="font-medium font-mono text-xs">
                        {item.itemSKU}
                      </td>
                      <td className="max-w-xs truncate" title={item.name}>
                        {item.name}
                      </td>
                      <td className="text-right font-mono">
                        {item.currentStock}
                      </td>
                      <td className="text-right font-mono">
                        {item.newStock}
                      </td>
                      <td
                        className={`text-right font-mono font-semibold ${
                          item.difference > 0
                            ? "text-green-600"
                            : item.difference < 0
                            ? "text-red-600"
                            : "text-gray-400"
                        }`}
                      >
                        {item.difference > 0 ? "+" : ""}
                        {item.difference}
                      </td>
                      <td className="text-center text-xs text-gray-500 whitespace-nowrap">
                        {item.dateOfAvailability || "—"}
                      </td>
                      <td className="text-center">
                        <span className={statusBadgeClass(item.status)}>
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
