import type { Article } from "@/lib/types";

export type SortField = "oxatisId" | "title" | "price" | "quantity" | "productType" | "brand";
export type SortDir = "asc" | "desc";

export interface ArticleFilters {
  searchTerm: string;
  sortField: SortField;
  sortDir: SortDir;
  filterAvailability: string;
  filterVisibility: string;
  filterCategory: string;
  filterBrand: string;
}

function parsePrice(priceStr: string): number {
  const num = parseFloat(priceStr.replace(/[^\d.,]/g, "").replace(",", "."));
  return isNaN(num) ? 0 : num;
}

export function filterArticles(articles: Article[], filters: ArticleFilters): Article[] {
  let items = [...articles];

  if (filters.filterAvailability !== "all") {
    items = items.filter((a) =>
      filters.filterAvailability === "in_stock"
        ? a.availability === "in stock"
        : a.availability !== "in stock"
    );
  }

  if (filters.filterVisibility !== "all") {
    items = items.filter((a) =>
      filters.filterVisibility === "visible" ? a.visible : !a.visible
    );
  }

  if (filters.filterCategory === "__none__") {
    items = items.filter((a) => !a.productType || !a.productType.trim());
  } else if (filters.filterCategory !== "all") {
    items = items.filter((a) => {
      const roots = a.productType.split("|").map((c) => c.trim().split(">")[0].trim());
      return roots.includes(filters.filterCategory);
    });
  }

  if (filters.filterBrand !== "all") {
    items = items.filter((a) => a.brand === filters.filterBrand);
  }

  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
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

    if (filters.sortField === "price") {
      valA = parsePrice(a.price);
      valB = parsePrice(b.price);
    } else if (filters.sortField === "quantity") {
      valA = a.quantity;
      valB = b.quantity;
    } else {
      valA = ((a[filters.sortField] as string) ?? "").toLowerCase();
      valB = ((b[filters.sortField] as string) ?? "").toLowerCase();
    }

    if (valA < valB) return filters.sortDir === "asc" ? -1 : 1;
    if (valA > valB) return filters.sortDir === "asc" ? 1 : -1;
    return 0;
  });

  return items;
}
