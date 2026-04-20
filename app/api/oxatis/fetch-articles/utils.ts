import Papa from "papaparse";
import type { Article } from "@/lib/types";

export function getField(row: Record<string, string>, key: string): string {
  return (row[key] ?? "").trim();
}

function buildProductType(row: Record<string, string>): string {
  const parts: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const val = getField(row, `Category${i}Name`);
    if (val) parts.push(val.replace(/\\/g, " > "));
  }
  return parts.join(" | ");
}

export function buildCategories(row: Record<string, string>): string[] {
  const cats: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const val = getField(row, `Category${i}Name`).replace(/\\/g, " > ");
    if (val) cats.push(val);
  }
  return cats;
}

export function formatPrice(priceHT: string, taxRate: string): string {
  const ht = parseFloat(priceHT);
  const tax = parseFloat(taxRate);
  if (isNaN(ht)) return "0.00 EUR";
  const rate = isNaN(tax) ? 0 : tax;
  const ttc = ht * (1 + rate / 100);
  return `${ttc.toFixed(2)} EUR`;
}

export function parseCSVRows(csvText: string): Article[] {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    delimiter: ";",
    quoteChar: '"',
    skipEmptyLines: true,
  });

  const items: Article[] = [];
  const seen = new Set<string>();

  for (const row of parsed.data) {
    const oxatisId = getField(row, "OxatisId");
    if (!oxatisId) continue;
    if (seen.has(oxatisId)) continue;
    seen.add(oxatisId);

    const qtyRaw = getField(row, "QtyInStock");
    const quantity = parseInt(qtyRaw, 10) || 0;
    const priceHT = getField(row, "Price1VATExcluded");
    const taxRate = getField(row, "TaxRate");

    items.push({
      oxatisId,
      itemSKU: getField(row, "ItemSKU"),
      title: getField(row, "Name"),
      link:
        getField(row, "ProductUrl") ||
        `https://www.elephantfilms.com/PBSCProduct.asp?ItmID=${oxatisId}`,
      price: formatPrice(priceHT, taxRate),
      priceHT: parseFloat(priceHT) ? parseFloat(priceHT).toFixed(2) : priceHT,
      salePrice: "",
      description: getField(row, "Description"),
      condition: getField(row, "ItemCondition"),
      ean: getField(row, "EANCode"),
      brand: getField(row, "BrandName"),
      imageUrl:
        getField(row, "UrlBigImgFileName") ||
        getField(row, "UrlSmallImgFileName") ||
        getField(row, "UrlZoomImgFileName"),
      category: "",
      productType: buildProductType(row),
      quantity,
      availability: quantity > 0 ? "in stock" : "out of stock",
      shippingWeight: getField(row, "Weight"),
      visible: getField(row, "Visible") === "1",
      cost: getField(row, "Cost"),
      categories: buildCategories(row),
      metaTitle: getField(row, "MetaTitle"),
      metaDescription: getField(row, "MetaDescription"),
    });
  }

  return items;
}
