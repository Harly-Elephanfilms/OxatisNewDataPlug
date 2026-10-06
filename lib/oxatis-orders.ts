import { extractXml } from "@/lib/api-helpers";

const ORDER_SERVICES_URL =
  "https://webservices.oxatis.com/webservices/httpservices/OrderServices.aspx";

const XML_NS =
  'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"';

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  lineRevenue: number;
}

export interface ParsedOrder {
  oxId: string;
  date: string;
  netAmount: number;
  coupon: string;
  globalDiscountAmount: number;
  items: OrderItem[];
}

export interface SalesAnalysis {
  period: { from: string; to: string };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    ordersWithPromo: number;
  };
  topProducts: Array<{ sku: string; name: string; quantity: number; revenue: number }>;
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
  promoCodes: Array<{ code: string; usageCount: number; totalDiscount: number }>;
}

export async function callOrderApi(
  appId: string,
  token: string,
  method: string,
  data: string,
  options: { url?: string; signal?: AbortSignal } = {}
): Promise<string> {
  const body = `AppId=${encodeURIComponent(appId)}&Token=${encodeURIComponent(token)}&Method=${encodeURIComponent(method)}&Data=${encodeURIComponent(data)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  let response: Response;
  try {
    response = await fetch(options.url ?? ORDER_SERVICES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: options.signal
        ? AbortSignal.any([controller.signal, options.signal])
        : controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} — méthode : ${method}`);
    return await response.text();
  } catch (err) {
    if (options.signal?.aborted) throw err;
    if (err instanceof Error && err.message.startsWith("HTTP ")) throw err;
    const isTimeout = err instanceof Error && err.name === "AbortError";
    throw new Error(isTimeout ? `Timeout — méthode : ${method}` : `Erreur réseau — méthode : ${method}`);
  } finally {
    clearTimeout(timeout);
  }
}

export function parseOrderCount(xml: string): number {
  if (!xml.includes("<StatusCode>200</StatusCode>")) return 0;
  const count = extractXml(xml, "Count");
  return parseInt(count, 10) || 0;
}

export function parseOrderIds(xml: string): string[] {
  const block = xml.match(/<OrderIDs>([\s\S]*?)<\/OrderIDs>/);
  if (!block) return [];
  const ids: string[] = [];
  // Oxatis renvoie <OrderID><OxID>123</OxID></OrderID> (imbriqué). On accepte
  // aussi la forme plate <OrderID>123</OrderID> par robustesse.
  const re = /<OrderID>\s*(?:<OxID>\s*)?(\d+)\s*(?:<\/OxID>\s*)?<\/OrderID>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block[1])) !== null) ids.push(m[1]);
  return ids;
}

export function parseTotalPages(xml: string): number {
  const m = xml.match(/<TotalPages>(\d+)<\/TotalPages>/);
  return m ? Math.max(1, parseInt(m[1], 10)) : 1;
}

export function parseOrderDetails(xml: string): ParsedOrder | null {
  if (!xml.includes("<StatusCode>200</StatusCode>")) return null;

  const itemsBlock = xml.match(/<OrderItems>([\s\S]*?)<\/OrderItems>/);
  const items: OrderItem[] = [];
  if (itemsBlock) {
    const re = /<Item>([\s\S]*?)<\/Item>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(itemsBlock[1])) !== null) {
      const itemXml = m[1];
      const sku = extractXml(itemXml, "ItemSKU");
      const name = extractXml(itemXml, "ItemName");
      const quantity = parseInt(extractXml(itemXml, "Quantity"), 10) || 0;
      const lineRevenue = parseFloat(extractXml(itemXml, "LineNetAmount")) || 0;
      if (sku) items.push({ sku, name, quantity, lineRevenue });
    }
  }

  const dateRaw = extractXml(xml, "Date");
  const date = dateRaw ? dateRaw.split("T")[0] : "";

  return {
    oxId: extractXml(xml, "OxID"),
    date,
    netAmount: parseFloat(extractXml(xml, "NetAmountDue")) || 0,
    coupon: extractXml(xml, "CartCoupon"),
    globalDiscountAmount: parseFloat(extractXml(xml, "GlobalDiscountAmount")) || 0,
    items,
  };
}

export function aggregateOrders(
  orders: ParsedOrder[],
  from: string,
  to: string
): SalesAnalysis {
  let totalRevenue = 0;
  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  const dayMap = new Map<string, { revenue: number; orders: number }>();
  const promoMap = new Map<string, { usageCount: number; totalDiscount: number }>();

  for (const order of orders) {
    totalRevenue += order.netAmount;

    const dayEntry = dayMap.get(order.date) ?? { revenue: 0, orders: 0 };
    dayMap.set(order.date, {
      revenue: dayEntry.revenue + order.netAmount,
      orders: dayEntry.orders + 1,
    });

    if (order.coupon) {
      const p = promoMap.get(order.coupon) ?? { usageCount: 0, totalDiscount: 0 };
      promoMap.set(order.coupon, {
        usageCount: p.usageCount + 1,
        totalDiscount: p.totalDiscount + order.globalDiscountAmount,
      });
    }

    for (const item of order.items) {
      const p = productMap.get(item.sku) ?? { name: item.name, quantity: 0, revenue: 0 };
      productMap.set(item.sku, {
        name: item.name || p.name,
        quantity: p.quantity + item.quantity,
        revenue: p.revenue + item.lineRevenue,
      });
    }
  }

  const ordersWithPromo = orders.filter((o) => o.coupon).length;

  return {
    period: { from, to },
    summary: {
      totalOrders: orders.length,
      totalRevenue,
      avgOrderValue: orders.length ? totalRevenue / orders.length : 0,
      ordersWithPromo,
    },
    topProducts: Array.from(productMap.entries())
      .map(([sku, v]) => ({ sku, ...v }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10),
    revenueByDay: Array.from(dayMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    promoCodes: Array.from(promoMap.entries())
      .map(([code, v]) => ({ code, ...v }))
      .sort((a, b) => b.usageCount - a.usageCount),
  };
}

export async function getOrderCount(
  appId: string,
  token: string,
  from: string,
  to: string
): Promise<number> {
  const data = `<?xml version="1.0" encoding="utf-8"?><OrderList ${XML_NS}><OrderDateStart>${from}T00:00:00</OrderDateStart><OrderDateEnd>${to}T23:59:59</OrderDateEnd></OrderList>`;
  const xml = await callOrderApi(appId, token, "OrderCount", data);
  return parseOrderCount(xml);
}

export async function getAllOrderIds(
  appId: string,
  token: string,
  from: string,
  to: string
): Promise<string[]> {
  const allIds: string[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const data = `<?xml version="1.0" encoding="utf-8"?><OrderList ${XML_NS}><PageInformation><PageNumber>${page}</PageNumber><PageSize>100</PageSize></PageInformation><OrderDateStart>${from}T00:00:00</OrderDateStart><OrderDateEnd>${to}T23:59:59</OrderDateEnd></OrderList>`;
    const xml = await callOrderApi(appId, token, "OrderGetList", data);
    allIds.push(...parseOrderIds(xml));
    totalPages = parseTotalPages(xml);
    page++;
  } while (page <= Math.min(totalPages, 500));

  return allIds;
}

export async function getOrderDetails(
  appId: string,
  token: string,
  orderId: string
): Promise<ParsedOrder | null> {
  if (!/^\d+$/.test(orderId)) throw new Error(`Invalid orderId: ${orderId}`);
  const data = `<?xml version="1.0" encoding="utf-8"?><Order ${XML_NS}><OxID>${orderId}</OxID></Order>`;
  const xml = await callOrderApi(appId, token, "OrderGetDetails", data);
  return parseOrderDetails(xml);
}
