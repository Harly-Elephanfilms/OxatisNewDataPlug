"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { CategoryNode } from "@/lib/types";

interface CategoriesContextValue {
  categoryTree: CategoryNode[];
  flatCategories: CategoryNode[];
  loading: boolean;
  fetchCategories: (appId?: string, token?: string) => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextValue>({
  categoryTree: [],
  flatCategories: [],
  loading: false,
  fetchCategories: async () => {},
});

function flatten(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((n) => [n, ...flatten(n.children ?? [])]);
}

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchCategories = useCallback(
    async (_appId?: string, _token?: string) => {
      if (fetched || loading) return;
      setLoading(true);
      try {
        const res = await fetch("/api/oxatis/categories");
        const data = await res.json() as { tree?: CategoryNode[]; error?: string };
        if (data.tree) {
          setCategoryTree(data.tree);
          setFetched(true);
        }
      } catch {
        // network error — caller can retry
      } finally {
        setLoading(false);
      }
    },
    [fetched, loading]
  );

  return (
    <CategoriesContext.Provider
      value={{ categoryTree, flatCategories: flatten(categoryTree), loading, fetchCategories }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export const useCategories = () => useContext(CategoriesContext);
