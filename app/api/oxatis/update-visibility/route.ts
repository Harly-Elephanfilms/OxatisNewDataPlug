import { updateProductVisible } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { oxatisResponse } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemSKU, visible } = body as {
      appId?: string;
      token?: string;
      itemSKU: string;
      visible: boolean;
    };
    const { appId, token } = getCredentials(body.appId, body.token);

    if (!appId || !token || !itemSKU || visible === undefined) {
      return Response.json(
        { error: "Paramètres manquants (appId, token, itemSKU, visible)" },
        { status: 400 }
      );
    }

    const xml = await updateProductVisible(appId, token, itemSKU, visible);
    return oxatisResponse(xml, "Erreur mise à jour visibilité");
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
