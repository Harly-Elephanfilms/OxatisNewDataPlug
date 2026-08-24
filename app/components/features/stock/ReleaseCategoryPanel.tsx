"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Article, CategoryNode, StockItem } from "@/lib/types";
import type { CategoryAssignment } from "@/lib/oxatis-api";
import { detectReleaseCandidates, matchesCategory, planCategoryChange } from "@/lib/release-moves";
import {
  DEFAULT_SOURCE,
  getServerSnapshot,
  getSnapshot,
  saveConfig,
  subscribe,
} from "@/lib/release-move-config";

/** Aplatit l'arbre en options « Parent > Enfant » pour le sélecteur. */
function flattenTree(nodes: CategoryNode[], prefix = ""): { node: CategoryNode; path: string }[] {
  return nodes.flatMap((node) => {
    const path = prefix ? `${prefix} > ${node.name}` : node.name;
    return [{ node, path }, ...flattenTree(node.children, path)];
  });
}

interface ReleaseCategoryPanelProps {
  siteStock: StockItem[];
  articles: Article[];
  loadingArticles: boolean;
  onRefreshArticles: () => void;
  onArticlesChange: (updater: (prev: Article[]) => Article[]) => void;
  serverHasCredentials: boolean;
  hasCredentials: boolean;
  appId: string;
  token: string;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export default function ReleaseCategoryPanel({
  siteStock,
  articles,
  loadingArticles,
  onRefreshArticles,
  onArticlesChange,
  serverHasCredentials,
  hasCredentials,
  appId,
  token,
  onError,
  onSuccess,
}: ReleaseCategoryPanelProps) {
  const config = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { source, target } = config;

  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [ignored, setIgnored] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState("");

  const credentialsQuery = serverHasCredentials
    ? ""
    : `appId=${encodeURIComponent(appId)}&token=${encodeURIComponent(token)}`;
  const effectiveHasCredentials = serverHasCredentials || hasCredentials;

  useEffect(() => {
    if (!effectiveHasCredentials || tree.length > 0) return;
    fetch(`/api/oxatis/categories${credentialsQuery ? `?${credentialsQuery}` : ""}`)
      .then((r) => r.json())
      .then((d: { tree?: CategoryNode[] }) => { if (d.tree) setTree(d.tree); })
      .catch(() => {});
  }, [effectiveHasCredentials, tree.length, credentialsQuery]);

  const candidates = useMemo(
    () => detectReleaseCandidates(siteStock, articles, source),
    [siteStock, articles, source]
  );
  const selected = useMemo(
    () => candidates.filter((c) => !ignored.has(c.itemSKU)),
    [candidates, ignored]
  );
  const options = useMemo(() => flattenTree(tree), [tree]);

  const toggle = (itemSKU: string) => {
    setIgnored((prev) => {
      const next = new Set(prev);
      if (next.has(itemSKU)) next.delete(itemSKU);
      else next.add(itemSKU);
      return next;
    });
  };

  const applyMoves = async () => {
    if (!target) { onError("Choisissez la catégorie de destination"); return; }
    if (!effectiveHasCredentials) { onError("Identifiants API requis — onglet CONFIG"); return; }

    setApplying(true);
    const errors: string[] = [];
    let moved = 0;
    let skipped = 0;

    for (const [index, candidate] of selected.entries()) {
      setProgress(`${index + 1}/${selected.length} — ${candidate.itemSKU}`);
      try {
        const query = `oxatisId=${encodeURIComponent(candidate.oxatisId)}${credentialsQuery ? `&${credentialsQuery}` : ""}`;
        const getRes = await fetch(`/api/oxatis/product-categories?${query}`);
        const getData = await getRes.json() as { categories?: CategoryAssignment[]; error?: string };
        if (!getRes.ok || !getData.categories) throw new Error(getData.error || "Lecture des catégories impossible");

        const next = planCategoryChange(getData.categories, source, target);
        if (!next) { skipped++; continue; }

        const postRes = await fetch("/api/oxatis/product-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(serverHasCredentials ? {} : { appId, token }),
            oxatisId: candidate.oxatisId,
            categories: next,
          }),
        });
        const postData = await postRes.json() as { error?: string };
        if (!postRes.ok) throw new Error(postData.error || "Erreur mise à jour");

        moved++;
        // Le flux catalogue n'est régénéré que périodiquement : on retire la
        // catégorie source localement pour que la ligne quitte la liste.
        onArticlesChange((prev) => prev.map((a) =>
          a.itemSKU === candidate.itemSKU
            ? { ...a, categories: a.categories.filter((c) => !matchesCategory(c, source)) }
            : a
        ));
      } catch (err) {
        errors.push(`${candidate.itemSKU} : ${err instanceof Error ? err.message : "Erreur"}`);
      }
    }

    setApplying(false);
    setProgress("");
    if (errors.length > 0) onError(`${errors.length} échec(s) — ${errors.slice(0, 5).join(" · ")}`);
    if (moved > 0 || skipped > 0) {
      onSuccess(
        `${moved} article(s) déplacé(s) vers « ${target.name} »` +
        (skipped > 0 ? ` — ${skipped} déjà dans la catégorie` : "")
      );
    }
  };

  const mono = { fontFamily: "var(--font-geist-mono)" } as const;

  return (
    <div className="card" style={{ padding: "1.125rem 1.25rem", marginBottom: "1rem", borderColor: "rgba(139,92,246,0.25)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <p style={{ ...mono, fontSize: "0.6rem", color: "#a78bfa", letterSpacing: "0.12em", marginBottom: "0.25rem" }}>
            {"// SORTIES_DU_JOUR"}
          </p>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-bright)" }}>
            Changement de catégorie à la sortie
          </h2>
          <p style={{ ...mono, fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.2rem" }}>
            {siteStock.length === 0
              ? "Chargez d'abord le stock du site pour détecter les sorties."
              : loadingArticles
              ? "Analyse du catalogue..."
              : `${candidates.length} article(s) dont la date de sortie est atteinte et encore en « ${source} »`}
          </p>
        </div>
        <button onClick={onRefreshArticles} disabled={loadingArticles || siteStock.length === 0} className="btn btn-ghost btn-sm">
          {loadingArticles ? <><span className="spinner spinner-sm" /> ANALYSE...</> : "RAFRAÎCHIR"}
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.875rem" }}>
        <div style={{ flex: "1 1 200px" }}>
          <label className="label">Catégorie de départ</label>
          <input
            type="text"
            value={source}
            onChange={(e) => saveConfig({ source: e.target.value })}
            className="input"
            placeholder={DEFAULT_SOURCE}
          />
        </div>
        <div style={{ flex: "1 1 240px" }}>
          <label className="label">Catégorie de destination</label>
          <select
            className="input"
            value={target?.oxId ?? ""}
            onChange={(e) => {
              const found = options.find((o) => o.node.oxId === e.target.value);
              saveConfig({
                target: found
                  ? { oxId: found.node.oxId, name: found.node.name, parentOxId: found.node.parentOxId }
                  : null,
              });
            }}
            disabled={options.length === 0}
          >
            <option value="">
              {options.length === 0 ? "Identifiants API requis pour lister les catégories" : "— Choisir —"}
            </option>
            {options.map(({ node, path }) => (
              <option key={node.oxId} value={node.oxId}>{path}</option>
            ))}
          </select>
        </div>
      </div>

      {candidates.length > 0 && (
        <>
          <div className="table-wrapper" style={{ marginTop: "0.875rem", maxHeight: 260, overflowY: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>Réf.</th>
                  <th>Titre</th>
                  <th>Sortie</th>
                  <th>Catégories actuelles</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.itemSKU} style={ignored.has(c.itemSKU) ? { opacity: 0.4 } : undefined}>
                    <td>
                      <input
                        type="checkbox"
                        checked={!ignored.has(c.itemSKU)}
                        onChange={() => toggle(c.itemSKU)}
                        aria-label={`Déplacer ${c.itemSKU}`}
                      />
                    </td>
                    <td style={{ ...mono, fontSize: "0.7rem" }}>{c.itemSKU}</td>
                    <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</td>
                    <td style={{ ...mono, fontSize: "0.7rem", color: "var(--muted)" }}>{c.dateOfAvailability}</td>
                    <td style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{c.categories.join(" · ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.875rem", flexWrap: "wrap" }}>
            <button
              onClick={applyMoves}
              disabled={applying || selected.length === 0 || !target || !effectiveHasCredentials}
              className="btn btn-primary btn-sm"
            >
              {applying ? <><span className="spinner spinner-sm" /> {progress}</> : `DÉPLACER ${selected.length} ARTICLE(S)`}
            </button>
            <span style={{ ...mono, fontSize: "0.7rem", color: "var(--muted)" }}>
              {target ? `« ${source} » → « ${target.name} »` : "Choisissez la catégorie de destination"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
