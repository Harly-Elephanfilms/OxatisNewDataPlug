import Papa from "papaparse";

export interface SiteStockItem {
  oxatisId: string;
  itemSKU: string;
  name: string;
  qtyInStock: number;
  dateOfAvailability: string;
}

export function parseSiteStockCSV(csvText: string): SiteStockItem[] {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    delimiter: ";",
    quoteChar: '"',
    skipEmptyLines: true,
  });

  return parsed.data
    .filter((row) => row["ItemSKU"])
    .map((row) => ({
      oxatisId: row["OxatisId"] ?? "",
      itemSKU: row["ItemSKU"] ?? "",
      name: row["Name"] ?? "",
      qtyInStock: parseInt(row["QtyInStock"] ?? "0", 10) || 0,
      dateOfAvailability: row["DateOfAvailability"] ?? "",
    }));
}
