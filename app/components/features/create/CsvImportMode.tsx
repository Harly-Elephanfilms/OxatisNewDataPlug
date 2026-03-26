"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import Papa from "papaparse";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CsvImportRow {
  itemSKU: string;
  name: string;
  priceHT: string;
  tva: string;
  ean: string;
  brand: string;
  stock: string;
  description: string;
  valid: boolean;
  errors: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CSV_TEMPLATE =
  "ref;titre;prix_ht;tva;ean;marque;stock;description\n" +
  "REF001;Mon Super Produit;9.99;20;1234567890123;Ma Marque;10;Description du produit\n" +
  "REF002;Autre Produit;14.99;20;;Autre Marque;5;";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectCsvColumns(headers: string[]): Record<string, number> {
  const m: Record<string, number> = {};
  headers.forEach((h, i) => {
    const c = h
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
    if (["ref", "reference", "sku", "itemsku", "id", "produit", "code"].includes(c))
      m.itemSKU = i;
    else if (["titre", "title", "nom", "name", "libelle"].includes(c)) m.name = i;
    else if (["prix", "price", "prixht", "priceht", "ht", "montant"].includes(c)) m.priceHT = i;
    else if (["tva", "vat", "taxe", "tx", "taux"].includes(c)) m.tva = i;
    else if (["ean", "barcode", "gtin", "code", "codebarre", "codebarres"].includes(c)) m.ean = i;
    else if (["marque", "brand", "fabricant", "manufacturer", "editeur"].includes(c)) m.brand = i;
    else if (["stock", "quantite", "quantity", "qty", "qte", "qt"].includes(c)) m.stock = i;
    else if (["description", "desc", "details", "detail"].includes(c)) m.description = i;
  });
  return m;
}

function validateCsvRow(row: CsvImportRow): CsvImportRow {
  const errors: string[] = [];
  if (!row.itemSKU.trim()) errors.push("Référence manquante");
  if (!row.name.trim()) errors.push("Titre manquant");
  if (!row.priceHT.trim()) errors.push("Prix manquant");
  else {
    const p = parseFloat(row.priceHT.replace(",", "."));
    if (isNaN(p) || p < 0) errors.push("Prix invalide");
  }
  if (row.ean && !/^\d{8,14}$/.test(row.ean.trim())) errors.push("EAN invalide");
  return { ...row, valid: errors.length === 0, errors };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CsvImportModeProps {
  appId: string;
  token: string;
  serverHasCredentials: boolean;
  noCredentials: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({
  n,
  label,
  icon,
}: {
  n: number;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
        {n}
      </span>
      {icon && <span className="text-slate-400">{icon}</span>}
      <h2 className="section-title text-base">{label}</h2>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CsvImportMode({
  appId,
  token,
  serverHasCredentials,
  noCredentials,
}: CsvImportModeProps) {
  const [csvRows, setCsvRows] = useState<CsvImportRow[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvError, setCsvError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const csvStats = useMemo(
    () => ({
      total: csvRows.length,
      valid: csvRows.filter((r) => r.valid).length,
    }),
    [csvRows]
  );

  const downloadTemplate = () => {
    const blob = new Blob(["\uFEFF" + CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_articles.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const processCsvText = (text: string, fileName: string) => {
    const clean = text.startsWith("\uFEFF") ? text.slice(1) : text;
    const firstLine = clean.split("\n")[0];
    const delimiter = firstLine.includes(";") ? ";" : ",";

    Papa.parse(clean, {
      header: false,
      delimiter,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as string[][];
        if (rows.length < 2) {
          setCsvError("Le fichier doit contenir au moins 2 lignes (en-tête + 1 article)");
          return;
        }
        const headers = rows[0].map((h) => h.replace(/"/g, "").trim());
        const colMap = detectCsvColumns(headers);

        if (colMap.itemSKU === undefined || colMap.name === undefined || colMap.priceHT === undefined) {
          setCsvError(
            `Colonnes obligatoires introuvables.\n` +
            `Colonnes détectées : ${headers.join(", ")}\n` +
            `Colonnes requises : ref (ou référence/sku), titre (ou name/nom), prix (ou prix_ht/price)`
          );
          return;
        }

        const get = (row: string[], key: string) => {
          const idx = colMap[key];
          return idx !== undefined ? (row[idx] ?? "").replace(/"/g, "").trim() : "";
        };

        const importRows: CsvImportRow[] = rows.slice(1).map((row) => {
          const raw: CsvImportRow = {
            itemSKU: get(row, "itemSKU"),
            name: get(row, "name"),
            priceHT: get(row, "priceHT"),
            tva: get(row, "tva") || "20",
            ean: get(row, "ean"),
            brand: get(row, "brand"),
            stock: get(row, "stock") || "0",
            description: get(row, "description"),
            valid: false,
            errors: [],
          };
          return validateCsvRow(raw);
        });

        setCsvFileName(fileName);
        setCsvRows(importRows);
      },
      error: (err: { message: string }) => setCsvError(`Erreur parsing CSV : ${err.message}`),
    });
  };

  const parseCsvFile = (file: File) => {
    setCsvError("");
    setCsvRows([]);
    setCsvFileName("");
    setImportProgress(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      if (text.includes("\ufffd")) {
        const r2 = new FileReader();
        r2.onload = () => processCsvText(r2.result as string, file.name);
        r2.onerror = () => setCsvError("Erreur de lecture du fichier");
        r2.readAsText(file, "iso-8859-1");
      } else {
        processCsvText(text, file.name);
      }
    };
    reader.onerror = () => setCsvError("Erreur de lecture du fichier");
    reader.readAsText(file, "utf-8");
  };

  const resetCsv = () => {
    setCsvRows([]);
    setCsvFileName("");
    setCsvError("");
    setImportProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const importCsvRows = async () => {
    const validRows = csvRows.filter((r) => r.valid);
    if (validRows.length === 0) return;
    setImporting(true);
    setImportProgress({ current: 0, total: validRows.length, errors: [] });
    const errors: string[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const res = await fetch("/api/oxatis/create-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(serverHasCredentials ? {} : { appId, token }),
            product: {
              itemSKU: row.itemSKU,
              name: row.name,
              priceHT: parseFloat(row.priceHT.replace(",", ".")),
              tva: parseFloat(row.tva) || 20,
              stock: parseInt(row.stock) || 0,
              brand: row.brand || undefined,
              ean: row.ean || undefined,
              description: row.description || undefined,
            },
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          errors.push(`${row.itemSKU}: ${data.error || "Erreur"}`);
        }
      } catch {
        errors.push(`${row.itemSKU}: Erreur réseau`);
      }
      setImportProgress({ current: i + 1, total: validRows.length, errors: [...errors] });
    }
    setImporting(false);
  };

  return (
    <div className="space-y-5">
      {/* Instructions */}
      <div className="card p-6">
        <SectionTitle n={1} label="Format du fichier CSV" icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        } />
        <p className="text-sm text-slate-500 mt-4 mb-3">
          Séparateur : <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-xs">;</code>{" "}
          ou <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-xs">,</code> — Encodage : UTF-8 ou ISO-8859-1
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs text-slate-600 mb-5 overflow-x-auto whitespace-nowrap">
          ref;titre;prix_ht;tva;ean;marque;stock;description
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { col: "ref", req: true, desc: "Référence unique" },
            { col: "titre", req: true, desc: "Nom du produit" },
            { col: "prix_ht", req: true, desc: "Prix hors taxe" },
            { col: "tva", req: false, desc: "Taux TVA (défaut: 20)" },
            { col: "ean", req: false, desc: "Code-barres EAN" },
            { col: "marque", req: false, desc: "Marque / éditeur" },
            { col: "stock", req: false, desc: "Quantité (défaut: 0)" },
            { col: "description", req: false, desc: "Description" },
          ].map((f) => (
            <div key={f.col} className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
              <p className="font-mono text-xs font-semibold text-slate-700">
                {f.col}
                {f.req && <span className="text-red-500 ml-0.5">*</span>}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
        <button
          onClick={downloadTemplate}
          className="btn btn-secondary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Télécharger le template CSV
        </button>
      </div>

      {/* Error */}
      {csvError && (
        <div className="alert alert-error">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span className="flex-1 whitespace-pre-wrap">{csvError}</span>
          <button
            onClick={() => { setCsvError(""); setCsvFileName(""); setCsvRows([]); }}
            className="text-current opacity-60 hover:opacity-100 font-bold text-lg leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>
      )}

      {/* Drop zone */}
      {!csvFileName && !csvError && (
        <div
          className="card rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30 p-12 text-center cursor-pointer transition-all group"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add("border-indigo-400", "bg-indigo-50/40");
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove("border-indigo-400", "bg-indigo-50/40");
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("border-indigo-400", "bg-indigo-50/40");
            const file = e.dataTransfer.files[0];
            if (file) parseCsvFile(file);
          }}
        >
          <svg className="w-14 h-14 text-slate-300 group-hover:text-indigo-400 mx-auto mb-4 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-slate-700 font-semibold mb-1">Glissez-déposez votre fichier CSV</p>
          <p className="text-sm text-slate-400">ou cliquez pour sélectionner un fichier</p>
          <p className="text-xs text-slate-300 mt-2">Formats acceptés : .csv, .txt</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) parseCsvFile(e.target.files[0]);
            }}
          />
        </div>
      )}

      {/* Preview table */}
      {csvRows.length > 0 && !importProgress && (
        <>
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap bg-slate-50/60">
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="font-semibold text-slate-700 text-sm">{csvFileName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {csvStats.total} article{csvStats.total > 1 ? "s" : ""} ·{" "}
                    <span className="text-emerald-600 font-medium">{csvStats.valid} valide{csvStats.valid > 1 ? "s" : ""}</span>
                    {csvStats.total - csvStats.valid > 0 && (
                      <>
                        {" "}·{" "}
                        <span className="text-red-500 font-medium">
                          {csvStats.total - csvStats.valid} avec erreurs
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={resetCsv}
                className="btn btn-ghost btn-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Changer de fichier
              </button>
            </div>
            <div className="table-wrapper border-0 rounded-none">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-8">#</th>
                    <th>Réf.</th>
                    <th>Titre</th>
                    <th className="text-right">Prix HT</th>
                    <th className="text-center">TVA</th>
                    <th>EAN</th>
                    <th>Marque</th>
                    <th className="text-right">Stock</th>
                    <th className="text-center w-8">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {csvRows.slice(0, 25).map((row, i) => (
                    <tr
                      key={i}
                      className={row.valid ? "" : "!bg-red-50/60"}
                      title={row.valid ? "" : row.errors.join(" · ")}
                    >
                      <td className="text-slate-400 font-mono text-xs">{i + 1}</td>
                      <td className="font-mono text-xs">
                        {row.itemSKU || <span className="text-red-400 italic">manquant</span>}
                      </td>
                      <td className="max-w-[200px] truncate">
                        {row.name || <span className="text-red-400 italic">manquant</span>}
                      </td>
                      <td className="text-right font-mono text-xs">
                        {row.priceHT ? `${row.priceHT} €` : <span className="text-red-400 italic">manquant</span>}
                      </td>
                      <td className="text-center text-slate-500">{row.tva}%</td>
                      <td className="font-mono text-xs text-slate-500">{row.ean || "—"}</td>
                      <td className="text-slate-500">{row.brand || "—"}</td>
                      <td className="text-right">{row.stock}</td>
                      <td className="text-center">
                        {row.valid ? (
                          <span className="badge badge-green">OK</span>
                        ) : (
                          <span className="badge badge-red" title={row.errors.join(", ")}>Err.</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvRows.length > 25 && (
                <p className="text-xs text-slate-400 text-center py-3 border-t border-slate-100">
                  Aperçu des 25 premiers sur {csvRows.length} lignes
                </p>
              )}
            </div>
          </div>

          {/* Import button */}
          <div className="flex justify-end">
            <button
              onClick={importCsvRows}
              disabled={csvStats.valid === 0 || importing || noCredentials}
              className="btn btn-primary btn-lg"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Importer {csvStats.valid} article{csvStats.valid > 1 ? "s" : ""}
            </button>
          </div>
        </>
      )}

      {/* Progress */}
      {importProgress && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">
              {importProgress.current < importProgress.total ? (
                <span className="flex items-center gap-2">
                  <span className="spinner spinner-sm" />
                  Import en cours...
                </span>
              ) : (
                "Import terminé !"
              )}
            </span>
            <span className="text-slate-500 font-mono text-xs tabular-nums">
              {importProgress.current} / {importProgress.total}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                importProgress.current === importProgress.total
                  ? "bg-emerald-500"
                  : "bg-indigo-500"
              }`}
              style={{
                width: `${(importProgress.current / importProgress.total) * 100}%`,
              }}
            />
          </div>
          {importProgress.errors.length > 0 && (
            <div className="alert alert-error flex-col items-start max-h-36 overflow-y-auto">
              <p className="text-xs font-semibold mb-1">
                {importProgress.errors.length} erreur{importProgress.errors.length > 1 ? "s" : ""}
              </p>
              {importProgress.errors.map((e, i) => (
                <p key={i} className="text-xs font-mono">{e}</p>
              ))}
            </div>
          )}
          {importProgress.current === importProgress.total && (
            <>
              <p className="text-sm text-center font-semibold text-emerald-600">
                {importProgress.errors.length === 0
                  ? `${importProgress.total} article${importProgress.total > 1 ? "s" : ""} créé${importProgress.total > 1 ? "s" : ""} avec succès`
                  : `${importProgress.total - importProgress.errors.length} / ${importProgress.total} articles créés`}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={resetCsv}
                  className="btn btn-secondary"
                >
                  Importer un autre fichier
                </button>
                <Link
                  href="/articles"
                  className="btn btn-primary"
                >
                  Voir les articles
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
