"use client";

import { useState, useCallback } from "react";
import type { Article } from "@/lib/types";
import type { CategoryAssignment } from "@/lib/oxatis-api";
import type { CategoryNode } from "@/lib/types";

export type ModalTab = "infos" | "categories" | "seo";

const COPIED_CATEGORIES_KEY = "oxatis_copied_categories";

export function useArticleModal(
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>,
  setError: (msg: string) => void,
  setSuccess: (msg: string) => void
) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [modalTab, setModalTab] = useState<ModalTab>("infos");

  const [longDescription, setLongDescription] = useState("");
  const [longDescriptionDraft, setLongDescriptionDraft] = useState("");
  const [loadingDescription, setLoadingDescription] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const [descriptionFetched, setDescriptionFetched] = useState(false);

  const [dateOfAvailability, setDateOfAvailability] = useState("");
  const [dateOfAvailabilityDraft, setDateOfAvailabilityDraft] = useState("");
  const [savingAvailability, setSavingAvailability] = useState(false);

  const [visibleDraft, setVisibleDraft] = useState(true);
  const [savingVisible, setSavingVisible] = useState(false);

  const [showIfOutOfStock, setShowIfOutOfStock] = useState(false);
  const [showIfOutOfStockDraft, setShowIfOutOfStockDraft] = useState(false);
  const [saleIfOutOfStock, setSaleIfOutOfStock] = useState(false);
  const [saleIfOutOfStockDraft, setSaleIfOutOfStockDraft] = useState(false);
  const [saleIfOutOfStockScenario, setSaleIfOutOfStockScenario] = useState(0);
  const [saleIfOutOfStockScenarioDraft, setSaleIfOutOfStockScenarioDraft] = useState(0);
  const [savingOutOfStock, setSavingOutOfStock] = useState(false);

  const [articleCategories, setArticleCategories] = useState<CategoryAssignment[]>([]);
  const [loadingArticleCats, setLoadingArticleCats] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [copyFlash, setCopyFlash] = useState(false);

  const fetchArticleCategories = useCallback(
    async (oxatisId: string) => {
      setLoadingArticleCats(true);
      try {
        const response = await fetch(
          `/api/oxatis/product-categories?oxatisId=${oxatisId}`
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erreur");
        setArticleCategories(data.categories);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur chargement catégories article");
      } finally {
        setLoadingArticleCats(false);
      }
    },
    [setError]
  );

  const fetchProductDetail = useCallback(
    async (itemSKU: string) => {
      setLoadingDescription(true);
      setDescriptionFetched(false);
      try {
        const response = await fetch(
          `/api/oxatis/product-detail?itemSKU=${encodeURIComponent(itemSKU)}`
        );
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
    },
    [setError]
  );

  const openArticleDetail = useCallback(
    (article: Article, onOpen: () => void) => {
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
      onOpen();
    },
    []
  );

  const closeModal = useCallback(() => setSelectedArticle(null), []);

  const saveVisible = useCallback(
    async (newValue: boolean) => {
      if (!selectedArticle) return;
      setSavingVisible(true);
      setError("");
      try {
        const response = await fetch("/api/oxatis/update-visibility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemSKU: selectedArticle.itemSKU, visible: newValue }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erreur");
        setVisibleDraft(newValue);
        setArticles((prev) =>
          prev.map((a) =>
            a.oxatisId === selectedArticle.oxatisId ? { ...a, visible: newValue } : a
          )
        );
        setSuccess(
          `Article "${selectedArticle.title}" ${newValue ? "rendu visible" : "masqué"} sur le site`
        );
        setTimeout(() => setSuccess(""), 5000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur mise à jour visibilité");
        setVisibleDraft(!newValue);
      } finally {
        setSavingVisible(false);
      }
    },
    [selectedArticle, setArticles, setError, setSuccess]
  );

  const saveAvailability = useCallback(async () => {
    if (!selectedArticle) return;
    setSavingAvailability(true);
    setError("");
    try {
      const response = await fetch("/api/oxatis/update-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
  }, [selectedArticle, dateOfAvailabilityDraft, setError, setSuccess]);

  const saveOutOfStock = useCallback(async () => {
    if (!selectedArticle) return;
    setSavingOutOfStock(true);
    setError("");
    try {
      const response = await fetch("/api/oxatis/update-out-of-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
      setError(err instanceof Error ? err.message : "Erreur mise à jour hors stock");
    } finally {
      setSavingOutOfStock(false);
    }
  }, [
    selectedArticle,
    showIfOutOfStockDraft,
    saleIfOutOfStockDraft,
    saleIfOutOfStockScenarioDraft,
    setError,
    setSuccess,
  ]);

  const saveLongDescription = useCallback(async () => {
    if (!selectedArticle) return;
    setSavingDescription(true);
    setError("");
    try {
      const response = await fetch("/api/oxatis/update-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
  }, [selectedArticle, longDescriptionDraft, setError, setSuccess]);

  const saveArticleCategories = useCallback(async () => {
    if (!selectedArticle) return;
    setSavingCategories(true);
    setError("");
    try {
      const response = await fetch("/api/oxatis/product-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oxatisId: selectedArticle.oxatisId,
          categories: articleCategories,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur");
      setSuccess(`Catégories mises à jour pour "${selectedArticle.title}"`);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur mise à jour catégories");
    } finally {
      setSavingCategories(false);
    }
  }, [selectedArticle, articleCategories, setError, setSuccess]);

  const toggleCategory = useCallback(
    (node: CategoryNode) => {
      setArticleCategories((prev) => {
        const exists = prev.some((c) => c.oxId === node.oxId);
        if (exists) return prev.filter((c) => c.oxId !== node.oxId);
        if (prev.length >= 10) {
          setError("Maximum 10 catégories par article");
          return prev;
        }
        const usedSlots = new Set(prev.map((c) => c.slot));
        let nextSlot = 1;
        while (usedSlots.has(nextSlot)) nextSlot++;
        return [
          ...prev,
          { oxId: node.oxId, name: node.name, parentOxId: node.parentOxId, slot: nextSlot },
        ];
      });
    },
    [setError]
  );

  const toggleExpanded = useCallback((oxId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(oxId)) next.delete(oxId);
      else next.add(oxId);
      return next;
    });
  }, []);

  const copyCategories = useCallback(() => {
    try {
      localStorage.setItem(COPIED_CATEGORIES_KEY, JSON.stringify(articleCategories));
      setCopyFlash(true);
      setTimeout(() => setCopyFlash(false), 1800);
    } catch {
      /* ignore */
    }
  }, [articleCategories]);

  const pasteCategories = useCallback(() => {
    try {
      const saved = localStorage.getItem(COPIED_CATEGORIES_KEY);
      if (saved) setArticleCategories(JSON.parse(saved) as CategoryAssignment[]);
    } catch {
      /* ignore */
    }
  }, []);

  return {
    selectedArticle,
    setSelectedArticle,
    modalTab,
    setModalTab,
    longDescription,
    longDescriptionDraft,
    setLongDescriptionDraft,
    loadingDescription,
    savingDescription,
    descriptionFetched,
    dateOfAvailability,
    dateOfAvailabilityDraft,
    setDateOfAvailabilityDraft,
    savingAvailability,
    visibleDraft,
    savingVisible,
    showIfOutOfStock,
    showIfOutOfStockDraft,
    setShowIfOutOfStockDraft,
    saleIfOutOfStock,
    saleIfOutOfStockDraft,
    setSaleIfOutOfStockDraft,
    saleIfOutOfStockScenario,
    saleIfOutOfStockScenarioDraft,
    setSaleIfOutOfStockScenarioDraft,
    savingOutOfStock,
    articleCategories,
    setArticleCategories,
    loadingArticleCats,
    savingCategories,
    expandedNodes,
    confirmingSave,
    setConfirmingSave,
    exportSuccess,
    setExportSuccess,
    copyFlash,
    openArticleDetail,
    closeModal,
    fetchArticleCategories,
    fetchProductDetail,
    saveVisible,
    saveAvailability,
    saveOutOfStock,
    saveLongDescription,
    saveArticleCategories,
    toggleCategory,
    toggleExpanded,
    copyCategories,
    pasteCategories,
  };
}
