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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${siteStock.length > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${siteStock.length > 0 ? "bg-green-600 text-white" : "bg-gray-300 text-white"}`}>1</span>
          Stock site {siteStock.length > 0 && `(${siteStock.length})`}
        </div>
        <div className="w-8 h-0.5 bg-gray-200 rounded"></div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${newStock.length > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${newStock.length > 0 ? "bg-green-600 text-white" : "bg-gray-300 text-white"}`}>2</span>
          Nouveau stock {newStock.length > 0 && `(${newStock.length})`}
        </div>
        <div className="w-8 h-0.5 bg-gray-200 rounded"></div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${canCompare ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${canCompare ? "bg-green-600 text-white" : "bg-gray-300 text-white"}`}>3</span>
          Comparer
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Site Stock Import */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">1</span>
            <h2 className="text-base font-semibold text-gray-900">Stock actuel du site</h2>
          </div>

          {/* Auto-fetch button */}
          <button
            onClick={onFetchSiteStock}
            disabled={loadingSiteStock}
            className="btn btn-primary w-full justify-center mb-4"
          >
            {loadingSiteStock ? (
              <>
                <span className="spinner spinner-sm"></span>
                Chargement...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Charger depuis le site
              </>
            )}
          </button>

          <div className="relative flex items-center my-4">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="mx-3 text-xs text-gray-400 font-medium">ou importer un fichier</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <label className="block cursor-pointer">
            <div className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
              siteStock.length > 0
                ? "border-green-300 bg-green-50"
                : "border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/30"
            }`}>
              {siteStock.length > 0 ? (
                <>
                  <svg className="w-6 h-6 text-green-500 mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-700 font-semibold text-sm">{siteStock.length} produits chargés</p>
                  <p className="text-xs text-green-600 mt-0.5 truncate">{siteFileName}</p>
                  <p className="text-xs text-gray-400 mt-1">Cliquez pour remplacer</p>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 text-gray-400 mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <p className="text-gray-500 text-sm font-medium">Importer un CSV</p>
                  <p className="text-xs text-gray-400 mt-1">OxatisId;ItemSKU;Name;QtyInStock;...</p>
                </>
              )}
              <input
                type="file"
                accept=".csv"
                onChange={handleSiteStockUpload}
                className="hidden"
              />
            </div>
          </label>
        </div>

        {/* New Stock Import */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">2</span>
            <h2 className="text-base font-semibold text-gray-900">Nouveau stock</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Fichier export stock (ex: <span className="font-mono bg-gray-100 px-1 rounded">export.csv</span>)
            <br />Format : Réf.;EAN;Titre;Type;Regr.;Stock;...
          </p>
          <label className="block cursor-pointer">
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              newStock.length > 0
                ? "border-green-300 bg-green-50"
                : "border-gray-200 hover:border-purple-400 hover:bg-purple-50/30"
            }`}>
              {newStock.length > 0 ? (
                <>
                  <svg className="w-6 h-6 text-green-500 mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-700 font-semibold text-sm">{newStock.length} produits chargés</p>
                  <p className="text-xs text-green-600 mt-0.5 truncate">{newFileName}</p>
                  <p className="text-xs text-gray-400 mt-1">Cliquez pour remplacer</p>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-gray-500 font-medium text-sm">Cliquez pour importer</p>
                  <p className="text-xs text-gray-400 mt-1">Séparateur : point-virgule (;)</p>
                </>
              )}
              <input
                type="file"
                accept=".csv"
                onChange={handleNewStockUpload}
                className="hidden"
              />
            </div>
          </label>
        </div>
      </div>

      {/* Compare button */}
      {canCompare && (
        <div className="text-center">
          <button
            onClick={onCompare}
            className="btn btn-primary btn-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
            Voir la comparaison ({comparisonCount} produits)
          </button>
          {toUpdateCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              {toUpdateCount} produit(s) avec des différences de stock
            </p>
          )}
        </div>
      )}

      {/* Preview tables side by side */}
      {(siteStock.length > 0 || newStock.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {siteStock.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                <h3 className="font-semibold text-sm text-indigo-700">Stock site — Aperçu</h3>
              </div>
              <div className="overflow-y-auto max-h-64">
                <table className="data-table text-xs">
                  <thead>
                    <tr>
                      <th className="!text-left">SKU</th>
                      <th className="!text-left">Nom</th>
                      <th className="!text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siteStock.slice(0, 50).map((item, idx) => (
                      <tr key={idx}>
                        <td className="font-mono">{item.itemSKU}</td>
                        <td className="truncate max-w-[150px]" title={item.name}>{item.name}</td>
                        <td className="text-right font-mono">{item.qtyInStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {siteStock.length > 50 && (
                <div className="px-3 py-2 bg-gray-50 text-xs text-gray-400 text-center border-t border-gray-100">
                  +{siteStock.length - 50} autres produits
                </div>
              )}
            </div>
          )}
          {newStock.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
                <h3 className="font-semibold text-sm text-purple-700">Nouveau stock — Aperçu</h3>
              </div>
              <div className="overflow-y-auto max-h-64">
                <table className="data-table text-xs">
                  <thead>
                    <tr>
                      <th className="!text-left">Réf.</th>
                      <th className="!text-left">Titre</th>
                      <th className="!text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newStock.slice(0, 50).map((item, idx) => (
                      <tr key={idx}>
                        <td className="font-mono">{item.ref}</td>
                        <td className="truncate max-w-[150px]" title={item.title}>{item.title}</td>
                        <td className="text-right font-mono">{item.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {newStock.length > 50 && (
                <div className="px-3 py-2 bg-gray-50 text-xs text-gray-400 text-center border-t border-gray-100">
                  +{newStock.length - 50} autres produits
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CSV parsing helpers (self-contained in this module) ──────────────────────

function readFileWithEncoding(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      if (text.includes("\ufffd")) {
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
  // We need Papa here – import it dynamically to keep this component lean
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
