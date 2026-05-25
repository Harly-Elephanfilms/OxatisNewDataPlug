import { updateProductPriceHT } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { oxatisResponse } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      itemSKU: string;
      priceHT: number;
      tva: number;
    };
    const { appId, token } = getCredentials(request);
    const { itemSKU, priceHT, tva } = body;

    if (!appId || !token || !itemSKU || priceHT == null) {
      return Response.json(
        { error: "Paramètres manquants (appId, token, itemSKU, priceHT)" },
        { status: 400 }
      );
    }

    const xml = await updateProductPriceHT(appId, token, itemSKU, priceHT, tva ?? 20);
    return oxatisResponse(xml);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
