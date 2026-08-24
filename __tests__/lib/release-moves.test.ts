import { describe, it, expect, vi, afterEach } from "vitest";
import { detectReleaseCandidates, matchesCategory, planCategoryChange } from "@/lib/release-moves";
import type { Article, StockItem } from "@/lib/types";

function article(itemSKU: string, categories: string[]): Article {
  return {
    oxatisId: `ox-${itemSKU}`, itemSKU, title: `Titre ${itemSKU}`, link: "", price: "",
    priceHT: "", salePrice: "", description: "", condition: "", ean: "", brand: "",
    imageUrl: "", category: "", productType: "", quantity: 0, availability: "in stock",
    shippingWeight: "", visible: true, cost: "", categories, metaTitle: "", metaDescription: "",
  };
}

function stock(itemSKU: string, dateOfAvailability: string): StockItem {
  return { oxatisId: `ox-${itemSKU}`, itemSKU, name: `Titre ${itemSKU}`, qtyInStock: 3, dateOfAvailability };
}

describe("detectReleaseCandidates", () => {
  afterEach(() => vi.useRealTimers());

  function freezeToday() {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 24, 10, 30)); // 24/08/2026
  }

  it("remonte un article dont la sortie est aujourd'hui et encore en Prochainement", () => {
    freezeToday();
    const found = detectReleaseCandidates(
      [stock("655639", "24/08/2026")],
      [article("655639", ["Prochainement"])],
      "Prochainement"
    );
    expect(found.map((c) => c.itemSKU)).toEqual(["655639"]);
  });

  it("remonte aussi les sorties passées oubliées", () => {
    freezeToday();
    const found = detectReleaseCandidates(
      [stock("A", "01/07/2026")],
      [article("A", ["Prochainement"])],
      "Prochainement"
    );
    expect(found).toHaveLength(1);
  });

  it("ignore les sorties futures", () => {
    freezeToday();
    const found = detectReleaseCandidates(
      [stock("B", "07/12/2027")],
      [article("B", ["Prochainement"])],
      "Prochainement"
    );
    expect(found).toEqual([]);
  });

  it("ignore un article qui n'est pas dans la catégorie de départ", () => {
    freezeToday();
    const found = detectReleaseCandidates(
      [stock("C", "01/07/2026")],
      [article("C", ["Nouveautés", "Blu-ray"])],
      "Prochainement"
    );
    expect(found).toEqual([]);
  });

  it("ignore un article sans date de sortie", () => {
    freezeToday();
    const found = detectReleaseCandidates(
      [stock("D", "")],
      [article("D", ["Prochainement"])],
      "Prochainement"
    );
    expect(found).toEqual([]);
  });

  it("reconnaît la catégorie au bout d'un chemin « Parent > Enfant »", () => {
    expect(matchesCategory("Films > Prochainement", "prochainement")).toBe(true);
    expect(matchesCategory("Prochainement", "Prochainement")).toBe(true);
    expect(matchesCategory("Films", "Prochainement")).toBe(false);
  });
});

describe("planCategoryChange", () => {
  const target = { oxId: "42", name: "Nouveautés", parentOxId: "0" };

  it("remplace la catégorie source dans son propre slot", () => {
    const next = planCategoryChange(
      [
        { oxId: "7", name: "Blu-ray", parentOxId: "0", slot: 1 },
        { oxId: "9", name: "Prochainement", parentOxId: "0", slot: 3 },
      ],
      "Prochainement",
      target
    );
    expect(next).toEqual([
      { oxId: "7", name: "Blu-ray", parentOxId: "0", slot: 1 },
      { oxId: "42", name: "Nouveautés", parentOxId: "0", slot: 3 },
    ]);
  });

  it("prend le premier slot libre quand la source est absente", () => {
    const next = planCategoryChange(
      [{ oxId: "7", name: "Blu-ray", parentOxId: "0", slot: 1 }],
      "Prochainement",
      target
    );
    expect(next).toEqual([
      { oxId: "7", name: "Blu-ray", parentOxId: "0", slot: 1 },
      { oxId: "42", name: "Nouveautés", parentOxId: "0", slot: 2 },
    ]);
  });

  it("ne fait rien si la cible est déjà affectée", () => {
    const next = planCategoryChange(
      [{ oxId: "42", name: "Nouveautés", parentOxId: "0", slot: 2 }],
      "Prochainement",
      target
    );
    expect(next).toBeNull();
  });

  it("ne fait rien quand les 10 slots sont pris et que la source est absente", () => {
    const full = Array.from({ length: 10 }, (_, i) => ({
      oxId: String(i + 1), name: `Cat ${i + 1}`, parentOxId: "0", slot: i + 1,
    }));
    expect(planCategoryChange(full, "Prochainement", target)).toBeNull();
  });
});
