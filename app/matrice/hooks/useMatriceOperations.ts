"use client";

import { useState, useCallback, useEffect } from "react";
import type { MatriceArticle, ProgressState, UpdateFields, DefaultCategory } from "@/app/matrice/types";
import { loadDefaultCategory, loadUpdateFields, UPDATE_FIELDS_KEY, DEFAULT_CAT_KEY } from "@/app/matrice/types";
import { sleep } from "@/lib/api-helpers";

export function useMatriceOperations() {
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [updateFields, setUpdateFields] = useState<UpdateFields>({
    description: true,
    dateDispo: true,
    nom: false,
    prix: false,
  });
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState<DefaultCategory | null>(null);

  useEffect(() => {
    setDefaultCategory(loadDefaultCategory());
    setUpdateFields(loadUpdateFields());
  }, []);

  const setDefaultCategoryPersisted = useCallback((cat: DefaultCategory | null) => {
    setDefaultCategory(cat);
    if (cat) localStorage.setItem(DEFAULT_CAT_KEY, JSON.stringify(cat));
    else localStorage.removeItem(DEFAULT_CAT_KEY);
  }, []);

  const setUpdateFieldsPersisted = useCallback((fields: UpdateFields) => {
    setUpdateFields(fields);
    localStorage.setItem(UPDATE_FIELDS_KEY, JSON.stringify(fields));
  }, []);

  const closeProgress = useCallback(() => {
    setProgressModalOpen(false);
    setProgress(null);
  }, []);

  const executeCreate = useCallback(
    async (items: MatriceArticle[]) => {
      if (!items.length) return;
      setProgressModalOpen(true);
      setProgress({ current: 0, total: items.length, errors: [], label: "Création en cours..." });
      const errors: string[] = [];

      for (let i = 0; i < items.length; i++) {
        const a = items[i];
        try {
          const priceHT = a.tva > 0 ? a.prixTTC / (1 + a.tva / 100) : a.prixTTC;

          const res = await fetch("/api/oxatis/create-product", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product: {
                itemSKU: a.itemSKU,
                name: a.nom,
                priceHT: parseFloat(priceHT.toFixed(2)),
                tva: a.tva,
                ean: a.ean,
                stock: 0,
                description: a.description,
                categories: defaultCategory
                  ? [
                      {
                        oxId: defaultCategory.oxId,
                        name: defaultCategory.name,
                        parentOxId: defaultCategory.parentOxId,
                        slot: 1,
                      },
                    ]
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
            if (a.descriptionLongue) {
              const r2 = await fetch("/api/oxatis/update-description", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemSKU: a.itemSKU, descriptionLong: a.descriptionLongue }),
              });
              if (!r2.ok) {
                const d2 = await r2.json();
                errors.push(`${a.itemSKU} (description) : ${d2.error || "Erreur"}`);
              }
            }
            if (a.dateDispo) {
              const r3 = await fetch("/api/oxatis/update-availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemSKU: a.itemSKU, dateOfAvailability: a.dateDispo }),
              });
              if (!r3.ok) {
                const d3 = await r3.json();
                errors.push(`${a.itemSKU} (date dispo) : ${d3.error || "Erreur"}`);
              }
            }
            await fetch("/api/oxatis/update-visibility", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ itemSKU: a.itemSKU, visible: true }),
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
    },
    [defaultCategory]
  );

  const executeUpdate = useCallback(
    async (items: MatriceArticle[], fields: UpdateFields) => {
      if (!items.length) return;
      setUpdateModalOpen(false);
      setProgressModalOpen(true);
      setProgress({ current: 0, total: items.length, errors: [], label: "Mise à jour en cours..." });
      const errors: string[] = [];

      for (let i = 0; i < items.length; i++) {
        const a = items[i];
        try {
          if (fields.nom && a.nom) {
            const r = await fetch("/api/oxatis/update-name", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ itemSKU: a.itemSKU, name: a.nom }),
            });
            if (!r.ok) errors.push(`${a.itemSKU} (nom) : ${(await r.json()).error || "Erreur"}`);
          }
          if (fields.prix && a.prixTTC > 0) {
            const priceHT = a.tva > 0 ? a.prixTTC / (1 + a.tva / 100) : a.prixTTC;
            const r = await fetch("/api/oxatis/update-price", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                itemSKU: a.itemSKU,
                priceHT: parseFloat(priceHT.toFixed(2)),
                tva: a.tva,
              }),
            });
            if (!r.ok) errors.push(`${a.itemSKU} (prix) : ${(await r.json()).error || "Erreur"}`);
          }
          if (fields.description && a.descriptionLongue) {
            const r = await fetch("/api/oxatis/update-description", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ itemSKU: a.itemSKU, descriptionLong: a.descriptionLongue }),
            });
            if (!r.ok) errors.push(`${a.itemSKU} (description) : ${(await r.json()).error || "Erreur"}`);
          }
          if (fields.dateDispo) {
            const r = await fetch("/api/oxatis/update-availability", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ itemSKU: a.itemSKU, dateOfAvailability: a.dateDispo }),
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
    },
    []
  );

  return {
    progress,
    progressModalOpen,
    updateFields,
    updateModalOpen,
    setUpdateModalOpen,
    defaultCategory,
    setDefaultCategoryPersisted,
    setUpdateFieldsPersisted,
    closeProgress,
    executeCreate,
    executeUpdate,
  };
}
