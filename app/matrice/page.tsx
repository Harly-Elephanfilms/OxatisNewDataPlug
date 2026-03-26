"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { CategoryNode } from "@/lib/types";
import { useCredentials } from "@/app/contexts/CredentialsContext";
import { useCategories } from "@/app/contexts/CategoriesContext";

const DEFAULT_CAT_KEY = "oxatis_matrice_default_cat";
const UPDATE_FIELDS_KEY = "oxatis_matrice_update_fields";

type DefaultCategory = { oxId: string; name: string; parentOxId: string };
type UpdateFields = { description: boolean; dateDispo: boolean; nom: boolean; prix: boolean };

function loadDefaultCategory(): DefaultCategory | null {
  try {
    const s = localStorage.getItem(DEFAULT_CAT_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

function loadUpdateFields(): UpdateFields {
  try {
    const s = localStorage.getItem(UPDATE_FIELDS_KEY);
    return s ? JSON.parse(s) : { description: true, dateDispo: true, nom: false, prix: false };
  } catch { return { description: true, dateDispo: true, nom: false, prix: false }; }
}

interface MatriceArticle {
  ean: string;
  itemSKU: string;
  langue: string;
  nom: string;
  prixTTC: number;
  tva: number;
  categories: string[];          // noms bruts des catégories (cols 7-11)
  description: string;           // description courte
  descriptionLongue: string;     // HTML complet, préfixé <!--#WYSIWYG#-->
  metaTitle: string;
  metaDescription: string;
  urlCanonique: string;
  afficherStock: string;
  montrerSiIndispo: string;
  causeIndispo: string;
  imageZoom1: string;
  imageMain: string;
  imageVignette: string;
  dateDispo: string;             // YYYY-MM-DD ou ""
  afficherDelai: string;
  isNew: boolean;
  oxatisId: string | null;
}

interface ProgressState {
  current: number;
  total: number;
  errors: string[];
  label: string;
}

interface ConflictItem {
  matrice: MatriceArticle;
  oxatis: {
    name: string;
    description: string;
    descriptionLong: string;
    dateOfAvailability: string;
    oxatisId: string;
  };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function str(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

export default function MatricePage() {
  const [articles, setArticles] = useState<MatriceArticle[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [filter, setFilter] = useState<"all" | "new" | "existing">("all");
  const [search, setSearch] = useState("");
  const [selectedEans, setSelectedEans] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<MatriceArticle | null>(null);

  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [progressModalOpen, setProgressModalOpen] = useState(false);

  const [verifying, setVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState({ current: 0, total: 0 });
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [pendingNew, setPendingNew] = useState<MatriceArticle[]>([]);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);

  // Credentials & categories (shared via context)
  const { appId, token, hasCredentials, serverHasCredentials, credParams } = useCredentials();
  const { categoryTree, loading: loadingTree, fetchCategories } = useCategories();

  const [defaultCategory, setDefaultCategory] = useState<DefaultCategory | null>(null);
  const [catSearch, setCatSearch] = useState("");

  const [updateFields, setUpdateFields] = useState<UpdateFields>({ description: true, dateDispo: true, nom: false, prix: false });
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDefaultCategory(loadDefaultCategory());
    setUpdateFields(loadUpdateFields());
  }, []);

  const setDefaultCategoryPersisted = (cat: DefaultCategory | null) => {
    setDefaultCategory(cat);
    if (cat) localStorage.setItem(DEFAULT_CAT_KEY, JSON.stringify(cat));
    else localStorage.removeItem(DEFAULT_CAT_KEY);
  };

  const setUpdateFieldsPersisted = (fields: UpdateFields) => {
    setUpdateFields(fields);
    localStorage.setItem(UPDATE_FIELDS_KEY, JSON.stringify(fields));
  };

  // Aplatit l'arbre en liste avec chemin complet (ex: "Cinéma > Action")
  const flatCategories = useMemo(() => {
    const result: { oxId: string; name: string; parentOxId: string; path: string }[] = [];
    function walk(nodes: CategoryNode[], prefix: string) {
      for (const n of nodes) {
        const path = prefix ? `${prefix} > ${n.name}` : n.name;
        result.push({ oxId: n.oxId, name: n.name, parentOxId: n.parentOxId, path });
        walk(n.children, path);
      }
    }
    walk(categoryTree, "");
    return result;
  }, [categoryTree]);

  const filteredCats = catSearch
    ? flatCategories.filter((c) => c.path.toLowerCase().includes(catSearch.toLowerCase()))
    : flatCategories;

  // ── Parsing ──────────────────────────────────────────────────────────────

  const parseFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setParseError("Fichier non reconnu. Veuillez importer un fichier Excel (.xlsx).");
      return;
    }
    setParsing(true);
    setParseError("");
    setArticles([]);
    setSelectedEans(new Set());
    setFilter("all");
    setSearch("");

    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });

      // ── Feuille Articles → map EAN → { oxatisId } (Actifs seulement) ──
      const aSheet = wb.Sheets["Articles"];
      if (!aSheet) throw new Error("Feuille 'Articles' introuvable dans le fichier.");
      const aRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(aSheet, { defval: null });

      const articleMap = new Map<string, { oxatisId: string | null }>();

      // Détecter les noms de colonnes de façon flexible (insensible à la casse et aux espaces)
      const normalize = (s: string) => s.toLowerCase().replace(/[\s_\-]/g, "");
      const firstRow = aRows[0] ?? {};
      const colKeys = Object.keys(firstRow);
      const findCol = (...variants: string[]) =>
        colKeys.find((k) => variants.includes(normalize(k))) ?? null;

      const eanKey = findCol("ean") ?? "EAN";
      const codeEtatKey = findCol("codeetat", "etat", "state") ?? "Code Etat";
      const oxatisIdKey = findCol("oxatisid", "oxid", "idoxatis") ?? "OxatisId";

      for (const row of aRows) {
        const ean = str(row[eanKey]);
        const codeEtat = Number(row[codeEtatKey]);
        const oxId = row[oxatisIdKey];
        if (ean && codeEtat === 0) {
          articleMap.set(ean, {
            oxatisId: oxId != null && String(oxId).trim() !== "" && String(oxId) !== "0"
              ? String(Math.round(Number(oxId)))
              : null,
          });
        }
      }

      // ── Feuille Matrice → valeurs calculées ──
      const mSheet = wb.Sheets["Matrice"];
      if (!mSheet) throw new Error("Feuille 'Matrice' introuvable dans le fichier.");
      const mRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(mSheet, { defval: null });

      const parsed: MatriceArticle[] = [];
      for (const row of mRows) {
        const ean = str(row["Code EAN"]);
        if (!ean || !articleMap.has(ean)) continue;

        const info = articleMap.get(ean)!;

        // Date de disponibilité
        let dateDispo = "";
        const rawDate = row["Date de disponibilité"];
        if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
          dateDispo = rawDate.toISOString().slice(0, 10);
        } else if (typeof rawDate === "string" && rawDate.trim()) {
          dateDispo = rawDate.trim().slice(0, 10);
        }

        // Description longue — préfixer avec <!--#WYSIWYG#-->
        const descLong = str(row["Description détaillée"]);
        const descLongFinal = descLong && !descLong.startsWith("<!--#WYSIWYG#-->")
          ? "<!--#WYSIWYG#-->" + descLong
          : descLong;

        parsed.push({
          ean,
          itemSKU:           str(row["Code produit"]),
          langue:            str(row["Langue de présentation"]).toLowerCase() || "fr",
          nom:               str(row["Nom"]),
          prixTTC:           Number(row["Prix 1 TTC"]) || 0,
          tva:               Number(row["Taux de TVA (en valeur)"]) || 20,
          categories: [
            row["Nom de la première catégorie"],
            row["Nom de la deuxième catégorie"],
            row["Nom de la troisième catégorie"],
            row["Nom de la quatrième catégorie"],
            row["Nom de la 5ème catégorie"],
          ].filter(Boolean).map(String),
          description:       str(row["Description"]),
          descriptionLongue: descLongFinal,
          metaTitle:         str(row["Titre de page (Balise <TITLE>)"]),
          metaDescription:   str(row["Description (META description)"]),
          urlCanonique:      str(row["Contenu de l'URL canonique"]),
          afficherStock:     str(row["Afficher le niveau du stock"]),
          montrerSiIndispo:  str(row["Montrer cet article même si il est indisponible"]),
          causeIndispo:      str(row["Cause de l'indisponibilité"]),
          imageZoom1:        str(row["1ère image zoom"]),
          imageMain:         str(row["Image principale"]),
          imageVignette:     str(row["Petite image (vignette)"]),
          dateDispo,
          afficherDelai:     str(row["Afficher le délai de disponibilité"]),
          isNew:             !info.oxatisId,
          oxatisId:          info.oxatisId,
        });
      }

      setArticles(parsed);
      setFileName(file.name);
      if (hasCredentials) fetchCategories(appId, token);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Erreur de parsing du fichier.");
    } finally {
      setParsing(false);
    }
  }, []);

  // ── Drag & Drop ──────────────────────────────────────────────────────────

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  };

  // ── Filtres & sélection ──────────────────────────────────────────────────

  const filtered = articles.filter((a) => {
    if (filter === "new" && !a.isNew) return false;
    if (filter === "existing" && a.isNew) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.nom.toLowerCase().includes(q) || a.itemSKU.includes(q) || a.ean.includes(q);
    }
    return true;
  });

  const stats = {
    total: articles.length,
    nouveaux: articles.filter((a) => a.isNew).length,
    existants: articles.filter((a) => !a.isNew).length,
  };

  const toggleSelect = (ean: string) => {
    setSelectedEans((prev) => {
      const next = new Set(prev);
      next.has(ean) ? next.delete(ean) : next.add(ean);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEans.size === filtered.length) {
      setSelectedEans(new Set());
    } else {
      setSelectedEans(new Set(filtered.map((a) => a.ean)));
    }
  };

  const selectedArticles = articles.filter((a) => selectedEans.has(a.ean));
  const selectedNew = selectedArticles.filter((a) => a.isNew);
  const selectedExisting = selectedArticles.filter((a) => !a.isNew);

  // ── Exécution ────────────────────────────────────────────────────────────

  const creds = credParams;

  // Vérifie si les articles "nouveaux" existent déjà sur Oxatis avant de créer
  const startCreate = async () => {
    const items = selectedNew;
    if (!items.length) return;

    const credQuery = serverHasCredentials
      ? ""
      : `appId=${encodeURIComponent(appId)}&token=${encodeURIComponent(token)}&`;

    setVerifying(true);
    setVerifyProgress({ current: 0, total: items.length });

    const foundConflicts: ConflictItem[] = [];
    const trulyNew: MatriceArticle[] = [];

    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      try {
        const res = await fetch(
          `/api/oxatis/product-detail?${credQuery}itemSKU=${encodeURIComponent(a.itemSKU)}`
        );
        if (res.ok) {
          const data = await res.json();
          foundConflicts.push({
            matrice: a,
            oxatis: {
              name: data.name || "",
              description: data.description || "",
              descriptionLong: data.descriptionLong || "",
              dateOfAvailability: data.dateOfAvailability || "",
              oxatisId: data.oxatisId || "",
            },
          });
        } else {
          trulyNew.push(a);
        }
      } catch {
        trulyNew.push(a);
      }
      setVerifyProgress({ current: i + 1, total: items.length });
    }

    setVerifying(false);

    if (foundConflicts.length > 0) {
      setConflicts(foundConflicts);
      setPendingNew(trulyNew);
      setConflictModalOpen(true);
    } else {
      executeCreate(trulyNew);
    }
  };

  const executeCreate = async (items: MatriceArticle[]) => {
    if (!items.length) return;
    setProgressModalOpen(true);
    setProgress({ current: 0, total: items.length, errors: [], label: "Création en cours..." });
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      try {
        const priceHT = a.tva > 0 ? a.prixTTC / (1 + a.tva / 100) : a.prixTTC;

        // 1. Créer le produit (format attendu par la route : { product: {...} })
        const res = await fetch("/api/oxatis/create-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...creds,
            product: {
              itemSKU:     a.itemSKU,
              name:        a.nom,
              priceHT:     parseFloat(priceHT.toFixed(2)),
              tva:         a.tva,
              ean:         a.ean,
              stock:       0,
              description: a.description,
              categories: defaultCategory
                ? [{ oxId: defaultCategory.oxId, name: defaultCategory.name, parentOxId: defaultCategory.parentOxId, slot: 1 }]
                : [],
            },
          }),
        });

        const d = await res.json();
        if (!res.ok) {
          errors.push(`${a.itemSKU} (création) : ${d.error || "Erreur"}`);
        } else {
          if (d.categoriesResult?.error) {
            errors.push(`${a.itemSKU} (catégories) : ${d.categoriesResult.error}`);
          }
          // 2. Description longue
          if (a.descriptionLongue) {
            const r2 = await fetch("/api/oxatis/update-description", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...creds, itemSKU: a.itemSKU, descriptionLong: a.descriptionLongue }),
            });
            if (!r2.ok) {
              const d2 = await r2.json();
              errors.push(`${a.itemSKU} (description) : ${d2.error || "Erreur"}`);
            }
          }
          // 3. Date de disponibilité
          if (a.dateDispo) {
            const r3 = await fetch("/api/oxatis/update-availability", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...creds, itemSKU: a.itemSKU, dateOfAvailability: a.dateDispo }),
            });
            if (!r3.ok) {
              const d3 = await r3.json();
              errors.push(`${a.itemSKU} (date dispo) : ${d3.error || "Erreur"}`);
            }
          }
          // 4. Visibilité (rendre visible)
          await fetch("/api/oxatis/update-visibility", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...creds, itemSKU: a.itemSKU, visible: true }),
          });
        }
      } catch {
        errors.push(`${a.itemSKU} : Erreur réseau`);
      }
      setProgress({
        current: i + 1,
        total: items.length,
        errors: [...errors],
        label: i + 1 < items.length ? "Création en cours..." : "Terminé !",
      });
      if (i + 1 < items.length) await sleep(200);
    }
  };

  const executeUpdate = async (items: MatriceArticle[] = selectedExisting, fields: UpdateFields = updateFields) => {
    if (!items.length) return;
    setUpdateModalOpen(false);
    setProgressModalOpen(true);
    setProgress({ current: 0, total: items.length, errors: [], label: "Mise à jour en cours..." });
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      try {
        // 1. Nom
        if (fields.nom && a.nom) {
          const r = await fetch("/api/oxatis/update-name", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...creds, itemSKU: a.itemSKU, name: a.nom }),
          });
          if (!r.ok) errors.push(`${a.itemSKU} (nom) : ${(await r.json()).error || "Erreur"}`);
        }
        // 2. Prix
        if (fields.prix && a.prixTTC > 0) {
          const priceHT = a.tva > 0 ? a.prixTTC / (1 + a.tva / 100) : a.prixTTC;
          const r = await fetch("/api/oxatis/update-price", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...creds, itemSKU: a.itemSKU, priceHT: parseFloat(priceHT.toFixed(2)), tva: a.tva }),
          });
          if (!r.ok) errors.push(`${a.itemSKU} (prix) : ${(await r.json()).error || "Erreur"}`);
        }
        // 3. Description longue
        if (fields.description && a.descriptionLongue) {
          const r = await fetch("/api/oxatis/update-description", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...creds, itemSKU: a.itemSKU, descriptionLong: a.descriptionLongue }),
          });
          if (!r.ok) errors.push(`${a.itemSKU} (description) : ${(await r.json()).error || "Erreur"}`);
        }
        // 4. Date de disponibilité
        if (fields.dateDispo) {
          const r = await fetch("/api/oxatis/update-availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...creds, itemSKU: a.itemSKU, dateOfAvailability: a.dateDispo }),
          });
          if (!r.ok) errors.push(`${a.itemSKU} (date dispo) : ${(await r.json()).error || "Erreur"}`);
        }
      } catch {
        errors.push(`${a.itemSKU} : Erreur réseau`);
      }
      setProgress({
        current: i + 1,
        total: items.length,
        errors: [...errors],
        label: i + 1 < items.length ? "Mise à jour en cours..." : "Terminé !",
      });
      if (i + 1 < items.length) await sleep(200);
    }
  };

  const closeProgress = () => {
    setProgressModalOpen(false);
    setProgress(null);
  };

  // Description longue sans le préfixe WYSIWYG pour l'affichage
  function descHtml(a: MatriceArticle): string {
    return a.descriptionLongue.replace("<!--#WYSIWYG#-->", "");
  }

  // ── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Import Matrice Oxatis</h1>
          <p className="section-subtitle mt-1">Création et mise à jour d&apos;articles depuis le fichier Excel</p>
        </div>
        {articles.length > 0 && (
          <button
            onClick={() => { setArticles([]); setFileName(""); setSelectedEans(new Set()); setFilter("all"); setSearch(""); }}
            className="btn btn-secondary btn-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Changer de fichier
          </button>
        )}
      </div>

      {parseError && (
        <div className="mx-8 mt-4 alert alert-error justify-between">
          <span>{parseError}</span>
          <button onClick={() => setParseError("")} className="btn btn-ghost btn-sm text-lg leading-none px-2 py-0">×</button>
        </div>
      )}

      <main className="page-content">

        {/* ── Zone de drop ────────────────────────────────────────────── */}
        {articles.length === 0 && (
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className="card flex flex-col items-center justify-center gap-4 cursor-pointer select-none transition-all"
            style={{
              minHeight: 320,
              border: `2px dashed ${isDragging ? "var(--primary)" : "var(--border)"}`,
              background: isDragging ? "var(--primary-light)" : parsing ? "var(--subtle)" : "#fff",
            }}
          >
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={onFileInput} className="hidden" />
            {parsing ? (
              <>
                <span className="spinner spinner-lg" />
                <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>Lecture du fichier Excel en cours...</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: isDragging ? "var(--primary)" : "var(--primary-light)" }}>
                  <svg className="w-10 h-10" style={{ color: isDragging ? "#fff" : "var(--primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800 text-lg">
                    {isDragging ? "Déposez le fichier ici" : "Glissez le fichier MatriceOxatis ici"}
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>ou cliquez pour sélectionner · Format .xlsx</p>
                </div>
                <div className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg" style={{ background: "var(--subtle)", color: "var(--muted)" }}>
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  Seuls les articles avec état <strong className="mx-1">Actif</strong> sont importés
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Résultats ────────────────────────────────────────────────── */}
        {articles.length > 0 && (
          <>
            {/* Stats + filtres + recherche */}
            <div className="flex flex-wrap items-center gap-4 mb-5">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: "var(--subtle)", border: "1px solid var(--border)" }}>
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-gray-700">{fileName}</span>
              </div>

              <button onClick={() => setFilter("all")} className={`card px-4 py-2 text-center cursor-pointer transition-all ${filter === "all" ? "ring-2 ring-indigo-400" : ""}`} style={{ minWidth: 90 }}>
                <div className="text-xl font-bold text-gray-800">{stats.total}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>Total actifs</div>
              </button>
              <button onClick={() => setFilter("new")} className={`card px-4 py-2 text-center cursor-pointer transition-all ${filter === "new" ? "ring-2 ring-green-400" : ""}`} style={{ minWidth: 90, background: filter === "new" ? "#f0fdf4" : undefined }}>
                <div className="text-xl font-bold text-green-600">{stats.nouveaux}</div>
                <div className="text-xs text-green-600">Nouveaux</div>
              </button>
              <button onClick={() => setFilter("existing")} className={`card px-4 py-2 text-center cursor-pointer transition-all ${filter === "existing" ? "ring-2 ring-indigo-400" : ""}`} style={{ minWidth: 90, background: filter === "existing" ? "var(--primary-light)" : undefined }}>
                <div className="text-xl font-bold" style={{ color: "var(--primary)" }}>{stats.existants}</div>
                <div className="text-xs" style={{ color: "var(--primary)" }}>Sur le site</div>
              </button>

              <div className="flex-1 min-w-[200px] max-w-sm">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par nom, SKU, EAN..."
                  className="input"
                />
              </div>
              <span className="text-sm" style={{ color: "var(--muted)" }}>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Catégorie par défaut pour nouveaux articles */}
            {stats.nouveaux > 0 && (
              <div className="card px-4 py-3 mb-4 flex flex-wrap items-center gap-3" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-sm font-medium text-green-800">Catégorie par défaut (nouveaux articles) :</span>
                {defaultCategory ? (
                  <div className="flex items-center gap-2">
                    <span className="badge badge-green text-xs">{defaultCategory.name}</span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>OxID {defaultCategory.oxId}</span>
                    <button onClick={() => setDefaultCategoryPersisted(null)} className="text-xs text-red-500 hover:text-red-700">✕ Retirer</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {loadingTree ? (
                      <span className="text-xs" style={{ color: "var(--muted)" }}>Chargement des catégories…</span>
                    ) : categoryTree.length === 0 ? (
                      <button onClick={() => fetchCategories(appId, token)} className="btn btn-sm btn-secondary text-xs">Charger les catégories</button>
                    ) : (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="text"
                          value={catSearch}
                          onChange={(e) => setCatSearch(e.target.value)}
                          placeholder="Rechercher une catégorie…"
                          className="input text-sm"
                          style={{ maxWidth: 260 }}
                        />
                        {catSearch && filteredCats.length > 0 && (
                          <div className="absolute z-30 mt-1 bg-white rounded-lg shadow-lg border max-h-48 overflow-y-auto" style={{ minWidth: 300, border: "1px solid var(--border)" }}>
                            {filteredCats.slice(0, 20).map((c) => (
                              <button
                                key={c.oxId}
                                onClick={() => { setDefaultCategoryPersisted(c); setCatSearch(""); }}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50"
                              >
                                <span className="font-medium text-gray-800">{c.name}</span>
                                <span className="ml-2 text-gray-400">{c.path}</span>
                                <span className="ml-2 font-mono text-gray-400">#{c.oxId}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <span className="text-xs text-green-700">Aucune sélection = pas de catégorie assignée</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tableau */}
            <div className="table-wrapper" style={{ maxHeight: "62vh", overflowY: "auto", overflowX: "auto" }}>
              <table className="data-table" style={{ tableLayout: "fixed", width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={filtered.length > 0 && selectedEans.size === filtered.length}
                        ref={(el) => { if (el) el.indeterminate = selectedEans.size > 0 && selectedEans.size < filtered.length; }}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                    </th>
                    <th style={{ width: 80 }}>État</th>
                    <th style={{ width: 72 }}>SKU</th>
                    <th style={{ width: 100 }}>EAN</th>
                    <th>Nom</th>
                    <th style={{ width: 80, textAlign: "right" }}>Prix TTC</th>
                    <th style={{ width: 90, textAlign: "center" }}>Date dispo</th>
                    <th style={{ width: 44, textAlign: "center" }}>Aperçu</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr
                      key={a.ean}
                      style={{ background: selectedEans.has(a.ean) ? "var(--primary-light)" : undefined, cursor: "pointer" }}
                      onClick={() => toggleSelect(a.ean)}
                    >
                      <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedEans.has(a.ean)}
                          onChange={() => toggleSelect(a.ean)}
                          className="w-4 h-4 accent-indigo-600 cursor-pointer"
                        />
                      </td>
                      <td>
                        {a.isNew
                          ? <span className="badge badge-green text-[10px]">Nouveau</span>
                          : <span className="badge badge-indigo text-[10px]">Sur le site</span>}
                      </td>
                      <td className="font-mono text-xs text-gray-600">{a.itemSKU}</td>
                      <td className="font-mono text-xs text-gray-500">{a.ean}</td>
                      <td>
                        <span className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">{a.nom}</span>
                      </td>
                      <td className="text-right">
                        <span className="text-sm font-semibold text-gray-700">{a.prixTTC.toFixed(2)} €</span>
                        <span className="block text-xs" style={{ color: "var(--muted)" }}>TVA {a.tva}%</span>
                      </td>
                      <td className="text-center text-xs" style={{ color: a.dateDispo ? "#c2410c" : "var(--muted)" }}>
                        {formatDate(a.dateDispo)}
                      </td>
                      <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setPreview(a)}
                          className="btn btn-ghost btn-sm"
                          title="Aperçu de la description"
                          style={{ padding: "0.25rem" }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Barre d'actions flottante */}
            {selectedEans.size > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl">
                <span className="text-sm font-medium">
                  {selectedEans.size} article{selectedEans.size > 1 ? "s" : ""} sélectionné{selectedEans.size > 1 ? "s" : ""}
                </span>
                <div className="w-px h-5 bg-gray-600" />
                {selectedNew.length > 0 && (
                  <button
                    onClick={startCreate}
                    disabled={!hasCredentials || verifying}
                    className="btn btn-sm"
                    style={{ background: "#16a34a", color: "#fff", borderColor: "#16a34a" }}
                    title={!hasCredentials ? "Identifiants API requis" : undefined}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Créer {selectedNew.length} nouveau{selectedNew.length > 1 ? "x" : ""}
                  </button>
                )}
                {selectedExisting.length > 0 && (
                  <button
                    onClick={() => setUpdateModalOpen(true)}
                    disabled={!hasCredentials}
                    className="btn btn-primary btn-sm"
                    title={!hasCredentials ? "Identifiants API requis" : undefined}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                    </svg>
                    Mettre à jour {selectedExisting.length} existant{selectedExisting.length > 1 ? "s" : ""}
                  </button>
                )}
                <button onClick={() => setSelectedEans(new Set())} className="btn btn-ghost btn-sm text-gray-400 hover:text-white">
                  Désélectionner
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Modal aperçu description ─────────────────────────────────── */}
        {preview && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-3xl max-h-[90vh] flex flex-col" style={{ borderRadius: "1rem" }}>
              {/* Header */}
              <div className="px-6 py-4 flex items-start justify-between flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    {preview.isNew
                      ? <span className="badge badge-green text-xs">Nouveau</span>
                      : <span className="badge badge-indigo text-xs">Sur le site</span>}
                    <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>SKU {preview.itemSKU} · EAN {preview.ean}</span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900 leading-snug">{preview.nom}</h2>
                </div>
                <button onClick={() => setPreview(null)} className="btn btn-ghost btn-sm text-2xl font-light" style={{ padding: "0.25rem 0.5rem" }}>×</button>
              </div>

              {/* Infos rapides */}
              <div className="px-6 py-3 flex-shrink-0 flex flex-wrap gap-4 text-sm" style={{ borderBottom: "1px solid var(--border)", background: "var(--subtle)" }}>
                <div>
                  <span className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>Prix TTC</span>
                  <p className="font-semibold text-gray-800">{preview.prixTTC.toFixed(2)} € <span className="font-normal text-xs" style={{ color: "var(--muted)" }}>TVA {preview.tva}%</span></p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>Date de dispo</span>
                  <p className="font-semibold" style={{ color: preview.dateDispo ? "#c2410c" : "var(--muted)" }}>{formatDate(preview.dateDispo)}</p>
                </div>
                {preview.categories.length > 0 && (
                  <div>
                    <span className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>Catégories</span>
                    <p className="text-gray-700">{preview.categories.join(" · ")}</p>
                  </div>
                )}
                {preview.metaTitle && (
                  <div>
                    <span className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>Meta title</span>
                    <p className="text-gray-700 text-xs">{preview.metaTitle}</p>
                  </div>
                )}
              </div>

              {/* Description longue rendue */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {preview.descriptionLongue ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Description longue</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--subtle)", color: "var(--muted)", border: "1px solid var(--border)" }}>HTML rendu</span>
                    </div>
                    <div
                      className="prose prose-sm max-w-none text-sm text-gray-700 leading-relaxed p-4 rounded-lg"
                      style={{ background: "var(--subtle)", border: "1px solid var(--border)" }}
                      dangerouslySetInnerHTML={{ __html: descHtml(preview) }}
                    />
                  </>
                ) : (
                  <p className="text-sm italic" style={{ color: "var(--muted)" }}>Aucune description longue.</p>
                )}

                {preview.description && (
                  <div className="mt-4">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Description courte</span>
                    <p className="mt-1 text-sm text-gray-700 p-3 rounded-lg" style={{ background: "var(--subtle)", border: "1px solid var(--border)" }}>{preview.description}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 flex justify-between items-center flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="flex gap-2">
                  {preview.isNew && !selectedEans.has(preview.ean) && (
                    <button
                      onClick={() => { toggleSelect(preview.ean); setPreview(null); }}
                      className="btn btn-sm"
                      style={{ background: "#16a34a", color: "#fff", borderColor: "#16a34a" }}
                    >
                      Sélectionner pour création
                    </button>
                  )}
                  {!preview.isNew && !selectedEans.has(preview.ean) && (
                    <button
                      onClick={() => { toggleSelect(preview.ean); setPreview(null); }}
                      className="btn btn-primary btn-sm"
                    >
                      Sélectionner pour mise à jour
                    </button>
                  )}
                </div>
                <button onClick={() => setPreview(null)} className="btn btn-secondary btn-sm">Fermer</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Overlay vérification ─────────────────────────────────────── */}
        {verifying && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-sm text-center px-8 py-8 flex flex-col items-center gap-4" style={{ borderRadius: "1rem" }}>
              <span className="spinner spinner-lg" />
              <div>
                <p className="font-semibold text-gray-800">Vérification en cours…</p>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                  {verifyProgress.current} / {verifyProgress.total} articles vérifiés sur Oxatis
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal conflits ────────────────────────────────────────────── */}
        {conflictModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-3xl max-h-[90vh] flex flex-col" style={{ borderRadius: "1rem" }}>
              {/* Header */}
              <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <h2 className="section-title">{conflicts.length} article{conflicts.length > 1 ? "s" : ""} déjà présent{conflicts.length > 1 ? "s" : ""} sur Oxatis</h2>
                </div>
                <p className="section-subtitle">
                  Ces articles existent déjà sur le site. Comparez les données matrice et Oxatis, puis choisissez comment procéder.
                  {pendingNew.length > 0 && ` ${pendingNew.length} article${pendingNew.length > 1 ? "s" : ""} vraiment nouveau${pendingNew.length > 1 ? "x" : ""} sera créé dans tous les cas.`}
                </p>
              </div>

              {/* Conflict list */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {conflicts.map((c, idx) => {
                  const descMatrice = c.matrice.descriptionLongue.replace("<!--#WYSIWYG#-->", "").replace(/<[^>]+>/g, " ").trim().slice(0, 140);
                  const descOxatis = c.oxatis.descriptionLong.replace("<!--#WYSIWYG#-->", "").replace(/<[^>]+>/g, " ").trim().slice(0, 140);
                  const dateDiff = c.matrice.dateDispo !== c.oxatis.dateOfAvailability;
                  const descDiff = descMatrice.slice(0, 80) !== descOxatis.slice(0, 80);
                  const nameDiff = c.oxatis.name && c.oxatis.name !== c.matrice.nom;
                  return (
                    <div key={idx} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                      <div className="px-4 py-2 flex items-center gap-3" style={{ background: "var(--subtle)", borderBottom: "1px solid var(--border)" }}>
                        <span className="font-mono text-xs text-gray-500">{c.matrice.itemSKU}</span>
                        <span className="text-sm font-semibold text-gray-800 flex-1">{c.matrice.nom}</span>
                        {c.oxatis.oxatisId && <span className="text-xs" style={{ color: "var(--muted)" }}>OxID {c.oxatis.oxatisId}</span>}
                      </div>
                      <div className="grid grid-cols-2" style={{ borderTop: "1px solid var(--border)" }}>
                        {/* Matrice */}
                        <div className="px-4 py-3 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--primary)" }}>Matrice Excel</p>
                          {nameDiff && <p className="text-xs text-gray-700"><span className="font-medium">Nom :</span> {c.matrice.nom}</p>}
                          <p className="text-xs" style={{ color: dateDiff ? "#c2410c" : "var(--muted)" }}>
                            <span className="font-medium text-gray-700">Date dispo : </span>{formatDate(c.matrice.dateDispo) || "—"}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                            <span className="font-medium text-gray-700">Description : </span>
                            <span style={{ color: descDiff ? "#1e40af" : undefined }}>{descMatrice || "—"}</span>
                          </p>
                        </div>
                        {/* Oxatis */}
                        <div className="px-4 py-3 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sur Oxatis</p>
                          {nameDiff && <p className="text-xs text-gray-700"><span className="font-medium">Nom :</span> {c.oxatis.name}</p>}
                          <p className="text-xs" style={{ color: dateDiff ? "#c2410c" : "var(--muted)" }}>
                            <span className="font-medium text-gray-700">Date dispo : </span>{formatDate(c.oxatis.dateOfAvailability) || "—"}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                            <span className="font-medium text-gray-700">Description : </span>
                            <span style={{ color: descDiff ? "#1e40af" : undefined }}>{descOxatis || "—"}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer actions */}
              <div className="px-6 py-4 flex-shrink-0 flex flex-wrap gap-3 justify-end" style={{ borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={() => setConflictModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Annuler
                </button>
                {pendingNew.length > 0 && (
                  <button
                    onClick={() => { setConflictModalOpen(false); executeCreate(pendingNew); }}
                    className="btn btn-sm"
                    style={{ background: "#16a34a", color: "#fff", borderColor: "#16a34a" }}
                  >
                    Créer uniquement les {pendingNew.length} nouveau{pendingNew.length > 1 ? "x" : ""}
                  </button>
                )}
                <button
                  onClick={() => {
                    setConflictModalOpen(false);
                    // Met à jour les conflits (description + date dispo) puis crée les nouveaux
                    const conflictArticles = conflicts.map((c) => c.matrice);
                    executeUpdate(conflictArticles, updateFields).then(() => {
                      if (pendingNew.length > 0) executeCreate(pendingNew);
                    });
                  }}
                  className="btn btn-primary btn-sm"
                >
                  Mettre à jour les {conflicts.length} existant{conflicts.length > 1 ? "s" : ""}
                  {pendingNew.length > 0 && ` + créer les ${pendingNew.length} nouveau${pendingNew.length > 1 ? "x" : ""}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal sélection champs mise à jour ───────────────────────── */}
        {updateModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-sm" style={{ borderRadius: "1rem" }}>
              <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="section-title">Champs à mettre à jour</h2>
                <p className="section-subtitle">{selectedExisting.length} article{selectedExisting.length > 1 ? "s" : ""} existant{selectedExisting.length > 1 ? "s" : ""} sélectionné{selectedExisting.length > 1 ? "s" : ""}</p>
              </div>
              <div className="px-6 py-5 space-y-3">
                {(
                  [
                    { key: "description", label: "Description longue (HTML)", note: "Recommandé" },
                    { key: "dateDispo",   label: "Date de disponibilité",      note: "Recommandé" },
                    { key: "nom",         label: "Nom / Titre",                note: "Écrase le titre existant" },
                    { key: "prix",        label: "Prix HT + TVA",              note: "Écrase le prix existant" },
                  ] as { key: keyof UpdateFields; label: string; note: string }[]
                ).map(({ key, label, note }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={updateFields[key]}
                      onChange={(e) => setUpdateFieldsPersisted({ ...updateFields, [key]: e.target.checked })}
                      className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer flex-shrink-0"
                    />
                    <span>
                      <span className="text-sm font-medium text-gray-800">{label}</span>
                      <span className="block text-xs" style={{ color: "var(--muted)" }}>{note}</span>
                    </span>
                  </label>
                ))}
                {!Object.values(updateFields).some(Boolean) && (
                  <p className="text-xs text-amber-600 font-medium">Sélectionnez au moins un champ.</p>
                )}
              </div>
              <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: "1px solid var(--border)" }}>
                <button onClick={() => setUpdateModalOpen(false)} className="btn btn-secondary btn-sm">Annuler</button>
                <button
                  onClick={() => executeUpdate()}
                  disabled={!Object.values(updateFields).some(Boolean)}
                  className="btn btn-primary btn-sm"
                >
                  Mettre à jour {selectedExisting.length} article{selectedExisting.length > 1 ? "s" : ""}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal progression ────────────────────────────────────────── */}
        {progressModalOpen && progress && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md" style={{ borderRadius: "1rem" }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                <h2 className="section-title">{progress.label}</h2>
                <p className="section-subtitle">{progress.current} / {progress.total} articles traités</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${progress.current === progress.total ? "bg-green-500" : "bg-indigo-500"}`}
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
                {progress.errors.length > 0 && (
                  <div className="alert alert-error p-3 max-h-48 overflow-y-auto flex-col items-start gap-1">
                    <p className="text-xs font-semibold mb-1">{progress.errors.length} erreur{progress.errors.length > 1 ? "s" : ""}</p>
                    {progress.errors.map((e, i) => (
                      <p key={i} className="text-xs font-mono">{e}</p>
                    ))}
                  </div>
                )}
                {progress.current === progress.total && (
                  <p className="text-sm font-medium text-center text-green-600">
                    {progress.errors.length === 0
                      ? `✓ ${progress.total} article${progress.total > 1 ? "s" : ""} traité${progress.total > 1 ? "s" : ""} avec succès`
                      : `${progress.total - progress.errors.length} / ${progress.total} articles traités`}
                  </p>
                )}
              </div>
              {progress.current === progress.total && (
                <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: "var(--border)" }}>
                  <button onClick={closeProgress} className="btn btn-primary">Fermer</button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
