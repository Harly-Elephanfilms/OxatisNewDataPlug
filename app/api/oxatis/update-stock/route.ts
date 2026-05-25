import { updateStockBySKU } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { extractXml } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { appId: bodyAppId, token: bodyToken, items } = await request.json() as {
      appId?: string;
      token?: string;
      items: { itemSKU: string; quantity: number }[];
    };
    const { appId, token } = getCredentials(request, bodyAppId, bodyToken);

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

    const batchSize = 10;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      const promises = batch.map(async (item) => {
        try {
          const responseXml = await updateStockBySKU(appId, token, item.itemSKU, item.quantity);
          const statusCode = extractXml(responseXml, "StatusCode");
          if (statusCode === "200") {
            results.success.push(item.itemSKU);
          } else {
            const errorMsg = extractXml(responseXml, "ErrorDetails") || "Erreur inconnue";
            results.errors.push(`${item.itemSKU}: ${errorMsg}`);
          }
        } catch (err) {
          results.errors.push(`${item.itemSKU}: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
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
