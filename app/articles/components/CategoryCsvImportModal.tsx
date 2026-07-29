"use client";

import React from "react";
import type { Article } from "@/lib/types";
import type { CategoryNode } from "@/lib/types";
import { useCategoryImport } from "@/app/articles/hooks/useCategoryImport";

interface Props {
  open: boolean;
  onClose: () => void;
  articles: Article[];
  categoryTree: CategoryNode[];
}

function readWithEncoding(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const text = r.result as string;
      if (text.includes("�")) {
        const r2 = new FileReader();
        r2.onload = () => resolve(r2.result as string);
        r2.onerror = () => reject(new Error("Erreur lecture fichier"));
        r2.readAsText(file, "iso-8859-1");
      } else {
        resolve(text);
      }
    };
    r.onerror = () => reject(new Error("Erreur lecture fichier"));
    r.readAsText(file, "utf-8");
  });
}

function downloadTemplate() {
  const header = [
    "itemSKU",
    "catOxId1",
    "catOxId2",
    "catOxId3",
    "catOxId4",
    "catOxId5",
    "catOxId6",
    "catOxId7",
    "catOxId8",
    "catOxId9",
    "catOxId10",
  ].join(";");
  const blob = new Blob(["﻿" + header + "\n"], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template_categories.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function CategoryCsvImportModal({ open, onClose, articles, categoryTree }: Props) {
  const { csvRows, parseText, importing, progress, executeImport, reset } = useCategoryImport(
    articles,
    categoryTree
  );

  if (!open) return null;

  const found = csvRows.filter((r) => r.found).length;
  const notFound = csvRows.filter((r) => !r.found).length;
  const done = progress?.current === progress?.total && progress !== null;

  const handleFile = async (file: File) => {
    const text = await readWithEncoding(file);
    parseText(text);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="card w-full max-w-2xl max-h-[85vh] flex flex-col"
        style={{ borderRadius: "1rem" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2 className="section-title">Import CSV — Catégories</h2>
            <p className="section-subtitle">
              Remplace les catégories de chaque article selon le fichier CSV
            </p>
          </div>
          {!importing && (
            <button
              onClick={handleClose}
              className="btn btn-ghost btn-sm text-2xl font-light"
              style={{ padding: "0.25rem 0.5rem" }}
            >
              ×
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Format info */}
          {csvRows.length === 0 && (
            <div
              className="rounded-lg p-3 text-sm space-y-1"
              style={{ background: "var(--subtle)", border: "1px solid var(--border)" }}
            >
              <p className="font-semibold text-gray-700">Format attendu (séparateur&nbsp;: point-virgule)</p>
              <p className="font-mono text-xs text-gray-500">
                itemSKU;catOxId1;catOxId2;...;catOxId10
              </p>
              <p className="text-xs text-gray-500">
                Les OxIDs des catégories sont visibles dans l&apos;onglet Catégories de chaque
                article (ex&nbsp;: <span className="font-mono">#1234</span>). Les colonnes vides
                vident le slot correspondant.
              </p>
              <button onClick={downloadTemplate} className="btn btn-ghost btn-sm text-xs mt-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Télécharger le modèle CSV
              </button>
            </div>
          )}

          {/* Drop zone */}
          {csvRows.length === 0 && !importing && (
            <label className="block cursor-pointer">
              <div
                className="rounded-lg p-8 text-center transition-colors"
                style={{ border: "2px dashed var(--border)" }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
              >
                <svg
                  className="w-8 h-8 mx-auto mb-2"
                  style={{ color: "var(--muted)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="font-medium text-gray-700">Déposer ou cliquer pour choisir</p>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  Fichier .csv — UTF-8 ou ISO-8859-1
                </p>
              </div>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
            </label>
          )}

          {/* Preview */}
          {csvRows.length > 0 && !progress && (
            <>
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className="badge badge-green">{found} articles trouvés</span>
                {notFound > 0 && (
                  <span className="badge badge-amber">{notFound} SKU non trouvés</span>
                )}
                <button
                  onClick={reset}
                  className="btn btn-ghost btn-sm text-xs ml-auto"
                  style={{ color: "var(--muted)" }}
                >
                  Changer de fichier
                </button>
              </div>

              <div
                className="table-wrapper"
                style={{ maxHeight: "40vh", overflowY: "auto" }}
              >
                <table className="data-table text-xs">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Statut</th>
                      <th>Catégories à appliquer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.map((row, i) => (
                      <tr key={i}>
                        <td className="font-mono">{row.itemSKU}</td>
                        <td>
                          {row.found ? (
                            <span className="badge badge-green text-[10px]">Trouvé</span>
                          ) : (
                            <span className="badge badge-amber text-[10px]">SKU inconnu</span>
                          )}
                        </td>
                        <td>
                          {row.categories.length === 0 ? (
                            <span style={{ color: "var(--muted)" }}>Tout vider</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {row.categories.map((c) => (
                                <span key={c.oxId} className="badge badge-purple text-[10px]">
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Progress */}
          {progress && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  {done ? "Terminé !" : "Application en cours..."}
                </span>
                <span style={{ color: "var(--muted)" }}>
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${done ? "bg-green-500" : "bg-indigo-500"}`}
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              {progress.errors.length > 0 && (
                <div className="alert alert-error p-3 max-h-32 overflow-y-auto flex-col items-start gap-1">
                  <p className="text-xs font-semibold mb-1">
                    {progress.errors.length} erreur{progress.errors.length > 1 ? "s" : ""}
                  </p>
                  {progress.errors.map((e, i) => (
                    <p key={i} className="text-xs font-mono">
                      {e}
                    </p>
                  ))}
                </div>
              )}
              {done && (
                <p className="text-sm text-green-600 font-medium text-center">
                  {progress.errors.length === 0
                    ? `✓ ${progress.total} article${progress.total > 1 ? "s" : ""} mis à jour`
                    : `${progress.total - progress.errors.length} / ${progress.total} articles mis à jour`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex-shrink-0 flex items-center justify-end gap-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {done ? (
            <button onClick={handleClose} className="btn btn-primary">
              Fermer
            </button>
          ) : csvRows.length > 0 && !importing ? (
            <>
              <button onClick={handleClose} className="btn btn-secondary">
                Annuler
              </button>
              <button
                onClick={() => executeImport()}
                disabled={found === 0}
                className="btn btn-primary"
              >
                Appliquer sur {found} article{found !== 1 ? "s" : ""}
              </button>
            </>
          ) : !importing ? (
            <button onClick={handleClose} className="btn btn-secondary">
              Fermer
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
