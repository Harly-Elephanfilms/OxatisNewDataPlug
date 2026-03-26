import { updateProductOutOfStock } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { oxatisResponse } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemSKU, showIfOutOfStock, saleIfOutOfStock, saleIfOutOfStockScenario } = body as {
      appId?: string;
      token?: string;
      itemSKU: string;
      showIfOutOfStock: boolean;
      saleIfOutOfStock: boolean;
      saleIfOutOfStockScenario: number;
    };
    const { appId, token } = getCredentials(body.appId, body.token);

    if (!appId || !token || !itemSKU) {
      return Response.json(
        { error: "Paramètres manquants (appId, token, itemSKU)" },
        { status: 400 }
      );
    }

    const xml = await updateProductOutOfStock(
      appId,
      token,
      itemSKU,
      !!showIfOutOfStock,
      !!saleIfOutOfStock,
      saleIfOutOfStockScenario ?? 0
    );
    return oxatisResponse(xml, "Erreur mise à jour comportement hors stock");
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
