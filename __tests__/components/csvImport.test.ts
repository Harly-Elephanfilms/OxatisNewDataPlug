import { describe, it, expect } from "vitest";
import { detectColumns, buildRows } from "@/app/components/features/create/CsvImportMode";

// En-têtes réels d'un export catalogue Oxatis (fichier « Ajouts d'articles »).
const OXATIS_HEADERS = [
  "Code EAN", "Code produit", "MPN", "Langue de présentation", "Nom",
  "Prix 1 TTC", "Taux de TVA (en valeur)",
  "Nom de la première catégorie", "Nom de la 10ème catégorie",
  "Description", "Description détaillée",
  "Caractéristiques", "Date de sortie ", "Date de disponibilité",
];

function row(values: Record<string, string>): string[] {
  return OXATIS_HEADERS.map((h) => values[h] ?? "");
}

const SAMPLE: Record<string, string> = {
  "Code EAN": "3700146556399",
  "Code produit": "655639",
  "Nom": "Agent très spécial 44 - Blu-ray",
  "Prix 1 TTC": "16,99",
  "Taux de TVA (en valeur)": "20",
  "Description": "Résumé court",
  "Description détaillée": "<b>Titre</b> : Agent très spécial 44",
  "Date de sortie ": "07/12/2027",
  "Date de disponibilité": "07/12/2027",
};

describe("import CSV — colonnes Oxatis", () => {
  it("détecte le prix comme TTC et ne le convertit pas", () => {
    const colMap = detectColumns(OXATIS_HEADERS);
    expect(colMap.priceIsTTC).toBe(true);

    const [r] = buildRows([row(SAMPLE)], colMap);
    expect(r.price).toBe("16,99");
    expect(r.priceIncludesVAT).toBe(true);
    expect(r.valid).toBe(true);
  });

  it("marque le prix comme HT quand la colonne est un prix hors taxe", () => {
    const headers = ["ref", "titre", "prix_ht", "tva"];
    const colMap = detectColumns(headers);
    expect(colMap.priceIsTTC).toBeUndefined();

    const [r] = buildRows([["REF1", "Produit", "14.16", "20"]], colMap);
    expect(r.price).toBe("14.16");
    expect(r.priceIncludesVAT).toBe(false);
  });

  it("reprend la date de disponibilité au format ISO", () => {
    const colMap = detectColumns(OXATIS_HEADERS);
    const [r] = buildRows([row(SAMPLE)], colMap);
    expect(r.dateOfAvailability).toBe("2027-12-07");
  });

  it("utilise « Date de sortie » quand « Date de disponibilité » est vide", () => {
    const colMap = detectColumns(OXATIS_HEADERS);
    const [r] = buildRows([row({ ...SAMPLE, "Date de disponibilité": "" })], colMap);
    expect(r.dateOfAvailability).toBe("2027-12-07");
  });

  it("signale une date illisible au lieu de l'ignorer", () => {
    const colMap = detectColumns(OXATIS_HEADERS);
    const [r] = buildRows(
      [row({ ...SAMPLE, "Date de disponibilité": "décembre-2027", "Date de sortie ": "" })],
      colMap
    );
    expect(r.dateOfAvailability).toBe("");
    expect(r.valid).toBe(false);
    expect(r.errors.join(" ")).toContain("Date de disponibilité illisible");
  });

  it("prend « Code produit » comme référence, pas « MPN »", () => {
    const colMap = detectColumns(OXATIS_HEADERS);
    const [r] = buildRows([row({ ...SAMPLE, MPN: "AUTRE" })], colMap);
    expect(r.itemSKU).toBe("655639");
  });

  it("route les deux descriptions vers des champs distincts", () => {
    const colMap = detectColumns(OXATIS_HEADERS);
    const [r] = buildRows([row(SAMPLE)], colMap);
    expect(r.description).toBe("Résumé court");
    expect(r.descriptionLong).toBe("<b>Titre</b> : Agent très spécial 44");
  });
});
