import * as XLSX from "xlsx";
import type { SalesAnalysis } from "@/lib/oxatis-orders";

const euro = (value: number) => Math.round(value * 100) / 100;

export function buildSalesWorkbook(result: SalesAnalysis): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["Indicateur", "Valeur"],
      ["Période du", result.period.from],
      ["Période au", result.period.to],
      ["Commandes", result.summary.totalOrders],
      ["Chiffre d'affaires net (€)", euro(result.summary.totalRevenue)],
      ["Panier moyen (€)", euro(result.summary.avgOrderValue)],
      ["Commandes avec code promo", result.summary.ordersWithPromo],
    ]),
    "Résumé"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      result.revenueByDay.map((day) => ({
        Date: day.date,
        "Chiffre d'affaires net (€)": euro(day.revenue),
        Commandes: day.orders,
      }))
    ),
    "Ventes par jour"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      result.allProducts.map((product) => ({
        Référence: product.sku,
        Article: product.name,
        "Quantité vendue": product.quantity,
        "Commandes avec code promo": product.promoOrderCount,
        "Unités dans commandes avec code promo": product.promoQuantity,
        "CA dans commandes avec code promo (€)": euro(product.promoRevenue),
        "Commandes sans code promo": product.noPromoOrderCount,
        "Unités dans commandes sans code promo": product.noPromoQuantity,
        "CA dans commandes sans code promo (€)": euro(product.noPromoRevenue),
        "Chiffre d'affaires net (€)": euro(product.revenue),
      }))
    ),
    "Articles"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      result.promoCodes.map((promo) => ({
        "Code promo": promo.code,
        Utilisations: promo.usageCount,
        "Remise totale (€)": euro(promo.totalDiscount),
      }))
    ),
    "Codes promo"
  );

  return workbook;
}
