import { NextRequest } from "next/server";
import { getCredentials } from "@/lib/server-credentials";
import { getPreparationStates, updateOrderProgressState } from "@/lib/order-preparation";

export const dynamic = "force-dynamic";
const MAX_BATCH = 50;

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  let originMatches = false;
  try { originMatches = !!origin && new URL(origin).origin === request.nextUrl.origin; } catch { /* refusé ci-dessous */ }
  if (!originMatches) {
    return Response.json({ error: "Requête externe refusée." }, { status: 403 });
  }
  const { appId, token } = getCredentials(request);
  if (!appId || !token) return Response.json({ error: "Identifiants Oxatis requis." }, { status: 401 });

  let body: { orderIds?: unknown; progressStateId?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corps de requête invalide." }, { status: 400 });
  }
  const orderIds = Array.isArray(body.orderIds) ? body.orderIds : [];
  const stateId = typeof body.progressStateId === "string" ? body.progressStateId : "";
  if (!orderIds.length || orderIds.length > MAX_BATCH || orderIds.some((id) => typeof id !== "string" || !/^\d+$/.test(id) || Number(id) < 1)
    || new Set(orderIds).size !== orderIds.length || !/^\d+$/.test(stateId) || Number(stateId) < 1) {
    return Response.json({ error: `Sélection invalide (1 à ${MAX_BATCH} commandes par lot).` }, { status: 400 });
  }

  try {
    const states = await getPreparationStates(appId, token, request.signal);
    if (!states.some((state) => state.id === stateId)) {
      return Response.json({ error: "L’état d’avancement choisi n’existe plus dans Oxatis. Rechargez la liste." }, { status: 400 });
    }

    const results: { orderId: string; success: boolean; error?: string }[] = [];
    for (let offset = 0; offset < orderIds.length; offset += 3) {
      const batch = orderIds.slice(offset, offset + 3) as string[];
      const settled = await Promise.allSettled(batch.map((orderId) => updateOrderProgressState(appId, token, orderId, stateId, request.signal)));
      settled.forEach((result, index) => {
        if (result.status === "fulfilled") results.push({ orderId: batch[index], success: true });
        else results.push({ orderId: batch[index], success: false, error: result.reason instanceof Error ? result.reason.message : "Mise à jour refusée par Oxatis." });
      });
    }
    return Response.json({ results }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Impossible de changer l’avancement." }, { status: 502 });
  }
}
