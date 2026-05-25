import { deleteProduct } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { oxatisResponse } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { oxatisId: string };
    const { appId, token } = getCredentials(request);
    const { oxatisId } = body;

    if (!appId || !token || !oxatisId) {
      return Response.json(
        { error: "Paramètres manquants (appId, token, oxatisId)" },
        { status: 400 }
      );
    }

    const xml = await deleteProduct(appId, token, oxatisId);
    return oxatisResponse(xml);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
