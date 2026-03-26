import { deleteProduct } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { oxatisResponse } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { oxatisId } = body as {
      appId?: string;
      token?: string;
      oxatisId: string;
    };
    const { appId, token } = getCredentials(body.appId, body.token);

    if (!appId || !token || !oxatisId) {
      return Response.json(
        { error: "Paramètres manquants (appId, token, oxatisId)" },
        { status: 400 }
      );
    }

    const xml = await deleteProduct(appId, token, oxatisId);
    return oxatisResponse(xml, "Erreur suppression produit");
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
