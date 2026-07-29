"use client";

import { useState, useCallback } from "react";
import type { Article } from "@/lib/types";
import type { CategoryNode } from "@/lib/types";
import type { CategoryAssignment } from "@/lib/oxatis-api";
import { sleep } from "@/lib/api-helpers";

export function useBulkActions(
  filteredArticles: Article[],
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>,
  setError: (msg: string) => void,
  setSuccess: (msg: string) => void
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<
    "add" | "clear" | "visible" | "hidden" | "availability" | "delete" | "replace"
  >("add");
  const [bulkSlot, setBulkSlot] = useState(1);
  const [bulkSelectedCategory, setBulkSelectedCategory] = useState<CategoryNode | null>(null);
  const [bulkExpandedNodes, setBulkExpandedNodes] = useState<Set<string>>(new Set());
  const [bulkProgress, setBulkProgress] = useState<{
    current: number;
    total: number;
    errors: string[];
  } | null>(null);
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const [bulkDate, setBulkDate] = useState("");
  const [bulkReplaceCategories, setBulkReplaceCategories] = useState<CategoryAssignment[]>([]);
  const [bulkReplaceExpandedNodes, setBulkReplaceExpandedNodes] = useState<Set<string>>(new Set());

  const toggleSelectArticle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === filteredArticles.length) return new Set();
      return new Set(filteredArticles.map((a) => a.oxatisId));
    });
  }, [filteredArticles]);

  const openBulkEdit = useCallback(() => {
    setBulkModalOpen(true);
    setBulkProgress(null);
    setBulkConfirming(false);
    setBulkSelectedCategory(null);
    setBulkExpandedNodes(new Set());
    setBulkReplaceCategories([]);
    setBulkReplaceExpandedNodes(new Set());
  }, []);

  const toggleBulkReplaceCategory = useCallback((node: CategoryNode) => {
    setBulkReplaceCategories((prev) => {
      const exists = prev.some((c) => c.oxId === node.oxId);
      if (exists) return prev.filter((c) => c.oxId !== node.oxId);
      if (prev.length >= 10) return prev;
      const usedSlots = new Set(prev.map((c) => c.slot));
      let nextSlot = 1;
      while (usedSlots.has(nextSlot)) nextSlot++;
      return [...prev, { oxId: node.oxId, name: node.name, parentOxId: node.parentOxId, slot: nextSlot }];
    });
  }, []);

  const executeBulkUpdate = useCallback(async () => {
    setBulkConfirming(false);
    const ids = Array.from(selectedIds);
    setBulkProgress({ current: 0, total: ids.length, errors: [] });
    const errors: string[] = [];
    const succeeded = new Set<string>();

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      try {
        let url = "/api/oxatis/update-slot";
        let body: Record<string, unknown> = {
          oxatisId: id,
          slot: bulkSlot,
          category:
            bulkAction === "add" && bulkSelectedCategory
              ? {
                  oxId: bulkSelectedCategory.oxId,
                  name: bulkSelectedCategory.name,
                  parentOxId: bulkSelectedCategory.parentOxId,
                  slot: bulkSlot,
                }
              : null,
        };

        if (bulkAction === "visible" || bulkAction === "hidden") {
          url = "/api/oxatis/update-visibility";
          body = { itemSKU: id, visible: bulkAction === "visible" };
        } else if (bulkAction === "availability") {
          url = "/api/oxatis/update-availability";
          body = { itemSKU: id, dateOfAvailability: bulkDate };
        } else if (bulkAction === "delete") {
          url = "/api/oxatis/delete-product";
          body = { oxatisId: id };
        } else if (bulkAction === "replace") {
          url = "/api/oxatis/product-categories";
          body = { oxatisId: id, categories: bulkReplaceCategories };
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

    if (succeeded.size > 0) {
      if (bulkAction === "visible" || bulkAction === "hidden") {
        const newVisible = bulkAction === "visible";
        setArticles((prev) =>
          prev.map((a) => (succeeded.has(a.oxatisId) ? { ...a, visible: newVisible } : a))
        );
      } else if (bulkAction === "delete") {
        setArticles((prev) => prev.filter((a) => !succeeded.has(a.oxatisId)));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          succeeded.forEach((id) => next.delete(id));
          return next;
        });
      }
    }

    void setError;
    void setSuccess;
  }, [selectedIds, bulkAction, bulkSelectedCategory, bulkSlot, bulkDate, bulkReplaceCategories, setArticles, setError, setSuccess]);

  return {
    selectedIds,
    setSelectedIds,
    bulkModalOpen,
    setBulkModalOpen,
    bulkAction,
    setBulkAction,
    bulkSlot,
    setBulkSlot,
    bulkSelectedCategory,
    setBulkSelectedCategory,
    bulkExpandedNodes,
    setBulkExpandedNodes,
    bulkProgress,
    setBulkProgress,
    bulkConfirming,
    setBulkConfirming,
    bulkDate,
    setBulkDate,
    bulkReplaceCategories,
    setBulkReplaceCategories,
    bulkReplaceExpandedNodes,
    setBulkReplaceExpandedNodes,
    toggleBulkReplaceCategory,
    toggleSelectArticle,
    toggleSelectAll,
    openBulkEdit,
    executeBulkUpdate,
  };
}
