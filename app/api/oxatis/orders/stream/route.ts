// app/api/oxatis/orders/stream/route.ts
import { NextRequest } from "next/server";
import { getCredentials } from "@/lib/server-credentials";
import {
  getOrderCount,
  getAllOrderIds,
  getOrderDetails,
  aggregateOrders,
  ParsedOrder,
  SalesAnalysis,
} from "@/lib/oxatis-orders";
import { sleep } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

// Bornes de sécurité pour éviter une requête à durée de vie illimitée sur de
// larges plages de dates.
const MAX_ORDERS = 5000;      // plafond dur sur le nombre de commandes traitées
const BATCH_SIZE = 5;         // nombre d'appels getOrderDetails concurrents
const BATCH_DELAY_MS = 100;   // pause entre lots pour ménager l'API Oxatis

function emptyResult(from: string, to: string): SalesAnalysis {
  return {
    period: { from, to },
    summary: { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, ordersWithPromo: 0 },
    topProducts: [],
    revenueByDay: [],
    promoCodes: [],
  };
}

export async function GET(request: NextRequest) {
  const { appId, token } = getCredentials(request);
  if (!appId || !token) {
    return Response.json({ error: "Credentials requis" }, { status: 401 });
  }

  const from = request.nextUrl.searchParams.get("from") ?? "";
  const to = request.nextUrl.searchParams.get("to") ?? "";
  if (!from || !to) {
    return Response.json({ error: "Paramètres from et to requis" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        const total = await getOrderCount(appId, token, from, to);
        send({ type: "total", count: total });

        if (total === 0) {
          send({ type: "result", data: emptyResult(from, to), errors: 0 });
          controller.close();
          return;
        }

        const allIds = await getAllOrderIds(appId, token, from, to);

        // Plafonne le travail : au-delà de MAX_ORDERS on tronque et on le signale.
        const ids = allIds.slice(0, MAX_ORDERS);
        const truncated = allIds.length > MAX_ORDERS;
        if (truncated) {
          send({ type: "truncated", processed: ids.length, available: allIds.length });
        }

        const orders: ParsedOrder[] = [];
        let done = 0;
        let errors = 0;

        // Traitement concurrent par lots plutôt qu'un appel à la fois.
        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
          const batch = ids.slice(i, i + BATCH_SIZE);
          const settled = await Promise.allSettled(
            batch.map((id) => getOrderDetails(appId, token, id))
          );
          for (const r of settled) {
            if (r.status === "fulfilled") {
              if (r.value) orders.push(r.value);
            } else {
              errors++;
            }
          }
          done += batch.length;
          send({ type: "progress", done, total: ids.length, errors });
          if (i + BATCH_SIZE < ids.length) await sleep(BATCH_DELAY_MS);
        }

        const result = aggregateOrders(orders, from, to);
        send({ type: "result", data: result, errors });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Erreur inconnue",
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
