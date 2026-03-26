import { updateSingleSlot } from "@/lib/oxatis-api";
import type { CategoryAssignment } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { oxatisResponse } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { oxatisId, slot, category } = body as {
      appId?: string;
      token?: string;
      oxatisId: string;
      slot: number;
      category: CategoryAssignment | null;
    };
    const { appId, token } = getCredentials(body.appId, body.token);

    if (!appId || !token || !oxatisId || !slot) {
      return Response.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const xmlResponse = await updateSingleSlot(appId, token, oxatisId, slot, category);
    return oxatisResponse(xmlResponse, "Erreur mise à jour slot catégorie");
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
