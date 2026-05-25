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

export const dynamic = "force-dynamic";

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
        const orders: ParsedOrder[] = [];
        let done = 0;
        let errors = 0;

        for (const id of allIds) {
          try {
            const order = await getOrderDetails(appId, token, id);
            if (order) orders.push(order);
          } catch {
            errors++;
          }
          done++;
          send({ type: "progress", done, total: allIds.length, errors });
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
