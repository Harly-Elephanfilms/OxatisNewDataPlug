"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { CategoryNode } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryEntry {
  name: string;
  slot: number; // slot Oxatis réel (1, 2, 3, 4, 10…) déduit du nom de la colonne
}

interface CsvImportRow {
  itemSKU: string;
  name: string;
  priceHT: string;
  tva: string;
  ean: string;
  brand: string;
  stock: string;
  description: string;
  descriptionLong: string;
  characteristics: string;
  categoryEntries: CategoryEntry[];
  valid: boolean;
  errors: string[];
}

interface CategoryColDef {
  colIdx: number;
  slot: number;
}

interface ColMap {
  [key: string]: number | boolean | CategoryColDef[] | undefined;
  priceIsTTC?: boolean;
  categoryNameCols?: CategoryColDef[];
}

interface CategoryNameMap {
  [name: string]: { oxId: string; name: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CSV_TEMPLATE =
  "ref;titre;prix_ht;tva;ean;marque;stock;description\n" +
  "REF001;Mon Super Produit;9.99;20;1234567890123;Ma Marque;10;Description du produit\n" +
  "REF002;Autre Produit;14.99;20;;Autre Marque;5;";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function slotFromNormalizedHeader(c: string): number {
  if (c.includes("premi")) return 1;
  if (c.includes("deuxi")) return 2;
  if (c.includes("troisi")) return 3;
  if (c.includes("quatri")) return 4;
  if (c.includes("cinq")) return 5;
  if (c.includes("six") || c.includes("6")) return 6;
  if (c.includes("sept") || c.includes("7")) return 7;
  if (c.includes("huit") || c.includes("8")) return 8;
  if (c.includes("neuv") || c.includes("9")) return 9;
  if (c.includes("10") || c.includes("dix")) return 10;
  return 0;
}

function detectColumns(headers: string[]): ColMap {
  const m: ColMap = { categoryNameCols: [] };
  headers.forEach((h, i) => {
    const c = normalizeHeader(h);
    if (["ref", "reference", "sku", "itemsku", "id", "produit", "code", "codeproduit", "mpn"].includes(c))
      m.itemSKU = i;
    else if (["titre", "title", "nom", "name", "libelle"].includes(c)) m.name = i;
    else if (["prix", "price", "prixht", "priceht", "ht", "montant"].includes(c)) m.priceHT = i;
    else if (["prix1ttc", "prixttc", "ttc"].includes(c)) { m.priceHT = i; m.priceIsTTC = true; }
    else if (["tva", "vat", "taxe", "tx", "taux", "tauxdetvaenvaleur", "tauxdetvaeenvaleur"].includes(c)) m.tva = i;
    else if (["ean", "barcode", "gtin", "codeean", "codebarre", "codebarres"].includes(c)) m.ean = i;
    else if (["marque", "brand", "fabricant", "manufacturer", "editeur"].includes(c)) m.brand = i;
    else if (["stock", "quantite", "quantity", "qty", "qte", "qt"].includes(c)) m.stock = i;
    else if (["descriptiondetaillee", "descriptiondetail", "detaillee", "descriptionlongue", "longdescription"].includes(c)) m.descriptionDetail = i;
    else if (["description", "desc", "details", "detail"].includes(c)) m.description = i;
    else if (["caracteristiques", "caracteristique", "features", "feature", "attributs"].includes(c)) m.characteristics = i;
    // Colonnes catégories Oxatis : "Nom de la Xème catégorie" — on déduit le slot du nom
    else if (c.includes("categorie") && c.startsWith("nom")) {
      const slot = slotFromNormalizedHeader(c);
      if (slot > 0) {
        (m.categoryNameCols as CategoryColDef[]).push({ colIdx: i, slot });
      }
    }
  });
  return m;
}

function parseCharacteristics(raw: string): { name: string; value: string }[] {
  if (!raw.trim()) return [];
  return raw
    .split("|")
    .map((pair) => {
      const eqIdx = pair.indexOf("=");
      if (eqIdx === -1) return null;
      const name = pair.slice(0, eqIdx).trim();
      const value = pair.slice(eqIdx + 1).trim();
      return name && value ? { name, value } : null;
    })
    .filter((f): f is { name: string; value: string } => f !== null);
}

function buildCategoryNameMap(nodes: CategoryNode[], map: CategoryNameMap = {}): CategoryNameMap {
  for (const node of nodes) {
    map[node.name.trim().toLowerCase()] = { oxId: node.oxId, name: node.name };
    if (node.children.length > 0) buildCategoryNameMap(node.children, map);
  }
  return map;
}

function validateRow(row: CsvImportRow): CsvImportRow {
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

function buildRows(rawRows: string[][], colMap: ColMap): CsvImportRow[] {
  const getIdx = (key: string): number | undefined => {
    const v = colMap[key];
    return typeof v === "number" ? v : undefined;
  };
  // String() sécurise les cellules xlsx qui peuvent être des numbers.
  // Pas de suppression des guillemets : Papaparse/XLSX les ont déjà déséchappés,
  // et les retirer mutilerait les citations du texte (ex. description détaillée).
  const get = (row: string[], key: string) => {
    const idx = getIdx(key);
    return idx !== undefined ? String(row[idx] ?? "").trim() : "";
  };

  return rawRows.map((row) => {
    const tvaStr = get(row, "tva") || "20";
    let priceStr = get(row, "priceHT");

    if (colMap.priceIsTTC && priceStr) {
      const ttc = parseFloat(priceStr.replace(",", "."));
      const tva = parseFloat(tvaStr.replace(",", "."));
      if (!isNaN(ttc) && !isNaN(tva)) {
        priceStr = (ttc / (1 + tva / 100)).toFixed(2);
      }
    }

    const catColDefs = (colMap.categoryNameCols as CategoryColDef[]) ?? [];
    const categoryEntries: CategoryEntry[] = catColDefs
      .map(({ colIdx, slot }) => {
        const name = String(row[colIdx] ?? "").trim();
        return name ? { name, slot } : null;
      })
      .filter((e): e is CategoryEntry => e !== null);

    return validateRow({
      itemSKU: get(row, "itemSKU"),
      name: get(row, "name"),
      priceHT: priceStr,
      tva: tvaStr,
      ean: get(row, "ean"),
      brand: get(row, "brand"),
      stock: get(row, "stock") || "0",
      description: get(row, "description"),
      descriptionLong: get(row, "descriptionDetail"),
      characteristics: get(row, "characteristics"),
      categoryEntries,
      valid: false,
      errors: [],
    });
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CsvImportModeProps {
  appId: string;
  token: string;
  serverHasCredentials: boolean;
  noCredentials: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ n, label, icon }: { n: number; label: string; icon?: React.ReactNode }) {
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
  const [categoryNameMap, setCategoryNameMap] = useState<CategoryNameMap | null>(null);
  const [resolvingCategories, setResolvingCategories] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const csvStats = useMemo(() => ({
    total: csvRows.length,
    valid: csvRows.filter((r) => r.valid).length,
  }), [csvRows]);

  const hasCategoryNames = useMemo(
    () => csvRows.some((r) => r.categoryEntries.length > 0),
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

  const processRows = useCallback((rawRows: string[][], fileName: string) => {
    if (rawRows.length < 2) {
      setCsvError("Le fichier doit contenir au moins 2 lignes (en-tête + 1 article)");
      return;
    }
    const headers = rawRows[0].map((h) => String(h ?? "").replace(/"/g, "").trim());
    const colMap = detectColumns(headers);

    if (colMap.itemSKU === undefined || colMap.name === undefined || colMap.priceHT === undefined) {
      setCsvError(
        `Colonnes obligatoires introuvables.\n` +
        `Colonnes détectées : ${headers.join(", ")}\n` +
        `Colonnes requises : ref (ou Code produit/MPN), titre (ou Nom), prix (ou Prix 1 TTC / prix_ht)`
      );
      return;
    }

    const importRows = buildRows(rawRows.slice(1), colMap);
    setCsvFileName(fileName);
    setCsvRows(importRows);
    setCategoryNameMap(null);
  }, []);

  const parseCsvFile = useCallback((file: File) => {
    setCsvError("");
    setCsvRows([]);
    setCsvFileName("");
    setImportProgress(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const tryParse = (t: string) => {
        const clean = t.startsWith("\uFEFF") ? t.slice(1) : t;
        const delimiter = clean.split("\n")[0].includes(";") ? ";" : ",";
        Papa.parse(clean, {
          header: false,
          delimiter,
          skipEmptyLines: true,
          complete: (results) => processRows(results.data as string[][], file.name),
          error: (err: { message: string }) => setCsvError(`Erreur parsing CSV : ${err.message}`),
        });
      };
      if (text.includes("\ufffd")) {
        const r2 = new FileReader();
        r2.onload = () => tryParse(r2.result as string);
        r2.onerror = () => setCsvError("Erreur de lecture du fichier");
        r2.readAsText(file, "iso-8859-1");
      } else {
        tryParse(text);
      }
    };
    reader.onerror = () => setCsvError("Erreur de lecture du fichier");
    reader.readAsText(file, "utf-8");
  }, [processRows]);

  const parseXlsxFile = useCallback((file: File) => {
    setCsvError("");
    setCsvRows([]);
    setCsvFileName("");
    setImportProgress(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
          header: 1,
          defval: "",
          raw: false,
        });
        processRows(rawRows as string[][], file.name);
      } catch (err) {
        setCsvError(`Erreur lecture Excel : ${err instanceof Error ? err.message : "Erreur inconnue"}`);
      }
    };
    reader.onerror = () => setCsvError("Erreur de lecture du fichier");
    reader.readAsArrayBuffer(file);
  }, [processRows]);

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      parseXlsxFile(file);
    } else {
      parseCsvFile(file);
    }
  }, [parseCsvFile, parseXlsxFile]);

  const resolveCategoryNames = async () => {
    if (noCredentials) return;
    setResolvingCategories(true);
    try {
      const params = serverHasCredentials
        ? ""
        : `?appId=${encodeURIComponent(appId)}&token=${encodeURIComponent(token)}`;
      const res = await fetch(`/api/oxatis/categories${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      const map = buildCategoryNameMap(data.tree);
      setCategoryNameMap(map);
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : "Erreur chargement catégories");
    } finally {
      setResolvingCategories(false);
    }
  };

  const resetCsv = () => {
    setCsvRows([]);
    setCsvFileName("");
    setCsvError("");
    setImportProgress(null);
    setCategoryNameMap(null);
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
        // Résoudre les noms de catégories en CategoryAssignment[] avec les slots réels
        const categories = categoryNameMap
          ? row.categoryEntries
              .map(({ name, slot }) => {
                const match = categoryNameMap[name.trim().toLowerCase()];
                return match ? { oxId: match.oxId, name: match.name, slot } : null;
              })
              .filter((c): c is { oxId: string; name: string; slot: number } => c !== null)
          : undefined;

        const features = row.characteristics
          ? parseCharacteristics(row.characteristics)
          : undefined;

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
              descriptionLong: row.descriptionLong || undefined,
              features: features?.length ? features : undefined,
              categories: categories?.length ? categories : undefined,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          errors.push(`${row.itemSKU}: ${data.error || "Erreur création"}`);
        } else {
          if (data.featuresResult === null || data.featuresResult === undefined) {
            // features non envoyées — le fichier n'avait pas de caractéristiques détectées
            if (row.characteristics) {
              errors.push(`${row.itemSKU}: ⚠ Caractéristiques présentes dans le fichier mais non envoyées (${parseCharacteristics(row.characteristics).length} détectées)`);
            }
          } else if (data.featuresResult?.error) {
            errors.push(`${row.itemSKU}: Caractéristiques erreur — ${data.featuresResult.error}`);
          }
          if (data.categoriesResult?.error) {
            errors.push(`${row.itemSKU}: Catégories — ${data.categoriesResult.error}`);
          }
        }
      } catch {
        errors.push(`${row.itemSKU}: Erreur réseau`);
      }
      setImportProgress({ current: i + 1, total: validRows.length, errors: [...errors] });
    }
    setImporting(false);
  };

  // Stats catégories résolues
  const catStats = useMemo(() => {
    if (!categoryNameMap || !hasCategoryNames) return null;
    let matched = 0, unmatched = 0;
    const unmatchedNames = new Set<string>();
    for (const row of csvRows) {
      for (const { name } of row.categoryEntries) {
        if (categoryNameMap[name.trim().toLowerCase()]) matched++;
        else { unmatched++; unmatchedNames.add(name); }
      }
    }
    return { matched, unmatched, unmatchedNames: [...unmatchedNames] };
  }, [categoryNameMap, csvRows, hasCategoryNames]);

  return (
    <div className="space-y-5">
      {/* Instructions */}
      <div className="card p-6">
        <SectionTitle n={1} label="Format du fichier" icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        } />

        <div className="mb-4 mt-4 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
          <p className="text-xs font-semibold text-indigo-700 mb-1">Format Oxatis (export catalogue) — recommandé</p>
          <div className="bg-white border border-indigo-100 rounded p-2 font-mono text-xs text-slate-600 overflow-x-auto whitespace-nowrap">
            Code EAN ; Code produit ; … ; Nom ; Prix 1 TTC ; Taux de TVA ; … ; Nom de la Xème catégorie ; … ; Caractéristiques ; …
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Prix TTC converti en HT · Catégories résolues par nom · Caractéristiques appliquées · CSV et XLSX acceptés
          </p>
        </div>

        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-400 mb-1">Format simplifié (template)</p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs text-slate-600 overflow-x-auto whitespace-nowrap">
            ref;titre;prix_ht;tva;ean;marque;stock;description
          </div>
        </div>

        <button onClick={downloadTemplate} className="btn btn-secondary">
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
            if (file) handleFile(file);
          }}
        >
          <svg className="w-14 h-14 text-slate-300 group-hover:text-indigo-400 mx-auto mb-4 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-slate-700 font-semibold mb-1">Glissez-déposez votre fichier</p>
          <p className="text-sm text-slate-400">ou cliquez pour sélectionner un fichier</p>
          <p className="text-xs text-slate-300 mt-2">Formats acceptés : .csv, .xlsx, .xls, .txt</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
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
                      <> · <span className="text-red-500 font-medium">{csvStats.total - csvStats.valid} avec erreurs</span></>
                    )}
                  </p>
                </div>
              </div>
              <button onClick={resetCsv} className="btn btn-ghost btn-sm">
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
                    <th>Catégories</th>
                    <th>Caractéristiques</th>
                    <th className="text-center w-8">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {csvRows.slice(0, 25).map((row, i) => {
                    const features = parseCharacteristics(row.characteristics);
                    return (
                      <tr
                        key={i}
                        className={row.valid ? "" : "!bg-red-50/60"}
                        title={row.valid ? "" : row.errors.join(" · ")}
                      >
                        <td className="text-slate-400 font-mono text-xs">{i + 1}</td>
                        <td className="font-mono text-xs">
                          {row.itemSKU || <span className="text-red-400 italic">manquant</span>}
                        </td>
                        <td className="max-w-[180px] truncate">
                          {row.name || <span className="text-red-400 italic">manquant</span>}
                        </td>
                        <td className="text-right font-mono text-xs">
                          {row.priceHT ? `${row.priceHT} €` : <span className="text-red-400 italic">manquant</span>}
                        </td>
                        <td className="text-center text-slate-500">{row.tva}%</td>
                        <td className="font-mono text-xs text-slate-500">{row.ean || "—"}</td>
                        <td className="text-xs text-slate-500 max-w-[120px]">
                          {row.categoryEntries.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {row.categoryEntries.map(({ name, slot }, ci) => {
                                const resolved = categoryNameMap?.[name.trim().toLowerCase()];
                                return (
                                  <span
                                    key={ci}
                                    className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                                      !categoryNameMap
                                        ? "bg-slate-100 text-slate-600"
                                        : resolved
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-red-100 text-red-600"
                                    }`}
                                    title={resolved ? `Slot ${slot} — OxID: ${resolved.oxId}` : `Slot ${slot} — Non trouvée`}
                                  >
                                    {name} <span className="opacity-60">#{slot}</span>
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="text-xs text-slate-500">
                          {features.length > 0 ? (
                            <span className="text-indigo-600 font-medium">{features.length} caract.</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="text-center">
                          {row.valid ? (
                            <span className="badge badge-green">OK</span>
                          ) : (
                            <span className="badge badge-red" title={row.errors.join(", ")}>Err.</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {csvRows.length > 25 && (
                <p className="text-xs text-slate-400 text-center py-3 border-t border-slate-100">
                  Aperçu des 25 premiers sur {csvRows.length} lignes
                </p>
              )}
            </div>
          </div>

          {/* Résolution catégories */}
          {hasCategoryNames && !noCredentials && (
            <div className={`card p-4 ${categoryNameMap ? "border-emerald-200 bg-emerald-50/40" : "border-amber-200 bg-amber-50/40"}`}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  {!categoryNameMap ? (
                    <p className="text-sm font-medium text-amber-800">
                      Des noms de catégories ont été détectés. Résolvez-les avant d&apos;importer.
                    </p>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-emerald-800">
                        Catégories résolues — {catStats?.matched ?? 0} correspondance{(catStats?.matched ?? 0) > 1 ? "s" : ""}
                        {(catStats?.unmatched ?? 0) > 0 && (
                          <span className="text-red-600 ml-2">· {catStats?.unmatched} non trouvée{(catStats?.unmatched ?? 0) > 1 ? "s" : ""}</span>
                        )}
                      </p>
                      {(catStats?.unmatchedNames.length ?? 0) > 0 && (
                        <p className="text-xs text-red-500 mt-0.5">
                          Non trouvées : {catStats?.unmatchedNames.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={resolveCategoryNames}
                  disabled={resolvingCategories}
                  className="btn btn-secondary btn-sm flex-shrink-0"
                >
                  {resolvingCategories ? (
                    <><span className="spinner spinner-sm" /> Chargement…</>
                  ) : categoryNameMap ? (
                    "Rafraîchir"
                  ) : (
                    "Résoudre les catégories"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Import button */}
          <div className="flex justify-end">
            <button
              onClick={importCsvRows}
              disabled={csvStats.valid === 0 || importing || noCredentials || (hasCategoryNames && !categoryNameMap)}
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
                  Import en cours…
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
                importProgress.current === importProgress.total ? "bg-emerald-500" : "bg-indigo-500"
              }`}
              style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
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
                <button onClick={resetCsv} className="btn btn-secondary">
                  Importer un autre fichier
                </button>
                <Link href="/articles" className="btn btn-primary">
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
