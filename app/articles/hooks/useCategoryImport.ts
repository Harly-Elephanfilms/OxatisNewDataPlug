"use client";

import { useState, useCallback } from "react";
import type { Article } from "@/lib/types";
import type { CategoryAssignment } from "@/lib/oxatis-api";
import type { CategoryNode } from "@/lib/types";
import { sleep } from "@/lib/api-helpers";

export interface CsvCategoryRow {
  itemSKU: string;
  oxatisId: string | null;
  categories: CategoryAssignment[];
  found: boolean;
}

function flattenTree(nodes: CategoryNode[]): Map<string, CategoryNode> {
  const map = new Map<string, CategoryNode>();
  function traverse(list: CategoryNode[]) {
    for (const n of list) {
      map.set(n.oxId, n);
      traverse(n.children);
    }
  }
  traverse(nodes);
  return map;
}

export function useCategoryImport(articles: Article[], categoryTree: CategoryNode[]) {
  const [csvRows, setCsvRows] = useState<CsvCategoryRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    errors: string[];
  } | null>(null);

  const parseText = useCallback(
    (text: string) => {
      const catMap = flattenTree(categoryTree);
      const articleMap = new Map(articles.map((a) => [a.itemSKU, a.oxatisId]));

      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length === 0) return;

      // Detect and skip header row
      const firstCell = lines[0].split(";")[0].replace(/"/g, "").trim().toLowerCase();
      const startRow =
        firstCell === "itemsku" || firstCell === "sku" || firstCell === "ref" || firstCell === "réf."
          ? 1
          : 0;

      const rows: CsvCategoryRow[] = [];
      for (let i = startRow; i < lines.length; i++) {
        const cols = lines[i].split(";").map((c) => c.replace(/"/g, "").trim());
        const sku = cols[0];
        if (!sku) continue;

        const oxatisId = articleMap.get(sku) ?? null;
        const catOxIds = cols.slice(1, 11).filter(Boolean);

        const categories: CategoryAssignment[] = catOxIds.map((oxId, idx) => {
          const node = catMap.get(oxId);
          return {
            oxId,
            name: node?.name ?? oxId,
            parentOxId: node?.parentOxId ?? "0",
            slot: idx + 1,
          };
        });

        rows.push({ itemSKU: sku, oxatisId, categories, found: !!oxatisId });
      }

      setCsvRows(rows);
    },
    [articles, categoryTree]
  );

  const executeImport = useCallback(
    async (onDone?: () => void) => {
      const toProcess = csvRows.filter((r) => r.found && r.oxatisId);
      if (toProcess.length === 0) return;

      setImporting(true);
      setProgress({ current: 0, total: toProcess.length, errors: [] });
      const errors: string[] = [];

      for (let i = 0; i < toProcess.length; i++) {
        const row = toProcess[i];
        try {
          const resp = await fetch("/api/oxatis/product-categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ oxatisId: row.oxatisId, categories: row.categories }),
          });
          if (!resp.ok) {
            const data = await resp.json();
            errors.push(`${row.itemSKU}: ${data.error ?? "Erreur"}`);
          }
        } catch {
          errors.push(`${row.itemSKU}: Erreur réseau`);
        }
        setProgress({ current: i + 1, total: toProcess.length, errors: [...errors] });
        if (i + 1 < toProcess.length) await sleep(200);
      }

      setImporting(false);
      onDone?.();
    },
    [csvRows]
  );

  const reset = useCallback(() => {
    setCsvRows([]);
    setProgress(null);
    setImporting(false);
  }, []);

  return { csvRows, parseText, importing, progress, executeImport, reset };
}
