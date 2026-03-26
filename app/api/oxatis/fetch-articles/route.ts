import Papa from "papaparse";
import type { Article } from "@/lib/types";

const ARTICLES_CSV_URL =
  "http://www.elephantfilms.com/Data/DataPlug/All/Oxatis-All-elysee-40682.csv";

function getField(row: Record<string, string>, key: string): string {
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

function buildCategories(row: Record<string, string>): string[] {
  const cats: string[] = [];
  for (let i = 1; i <= 10; i++) {
    cats.push(getField(row, `Category${i}Name`).replace(/\\/g, " > "));
  }
  return cats;
}

function formatPrice(priceHT: string, taxRate: string): string {
  const ht = parseFloat(priceHT);
  const tax = parseFloat(taxRate);
  if (isNaN(ht)) return "0.00 EUR";
  const rate = isNaN(tax) ? 0 : tax;
  const ttc = ht * (1 + rate / 100);
  return `${ttc.toFixed(2)} EUR`;
}

function parseCSVRows(csvText: string): Article[] {
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
      link: getField(row, "ProductUrl") || `https://www.elephantfilms.com/PBSCProduct.asp?ItmID=${oxatisId}`,
      price: formatPrice(priceHT, taxRate),
      priceHT: parseFloat(priceHT) ? parseFloat(priceHT).toFixed(2) : priceHT,
      salePrice: "",
      description: getField(row, "Description"),
      condition: getField(row, "ItemCondition"),
      ean: getField(row, "EANCode"),
      brand: getField(row, "BrandName"),
      imageUrl: getField(row, "UrlBigImgFileName") || getField(row, "UrlSmallImgFileName") || getField(row, "UrlZoomImgFileName"),
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

export async function GET() {
  try {
    const response = await fetch(ARTICLES_CSV_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return Response.json(
        { error: `Erreur HTTP ${response.status} lors du téléchargement du CSV` },
        { status: 500 }
      );
    }

    // Le CSV Oxatis est en Windows-1252 (caractères accentués)
    const buffer = await response.arrayBuffer();
    const csvText = new TextDecoder("windows-1252").decode(buffer);

    if (csvText.includes("<!DOCTYPE html") || csvText.includes("<html")) {
      return Response.json(
        { error: "Le serveur a retourné du HTML au lieu du CSV (Cloudflare)" },
        { status: 502 }
      );
    }

    const items = parseCSVRows(csvText);

    return Response.json({
      count: items.length,
      items,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
