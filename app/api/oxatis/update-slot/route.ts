import { updateSingleSlot } from "@/lib/oxatis-api";
import type { CategoryAssignment } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { oxatisResponse, badRequest } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      oxatisId?: unknown;
      slot?: unknown;
      category?: CategoryAssignment | null;
    };
    const { appId, token } = getCredentials(request);
    const { oxatisId, slot, category } = body;

    if (!appId || !token || typeof oxatisId !== "string" || !oxatisId) {
      return badRequest("Paramètres manquants (appId, token, oxatisId)");
    }

    // slot est interpolé dans le nom de balise <Category{slot}> : doit être un entier 1–10.
    if (typeof slot !== "number" || !Number.isInteger(slot) || slot < 1 || slot > 10) {
      return badRequest("slot doit être un entier entre 1 et 10");
    }

    const xmlResponse = await updateSingleSlot(appId, token, oxatisId, slot, category ?? null);
    return oxatisResponse(xmlResponse);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
