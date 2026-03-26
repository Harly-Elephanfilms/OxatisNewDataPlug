"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import type { Article, CategoryNode } from "@/lib/types";
import type { CategoryAssignment } from "@/lib/oxatis-api";
import { useCredentials } from "@/app/contexts/CredentialsContext";
import { useCategories } from "@/app/contexts/CategoriesContext";

type SortField = "oxatisId" | "title" | "price" | "quantity" | "productType" | "brand";
type SortDir = "asc" | "desc";
type ModalTab = "infos" | "categories" | "seo";

const COPIED_CATEGORIES_KEY = "oxatis_copied_categories";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function parsePrice(priceStr: string): number {
  const num = parseFloat(priceStr.replace(/[^\d.,]/g, "").replace(",", "."));
  return isNaN(num) ? 0 : num;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterAvailability, setFilterAvailability] = useState<string>("all");
  const [filterVisibility, setFilterVisibility] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [modalTab, setModalTab] = useState<ModalTab>("infos");

  // Détail produit (description longue + date de disponibilité) fetchés depuis l'API
  const [longDescription, setLongDescription] = useState<string>("");
  const [longDescriptionDraft, setLongDescriptionDraft] = useState<string>("");
  const [loadingDescription, setLoadingDescription] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const [descriptionFetched, setDescriptionFetched] = useState(false);

  const [dateOfAvailability, setDateOfAvailability] = useState<string>("");
  const [dateOfAvailabilityDraft, setDateOfAvailabilityDraft] = useState<string>("");
  const [savingAvailability, setSavingAvailability] = useState(false);

  const [visibleDraft, setVisibleDraft] = useState<boolean>(true);
  const [savingVisible, setSavingVisible] = useState(false);

  // Comportement hors stock
  const [showIfOutOfStock, setShowIfOutOfStock] = useState<boolean>(false);
  const [showIfOutOfStockDraft, setShowIfOutOfStockDraft] = useState<boolean>(false);
  const [saleIfOutOfStock, setSaleIfOutOfStock] = useState<boolean>(false);
  const [saleIfOutOfStockDraft, setSaleIfOutOfStockDraft] = useState<boolean>(false);
  const [saleIfOutOfStockScenario, setSaleIfOutOfStockScenario] = useState<number>(0);
  const [saleIfOutOfStockScenarioDraft, setSaleIfOutOfStockScenarioDraft] = useState<number>(0);
  const [savingOutOfStock, setSavingOutOfStock] = useState(false);

  // Category tree (shared via context)
  const { categoryTree, loading: loadingTree, fetchCategories } = useCategories();

  // Article categories (per-article, local)
  const [articleCategories, setArticleCategories] = useState<CategoryAssignment[]>([]);
  const [loadingArticleCats, setLoadingArticleCats] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [copyFlash, setCopyFlash] = useState(false);
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Bulk edit
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<"add" | "clear" | "visible" | "hidden" | "availability" | "delete">("add");
  const [bulkSlot, setBulkSlot] = useState(1);
  const [bulkSelectedCategory, setBulkSelectedCategory] = useState<CategoryNode | null>(null);
  const [bulkExpandedNodes, setBulkExpandedNodes] = useState<Set<string>>(new Set());
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; errors: string[] } | null>(null);
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const [bulkDate, setBulkDate] = useState("");

  // Credentials (shared via context)
  const { appId, token, hasCredentials, serverHasCredentials, credParams } = useCredentials();

  const fetchArticles = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/oxatis/fetch-articles");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur");
      setArticles(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const fetchArticleCategories = async (oxatisId: string) => {
    if (!hasCredentials) return;
    setLoadingArticleCats(true);
    try {
      const qParams = serverHasCredentials
        ? ""
        : `appId=${encodeURIComponent(appId)}&token=${encodeURIComponent(token)}&`;
      const response = await fetch(
        `/api/oxatis/product-categories?${qParams}oxatisId=${oxatisId}`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur");
      setArticleCategories(data.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement catégories article");
    } finally {
      setLoadingArticleCats(false);
    }
  };

  const saveArticleCategories = async () => {
    if (!selectedArticle || !hasCredentials) return;
    setSavingCategories(true);
    setError("");
    try {
      const response = await fetch("/api/oxatis/product-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...credParams,
          oxatisId: selectedArticle.oxatisId,
          categories: articleCategories,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur");
      setSuccess(`Catégories mises à jour pour "${selectedArticle.title}"`);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur mise à jour");
    } finally {
      setSavingCategories(false);
    }
  };

  const fetchProductDetail = async (itemSKU: string) => {
    if (!hasCredentials) return;
    setLoadingDescription(true);
    setDescriptionFetched(false);
    try {
      const qParams = serverHasCredentials
        ? ""
        : `appId=${encodeURIComponent(appId)}&token=${encodeURIComponent(token)}&`;
      const response = await fetch(`/api/oxatis/product-detail?${qParams}itemSKU=${encodeURIComponent(itemSKU)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur");
      const desc = data.descriptionLong || "";
      setLongDescription(desc);
      setLongDescriptionDraft(desc);
      const date = data.dateOfAvailability || "";
      setDateOfAvailability(date);
      setDateOfAvailabilityDraft(date);
      const show = !!data.showIfOutOfStock;
      setShowIfOutOfStock(show);
      setShowIfOutOfStockDraft(show);
      const sale = !!data.saleIfOutOfStock;
      setSaleIfOutOfStock(sale);
      setSaleIfOutOfStockDraft(sale);
      const scenario = data.saleIfOutOfStockScenario ?? 0;
      setSaleIfOutOfStockScenario(scenario);
      setSaleIfOutOfStockScenarioDraft(scenario);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement détail produit");
    } finally {
      setLoadingDescription(false);
      setDescriptionFetched(true);
    }
  };

  const saveVisible = async (newValue: boolean) => {
    if (!selectedArticle || !hasCredentials) return;
    setSavingVisible(true);
    setError("");
    try {
      const response = await fetch("/api/oxatis/update-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...credParams,
          itemSKU: selectedArticle.itemSKU,
          visible: newValue,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur");
      setVisibleDraft(newValue);
      // Mettre à jour le tableau en temps réel
      setArticles((prev) =>
        prev.map((a) => a.oxatisId === selectedArticle.oxatisId ? { ...a, visible: newValue } : a)
      );
      setSuccess(`Article "${selectedArticle.title}" ${newValue ? "rendu visible" : "masqué"} sur le site`);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur mise à jour visibilité");
      setVisibleDraft(!newValue); // rollback
    } finally {
      setSavingVisible(false);
    }
  };

  const saveAvailability = async () => {
    if (!selectedArticle || !hasCredentials) return;
    setSavingAvailability(true);
    setError("");
    try {
      const response = await fetch("/api/oxatis/update-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...credParams,
          itemSKU: selectedArticle.itemSKU,
          dateOfAvailability: dateOfAvailabilityDraft,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur");
      setDateOfAvailability(dateOfAvailabilityDraft);
      setSuccess(`Date de disponibilité mise à jour pour "${selectedArticle.title}"`);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur mise à jour disponibilité");
    } finally {
      setSavingAvailability(false);
    }
  };

  const saveOutOfStock = async () => {
    if (!selectedArticle || !hasCredentials) return;
    setSavingOutOfStock(true);
    setError("");
    try {
      const response = await fetch("/api/oxatis/update-out-of-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...credParams,
          itemSKU: selectedArticle.itemSKU,
          showIfOutOfStock: showIfOutOfStockDraft,
          saleIfOutOfStock: saleIfOutOfStockDraft,
          saleIfOutOfStockScenario: saleIfOutOfStockScenarioDraft,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur");
      setShowIfOutOfStock(showIfOutOfStockDraft);
      setSaleIfOutOfStock(saleIfOutOfStockDraft);
      setSaleIfOutOfStockScenario(saleIfOutOfStockScenarioDraft);
      setSuccess(`Comportement hors stock mis à jour pour "${selectedArticle.title}"`);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur mise à jour disponibilité");
    } finally {
      setSavingOutOfStock(false);
    }
  };

  const saveLongDescription = async () => {
    if (!selectedArticle || !hasCredentials) return;
    setSavingDescription(true);
    setError("");
    try {
      const response = await fetch("/api/oxatis/update-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...credParams,
          itemSKU: selectedArticle.itemSKU,
          descriptionLong: longDescriptionDraft,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur");
      setLongDescription(longDescriptionDraft);
      setSuccess(`Description longue mise à jour pour "${selectedArticle.title}"`);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur mise à jour description");
    } finally {
      setSavingDescription(false);
    }
  };

  const openArticleDetail = (article: Article) => {
    setSelectedArticle(article);
    setArticleCategories([]);
    setModalTab("infos");
    setConfirmingSave(false);
    setLongDescription("");
    setLongDescriptionDraft("");
    setDateOfAvailability("");
    setDateOfAvailabilityDraft("");
    setDescriptionFetched(false);
    setVisibleDraft(article.visible);
    setShowIfOutOfStock(false);
    setShowIfOutOfStockDraft(false);
    setSaleIfOutOfStock(false);
    setSaleIfOutOfStockDraft(false);
    setSaleIfOutOfStockScenario(0);
    setSaleIfOutOfStockScenarioDraft(0);
    if (hasCredentials) {
      fetchArticleCategories(article.oxatisId);
      fetchProductDetail(article.itemSKU);
      if (categoryTree.length === 0) fetchCategories(appId, token);
    }
  };

  const toggleCategory = (node: CategoryNode) => {
    const exists = articleCategories.some((c) => c.oxId === node.oxId);
    if (exists) {
      setArticleCategories(articleCategories.filter((c) => c.oxId !== node.oxId));
    } else {
      if (articleCategories.length >= 10) {
        setError("Maximum 10 catégories par article");
        return;
      }
      const usedSlots = new Set(articleCategories.map((c) => c.slot));
      let nextSlot = 1;
      while (usedSlots.has(nextSlot)) nextSlot++;
      setArticleCategories([
        ...articleCategories,
        { oxId: node.oxId, name: node.name, parentOxId: node.parentOxId, slot: nextSlot },
      ]);
    }
  };

  const toggleExpanded = (oxId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(oxId)) next.delete(oxId);
      else next.add(oxId);
      return next;
    });
  };

  const copyCategories = () => {
    try {
      localStorage.setItem(COPIED_CATEGORIES_KEY, JSON.stringify(articleCategories));
      setCopyFlash(true);
      setTimeout(() => setCopyFlash(false), 1800);
    } catch { /* ignore */ }
  };

  const pasteCategories = () => {
    try {
      const saved = localStorage.getItem(COPIED_CATEGORIES_KEY);
      if (saved) {
        const parsed: CategoryAssignment[] = JSON.parse(saved);
        setArticleCategories(parsed);
      }
    } catch { /* ignore */ }
  };

  const toggleSelectArticle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredArticles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredArticles.map((a) => a.oxatisId)));
    }
  };

  const openBulkEdit = () => {
    setBulkModalOpen(true);
    setBulkProgress(null);
    setBulkConfirming(false);
    setBulkSelectedCategory(null);
    setBulkExpandedNodes(new Set());
    if (categoryTree.length === 0 && hasCredentials) fetchCategories(appId, token);
  };

  const executeBulkUpdate = async () => {
    setBulkConfirming(false);
    const ids = Array.from(selectedIds);
    setBulkProgress({ current: 0, total: ids.length, errors: [] });
    const errors: string[] = [];
    const succeeded = new Set<string>();
    const creds = credParams;

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      try {
        let url = "/api/oxatis/update-slot";
        let body: Record<string, unknown> = {
          ...creds,
          oxatisId: id,
          slot: bulkSlot,
          category: bulkAction === "add" && bulkSelectedCategory
            ? { oxId: bulkSelectedCategory.oxId, name: bulkSelectedCategory.name, parentOxId: bulkSelectedCategory.parentOxId, slot: bulkSlot }
            : null,
        };

        if (bulkAction === "visible" || bulkAction === "hidden") {
          url = "/api/oxatis/update-visibility";
          body = { ...creds, itemSKU: id, visible: bulkAction === "visible" };
        } else if (bulkAction === "availability") {
          url = "/api/oxatis/update-availability";
          body = { ...creds, itemSKU: id, dateOfAvailability: bulkDate };
        } else if (bulkAction === "delete") {
          url = "/api/oxatis/delete-product";
          body = { ...creds, oxatisId: id };
        }

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const data = await response.json();
          errors.push(`${id}: ${data.error || "Erreur"}`);
        } else {
          succeeded.add(id);
        }
      } catch {
        errors.push(`${id}: Erreur réseau`);
      }
      setBulkProgress({ current: i + 1, total: ids.length, errors: [...errors] });
      if (i + 1 < ids.length) await sleep(200);
    }

    // Mettre à jour le tableau local pour les articles qui ont réussi
    if (succeeded.size > 0) {
      if (bulkAction === "visible" || bulkAction === "hidden") {
        const newVisible = bulkAction === "visible";
        setArticles((prev) =>
          prev.map((a) => succeeded.has(a.oxatisId) ? { ...a, visible: newVisible } : a)
        );
      } else if (bulkAction === "delete") {
        setArticles((prev) => prev.filter((a) => !succeeded.has(a.oxatisId)));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          succeeded.forEach((id) => next.delete(id));
          return next;
        });
      }
      // Pour les slots et la disponibilité, pas de champ local à mettre à jour directement
    }
  };

  const renderBulkCategoryTree = (nodes: CategoryNode[], depth: number = 0): React.ReactNode => {
    return nodes.map((node) => {
      const isSelected = bulkSelectedCategory?.oxId === node.oxId;
      const hasChildren = node.children.length > 0;
      const isExpanded = bulkExpandedNodes.has(node.oxId);
      return (
        <div key={node.oxId}>
          <div
            className="flex items-center gap-2 py-1.5 rounded-md transition-colors cursor-pointer"
            style={{
              paddingLeft: `${depth * 16 + 8}px`,
              paddingRight: "8px",
              background: isSelected ? "var(--primary-light)" : undefined,
            }}
            onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--subtle)"; }}
            onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = ""; }}
            onClick={() => setBulkSelectedCategory(node)}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setBulkExpandedNodes((prev) => {
                    const next = new Set(prev);
                    if (next.has(node.oxId)) next.delete(node.oxId);
                    else next.add(node.oxId);
                    return next;
                  });
                }}
                className="w-5 h-5 flex items-center justify-center flex-shrink-0"
                style={{ color: "var(--muted)" }}
              >
                <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <span className="w-5 flex-shrink-0" />
            )}
            <div
              className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
              style={{ borderColor: isSelected ? "var(--primary)" : "var(--border)", background: isSelected ? "var(--primary)" : "#fff" }}
            >
              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <span className="text-sm select-none" style={{ fontWeight: isSelected ? 500 : 400, color: isSelected ? "#3730a3" : "#374151" }}>
              {node.name}
            </span>
          </div>
          {hasChildren && isExpanded && (
            <div style={{ borderLeft: "2px solid var(--border)", marginLeft: `${depth * 16 + 20}px` }}>
              <div style={{ marginLeft: "-2px" }}>
                {renderBulkCategoryTree(node.children, depth + 1)}
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  // Unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const a of articles) {
      if (a.productType) {
        for (const catPath of a.productType.split("|")) {
          const root = catPath.trim().split(">")[0].trim();
          if (root) cats.add(root);
        }
      }
    }
    return Array.from(cats).sort();
  }, [articles]);

  // Unique brands for filter
  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const a of articles) {
      if (a.brand) set.add(a.brand);
    }
    return Array.from(set).sort();
  }, [articles]);

  // Stats
  const stats = useMemo(() => {
    const inStock = articles.filter((a) => a.availability === "in stock").length;
    const outOfStock = articles.filter((a) => a.availability !== "in stock").length;
    const hidden = articles.filter((a) => !a.visible).length;
    const totalValue = articles.reduce((sum, a) => sum + parsePrice(a.price) * Math.max(0, a.quantity), 0);
    return { total: articles.length, inStock, outOfStock, hidden, totalValue };
  }, [articles]);

  // Filtered and sorted
  const filteredArticles = useMemo(() => {
    let items = [...articles];

    if (filterAvailability !== "all") {
      items = items.filter((a) =>
        filterAvailability === "in_stock"
          ? a.availability === "in stock"
          : a.availability !== "in stock"
      );
    }

    if (filterVisibility !== "all") {
      items = items.filter((a) =>
        filterVisibility === "visible" ? a.visible : !a.visible
      );
    }

    if (filterCategory === "__none__") {
      items = items.filter((a) => !a.productType || !a.productType.trim());
    } else if (filterCategory !== "all") {
      items = items.filter((a) => {
        const roots = a.productType.split("|").map((c) => c.trim().split(">")[0].trim());
        return roots.includes(filterCategory);
      });
    }

    if (filterBrand !== "all") {
      items = items.filter((a) => a.brand === filterBrand);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(
        (a) =>
          a.title.toLowerCase().includes(term) ||
          a.oxatisId.includes(term) ||
          a.itemSKU.toLowerCase().includes(term) ||
          a.ean.includes(term) ||
          a.brand.toLowerCase().includes(term) ||
          a.productType.toLowerCase().includes(term)
      );
    }

    items.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      if (sortField === "price") {
        valA = parsePrice(a.price);
        valB = parsePrice(b.price);
      } else if (sortField === "quantity") {
        valA = a.quantity;
        valB = b.quantity;
      } else {
        valA = (a[sortField] as string).toLowerCase();
        valB = (b[sortField] as string).toLowerCase();
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return items;
  }, [articles, filterAvailability, filterVisibility, filterCategory, filterBrand, searchTerm, sortField, sortDir]);

  const exportCsv = () => {
    setExportSuccess(false);
    const headers = ["ID", "SKU", "Titre", "Marque", "EAN", "Prix HT", "Prix TTC", "Stock", "Disponibilité", "Catégorie", "Visible", "Poids"];
    const rows = filteredArticles.map((a) => [
      a.oxatisId,
      a.itemSKU,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.brand.replace(/"/g, '""')}"`,
      a.ean,
      a.priceHT,
      a.price.replace(" EUR", ""),
      String(a.quantity),
      a.availability === "in stock" ? "En stock" : "Rupture",
      `"${a.productType.replace(/"/g, '""')}"`,
      a.visible ? "Oui" : "Non",
      a.shippingWeight,
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `articles_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2000);
  };

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir(sortDir === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDir(field === "quantity" || field === "price" ? "desc" : "asc");
      }
    },
    [sortField, sortDir]
  );

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  };

  const parseDescription = (html: string) => {
    const fields: Record<string, string> = {};
    const lines = stripHtml(html).split(/\s*-\s+/);
    for (const line of lines) {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0 && colonIdx < 30) {
        const key = line.substring(0, colonIdx).trim();
        const val = line.substring(colonIdx + 1).trim();
        if (key && val) fields[key] = val;
      }
    }
    return fields;
  };

  const renderCategoryTree = (nodes: CategoryNode[], depth: number = 0) => {
    return nodes.map((node) => {
      const isAssigned = articleCategories.some((c) => c.oxId === node.oxId);
      const hasChildren = node.children.length > 0;
      const isExpanded = expandedNodes.has(node.oxId);

      return (
        <div key={node.oxId}>
          <div
            className="flex items-center gap-2 py-1.5 rounded-md transition-colors cursor-pointer"
            style={{
              paddingLeft: `${depth * 16 + 8}px`,
              paddingRight: "8px",
              background: isAssigned ? "var(--primary-light)" : undefined,
            }}
            onMouseEnter={(e) => { if (!isAssigned) (e.currentTarget as HTMLElement).style.background = "var(--subtle)"; }}
            onMouseLeave={(e) => { if (!isAssigned) (e.currentTarget as HTMLElement).style.background = ""; }}
          >
            {hasChildren ? (
              <button
                onClick={(e) => { e.stopPropagation(); toggleExpanded(node.oxId); }}
                className="w-5 h-5 flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ color: "var(--muted)" }}
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <span className="w-5 flex-shrink-0" />
            )}
            <button
              onClick={() => toggleCategory(node)}
              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors"
              style={{
                border: `2px solid ${isAssigned ? "var(--primary)" : "var(--border)"}`,
                background: isAssigned ? "var(--primary)" : "#fff",
                color: "#fff",
              }}
            >
              {isAssigned && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span
              className="text-sm select-none flex-1"
              style={{ fontWeight: isAssigned ? 500 : 400, color: isAssigned ? "#3730a3" : "#374151", cursor: "pointer" }}
              onClick={() => toggleCategory(node)}
            >
              {node.name}
            </span>
          </div>
          {hasChildren && isExpanded && (
            <div style={{ borderLeft: "2px solid var(--border)", marginLeft: `${depth * 16 + 20}px` }}>
              <div style={{ marginLeft: "-2px" }}>
                {renderCategoryTree(node.children, depth + 1)}
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  // Computed margin for selected article
  const margin = useMemo(() => {
    if (!selectedArticle) return null;
    const ht = parseFloat(selectedArticle.priceHT);
    const cost = parseFloat(selectedArticle.cost);
    if (!ht || !cost || ht <= 0) return null;
    const pct = ((ht - cost) / ht) * 100;
    const abs = ht - cost;
    return { pct, abs };
  }, [selectedArticle]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Gestion des articles</h1>
          <p className="section-subtitle mt-1">Catalogue produits Elephant Films</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mx-8 mt-4 alert alert-error justify-between items-start">
          <span className="whitespace-pre-wrap flex-1">{error}</span>
          <button onClick={() => setError("")} className="btn btn-ghost btn-sm ml-2 text-lg leading-none px-2 py-0">×</button>
        </div>
      )}
      {success && (
        <div className="mx-8 mt-4 alert alert-success justify-between items-center">
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess("")} className="btn btn-ghost btn-sm ml-2 text-lg leading-none px-2 py-0">×</button>
        </div>
      )}

      <main className="page-content">
        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="card p-8 max-w-sm w-full text-center">
              <span className="spinner spinner-lg mx-auto mb-4 block"></span>
              <p className="text-gray-700">Chargement des articles depuis elephantfilms.com...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {articles.length === 0 && !loading && (
          <div className="max-w-lg mx-auto text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <h2 className="section-title mb-2">Catalogue produits</h2>
            <p className="section-subtitle mb-6">Chargez le catalogue depuis le CSV Oxatis du site.</p>
            <button onClick={fetchArticles} className="btn btn-primary btn-lg">
              Charger les articles
            </button>
          </div>
        )}

        {articles.length > 0 && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                <div className="text-xs text-gray-500 mt-0.5">Articles total</div>
              </div>
              <div className="card p-4 text-center" style={{ background: "var(--success-light)", borderColor: "#bbf7d0" }}>
                <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
                <div className="text-xs text-green-600 mt-0.5">En stock</div>
              </div>
              <div className="card p-4 text-center" style={{ background: "var(--danger-light)", borderColor: "#fca5a5" }}>
                <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
                <div className="text-xs text-red-600 mt-0.5">Rupture</div>
              </div>
              <div
                className="card p-4 text-center cursor-pointer transition-all"
                style={{ background: "#fef3c7", borderColor: "#fcd34d" }}
                onClick={() => setFilterVisibility(filterVisibility === "hidden" ? "all" : "hidden")}
                title="Cliquer pour filtrer les articles masqués"
              >
                <div className="text-2xl font-bold text-amber-600">{stats.hidden}</div>
                <div className="text-xs text-amber-600 mt-0.5">
                  Masqués {filterVisibility === "hidden" && <span className="ml-1 font-bold">●</span>}
                </div>
              </div>
              <div className="card p-4 text-center" style={{ background: "var(--primary-light)", borderColor: "#c7d2fe" }}>
                <div className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
                  {stats.totalValue.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--primary)" }}>Valeur du stock</div>
              </div>
            </div>

            {/* Filters bar */}
            <div className="card p-4 mb-5">
              <div className="flex flex-wrap gap-3 items-center">
                <button onClick={fetchArticles} disabled={loading} className="btn btn-primary">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                  Rafraîchir
                </button>

                <button
                  onClick={exportCsv}
                  className="btn btn-secondary"
                  style={exportSuccess ? { borderColor: "#bbf7d0", background: "var(--success-light)", color: "#15803d" } : {}}
                >
                  {exportSuccess ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Exporté !
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Exporter CSV
                    </>
                  )}
                </button>

                {/* Search */}
                <div className="flex-1 min-w-[200px] max-w-sm">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nom, ID, SKU, EAN, marque..."
                    className="input"
                  />
                </div>

                {/* Availability filter */}
                <select
                  value={filterAvailability}
                  onChange={(e) => setFilterAvailability(e.target.value)}
                  className="input"
                  style={{ width: "auto" }}
                >
                  <option value="all">Tous ({stats.total})</option>
                  <option value="in_stock">En stock ({stats.inStock})</option>
                  <option value="out_of_stock">Rupture ({stats.outOfStock})</option>
                </select>

                {/* Visibility filter */}
                <select
                  value={filterVisibility}
                  onChange={(e) => setFilterVisibility(e.target.value)}
                  className="input"
                  style={{
                    width: "auto",
                    borderColor: filterVisibility !== "all" ? "var(--warning)" : undefined,
                    boxShadow: filterVisibility !== "all" ? "0 0 0 3px rgba(245,158,11,0.15)" : undefined,
                  }}
                >
                  <option value="all">Visibilité : tous</option>
                  <option value="visible">Visibles ({stats.total - stats.hidden})</option>
                  <option value="hidden">Masqués ({stats.hidden})</option>
                </select>

                {/* Category filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="input"
                  style={{
                    width: "auto",
                    borderColor: filterCategory === "__none__" ? "var(--warning)" : undefined,
                    boxShadow: filterCategory === "__none__" ? "0 0 0 3px rgba(245,158,11,0.15)" : undefined,
                  }}
                >
                  <option value="all">Toutes les catégories</option>
                  <option value="__none__">Sans catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Brand filter */}
                {brands.length > 0 && (
                  <select
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    className="input"
                    style={{ width: "auto" }}
                  >
                    <option value="all">Toutes les marques</option>
                    {brands.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                )}

                <span className="text-sm" style={{ color: "var(--muted)" }}>{filteredArticles.length} résultat{filteredArticles.length !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Table */}
            <div className="table-wrapper" style={{ maxHeight: "70vh", overflowY: "auto", overflowX: "auto" }}>
              <table className="data-table" style={{ tableLayout: "fixed", width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={filteredArticles.length > 0 && selectedIds.size === filteredArticles.length}
                        ref={(el) => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < filteredArticles.length; }}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                    </th>
                    <th style={{ width: 48 }}></th>
                    <th
                      style={{ width: 100 }}
                      onClick={() => handleSort("oxatisId")}
                      className="cursor-pointer select-none hover:bg-slate-100 text-xs uppercase tracking-wide whitespace-nowrap"
                    >
                      ID / SKU {sortField === "oxatisId" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                    </th>
                    <th
                      onClick={() => handleSort("title")}
                      className="cursor-pointer select-none hover:bg-slate-100 text-xs uppercase tracking-wide whitespace-nowrap"
                    >
                      Nom {sortField === "title" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                    </th>
                    <th
                      style={{ width: 130 }}
                      onClick={() => handleSort("brand")}
                      className="cursor-pointer select-none hover:bg-slate-100 text-xs uppercase tracking-wide whitespace-nowrap"
                    >
                      Marque {sortField === "brand" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                    </th>
                    <th
                      style={{ width: 180 }}
                      onClick={() => handleSort("productType")}
                      className="cursor-pointer select-none hover:bg-slate-100 text-xs uppercase tracking-wide whitespace-nowrap"
                    >
                      Catégorie {sortField === "productType" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                    </th>
                    <th
                      style={{ width: 80, textAlign: "right" }}
                      onClick={() => handleSort("price")}
                      className="cursor-pointer select-none hover:bg-slate-100 text-xs uppercase tracking-wide whitespace-nowrap"
                    >
                      Prix € {sortField === "price" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                    </th>
                    <th
                      style={{ width: 70, textAlign: "right" }}
                      onClick={() => handleSort("quantity")}
                      className="cursor-pointer select-none hover:bg-slate-100 text-xs uppercase tracking-wide whitespace-nowrap"
                    >
                      Stock {sortField === "quantity" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                    </th>
                    <th style={{ width: 70, textAlign: "center" }} className="text-xs uppercase tracking-wide whitespace-nowrap">
                      Visible
                    </th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map((article) => (
                    <tr
                      key={article.oxatisId}
                      style={
                        selectedIds.has(article.oxatisId)
                          ? { background: "var(--primary-light)" }
                          : !article.visible
                          ? { background: "#fffbeb" }
                          : article.availability !== "in stock"
                          ? { background: "var(--danger-light)" }
                          : {}
                      }
                    >
                      <td style={{ textAlign: "center", padding: "0.25rem" }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(article.oxatisId)}
                          onChange={() => toggleSelectArticle(article.oxatisId)}
                          className="w-4 h-4 accent-indigo-600 cursor-pointer"
                        />
                      </td>
                      <td style={{ padding: "0.25rem 0.375rem" }}>
                        {article.imageUrl ? (
                          <img src={article.imageUrl} alt="" className="w-9 h-9 object-contain rounded" loading="lazy" />
                        ) : (
                          <div className="w-9 h-9 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">?</div>
                        )}
                      </td>
                      <td style={{ padding: "0.25rem 0.5rem" }}>
                        <div className="font-mono text-xs" style={{ color: "var(--muted)" }}>{article.oxatisId}</div>
                        <div className="font-mono text-xs truncate" style={{ color: "var(--muted)", opacity: 0.7 }}>{article.itemSKU}</div>
                      </td>
                      <td className="truncate text-sm font-medium" style={{ padding: "0.25rem 0.5rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={article.title}>
                        {article.title}
                      </td>
                      <td style={{ padding: "0.25rem 0.5rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {article.brand ? (
                          <span className="text-xs font-medium text-gray-600">{article.brand}</span>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--muted)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "0.25rem 0.5rem", overflow: "hidden" }} title={article.productType}>
                        <div className="flex flex-col gap-0.5" style={{ overflow: "hidden" }}>
                          {article.productType
                            ? article.productType.split("|").map((cat, ci) => {
                                const parts = cat.trim().split(">");
                                const leaf = parts[parts.length - 1].trim();
                                return (
                                  <span key={ci} className="badge badge-purple text-[10px] truncate" style={{ maxWidth: "100%", display: "inline-block" }}>{leaf}</span>
                                );
                              })
                            : <span className="badge badge-amber">—</span>
                          }
                        </div>
                      </td>
                      <td className="font-mono text-sm" style={{ textAlign: "right", padding: "0.25rem 0.5rem" }}>
                        {article.price.replace(" EUR", "").replace(" €", "")}
                      </td>
                      <td style={{ textAlign: "right", padding: "0.25rem 0.5rem" }}>
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            style={{
                              width: 8, height: 8, borderRadius: "50%", display: "inline-block",
                              backgroundColor: article.availability === "in stock" ? "#15803d" : "var(--danger)",
                            }}
                            title={article.availability === "in stock" ? "En stock" : "Rupture"}
                          />
                          <span className="font-mono text-sm font-semibold" style={{ color: article.quantity > 10 ? "#15803d" : article.quantity > 0 ? "#c2410c" : "var(--danger)" }}>
                            {article.quantity}
                          </span>
                        </span>
                      </td>
                      <td style={{ textAlign: "center", padding: "0.25rem 0.5rem" }}>
                        {article.visible ? (
                          <span className="badge badge-green text-[10px]">Visible</span>
                        ) : (
                          <span className="badge badge-amber text-[10px]">Masqué</span>
                        )}
                      </td>
                      <td style={{ textAlign: "center", padding: "0.25rem" }}>
                        <button
                          onClick={() => openArticleDetail(article)}
                          className="btn btn-ghost btn-sm"
                          title="Voir le détail"
                          style={{ padding: "0.375rem" }}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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

            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl">
                <span className="text-sm font-medium">{selectedIds.size} article{selectedIds.size > 1 ? "s" : ""} sélectionné{selectedIds.size > 1 ? "s" : ""}</span>
                <div className="w-px h-5 bg-gray-600" />
                <button onClick={openBulkEdit} className="btn btn-primary btn-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                  Modifier
                </button>
                <button
                  onClick={() => { setBulkAction("delete"); openBulkEdit(); }}
                  className="btn btn-sm"
                  style={{ background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Supprimer
                </button>
                <button onClick={() => setSelectedIds(new Set())} className="btn btn-ghost btn-sm text-gray-400 hover:text-white">
                  Désélectionner
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Detail modal ───────────────────────────────────────────────── */}
        {selectedArticle && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ borderRadius: "1rem" }}>

              {/* Modal header */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-start justify-between flex-shrink-0 z-10" style={{ borderColor: "var(--border)", borderRadius: "1rem 1rem 0 0" }}>
                <div className="flex-1 mr-4">
                  <p className="text-xs font-mono mb-1" style={{ color: "var(--muted)" }}>
                    ID {selectedArticle.oxatisId} · SKU {selectedArticle.itemSKU || "—"} · EAN {selectedArticle.ean || "—"}
                  </p>
                  <h2 className="text-lg font-bold text-gray-900 leading-snug">{selectedArticle.title}</h2>
                </div>
                <button
                  onClick={() => { setSelectedArticle(null); setConfirmingSave(false); }}
                  className="btn btn-ghost btn-sm text-2xl font-light leading-none"
                  style={{ padding: "0.25rem 0.5rem" }}
                >
                  ×
                </button>
              </div>

              {/* Tab nav */}
              <div className="flex border-b flex-shrink-0" style={{ borderColor: "var(--border)", background: "var(--subtle)" }}>
                {(["infos", "categories", "seo"] as ModalTab[]).map((tab) => {
                  const labels: Record<ModalTab, string> = { infos: "Informations", categories: "Catégories", seo: "SEO & Description" };
                  const isActive = modalTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setModalTab(tab);
                        if (tab === "seo" && !descriptionFetched && selectedArticle) {
                          fetchProductDetail(selectedArticle.itemSKU);
                        }
                      }}
                      className="px-5 py-3 text-sm font-medium transition-colors relative"
                      style={{
                        color: isActive ? "var(--primary)" : "var(--muted)",
                        borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                        marginBottom: "-1px",
                        background: "none",
                        cursor: "pointer",
                      }}
                    >
                      {labels[tab]}
                      {tab === "categories" && (
                        <span className="ml-2 badge badge-indigo" style={{ fontSize: "10px", padding: "1px 5px" }}>
                          {articleCategories.length}/10
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              <div className="overflow-y-auto flex-1 p-6">

                {/* ── Onglet Informations ─────────────────────────────── */}
                {modalTab === "infos" && (
                  <div className="space-y-6">
                    <div className="flex gap-6">
                      {/* Image */}
                      {selectedArticle.imageUrl && (
                        <div className="flex-shrink-0">
                          <img
                            src={selectedArticle.imageUrl}
                            alt={selectedArticle.title}
                            className="w-40 h-auto object-contain rounded-lg border border-gray-200"
                          />
                        </div>
                      )}

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm flex-1">
                        {/* Prix */}
                        <div>
                          <span className="text-gray-400 text-xs uppercase tracking-wide">Prix de vente</span>
                          <p className="font-semibold text-gray-900 text-lg mt-0.5">
                            {selectedArticle.price.replace(" EUR", " €")} TTC
                          </p>
                          {selectedArticle.priceHT && (
                            <p className="text-sm text-gray-500">{selectedArticle.priceHT} € HT</p>
                          )}
                        </div>

                        {/* Marge */}
                        {margin ? (
                          <div>
                            <span className="text-gray-400 text-xs uppercase tracking-wide">Marge brute</span>
                            <p className="font-semibold text-lg mt-0.5" style={{ color: margin.pct >= 40 ? "#15803d" : margin.pct >= 20 ? "#c2410c" : "var(--danger)" }}>
                              {margin.pct.toFixed(1)} %
                            </p>
                            <p className="text-sm text-gray-500">
                              {margin.abs.toFixed(2)} € · Coût : {parseFloat(selectedArticle.cost).toFixed(2)} €
                            </p>
                          </div>
                        ) : (
                          selectedArticle.cost && parseFloat(selectedArticle.cost) > 0 ? (
                            <div>
                              <span className="text-gray-400 text-xs uppercase tracking-wide">Coût</span>
                              <p className="font-semibold text-gray-700 mt-0.5">{parseFloat(selectedArticle.cost).toFixed(2)} €</p>
                            </div>
                          ) : <div />
                        )}

                        {/* Stock */}
                        <div>
                          <span className="text-gray-400 text-xs uppercase tracking-wide">Stock</span>
                          <p className={`font-semibold text-lg mt-0.5 ${selectedArticle.quantity > 10 ? "text-green-600" : selectedArticle.quantity > 0 ? "text-orange-500" : "text-red-500"}`}>
                            {selectedArticle.quantity} unités
                          </p>
                          <p className="text-sm text-gray-500">
                            {selectedArticle.availability === "in stock" ? "En stock" : "Rupture de stock"}
                          </p>
                        </div>

                        {/* Visibilité — toggle */}
                        <div>
                          <span className="text-gray-400 text-xs uppercase tracking-wide">Visibilité</span>
                          <div className="flex items-center gap-3 mt-1">
                            <button
                              onClick={() => !savingVisible && saveVisible(!visibleDraft)}
                              disabled={savingVisible || !hasCredentials}
                              className="relative flex-shrink-0"
                              style={{ cursor: hasCredentials ? "pointer" : "default" }}
                              title={visibleDraft ? "Cliquer pour masquer" : "Cliquer pour rendre visible"}
                            >
                              {savingVisible ? (
                                <span className="spinner spinner-sm" />
                              ) : (
                                <span
                                  className="flex items-center"
                                  style={{
                                    width: 44, height: 24, borderRadius: 12,
                                    background: visibleDraft ? "var(--success)" : "var(--muted)",
                                    transition: "background 0.2s",
                                    position: "relative",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "0 3px",
                                  }}
                                >
                                  <span style={{
                                    width: 18, height: 18, borderRadius: "50%",
                                    background: "#fff",
                                    transform: visibleDraft ? "translateX(20px)" : "translateX(0)",
                                    transition: "transform 0.2s",
                                    display: "block",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                  }} />
                                </span>
                              )}
                            </button>
                            <span className="text-sm font-medium" style={{ color: visibleDraft ? "#15803d" : "var(--muted)" }}>
                              {visibleDraft ? "Visible sur le site" : "Masqué"}
                            </span>
                          </div>
                        </div>

                        {/* Marque */}
                        <div>
                          <span className="text-gray-400 text-xs uppercase tracking-wide">Marque</span>
                          <p className="text-gray-800 font-medium mt-0.5">{selectedArticle.brand || "—"}</p>
                        </div>

                        {/* EAN */}
                        <div>
                          <span className="text-gray-400 text-xs uppercase tracking-wide">EAN</span>
                          <p className="text-gray-700 font-mono mt-0.5">{selectedArticle.ean || "—"}</p>
                        </div>

                        {/* Poids */}
                        {selectedArticle.shippingWeight && (
                          <div>
                            <span className="text-gray-400 text-xs uppercase tracking-wide">Poids</span>
                            <p className="text-gray-700 mt-0.5">{selectedArticle.shippingWeight} kg</p>
                          </div>
                        )}

                        {/* Date de disponibilité — éditable */}
                        {hasCredentials && (
                          <div className="col-span-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-400 text-xs uppercase tracking-wide">Date de disponibilité</span>
                              {descriptionFetched && dateOfAvailabilityDraft !== dateOfAvailability && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setDateOfAvailabilityDraft(dateOfAvailability)}
                                    className="btn btn-ghost btn-sm text-xs"
                                    style={{ color: "var(--muted)" }}
                                  >
                                    Annuler
                                  </button>
                                  <button
                                    onClick={saveAvailability}
                                    disabled={savingAvailability}
                                    className="btn btn-primary btn-sm"
                                  >
                                    {savingAvailability ? (
                                      <span className="flex items-center gap-1.5">
                                        <span className="spinner spinner-sm" />
                                        ...
                                      </span>
                                    ) : "Mettre à jour"}
                                  </button>
                                </div>
                              )}
                            </div>
                            {loadingDescription ? (
                              <span className="spinner spinner-sm" />
                            ) : (
                              <div className="flex items-center gap-3">
                                <input
                                  type="date"
                                  value={dateOfAvailabilityDraft}
                                  onChange={(e) => setDateOfAvailabilityDraft(e.target.value)}
                                  className="input"
                                  style={{ width: "auto" }}
                                />
                                {dateOfAvailabilityDraft && (
                                  <button
                                    onClick={() => setDateOfAvailabilityDraft("")}
                                    className="btn btn-ghost btn-sm text-xs"
                                    style={{ color: "var(--muted)" }}
                                    title="Effacer la date"
                                  >
                                    ✕ Effacer
                                  </button>
                                )}
                                {dateOfAvailabilityDraft && new Date(dateOfAvailabilityDraft) > new Date() && (
                                  <span className="badge badge-amber text-xs">Précommande</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Condition */}
                        {selectedArticle.condition && (
                          <div>
                            <span className="text-gray-400 text-xs uppercase tracking-wide">État</span>
                            <p className="text-gray-700 mt-0.5 capitalize">{selectedArticle.condition}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Comportement hors stock */}
                    {hasCredentials && (
                      <div className="rounded-xl p-4" style={{ background: "var(--subtle)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Comportement hors stock</h3>
                          {descriptionFetched && (
                            showIfOutOfStockDraft !== showIfOutOfStock || saleIfOutOfStockDraft !== saleIfOutOfStock || saleIfOutOfStockScenarioDraft !== saleIfOutOfStockScenario
                          ) && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setShowIfOutOfStockDraft(showIfOutOfStock);
                                  setSaleIfOutOfStockDraft(saleIfOutOfStock);
                                  setSaleIfOutOfStockScenarioDraft(saleIfOutOfStockScenario);
                                }}
                                className="btn btn-ghost btn-sm text-xs"
                                style={{ color: "var(--muted)" }}
                              >
                                Annuler
                              </button>
                              <button
                                onClick={saveOutOfStock}
                                disabled={savingOutOfStock}
                                className="btn btn-primary btn-sm"
                              >
                                {savingOutOfStock ? (
                                  <span className="flex items-center gap-1.5">
                                    <span className="spinner spinner-sm" />
                                    ...
                                  </span>
                                ) : "Mettre à jour"}
                              </button>
                            </div>
                          )}
                        </div>

                        {loadingDescription ? (
                          <span className="spinner spinner-sm" />
                        ) : (
                          <div className="space-y-3">
                            {/* ShowIfOutOfStock */}
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-700">Afficher si indisponible</p>
                                <p className="text-xs text-gray-400">L&apos;article reste visible même en rupture de stock</p>
                              </div>
                              <button
                                onClick={() => setShowIfOutOfStockDraft(!showIfOutOfStockDraft)}
                                className="relative flex-shrink-0"
                                style={{ cursor: "pointer" }}
                              >
                                <span
                                  style={{
                                    width: 44, height: 24, borderRadius: 12,
                                    background: showIfOutOfStockDraft ? "var(--primary)" : "var(--muted)",
                                    transition: "background 0.2s",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "0 3px",
                                  }}
                                >
                                  <span style={{
                                    width: 18, height: 18, borderRadius: "50%",
                                    background: "#fff",
                                    transform: showIfOutOfStockDraft ? "translateX(20px)" : "translateX(0)",
                                    transition: "transform 0.2s",
                                    display: "block",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                  }} />
                                </span>
                              </button>
                            </div>

                            {/* SaleIfOutOfStock */}
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-700">Autoriser l&apos;achat si indisponible</p>
                                <p className="text-xs text-gray-400">L&apos;article peut être commandé même en rupture</p>
                              </div>
                              <button
                                onClick={() => setSaleIfOutOfStockDraft(!saleIfOutOfStockDraft)}
                                className="relative flex-shrink-0"
                                style={{ cursor: "pointer" }}
                              >
                                <span
                                  style={{
                                    width: 44, height: 24, borderRadius: 12,
                                    background: saleIfOutOfStockDraft ? "var(--primary)" : "var(--muted)",
                                    transition: "background 0.2s",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "0 3px",
                                  }}
                                >
                                  <span style={{
                                    width: 18, height: 18, borderRadius: "50%",
                                    background: "#fff",
                                    transform: saleIfOutOfStockDraft ? "translateX(20px)" : "translateX(0)",
                                    transition: "transform 0.2s",
                                    display: "block",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                  }} />
                                </span>
                              </button>
                            </div>

                            {/* SaleIfOutOfStockScenario */}
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1.5">Message d&apos;indisponibilité</p>
                              <select
                                value={saleIfOutOfStockScenarioDraft}
                                onChange={(e) => setSaleIfOutOfStockScenarioDraft(parseInt(e.target.value))}
                                className="input"
                                style={{ width: "100%" }}
                              >
                                <option value={0}>Aucun message</option>
                                <option value={1}>Rupture de stock</option>
                                <option value={2}>Disponible chez le fournisseur</option>
                                <option value={3}>Article discontinué</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lien site */}
                    {selectedArticle.link && (
                      <a
                        href={selectedArticle.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: "inline-flex" }}
                      >
                        Voir sur le site
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}

                {/* ── Onglet Catégories ───────────────────────────────── */}
                {modalTab === "categories" && (
                  <div className="card overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between" style={{ background: "var(--primary-light)", borderBottom: "1px solid #c7d2fe" }}>
                      <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: "#3730a3" }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                        </svg>
                        Catégories de l&apos;article
                        <span className="badge badge-indigo">{articleCategories.length}/10</span>
                      </h3>
                      <div className="flex items-center gap-2">
                        {articleCategories.length > 0 && !confirmingSave && (
                          <button
                            onClick={() => setArticleCategories([])}
                            disabled={savingCategories}
                            className="btn btn-danger btn-sm"
                            title="Vide tous les slots"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Tout vider
                          </button>
                        )}
                        {confirmingSave ? (
                          <div className="alert alert-warning py-1.5 px-3 gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            <span className="text-sm font-medium">Confirmer ?</span>
                            <button
                              onClick={async () => { setConfirmingSave(false); await saveArticleCategories(); }}
                              disabled={savingCategories}
                              className="btn btn-primary btn-sm"
                            >
                              {savingCategories ? (
                                <span className="flex items-center gap-1.5">
                                  <span className="spinner spinner-sm"></span>
                                  En cours...
                                </span>
                              ) : "Confirmer"}
                            </button>
                            <button onClick={() => setConfirmingSave(false)} disabled={savingCategories} className="btn btn-secondary btn-sm">
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmingSave(true)} disabled={savingCategories} className="btn btn-primary btn-sm">
                            Mettre à jour sur le site
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      {!hasCredentials ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Configurez vos identifiants API dans le{" "}
                          <Link href="/stock" className="text-indigo-600 hover:underline">Stock Manager</Link>
                          {" "}pour gérer les catégories.
                        </p>
                      ) : loadingArticleCats ? (
                        <div className="flex items-center justify-center py-4 gap-2 text-sm" style={{ color: "var(--muted)" }}>
                          <span className="spinner spinner-sm"></span>
                          Chargement des catégories...
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Assigned categories */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="label uppercase tracking-wide" style={{ marginBottom: 0 }}>Catégories assignées</h4>
                              <div className="flex items-center gap-1">
                                {copyFlash ? (
                                  <span className="badge badge-green">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Copié !
                                  </span>
                                ) : (
                                  <button onClick={copyCategories} disabled={articleCategories.length === 0} title="Copier" className="btn btn-ghost btn-sm" style={{ padding: "0.25rem 0.375rem" }}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                )}
                                <button onClick={pasteCategories} title="Coller" className="btn btn-ghost btn-sm" style={{ padding: "0.25rem 0.375rem" }}>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            {articleCategories.length === 0 ? (
                              <p className="text-sm italic" style={{ color: "var(--muted)" }}>Aucune catégorie</p>
                            ) : (
                              <div className="space-y-1.5">
                                {[...articleCategories].sort((a, b) => a.slot - b.slot).map((cat) => {
                                  const usedSlots = new Set(articleCategories.map((c) => c.slot));
                                  return (
                                    <div key={cat.oxId} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm group" style={{ background: "var(--primary-light)", border: "1px solid #c7d2fe" }}>
                                      <select
                                        value={cat.slot}
                                        onChange={(e) => {
                                          const newSlot = parseInt(e.target.value);
                                          setArticleCategories(articleCategories.map((c) => {
                                            if (c.oxId === cat.oxId) return { ...c, slot: newSlot };
                                            if (c.slot === newSlot) return { ...c, slot: cat.slot };
                                            return c;
                                          }));
                                        }}
                                        className="input text-xs w-28 flex-shrink-0 cursor-pointer"
                                        style={{ padding: "0.25rem 0.5rem", color: "var(--primary)" }}
                                      >
                                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                          <option key={n} value={n}>
                                            Catégorie {n}{usedSlots.has(n) && n !== cat.slot ? " ↔" : ""}
                                          </option>
                                        ))}
                                      </select>
                                      <span className="font-medium flex-1" style={{ color: "#3730a3" }}>{cat.name}</span>
                                      <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>#{cat.oxId}</span>
                                      <button
                                        onClick={() => setArticleCategories(articleCategories.filter((c) => c.oxId !== cat.oxId))}
                                        className="btn btn-ghost btn-sm text-gray-300 hover:text-red-500"
                                        title="Retirer"
                                        style={{ padding: "0.125rem 0.25rem" }}
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Category tree picker */}
                          <div>
                            <h4 className="label uppercase tracking-wide mb-2">Arbre des catégories</h4>
                            {loadingTree ? (
                              <div className="flex items-center justify-center py-4 gap-2 text-sm" style={{ color: "var(--muted)" }}>
                                <span className="spinner spinner-sm"></span>
                                Chargement de l&apos;arbre...
                              </div>
                            ) : categoryTree.length === 0 ? (
                              <button onClick={() => fetchCategories(appId, token)} className="w-full btn btn-ghost" style={{ border: "1px dashed var(--border)", justifyContent: "center", padding: "0.75rem" }}>
                                Charger l&apos;arbre des catégories
                              </button>
                            ) : (
                              <div className="card max-h-64 overflow-y-auto p-1" style={{ borderRadius: "0.5rem" }}>
                                {renderCategoryTree(categoryTree)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Onglet SEO & Description ────────────────────────── */}
                {modalTab === "seo" && (
                  <div className="space-y-5">
                    {/* MetaTitle */}
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wide">Meta Title</span>
                      {selectedArticle.metaTitle ? (
                        <p className="mt-1 text-sm text-gray-800 font-medium p-3 rounded-lg" style={{ background: "var(--subtle)", border: "1px solid var(--border)" }}>
                          {selectedArticle.metaTitle}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm italic" style={{ color: "var(--muted)" }}>Non renseigné</p>
                      )}
                      {selectedArticle.metaTitle && (
                        <p className="text-xs mt-1" style={{ color: selectedArticle.metaTitle.length > 60 ? "var(--danger)" : selectedArticle.metaTitle.length > 50 ? "var(--warning)" : "var(--muted)" }}>
                          {selectedArticle.metaTitle.length} / 60 caractères
                        </p>
                      )}
                    </div>

                    {/* MetaDescription */}
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wide">Meta Description</span>
                      {selectedArticle.metaDescription ? (
                        <p className="mt-1 text-sm text-gray-700 leading-relaxed p-3 rounded-lg" style={{ background: "var(--subtle)", border: "1px solid var(--border)" }}>
                          {selectedArticle.metaDescription}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm italic" style={{ color: "var(--muted)" }}>Non renseignée</p>
                      )}
                      {selectedArticle.metaDescription && (
                        <p className="text-xs mt-1" style={{ color: selectedArticle.metaDescription.length > 160 ? "var(--danger)" : selectedArticle.metaDescription.length > 140 ? "var(--warning)" : "var(--muted)" }}>
                          {selectedArticle.metaDescription.length} / 160 caractères
                        </p>
                      )}
                    </div>

                    {/* Description longue — éditable */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-400 text-xs uppercase tracking-wide">Description longue</span>
                        {descriptionFetched && hasCredentials && (
                          <div className="flex items-center gap-2">
                            {longDescriptionDraft !== longDescription && (
                              <button
                                onClick={() => setLongDescriptionDraft(longDescription)}
                                className="btn btn-ghost btn-sm text-xs"
                                style={{ color: "var(--muted)" }}
                              >
                                Annuler
                              </button>
                            )}
                            <button
                              onClick={saveLongDescription}
                              disabled={savingDescription || longDescriptionDraft === longDescription}
                              className="btn btn-primary btn-sm"
                            >
                              {savingDescription ? (
                                <span className="flex items-center gap-1.5">
                                  <span className="spinner spinner-sm" />
                                  Sauvegarde...
                                </span>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                  </svg>
                                  Mettre à jour sur le site
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {!hasCredentials ? (
                        <p className="text-sm text-gray-500 italic">
                          Configurez vos identifiants API dans le{" "}
                          <Link href="/stock" className="text-indigo-600 hover:underline">Stock Manager</Link>
                          {" "}pour charger et modifier la description longue.
                        </p>
                      ) : loadingDescription ? (
                        <div className="flex items-center gap-2 py-4 text-sm" style={{ color: "var(--muted)" }}>
                          <span className="spinner spinner-sm" />
                          Chargement de la description depuis Oxatis...
                        </div>
                      ) : (
                        <>
                          <textarea
                            value={longDescriptionDraft}
                            onChange={(e) => setLongDescriptionDraft(e.target.value)}
                            rows={12}
                            className="input w-full font-mono text-sm leading-relaxed"
                            style={{ resize: "vertical", fontFamily: "inherit" }}
                            placeholder="Aucune description longue. Saisissez-en une ici..."
                          />
                          {longDescriptionDraft !== longDescription && (
                            <p className="text-xs mt-1" style={{ color: "var(--warning)" }}>
                              Modifications non sauvegardées — cliquez sur « Mettre à jour sur le site »
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Description courte (CSV) */}
                    {selectedArticle.description && (
                      <div>
                        <span className="text-gray-400 text-xs uppercase tracking-wide">Description courte (CSV)</span>
                        <div className="mt-1 rounded-lg p-4 text-sm leading-relaxed space-y-1" style={{ background: "var(--subtle)", color: "#374151" }}>
                          {(() => {
                            const fields = parseDescription(selectedArticle.description);
                            const keys = Object.keys(fields);
                            if (keys.length > 2) {
                              return (
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                  {keys.map((key) => (
                                    <div key={key} className="flex gap-2">
                                      <dt className="text-gray-500 font-medium min-w-[120px]">{key} :</dt>
                                      <dd className="text-gray-800">{fields[key]}</dd>
                                    </div>
                                  ))}
                                </dl>
                              );
                            }
                            return <p>{stripHtml(selectedArticle.description)}</p>;
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Catégories CSV brutes */}
                    {selectedArticle.categories && selectedArticle.categories.some(c => c) && (
                      <div>
                        <span className="text-gray-400 text-xs uppercase tracking-wide">Catégories CSV (slots 1–10)</span>
                        <div className="mt-1 space-y-0.5">
                          {selectedArticle.categories.map((cat, i) =>
                            cat ? (
                              <p key={i} className="text-sm text-gray-700">
                                <span className="text-gray-400 font-mono text-xs mr-1.5">Cat {i + 1} :</span>
                                {cat}
                              </p>
                            ) : null
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Bulk edit modal ─────────────────────────────────────────────── */}
      {bulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[85vh] flex flex-col" style={{ borderRadius: "1rem" }}>
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h2 className="section-title">Modification en lot</h2>
                <p className="section-subtitle">{selectedIds.size} article{selectedIds.size > 1 ? "s" : ""} sélectionné{selectedIds.size > 1 ? "s" : ""}</p>
              </div>
              {!bulkProgress && (
                <button onClick={() => setBulkModalOpen(false)} className="btn btn-ghost btn-sm text-2xl font-light" style={{ padding: "0.25rem 0.5rem" }}>×</button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {bulkProgress ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {bulkProgress.current < bulkProgress.total ? "Mise à jour en cours..." : "Terminé !"}
                    </span>
                    <span className="text-gray-500">{bulkProgress.current} / {bulkProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${bulkProgress.current === bulkProgress.total ? "bg-green-500" : "bg-purple-500"}`}
                      style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                    />
                  </div>
                  {bulkProgress.errors.length > 0 && (
                    <div className="alert alert-error p-3 max-h-40 overflow-y-auto flex-col items-start gap-1">
                      <p className="text-xs font-semibold mb-1">{bulkProgress.errors.length} erreur{bulkProgress.errors.length > 1 ? "s" : ""}</p>
                      {bulkProgress.errors.map((e, i) => (
                        <p key={i} className="text-xs font-mono">{e}</p>
                      ))}
                    </div>
                  )}
                  {bulkProgress.current === bulkProgress.total && (
                    <p className="text-sm text-green-600 font-medium text-center">
                      {bulkProgress.errors.length === 0
                        ? `✓ ${bulkProgress.total} article${bulkProgress.total > 1 ? "s" : ""} ${bulkAction === "delete" ? "supprimé" : "mis à jour"}${bulkProgress.total > 1 ? "s" : ""} avec succès`
                        : `${bulkProgress.total - bulkProgress.errors.length} / ${bulkProgress.total} articles ${bulkAction === "delete" ? "supprimés" : "mis à jour"}`}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Mode selector */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    <button onClick={() => setBulkAction("add")} className={`btn btn-sm flex-1 ${bulkAction === "add" ? "btn-primary" : "btn-secondary"}`} style={{ justifyContent: "center", minWidth: 110 }}>
                      Assigner slot
                    </button>
                    <button
                      onClick={() => setBulkAction("clear")}
                      className={`btn btn-sm flex-1 ${bulkAction === "clear" ? "btn-danger" : "btn-secondary"}`}
                      style={{ justifyContent: "center", minWidth: 110, ...(bulkAction === "clear" ? { background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" } : {}) }}
                    >
                      Vider slot
                    </button>
                    <button onClick={() => setBulkAction("visible")} className={`btn btn-sm flex-1 ${bulkAction === "visible" ? "btn-primary" : "btn-secondary"}`} style={{ justifyContent: "center", minWidth: 90 }}>
                      Rendre visible
                    </button>
                    <button onClick={() => setBulkAction("hidden")} className={`btn btn-sm flex-1 ${bulkAction === "hidden" ? "btn-danger" : "btn-secondary"}`} style={{ justifyContent: "center", minWidth: 90, ...(bulkAction === "hidden" ? { background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" } : {}) }}>
                      Masquer
                    </button>
                    <button onClick={() => setBulkAction("availability")} className={`btn btn-sm flex-1 ${bulkAction === "availability" ? "btn-primary" : "btn-secondary"}`} style={{ justifyContent: "center", minWidth: 110 }}>
                      Disponibilité
                    </button>
                    <button
                      onClick={() => setBulkAction("delete")}
                      className="btn btn-sm flex-1"
                      style={{ justifyContent: "center", minWidth: 90, background: bulkAction === "delete" ? "var(--danger)" : undefined, color: bulkAction === "delete" ? "#fff" : undefined, borderColor: bulkAction === "delete" ? "var(--danger)" : undefined }}
                    >
                      Supprimer
                    </button>
                  </div>

                  {/* Slot number — only for slot actions */}
                  {(bulkAction === "add" || bulkAction === "clear") && (
                    <div>
                      <label className="label uppercase tracking-wide">Numéro de slot</label>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <button
                            key={n}
                            onClick={() => setBulkSlot(n)}
                            className={`btn btn-sm ${bulkSlot === n ? (bulkAction === "clear" ? "" : "btn-primary") : "btn-secondary"}`}
                            style={{
                              width: "2.5rem", height: "2.5rem", justifyContent: "center", padding: 0, fontWeight: 600,
                              ...(bulkSlot === n && bulkAction === "clear" ? { background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" } : {}),
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category tree — only for add */}
                  {bulkAction === "add" && (
                    <div>
                      <label className="label uppercase tracking-wide">Catégorie à assigner</label>
                      {bulkSelectedCategory && (
                        <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-2" style={{ background: "var(--primary-light)", border: "1px solid #c7d2fe" }}>
                          <span className="text-sm font-medium flex-1" style={{ color: "#3730a3" }}>{bulkSelectedCategory.name}</span>
                          <button onClick={() => setBulkSelectedCategory(null)} className="btn btn-ghost btn-sm" style={{ padding: "0.125rem 0.25rem" }}>×</button>
                        </div>
                      )}
                      {loadingTree ? (
                        <div className="flex items-center gap-2 text-sm py-2" style={{ color: "var(--muted)" }}>
                          <span className="spinner spinner-sm" />
                          Chargement...
                        </div>
                      ) : (
                        <div className="card max-h-52 overflow-y-auto p-1" style={{ borderRadius: "0.5rem" }}>
                          {renderBulkCategoryTree(categoryTree)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Availability date picker */}
                  {bulkAction === "availability" && (
                    <div>
                      <label className="label uppercase tracking-wide">Date de disponibilité</label>
                      <input
                        type="date"
                        value={bulkDate}
                        onChange={(e) => setBulkDate(e.target.value)}
                        className="form-input"
                      />
                      <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Laissez vide pour effacer la date de disponibilité.</p>
                    </div>
                  )}

                  {/* Summary alert */}
                  <div className={`alert ${bulkAction === "clear" || bulkAction === "hidden" || bulkAction === "delete" ? "alert-error" : "alert-info"}`}>
                    {bulkAction === "clear" && `Vider le slot ${bulkSlot} sur ${selectedIds.size} article${selectedIds.size > 1 ? "s" : ""}`}
                    {bulkAction === "add" && (bulkSelectedCategory
                      ? `Assigner "${bulkSelectedCategory.name}" au slot ${bulkSlot} sur ${selectedIds.size} article${selectedIds.size > 1 ? "s" : ""}`
                      : `Sélectionnez une catégorie à assigner au slot ${bulkSlot}`)}
                    {bulkAction === "visible" && `Rendre visible ${selectedIds.size} article${selectedIds.size > 1 ? "s" : ""}`}
                    {bulkAction === "hidden" && `Masquer ${selectedIds.size} article${selectedIds.size > 1 ? "s" : ""}`}
                    {bulkAction === "availability" && (bulkDate
                      ? `Définir la date de disponibilité au ${bulkDate} sur ${selectedIds.size} article${selectedIds.size > 1 ? "s" : ""}`
                      : `Effacer la date de disponibilité sur ${selectedIds.size} article${selectedIds.size > 1 ? "s" : ""}`)}
                    {bulkAction === "delete" && (
                      <span>
                        <strong>Attention — action irréversible.</strong>{" "}
                        Supprimer définitivement {selectedIds.size} article{selectedIds.size > 1 ? "s" : ""} d&apos;Oxatis.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 flex-shrink-0 flex items-center justify-end gap-3" style={{ borderTop: "1px solid var(--border)" }}>
              {bulkProgress?.current === bulkProgress?.total && bulkProgress !== null ? (
                <button onClick={() => { setBulkModalOpen(false); setBulkProgress(null); setBulkSelectedCategory(null); }} className="btn btn-primary">
                  Fermer
                </button>
              ) : !bulkProgress ? (
                bulkConfirming ? (
                  <>
                    <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "#92400e" }}>
                      <svg className="w-4 h-4" style={{ color: "var(--warning)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      Confirmer ?
                    </span>
                    <button onClick={executeBulkUpdate} className={`btn ${bulkAction === "clear" || bulkAction === "hidden" || bulkAction === "delete" ? "btn-danger" : "btn-primary"}`} style={bulkAction === "clear" || bulkAction === "hidden" || bulkAction === "delete" ? { background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" } : {}}>
                      {bulkAction === "delete" ? "Oui, supprimer définitivement" : "Oui, appliquer"}
                    </button>
                    <button onClick={() => setBulkConfirming(false)} className="btn btn-secondary">Annuler</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setBulkModalOpen(false)} className="btn btn-secondary">Annuler</button>
                    <button
                      onClick={() => setBulkConfirming(true)}
                      disabled={bulkAction === "add" && !bulkSelectedCategory}
                      className={`btn ${bulkAction === "clear" || bulkAction === "hidden" || bulkAction === "delete" ? "btn-danger" : "btn-primary"}`}
                      style={bulkAction === "clear" || bulkAction === "hidden" || bulkAction === "delete" ? { background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" } : {}}
                    >
                      {bulkAction === "delete" ? `Supprimer ${selectedIds.size} article${selectedIds.size > 1 ? "s" : ""}` : `Appliquer à ${selectedIds.size} article${selectedIds.size > 1 ? "s" : ""}`}
                    </button>
                  </>
                )
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
