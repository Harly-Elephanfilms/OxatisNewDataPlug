import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { buildSalesWorkbook } from "@/app/analytics/utils/salesWorkbook";

describe("buildSalesWorkbook", () => {
  it("exports the summary and every visible sales table into separate sheets", () => {
    const workbook = buildSalesWorkbook({
      period: { from: "2026-09-01", to: "2026-09-30" },
      summary: { totalOrders: 2, totalRevenue: 125.555, avgOrderValue: 62.7775, ordersWithPromo: 1 },
      topProducts: [{ sku: "SKU-1", name: "Film", quantity: 3, revenue: 75.5 }],
      allProducts: [{ sku: "SKU-1", name: "Film", quantity: 3, revenue: 75.5, orderCount: 2, promoQuantity: 2, noPromoQuantity: 1, promoRevenue: 50, noPromoRevenue: 25.5, promoOrderCount: 1, noPromoOrderCount: 1 }],
      revenueByDay: [{ date: "2026-09-02", revenue: 125.555, orders: 2 }],
      promoCodes: [{ code: "RENTREE", usageCount: 1, totalDiscount: 5 }],
    });

    expect(workbook.SheetNames).toEqual(["Résumé", "Ventes par jour", "Articles", "Codes promo"]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets["Résumé"], { header: 1 })).toContainEqual([
      "Chiffre d'affaires net (€)",
      125.56,
    ]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets["Articles"], { header: 1 })).toContainEqual([
      "SKU-1",
      "Film",
      3,
      1,
      2,
      50,
      1,
      1,
      25.5,
      75.5,
    ]);
  });
});
