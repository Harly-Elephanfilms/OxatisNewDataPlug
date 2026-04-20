import { useState, useMemo } from "react";
import type { Article } from "@/lib/types";
import { filterArticles } from "@/app/articles/utils/articleFilters";
import type { SortField, SortDir } from "@/app/articles/utils/articleFilters";

export type { SortField, SortDir };

export function useArticleFilters(articles: Article[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterAvailability, setFilterAvailability] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");

  const filteredArticles = useMemo(
    () =>
      filterArticles(articles, {
        searchTerm,
        sortField,
        sortDir,
        filterAvailability,
        filterVisibility,
        filterCategory,
        filterBrand,
      }),
    [articles, searchTerm, sortField, sortDir, filterAvailability, filterVisibility, filterCategory, filterBrand]
  );

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

  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const a of articles) if (a.brand) set.add(a.brand);
    return Array.from(set).sort();
  }, [articles]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === "quantity" || field === "price" ? "desc" : "asc");
    }
  };

  return {
    searchTerm, setSearchTerm,
    sortField, setSortField,
    sortDir, setSortDir,
    filterAvailability, setFilterAvailability,
    filterVisibility, setFilterVisibility,
    filterCategory, setFilterCategory,
    filterBrand, setFilterBrand,
    filteredArticles,
    categories,
    brands,
    handleSort,
  };
}
