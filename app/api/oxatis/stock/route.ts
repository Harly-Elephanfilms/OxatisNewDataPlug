import { getStockBySKU } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { extractXml } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

interface StockResult {
  oxatisId: string;
  itemSKU: string;
  name: string;
  qtyInStock: number;
}

function parseProductStockResponse(xml: string): StockResult | null {
  const statusCode = extractXml(xml, "StatusCode");
  if (statusCode !== "200") return null;

  const oxatisId = extractXml(xml, "OxID");
  const itemSKU = extractXml(xml, "ItemSKU");

  // QuantityInStock > Value
  const qtyMatch = xml.match(/<QuantityInStock>[\s\S]*?<Value>([^<]*)<\/Value>/);
  const qtyInStock = qtyMatch ? parseInt(qtyMatch[1], 10) || 0 : 0;

  if (!oxatisId || oxatisId === "-1") return null;

  return { oxatisId, itemSKU, name: "", qtyInStock };
}

export async function POST(request: NextRequest) {
  try {
    const { appId: bodyAppId, token: bodyToken, skus } = await request.json() as { appId?: string; token?: string; skus: { sku: string; name: string; oxatisId?: string }[] };
    const { appId, token } = getCredentials(request, bodyAppId, bodyToken);

    if (!appId || !token) {
      return Response.json({ error: "AppId et Token requis" }, { status: 400 });
    }

    if (!skus || !Array.isArray(skus) || skus.length === 0) {
      return Response.json({
        error: "Liste de SKUs requise. Importez d'abord un CSV avec les références produits."
      }, { status: 400 });
    }

    // Test credentials first with the first SKU
    const testXml = await getStockBySKU(appId, token, skus[0].sku);
    if (testXml.includes("<StatusCode>503</StatusCode>")) {
      return Response.json({ error: "Identifiants API invalides (erreur 503 - Unauthorized)" }, { status: 401 });
    }

    const allStockResults: StockResult[] = [];
    const errors: string[] = [];

    // Process SKUs in parallel batches of 10 (to avoid overloading API)
    const batchSize = 10;
    for (let i = 0; i < skus.length; i += batchSize) {
      const batch = skus.slice(i, i + batchSize);

      const promises = batch.map(async (item: { sku: string; name: string; oxatisId?: string }) => {
        try {
          const xml = await getStockBySKU(appId, token, item.sku);
          const result = parseProductStockResponse(xml);

          if (result) {
            result.name = item.name || "";
            // Use provided oxatisId if API didn't return one
            if (!result.oxatisId && item.oxatisId) {
              result.oxatisId = item.oxatisId;
            }
            return result;
          }
          return null;
        } catch (err) {
          errors.push(`SKU ${item.sku}: ${err instanceof Error ? err.message : "erreur"}`);
          return null;
        }
      });

      const results = await Promise.all(promises);
      for (const r of results) {
        if (r) allStockResults.push(r);
      }
    }

    return Response.json({
      total: allStockResults.length,
      items: allStockResults,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return Response.json({ error: message }, { status: 500 });
  }
}
