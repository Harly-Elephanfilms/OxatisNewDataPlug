import { updateProductName } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { oxatisResponse } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemSKU, name } = body as {
      appId?: string;
      token?: string;
      itemSKU: string;
      name: string;
    };
    const { appId, token } = getCredentials(body.appId, body.token);

    if (!appId || !token || !itemSKU || !name) {
      return Response.json(
        { error: "Paramètres manquants (appId, token, itemSKU, name)" },
        { status: 400 }
      );
    }

    const xml = await updateProductName(appId, token, itemSKU, name);
    return oxatisResponse(xml, "Erreur mise à jour nom");
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
