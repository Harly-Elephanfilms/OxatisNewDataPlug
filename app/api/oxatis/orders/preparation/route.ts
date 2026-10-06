import { NextRequest } from "next/server";
import { getCredentials } from "@/lib/server-credentials";
import { getPreparationOrder, getPreparationSummaries, validatePreparationQuery } from "@/lib/order-preparation";
import type { PreparationOrder, PreparationPage } from "@/lib/order-export";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { appId, token } = getCredentials(request);
  if (!appId || !token) return Response.json({ error: "Configurez vos identifiants Oxatis dans Stock Manager." }, { status: 401 });
  let query: ReturnType<typeof validatePreparationQuery>;
  try {
    query = validatePreparationQuery(request.nextUrl.searchParams);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Paramètres invalides." }, { status: 400 });
  }
  try {
    const { summaries, totalItems, totalPages } = await getPreparationSummaries(appId, token, query, request.signal);
    const matching = summaries.filter((s) => query.mode === "unbilled" || s.progressStateId === query.stateId);
    const excludedShipped = query.includeShipped ? [] : matching.filter((s) => s.shipped).map((s) => s.oxId);
    const candidates = matching.filter((s) => query.includeShipped || !s.shipped);
    const orders: PreparationOrder[] = [];
    const errors: PreparationPage["errors"] = [];
    for (let offset = 0; offset < candidates.length; offset += 5) {
      if (request.signal.aborted) throw new Error("Récupération annulée.");
      const batch = candidates.slice(offset, offset + 5);
      const results = await Promise.allSettled(batch.map((s) => getPreparationOrder(appId, token, s.oxId, request.signal)));
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          errors.push({ orderId: batch[index].oxId, message: result.reason instanceof Error ? result.reason.message : "Lecture impossible." });
        } else {
          const order = result.value;
          // Le détail OWS omet parfois Shipped ; le résumé conserve ce marquage.
          order.shipped = order.shipped || batch[index].shipped;
          // Relit l'état : il peut avoir changé depuis la récupération du résumé.
          if (query.mode === "unbilled" ? !order.invoiceId : !!order.invoiceId && order.progressStateId === query.stateId) orders.push(order);
        }
      });
    }
    const data: PreparationPage = { orders, errors, page: query.page, totalPages, totalItems, scanned: summaries.length, excludedShipped };
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur de récupération des commandes." }, { status: 502 });
  }
}
