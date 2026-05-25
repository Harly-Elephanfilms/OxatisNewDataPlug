import { updateProductName } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { oxatisResponse } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      itemSKU: string;
      name: string;
    };
    const { appId, token } = getCredentials(request);
    const { itemSKU, name } = body;

    if (!appId || !token || !itemSKU || !name) {
      return Response.json(
        { error: "Paramètres manquants (appId, token, itemSKU, name)" },
        { status: 400 }
      );
    }

    const xml = await updateProductName(appId, token, itemSKU, name);
    return oxatisResponse(xml);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
