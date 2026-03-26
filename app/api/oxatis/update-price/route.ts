import { updateProductPriceHT } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { oxatisResponse } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemSKU, priceHT, tva } = body as {
      appId?: string;
      token?: string;
      itemSKU: string;
      priceHT: number;
      tva: number;
    };
    const { appId, token } = getCredentials(body.appId, body.token);

    if (!appId || !token || !itemSKU || priceHT == null) {
      return Response.json(
        { error: "Paramètres manquants (appId, token, itemSKU, priceHT)" },
        { status: 400 }
      );
    }

    const xml = await updateProductPriceHT(appId, token, itemSKU, priceHT, tva ?? 20);
    return oxatisResponse(xml, "Erreur mise à jour prix");
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
