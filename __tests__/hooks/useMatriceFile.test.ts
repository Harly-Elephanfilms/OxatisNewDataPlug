import { describe, it, expect } from "vitest";
import { rowToMatriceArticle } from "@/app/matrice/hooks/useMatriceFile";

function makeRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    "Code EAN": "1234567890123",
    "Code produit": "SKU-001",
    "Langue de présentation": "FR",
    "Nom": "Produit Test",
    "Prix 1 TTC": 29.99,
    "Taux de TVA (en valeur)": 20,
    "Description": "Description courte",
    "Description détaillée": "<p>Desc longue</p>",
    "Titre de page (Balise <TITLE>)": "Meta titre",
    "Description (META description)": "Meta desc",
    "Contenu de l'URL canonique": "",
    "Afficher le niveau du stock": "1",
    "Montrer cet article même si il est indisponible": "0",
    "Cause de l'indisponibilité": "",
    "1ère image zoom": "",
    "Image principale": "",
    "Petite image (vignette)": "",
    "Date de disponibilité": "",
    "Afficher le délai de disponibilité": "0",
    "Nom de la première catégorie": "Cinéma",
    "Nom de la deuxième catégorie": null,
    "Nom de la troisième catégorie": null,
    "Nom de la quatrième catégorie": null,
    "Nom de la 5ème catégorie": null,
    ...overrides,
  };
}

describe("rowToMatriceArticle", () => {
  it("maps a standard row correctly", () => {
    const result = rowToMatriceArticle(makeRow(), "OX123", false);
    expect(result).not.toBeNull();
    expect(result!.ean).toBe("1234567890123");
    expect(result!.itemSKU).toBe("SKU-001");
    expect(result!.nom).toBe("Produit Test");
    expect(result!.prixTTC).toBe(29.99);
    expect(result!.tva).toBe(20);
    expect(result!.oxatisId).toBe("OX123");
    expect(result!.isNew).toBe(false);
  });

  it("returns null when EAN is missing", () => {
    const result = rowToMatriceArticle(makeRow({ "Code EAN": null }), null, true);
    expect(result).toBeNull();
  });

  it("returns null when EAN is empty string", () => {
    const result = rowToMatriceArticle(makeRow({ "Code EAN": "" }), null, true);
    expect(result).toBeNull();
  });

  it("normalises langue to lowercase", () => {
    const result = rowToMatriceArticle(makeRow({ "Langue de présentation": "FR" }), null, true);
    expect(result!.langue).toBe("fr");
  });

  it("defaults langue to 'fr' when absent", () => {
    const result = rowToMatriceArticle(makeRow({ "Langue de présentation": null }), null, true);
    expect(result!.langue).toBe("fr");
  });

  it("defaults tva to 20 when absent", () => {
    const result = rowToMatriceArticle(makeRow({ "Taux de TVA (en valeur)": null }), null, true);
    expect(result!.tva).toBe(20);
  });

  it("defaults prixTTC to 0 when absent", () => {
    const result = rowToMatriceArticle(makeRow({ "Prix 1 TTC": null }), null, true);
    expect(result!.prixTTC).toBe(0);
  });

  it("collects up to 5 categories, filtering nulls", () => {
    const result = rowToMatriceArticle(
      makeRow({
        "Nom de la première catégorie": "Cat A",
        "Nom de la deuxième catégorie": "Cat B",
        "Nom de la troisième catégorie": null,
      }),
      null,
      true
    );
    expect(result!.categories).toEqual(["Cat A", "Cat B"]);
  });

  it("prepends WYSIWYG prefix to description longue when absent", () => {
    const result = rowToMatriceArticle(makeRow({ "Description détaillée": "<p>HTML</p>" }), null, true);
    expect(result!.descriptionLongue).toBe("<!--#WYSIWYG#--><p>HTML</p>");
  });

  it("does not double-prefix WYSIWYG if already present", () => {
    const row = makeRow({ "Description détaillée": "<!--#WYSIWYG#--><p>Already</p>" });
    const result = rowToMatriceArticle(row, null, true);
    expect(result!.descriptionLongue).toBe("<!--#WYSIWYG#--><p>Already</p>");
  });

  it("parses Date object for dateDispo", () => {
    const d = new Date("2025-06-15T00:00:00.000Z");
    const result = rowToMatriceArticle(makeRow({ "Date de disponibilité": d }), null, true);
    expect(result!.dateDispo).toBe("2025-06-15");
  });

  it("parses string date for dateDispo", () => {
    const result = rowToMatriceArticle(makeRow({ "Date de disponibilité": "2025-12-01T00:00:00" }), null, true);
    expect(result!.dateDispo).toBe("2025-12-01");
  });

  it("leaves dateDispo empty when absent", () => {
    const result = rowToMatriceArticle(makeRow({ "Date de disponibilité": null }), null, true);
    expect(result!.dateDispo).toBe("");
  });

  it("sets isNew=true and oxatisId=null for new articles", () => {
    const result = rowToMatriceArticle(makeRow(), null, true);
    expect(result!.isNew).toBe(true);
    expect(result!.oxatisId).toBeNull();
  });

  it("sets isNew=false and oxatisId for existing articles", () => {
    const result = rowToMatriceArticle(makeRow(), "OX999", false);
    expect(result!.isNew).toBe(false);
    expect(result!.oxatisId).toBe("OX999");
  });
});
