"use client";

import { useState, useCallback } from "react";
import type { MatriceArticle, ConflictItem } from "@/app/matrice/types";

export function useConflictDetection() {
  const [verifying, setVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState({ current: 0, total: 0 });
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [pendingNew, setPendingNew] = useState<MatriceArticle[]>([]);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);

  const checkConflicts = useCallback(
    async (
      items: MatriceArticle[],
      onNoConflicts: (trulyNew: MatriceArticle[]) => void
    ) => {
      if (!items.length) return;

      setVerifying(true);
      setVerifyProgress({ current: 0, total: items.length });

      const foundConflicts: ConflictItem[] = [];
      const trulyNew: MatriceArticle[] = [];

      for (let i = 0; i < items.length; i++) {
        const a = items[i];
        try {
          const res = await fetch(
            `/api/oxatis/product-detail?itemSKU=${encodeURIComponent(a.itemSKU)}`
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
        onNoConflicts(trulyNew);
      }
    },
    []
  );

  return {
    verifying,
    verifyProgress,
    conflicts,
    pendingNew,
    conflictModalOpen,
    setConflictModalOpen,
    checkConflicts,
  };
}
