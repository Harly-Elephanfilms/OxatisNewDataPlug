import { updateProductAvailability } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { oxatisResponse } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemSKU, dateOfAvailability } = body as {
      appId?: string;
      token?: string;
      itemSKU: string;
      dateOfAvailability: string; // YYYY-MM-DD ou "" pour effacer
    };
    const { appId, token } = getCredentials(body.appId, body.token);

    if (!appId || !token || !itemSKU) {
      return Response.json(
        { error: "Paramètres manquants (appId, token, itemSKU)" },
        { status: 400 }
      );
    }

    const xml = await updateProductAvailability(appId, token, itemSKU, dateOfAvailability ?? "");
    return oxatisResponse(xml, "Erreur mise à jour disponibilité");
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
