"use client";

import { useState, useCallback } from "react";
import type { MatriceArticle } from "@/app/matrice/types";
import { str } from "@/app/matrice/types";

export { str };

export function rowToMatriceArticle(
  row: Record<string, unknown>,
  oxatisId: string | null,
  isNew: boolean
): MatriceArticle | null {
  const ean = str(row["Code EAN"]);
  if (!ean) return null;

  let dateDispo = "";
  const rawDate = row["Date de disponibilité"];
  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    dateDispo = rawDate.toISOString().slice(0, 10);
  } else if (typeof rawDate === "string" && rawDate.trim()) {
    dateDispo = rawDate.trim().slice(0, 10);
  }

  const descLong = str(row["Description détaillée"]);
  const descLongFinal =
    descLong && !descLong.startsWith("<!--#WYSIWYG#-->")
      ? "<!--#WYSIWYG#-->" + descLong
      : descLong;

  return {
    ean,
    itemSKU: str(row["Code produit"]),
    langue: str(row["Langue de présentation"]).toLowerCase() || "fr",
    nom: str(row["Nom"]),
    prixTTC: Number(row["Prix 1 TTC"]) || 0,
    tva: Number(row["Taux de TVA (en valeur)"]) || 20,
    categories: [
      row["Nom de la première catégorie"],
      row["Nom de la deuxième catégorie"],
      row["Nom de la troisième catégorie"],
      row["Nom de la quatrième catégorie"],
      row["Nom de la 5ème catégorie"],
    ]
      .filter(Boolean)
      .map(String),
    description: str(row["Description"]),
    descriptionLongue: descLongFinal,
    metaTitle: str(row["Titre de page (Balise <TITLE>)"]),
    metaDescription: str(row["Description (META description)"]),
    urlCanonique: str(row["Contenu de l'URL canonique"]),
    afficherStock: str(row["Afficher le niveau du stock"]),
    montrerSiIndispo: str(row["Montrer cet article même si il est indisponible"]),
    causeIndispo: str(row["Cause de l'indisponibilité"]),
    imageZoom1: str(row["1ère image zoom"]),
    imageMain: str(row["Image principale"]),
    imageVignette: str(row["Petite image (vignette)"]),
    dateDispo,
    afficherDelai: str(row["Afficher le délai de disponibilité"]),
    isNew,
    oxatisId,
  };
}

export function useMatriceFile(onFileParsed?: (appId: string, token: string) => void) {
  const [articles, setArticles] = useState<MatriceArticle[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const parseFile = useCallback(
    async (file: File, appId: string, token: string, hasCredentials: boolean) => {
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        setParseError("Fichier non reconnu. Veuillez importer un fichier Excel (.xlsx).");
        return;
      }
      setParsing(true);
      setParseError("");
      setArticles([]);

      try {
        const XLSX = await import("xlsx");
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array", cellDates: true });

        const aSheet = wb.Sheets["Articles"];
        if (!aSheet) throw new Error("Feuille 'Articles' introuvable dans le fichier.");
        const aRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(aSheet, { defval: null });

        const articleMap = new Map<string, { oxatisId: string | null }>();
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
              oxatisId:
                oxId != null &&
                String(oxId).trim() !== "" &&
                String(oxId) !== "0"
                  ? String(Math.round(Number(oxId)))
                  : null,
            });
          }
        }

        const mSheet = wb.Sheets["Matrice"];
        if (!mSheet) throw new Error("Feuille 'Matrice' introuvable dans le fichier.");
        const mRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(mSheet, { defval: null });

        const parsed: MatriceArticle[] = [];
        for (const row of mRows) {
          const ean = str(row["Code EAN"]);
          if (!ean || !articleMap.has(ean)) continue;
          const info = articleMap.get(ean)!;
          const article = rowToMatriceArticle(row, info.oxatisId, !info.oxatisId);
          if (article) parsed.push(article);
        }

        setArticles(parsed);
        setFileName(file.name);
        if (hasCredentials && onFileParsed) onFileParsed(appId, token);
      } catch (err) {
        setParseError(err instanceof Error ? err.message : "Erreur de parsing du fichier.");
      } finally {
        setParsing(false);
      }
    },
    [onFileParsed]
  );

  const reset = useCallback(() => {
    setArticles([]);
    setFileName("");
    setParseError("");
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent, appId: string, token: string, hasCredentials: boolean) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file, appId, token, hasCredentials);
    },
    [parseFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  return {
    articles,
    setArticles,
    parsing,
    parseError,
    setParseError,
    fileName,
    isDragging,
    parseFile,
    reset,
    onDrop,
    onDragOver,
    onDragLeave,
  };
}
