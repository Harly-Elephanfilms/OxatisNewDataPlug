import { NextRequest } from "next/server";
import { getCredentials } from "@/lib/server-credentials";
import { getPreparationStates } from "@/lib/order-preparation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { appId, token } = getCredentials(request);
  if (!appId || !token) return Response.json({ error: "Identifiants Oxatis requis." }, { status: 401 });
  try {
    const states = await getPreparationStates(appId, token, request.signal);
    return Response.json({ states }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Impossible de lire les états d’avancement." }, { status: 502 });
  }
}
