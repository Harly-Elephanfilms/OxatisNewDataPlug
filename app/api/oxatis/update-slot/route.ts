import { updateSingleSlot } from "@/lib/oxatis-api";
import type { CategoryAssignment } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { oxatisResponse } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      oxatisId: string;
      slot: number;
      category: CategoryAssignment | null;
    };
    const { appId, token } = getCredentials(request);
    const { oxatisId, slot, category } = body;

    if (!appId || !token || !oxatisId || !slot) {
      return Response.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const xmlResponse = await updateSingleSlot(appId, token, oxatisId, slot, category);
    return oxatisResponse(xmlResponse);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
