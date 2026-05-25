import { describe, it, expect } from "vitest";
import {
  buildCategories,
  formatPrice,
  parseCSVRows,
} from "@/app/api/oxatis/fetch-articles/utils";

describe("buildCategories", () => {
  it("returns categories for filled slots", () => {
    const row = {
      Category1Name: "Films\\Action",
      Category2Name: "Films\\Drama",
      Category3Name: "",
    };
    expect(buildCategories(row)).toEqual(["Films > Action", "Films > Drama"]);
  });

  it("filters empty slots", () => {
    const row = { Category1Name: "", Category2Name: "Docs" };
    expect(buildCategories(row)).toEqual(["Docs"]);
  });

  it("returns empty array when all slots empty", () => {
    expect(buildCategories({})).toEqual([]);
  });

  it("handles backslash-separated paths with multiple levels", () => {
    const row = { Category1Name: "A\\B\\C" };
    expect(buildCategories(row)).toEqual(["A > B > C"]);
  });
});

describe("formatPrice", () => {
  it("computes TTC from HT + tax rate", () => {
    expect(formatPrice("100", "20")).toBe("120.00 EUR");
  });

  it("returns 0.00 EUR for empty price", () => {
    expect(formatPrice("", "20")).toBe("0.00 EUR");
  });

  it("returns 0.00 EUR for non-numeric price", () => {
    expect(formatPrice("abc", "20")).toBe("0.00 EUR");
  });

  it("uses rate 0 when taxRate is empty", () => {
    expect(formatPrice("50", "")).toBe("50.00 EUR");
  });

  it("uses rate 0 when taxRate is NaN", () => {
    expect(formatPrice("50", "abc")).toBe("50.00 EUR");
  });
});

describe("parseCSVRows", () => {
  const csvWith2Rows = [
    "OxatisId;ItemSKU;Name;Price1VATExcluded;TaxRate;QtyInStock;Visible",
    "1;SKU-A;Article A;10;20;5;1",
    "2;SKU-B;Article B;20;0;0;0",
  ].join("\n");

  it("parses rows correctly", () => {
    const items = parseCSVRows(csvWith2Rows);
    expect(items).toHaveLength(2);
    expect(items[0].oxatisId).toBe("1");
    expect(items[0].itemSKU).toBe("SKU-A");
    expect(items[0].price).toBe("12.00 EUR");
    expect(items[0].quantity).toBe(5);
    expect(items[0].visible).toBe(true);
    expect(items[1].visible).toBe(false);
  });

  it("deduplicates by OxatisId", () => {
    const csv = [
      "OxatisId;ItemSKU;Name;Price1VATExcluded;TaxRate;QtyInStock;Visible",
      "1;SKU-A;Article A;10;20;5;1",
      "1;SKU-A;Article A dupe;10;20;3;1",
    ].join("\n");
    expect(parseCSVRows(csv)).toHaveLength(1);
  });

  it("skips rows with missing OxatisId", () => {
    const csv = [
      "OxatisId;ItemSKU;Name;Price1VATExcluded;TaxRate;QtyInStock;Visible",
      ";SKU-X;No ID;10;20;1;1",
    ].join("\n");
    expect(parseCSVRows(csv)).toHaveLength(0);
  });

  it("sets quantity to 0 for empty QtyInStock", () => {
    const csv = [
      "OxatisId;ItemSKU;Name;Price1VATExcluded;TaxRate;QtyInStock;Visible",
      "3;SKU-C;Article C;10;20;;1",
    ].join("\n");
    const items = parseCSVRows(csv);
    expect(items[0].quantity).toBe(0);
    expect(items[0].availability).toBe("out of stock");
  });

  it("sets availability to in stock when quantity > 0", () => {
    const items = parseCSVRows(csvWith2Rows);
    expect(items[0].availability).toBe("in stock");
    expect(items[1].availability).toBe("out of stock");
  });
});
