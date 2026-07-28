import { updateProductPriceHT } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { oxatisResponse, badRequest, toFiniteNumber } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      itemSKU?: unknown;
      priceHT?: unknown;
      tva?: unknown;
    };
    const { appId, token } = getCredentials(request);
    const { itemSKU } = body;

    if (!appId || !token || typeof itemSKU !== "string" || !itemSKU) {
      return badRequest("Paramètres manquants (appId, token, itemSKU)");
    }

    const priceHT = toFiniteNumber(body.priceHT);
    if (priceHT === null) return badRequest("priceHT doit être un nombre");

    const tva = body.tva == null ? 20 : toFiniteNumber(body.tva);
    if (tva === null) return badRequest("tva doit être un nombre");

    const xml = await updateProductPriceHT(appId, token, itemSKU, priceHT, tva);
    return oxatisResponse(xml);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
