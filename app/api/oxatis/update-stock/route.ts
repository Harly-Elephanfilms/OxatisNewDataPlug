import { updateStockBySKU } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { NextRequest } from "next/server";

function parseXmlValue(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`);
  const match = xml.match(regex);
  return match ? match[1] : "";
}

export async function POST(request: NextRequest) {
  try {
    const { appId: bodyAppId, token: bodyToken, items } = await request.json();
    const { appId, token } = getCredentials(bodyAppId, bodyToken);

    if (!appId || !token || !items || !Array.isArray(items)) {
      return Response.json(
        { error: "AppId, Token et items requis" },
        { status: 400 }
      );
    }

    const results: { success: string[]; errors: string[] } = {
      success: [],
      errors: [],
    };

    // Update one by one (API only accepts one product per call)
    // Process in parallel batches of 10
    const batchSize = 10;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      const promises = batch.map(async (item: { itemSKU: string; quantity: number }) => {
        try {
          const responseXml = await updateStockBySKU(appId, token, item.itemSKU, item.quantity);

          const statusCode = parseXmlValue(responseXml, "StatusCode");
          if (statusCode === "200") {
            results.success.push(item.itemSKU);
          } else {
            const errorMsg = parseXmlValue(responseXml, "ErrorDetails") || "Erreur inconnue";
            results.errors.push(`${item.itemSKU}: ${errorMsg}`);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Erreur inconnue";
          results.errors.push(`${item.itemSKU}: ${message}`);
        }
      });

      await Promise.all(promises);
    }

    return Response.json({
      updated: results.success.length,
      errors: results.errors,
      total: items.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return Response.json({ error: message }, { status: 500 });
  }
}
