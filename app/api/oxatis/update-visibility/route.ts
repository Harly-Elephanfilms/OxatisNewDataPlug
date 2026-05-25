import { updateProductVisible } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { oxatisResponse } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      itemSKU: string;
      visible: boolean;
    };
    const { appId, token } = getCredentials(request);
    const { itemSKU, visible } = body;

    if (!appId || !token || !itemSKU || visible === undefined) {
      return Response.json(
        { error: "Paramètres manquants (appId, token, itemSKU, visible)" },
        { status: 400 }
      );
    }

    const xml = await updateProductVisible(appId, token, itemSKU, visible);
    return oxatisResponse(xml);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
