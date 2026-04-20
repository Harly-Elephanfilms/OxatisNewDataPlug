import { describe, it, expect } from "vitest";
import { parseSiteStockCSV } from "@/app/api/oxatis/fetch-site-stock/utils";

describe("parseSiteStockCSV", () => {
  const csv = [
    "OxatisId;ItemSKU;Name;QtyInStock;DateOfAvailability",
    "1;SKU-A;Article A;10;2026-06-01",
    "2;SKU-B;Article B;0;",
  ].join("\n");

  it("parses a normal line", () => {
    const items = parseSiteStockCSV(csv);
    expect(items[0]).toEqual({
      oxatisId: "1",
      itemSKU: "SKU-A",
      name: "Article A",
      qtyInStock: 10,
      dateOfAvailability: "2026-06-01",
    });
  });

  it("parses second line with empty date", () => {
    const items = parseSiteStockCSV(csv);
    expect(items[1].qtyInStock).toBe(0);
    expect(items[1].dateOfAvailability).toBe("");
  });

  it("sets qtyInStock to 0 when field is empty", () => {
    const csvEmpty = [
      "OxatisId;ItemSKU;Name;QtyInStock;DateOfAvailability",
      "3;SKU-C;Article C;;",
    ].join("\n");
    expect(parseSiteStockCSV(csvEmpty)[0].qtyInStock).toBe(0);
  });

  it("sets qtyInStock to 0 for NaN value", () => {
    const csvNaN = [
      "OxatisId;ItemSKU;Name;QtyInStock;DateOfAvailability",
      "4;SKU-D;Article D;abc;",
    ].join("\n");
    expect(parseSiteStockCSV(csvNaN)[0].qtyInStock).toBe(0);
  });

  it("filters out rows with no ItemSKU", () => {
    const csvNoSKU = [
      "OxatisId;ItemSKU;Name;QtyInStock;DateOfAvailability",
      "5;;Article E;1;",
    ].join("\n");
    expect(parseSiteStockCSV(csvNoSKU)).toHaveLength(0);
  });

  it("returns all rows when all have ItemSKU", () => {
    const items = parseSiteStockCSV(csv);
    expect(items).toHaveLength(2);
  });
});
