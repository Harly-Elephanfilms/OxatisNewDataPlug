import { describe, it, expect } from "vitest";
import { filterArticles } from "@/app/articles/utils/articleFilters";
import type { ArticleFilters } from "@/app/articles/utils/articleFilters";
import type { Article } from "@/lib/types";

const baseFilters: ArticleFilters = {
  searchTerm: "",
  sortField: "title",
  sortDir: "asc",
  filterAvailability: "all",
  filterVisibility: "all",
  filterCategory: "all",
  filterBrand: "all",
};

function makeArticle(overrides: Partial<Article>): Article {
  return {
    oxatisId: "1",
    itemSKU: "SKU-1",
    title: "Article Test",
    link: "",
    price: "10.00 EUR",
    priceHT: "8.33",
    salePrice: "",
    description: "",
    condition: "",
    ean: "",
    brand: "",
    imageUrl: "",
    category: "",
    productType: "",
    quantity: 1,
    availability: "in stock",
    shippingWeight: "",
    visible: true,
    cost: "",
    categories: [],
    metaTitle: "",
    metaDescription: "",
    ...overrides,
  };
}

describe("filterArticles — searchTerm", () => {
  it("filters by title", () => {
    const articles = [
      makeArticle({ title: "Star Wars" }),
      makeArticle({ oxatisId: "2", title: "Indiana Jones" }),
    ];
    const result = filterArticles(articles, { ...baseFilters, searchTerm: "star" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Star Wars");
  });

  it("filters by itemSKU", () => {
    const articles = [
      makeArticle({ itemSKU: "SKU-ABC" }),
      makeArticle({ oxatisId: "2", itemSKU: "SKU-XYZ" }),
    ];
    const result = filterArticles(articles, { ...baseFilters, searchTerm: "abc" });
    expect(result).toHaveLength(1);
  });

  it("returns all when searchTerm is empty", () => {
    const articles = [makeArticle({}), makeArticle({ oxatisId: "2" })];
    expect(filterArticles(articles, baseFilters)).toHaveLength(2);
  });
});

describe("filterArticles — availability", () => {
  it("filters to in_stock only", () => {
    const articles = [
      makeArticle({ availability: "in stock" }),
      makeArticle({ oxatisId: "2", availability: "out of stock" }),
    ];
    const result = filterArticles(articles, { ...baseFilters, filterAvailability: "in_stock" });
    expect(result).toHaveLength(1);
    expect(result[0].availability).toBe("in stock");
  });

  it("filters to out_of_stock only", () => {
    const articles = [
      makeArticle({ availability: "in stock" }),
      makeArticle({ oxatisId: "2", availability: "out of stock" }),
    ];
    const result = filterArticles(articles, { ...baseFilters, filterAvailability: "out_of_stock" });
    expect(result).toHaveLength(1);
    expect(result[0].availability).toBe("out of stock");
  });
});

describe("filterArticles — visibility", () => {
  it("filters to visible only", () => {
    const articles = [
      makeArticle({ visible: true }),
      makeArticle({ oxatisId: "2", visible: false }),
    ];
    const result = filterArticles(articles, { ...baseFilters, filterVisibility: "visible" });
    expect(result).toHaveLength(1);
    expect(result[0].visible).toBe(true);
  });

  it("filters to hidden only", () => {
    const articles = [
      makeArticle({ visible: true }),
      makeArticle({ oxatisId: "2", visible: false }),
    ];
    const result = filterArticles(articles, { ...baseFilters, filterVisibility: "hidden" });
    expect(result).toHaveLength(1);
    expect(result[0].visible).toBe(false);
  });
});

describe("filterArticles — category", () => {
  it("filters by category root", () => {
    const articles = [
      makeArticle({ productType: "Films > Action | Films > Drama" }),
      makeArticle({ oxatisId: "2", productType: "Livres > Roman" }),
    ];
    const result = filterArticles(articles, { ...baseFilters, filterCategory: "Livres" });
    expect(result).toHaveLength(1);
    expect(result[0].productType).toContain("Livres");
  });

  it("filters __none__ to articles with no productType", () => {
    const articles = [
      makeArticle({ productType: "" }),
      makeArticle({ oxatisId: "2", productType: "Films > Action" }),
    ];
    const result = filterArticles(articles, { ...baseFilters, filterCategory: "__none__" });
    expect(result).toHaveLength(1);
    expect(result[0].productType).toBe("");
  });
});

describe("filterArticles — sorting", () => {
  it("sorts by title ascending", () => {
    const articles = [
      makeArticle({ title: "Z Article", oxatisId: "1" }),
      makeArticle({ title: "A Article", oxatisId: "2" }),
    ];
    const result = filterArticles(articles, { ...baseFilters, sortField: "title", sortDir: "asc" });
    expect(result[0].title).toBe("A Article");
  });

  it("sorts by title descending", () => {
    const articles = [
      makeArticle({ title: "Z Article", oxatisId: "1" }),
      makeArticle({ title: "A Article", oxatisId: "2" }),
    ];
    const result = filterArticles(articles, { ...baseFilters, sortField: "title", sortDir: "desc" });
    expect(result[0].title).toBe("Z Article");
  });

  it("sorts by quantity ascending", () => {
    const articles = [
      makeArticle({ quantity: 10, oxatisId: "1" }),
      makeArticle({ quantity: 2, oxatisId: "2" }),
    ];
    const result = filterArticles(articles, { ...baseFilters, sortField: "quantity", sortDir: "asc" });
    expect(result[0].quantity).toBe(2);
  });

  it("sorts by price descending", () => {
    const articles = [
      makeArticle({ price: "10.00 EUR", oxatisId: "1" }),
      makeArticle({ price: "50.00 EUR", oxatisId: "2" }),
    ];
    const result = filterArticles(articles, { ...baseFilters, sortField: "price", sortDir: "desc" });
    expect(result[0].price).toBe("50.00 EUR");
  });

  it("sorts by brand ascending", () => {
    const articles = [
      makeArticle({ brand: "Zara", oxatisId: "1" }),
      makeArticle({ brand: "Apple", oxatisId: "2" }),
    ];
    const result = filterArticles(articles, { ...baseFilters, sortField: "brand", sortDir: "asc" });
    expect(result[0].brand).toBe("Apple");
  });
});

describe("filterArticles — combined filters", () => {
  it("applies availability + visibility together", () => {
    const articles = [
      makeArticle({ oxatisId: "1", availability: "in stock", visible: true }),
      makeArticle({ oxatisId: "2", availability: "in stock", visible: false }),
      makeArticle({ oxatisId: "3", availability: "out of stock", visible: true }),
    ];
    const result = filterArticles(articles, {
      ...baseFilters,
      filterAvailability: "in_stock",
      filterVisibility: "visible",
    });
    expect(result).toHaveLength(1);
    expect(result[0].oxatisId).toBe("1");
  });

  it("applies brand + availability together", () => {
    const articles = [
      makeArticle({ oxatisId: "1", brand: "Nike", availability: "in stock" }),
      makeArticle({ oxatisId: "2", brand: "Nike", availability: "out of stock" }),
      makeArticle({ oxatisId: "3", brand: "Adidas", availability: "in stock" }),
    ];
    const result = filterArticles(articles, {
      ...baseFilters,
      filterBrand: "Nike",
      filterAvailability: "in_stock",
    });
    expect(result).toHaveLength(1);
    expect(result[0].oxatisId).toBe("1");
  });
});
