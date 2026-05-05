# Sales Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un onglet "Ventes" à la page Analytics existante qui interroge l'API Oxatis Order en temps réel (SSE), affiche une barre de progression, puis des graphiques (top articles vendus, CA par jour, codes promo).

**Architecture:** SSE endpoint `/api/oxatis/orders/stream` qui appelle Oxatis séquentiellement (`OrderCount` → `OrderGetList` → `OrderGetDetails` × N), émet la progression en temps réel, puis le résultat agrégé. Côté client, un hook `useSalesAnalysis` consomme le SSE et alimente 6 composants Recharts.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, Recharts

---

## File Map

| Fichier | Action | Rôle |
|---------|--------|------|
| `lib/oxatis-orders.ts` | Créer | Appels Oxatis Order API + parsing XML + agrégation |
| `__tests__/lib/oxatis-orders.test.ts` | Créer | Tests unitaires parsing + agrégation |
| `app/api/oxatis/orders/stream/route.ts` | Créer | SSE endpoint — orchestration + progression |
| `app/analytics/hooks/useSalesAnalysis.ts` | Créer | Hook React — consomme SSE, expose état |
| `app/analytics/components/SalesDatePicker.tsx` | Créer | Sélecteur de période (7j / 30j / 3 mois / custom) |
| `app/analytics/components/SalesProgress.tsx` | Créer | Barre de progression pendant l'analyse |
| `app/analytics/components/SalesSummaryCards.tsx` | Créer | 4 cartes résumé (commandes, CA, panier moyen, promos) |
| `app/analytics/components/TopProductsChart.tsx` | Créer | Bar chart horizontal top 10 articles |
| `app/analytics/components/RevenueChart.tsx` | Créer | Line chart CA par jour |
| `app/analytics/components/PromoCodeTable.tsx` | Créer | Tableau codes promo |
| `app/analytics/page.tsx` | Modifier | Ajouter onglet "Ventes" + câbler les composants |

---

## Task 1 : Installer Recharts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Installer Recharts**

```bash
npm install recharts
```

Expected output: `added N packages` (aucune erreur).

- [ ] **Step 2: Vérifier l'installation**

```bash
node -e "require('recharts'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add recharts dependency"
```

---

## Task 2 : Créer `lib/oxatis-orders.ts` — types, parsing, agrégation

**Files:**
- Create: `lib/oxatis-orders.ts`

- [ ] **Step 1: Créer le fichier avec types et constante URL**

```typescript
// lib/oxatis-orders.ts
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
  date: string;            // YYYY-MM-DD
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
```

- [ ] **Step 2: Ajouter la fonction `callOrderApi` interne**

Ajouter sous les types :

```typescript
async function callOrderApi(
  appId: string,
  token: string,
  method: string,
  data: string
): Promise<string> {
  const body = `AppId=${encodeURIComponent(appId)}&Token=${encodeURIComponent(token)}&Method=${encodeURIComponent(method)}&Data=${encodeURIComponent(data)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  let response: Response;
  try {
    response = await fetch(ORDER_SERVICES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    throw new Error(isTimeout ? `Timeout — méthode : ${method}` : `Erreur réseau — méthode : ${method}`);
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status} — méthode : ${method}`);
  return response.text();
}
```

- [ ] **Step 3: Ajouter les 3 fonctions de parsing pures (exportées pour les tests)**

```typescript
export function parseOrderCount(xml: string): number {
  if (!xml.includes("<StatusCode>200</StatusCode>")) return 0;
  const count = extractXml(xml, "Count");
  return parseInt(count, 10) || 0;
}

export function parseOrderIds(xml: string): string[] {
  const block = xml.match(/<OrderIDs>([\s\S]*?)<\/OrderIDs>/);
  if (!block) return [];
  const ids: string[] = [];
  const re = /<OrderID>(\d+)<\/OrderID>/g;
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
```

- [ ] **Step 4: Ajouter la fonction d'agrégation et les fonctions d'appel API**

```typescript
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
  const data = `<?xml version="1.0" encoding="utf-8"?><Orders ${XML_NS}><StartDate>${from}T00:00:00</StartDate><EndDate>${to}T23:59:59</EndDate></Orders>`;
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
    const data = `<?xml version="1.0" encoding="utf-8"?><Orders ${XML_NS}><StartDate>${from}T00:00:00</StartDate><EndDate>${to}T23:59:59</EndDate><PageNumber>${page}</PageNumber><PageSize>100</PageSize></Orders>`;
    const xml = await callOrderApi(appId, token, "OrderGetList", data);
    allIds.push(...parseOrderIds(xml));
    totalPages = parseTotalPages(xml);
    page++;
  } while (page <= totalPages);

  return allIds;
}

export async function getOrderDetails(
  appId: string,
  token: string,
  orderId: string
): Promise<ParsedOrder | null> {
  const data = `<?xml version="1.0" encoding="utf-8"?><Order ${XML_NS}><OxID>${orderId}</OxID></Order>`;
  const xml = await callOrderApi(appId, token, "OrderGetDetails", data);
  return parseOrderDetails(xml);
}
```

- [ ] **Step 5: Vérifier que le fichier compile**

```bash
npx tsc --noEmit
```

Expected: aucune erreur TypeScript.

---

## Task 3 : Tests unitaires des fonctions de parsing

**Files:**
- Create: `__tests__/lib/oxatis-orders.test.ts`

- [ ] **Step 1: Écrire les tests pour `parseOrderCount`**

```typescript
// __tests__/lib/oxatis-orders.test.ts
import { describe, it, expect } from "vitest";
import {
  parseOrderCount,
  parseOrderIds,
  parseTotalPages,
  parseOrderDetails,
  aggregateOrders,
} from "@/lib/oxatis-orders";

describe("parseOrderCount", () => {
  it("retourne le nombre de commandes sur succès", () => {
    const xml = "<StatusCode>200</StatusCode><Count>42</Count>";
    expect(parseOrderCount(xml)).toBe(42);
  });

  it("retourne 0 sur StatusCode non-200", () => {
    const xml = "<StatusCode>503</StatusCode><ErrorDetails>Unauthorized</ErrorDetails>";
    expect(parseOrderCount(xml)).toBe(0);
  });

  it("retourne 0 si Count absent", () => {
    const xml = "<StatusCode>200</StatusCode>";
    expect(parseOrderCount(xml)).toBe(0);
  });
});
```

- [ ] **Step 2: Écrire les tests pour `parseOrderIds`**

```typescript
describe("parseOrderIds", () => {
  it("extrait tous les IDs de commande", () => {
    const xml = `<OrderList><OrderIDs><OrderID>101</OrderID><OrderID>102</OrderID></OrderIDs></OrderList>`;
    expect(parseOrderIds(xml)).toEqual(["101", "102"]);
  });

  it("retourne [] si OrderIDs absent", () => {
    expect(parseOrderIds("<StatusCode>200</StatusCode>")).toEqual([]);
  });

  it("retourne [] sur xml vide", () => {
    expect(parseOrderIds("")).toEqual([]);
  });
});
```

- [ ] **Step 3: Écrire les tests pour `parseTotalPages`**

```typescript
describe("parseTotalPages", () => {
  it("extrait le nombre de pages", () => {
    const xml = "<PageInformation><TotalPages>5</TotalPages></PageInformation>";
    expect(parseTotalPages(xml)).toBe(5);
  });

  it("retourne 1 si TotalPages absent", () => {
    expect(parseTotalPages("<StatusCode>200</StatusCode>")).toBe(1);
  });

  it("retourne au moins 1 même si la valeur est 0", () => {
    expect(parseTotalPages("<TotalPages>0</TotalPages>")).toBe(1);
  });
});
```

- [ ] **Step 4: Écrire les tests pour `parseOrderDetails`**

```typescript
describe("parseOrderDetails", () => {
  const orderXml = `
    <StatusCode>200</StatusCode>
    <OxID>999</OxID>
    <Date>2024-03-15T14:30:00</Date>
    <NetAmountDue>89.50</NetAmountDue>
    <CartCoupon>SUMMER20</CartCoupon>
    <GlobalDiscountAmount>10.00</GlobalDiscountAmount>
    <OrderItems>
      <Item>
        <ItemSKU>SKU-001</ItemSKU>
        <ItemName>Article A</ItemName>
        <Quantity>2</Quantity>
        <LineNetAmount>40.00</LineNetAmount>
      </Item>
      <Item>
        <ItemSKU>SKU-002</ItemSKU>
        <ItemName>Article B</ItemName>
        <Quantity>1</Quantity>
        <LineNetAmount>49.50</LineNetAmount>
      </Item>
    </OrderItems>
  `;

  it("parse les champs principaux", () => {
    const result = parseOrderDetails(orderXml);
    expect(result).not.toBeNull();
    expect(result!.oxId).toBe("999");
    expect(result!.date).toBe("2024-03-15");
    expect(result!.netAmount).toBe(89.5);
    expect(result!.coupon).toBe("SUMMER20");
    expect(result!.globalDiscountAmount).toBe(10.0);
  });

  it("parse les lignes articles", () => {
    const result = parseOrderDetails(orderXml);
    expect(result!.items).toHaveLength(2);
    expect(result!.items[0]).toEqual({ sku: "SKU-001", name: "Article A", quantity: 2, lineRevenue: 40 });
    expect(result!.items[1]).toEqual({ sku: "SKU-002", name: "Article B", quantity: 1, lineRevenue: 49.5 });
  });

  it("retourne null sur StatusCode non-200", () => {
    expect(parseOrderDetails("<StatusCode>503</StatusCode>")).toBeNull();
  });

  it("retourne une commande vide si OrderItems absent", () => {
    const xml = `<StatusCode>200</StatusCode><OxID>1</OxID><Date>2024-01-01T00:00:00</Date><NetAmountDue>0</NetAmountDue>`;
    const result = parseOrderDetails(xml);
    expect(result).not.toBeNull();
    expect(result!.items).toHaveLength(0);
  });
});
```

- [ ] **Step 5: Écrire les tests pour `aggregateOrders`**

```typescript
describe("aggregateOrders", () => {
  const orders = [
    {
      oxId: "1", date: "2024-03-01", netAmount: 100, coupon: "PROMO10",
      globalDiscountAmount: 10,
      items: [
        { sku: "SKU-A", name: "Produit A", quantity: 3, lineRevenue: 60 },
        { sku: "SKU-B", name: "Produit B", quantity: 1, lineRevenue: 40 },
      ],
    },
    {
      oxId: "2", date: "2024-03-01", netAmount: 50, coupon: "",
      globalDiscountAmount: 0,
      items: [
        { sku: "SKU-A", name: "Produit A", quantity: 2, lineRevenue: 50 },
      ],
    },
    {
      oxId: "3", date: "2024-03-02", netAmount: 75, coupon: "PROMO10",
      globalDiscountAmount: 7.5,
      items: [
        { sku: "SKU-C", name: "Produit C", quantity: 5, lineRevenue: 75 },
      ],
    },
  ];

  it("calcule le résumé correctement", () => {
    const result = aggregateOrders(orders, "2024-03-01", "2024-03-02");
    expect(result.summary.totalOrders).toBe(3);
    expect(result.summary.totalRevenue).toBeCloseTo(225);
    expect(result.summary.avgOrderValue).toBeCloseTo(75);
    expect(result.summary.ordersWithPromo).toBe(2);
  });

  it("agrège les produits et trie par quantité décroissante", () => {
    const result = aggregateOrders(orders, "2024-03-01", "2024-03-02");
    expect(result.topProducts[0].sku).toBe("SKU-C"); // qty=5
    expect(result.topProducts[1].sku).toBe("SKU-A"); // qty=5 → 3+2=5 — égalité, ordre stable
    expect(result.topProducts[0].quantity).toBe(5);
    expect(result.topProducts[1].quantity).toBe(5);
  });

  it("agrège le CA par jour", () => {
    const result = aggregateOrders(orders, "2024-03-01", "2024-03-02");
    const day1 = result.revenueByDay.find((d) => d.date === "2024-03-01");
    expect(day1).toBeDefined();
    expect(day1!.revenue).toBeCloseTo(150);
    expect(day1!.orders).toBe(2);
  });

  it("agrège les codes promo", () => {
    const result = aggregateOrders(orders, "2024-03-01", "2024-03-02");
    const promo = result.promoCodes.find((p) => p.code === "PROMO10");
    expect(promo).toBeDefined();
    expect(promo!.usageCount).toBe(2);
    expect(promo!.totalDiscount).toBeCloseTo(17.5);
  });

  it("retourne des tableaux vides sur liste vide", () => {
    const result = aggregateOrders([], "2024-03-01", "2024-03-02");
    expect(result.summary.totalOrders).toBe(0);
    expect(result.topProducts).toHaveLength(0);
    expect(result.revenueByDay).toHaveLength(0);
    expect(result.promoCodes).toHaveLength(0);
  });
});
```

- [ ] **Step 6: Lancer les tests — ils doivent passer**

```bash
npm run test -- __tests__/lib/oxatis-orders.test.ts
```

Expected: tous les tests passent (≥ 15 tests).

- [ ] **Step 7: Commit**

```bash
git add lib/oxatis-orders.ts __tests__/lib/oxatis-orders.test.ts
git commit -m "feat: add oxatis-orders lib with parsing and aggregation (15 tests)"
```

---

## Task 4 : SSE endpoint `/api/oxatis/orders/stream`

**Files:**
- Create: `app/api/oxatis/orders/stream/route.ts`

- [ ] **Step 1: Créer le fichier SSE**

```typescript
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
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npx tsc --noEmit
```

Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add app/api/oxatis/orders/stream/route.ts
git commit -m "feat: add SSE endpoint for order analysis with real-time progress"
```

---

## Task 5 : Hook `useSalesAnalysis`

**Files:**
- Create: `app/analytics/hooks/useSalesAnalysis.ts`

- [ ] **Step 1: Créer le hook**

```typescript
// app/analytics/hooks/useSalesAnalysis.ts
"use client";
import { useState, useCallback } from "react";
import type { SalesAnalysis } from "@/lib/oxatis-orders";

type Status = "idle" | "loading" | "done" | "error";

interface Progress {
  done: number;
  total: number;
  errors: number;
}

interface UseSalesAnalysis {
  status: Status;
  progress: Progress;
  result: SalesAnalysis | null;
  error: string;
  analyze: (from: string, to: string) => void;
  reset: () => void;
}

export function useSalesAnalysis(): UseSalesAnalysis {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState<Progress>({ done: 0, total: 0, errors: 0 });
  const [result, setResult] = useState<SalesAnalysis | null>(null);
  const [error, setError] = useState("");

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress({ done: 0, total: 0, errors: 0 });
    setResult(null);
    setError("");
  }, []);

  const analyze = useCallback((from: string, to: string) => {
    setStatus("loading");
    setProgress({ done: 0, total: 0, errors: 0 });
    setResult(null);
    setError("");

    const source = new EventSource(
      `/api/oxatis/orders/stream?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );

    source.onmessage = (e: MessageEvent) => {
      const payload = JSON.parse(e.data as string) as {
        type: string;
        count?: number;
        done?: number;
        total?: number;
        errors?: number;
        data?: SalesAnalysis;
        message?: string;
      };

      if (payload.type === "total") {
        setProgress((p) => ({ ...p, total: payload.count ?? 0 }));
      } else if (payload.type === "progress") {
        setProgress({
          done: payload.done ?? 0,
          total: payload.total ?? 0,
          errors: payload.errors ?? 0,
        });
      } else if (payload.type === "result") {
        setResult(payload.data ?? null);
        setStatus("done");
        source.close();
      } else if (payload.type === "error") {
        setError(payload.message ?? "Erreur inconnue");
        setStatus("error");
        source.close();
      }
    };

    source.onerror = () => {
      setError("Connexion interrompue. Vérifiez vos credentials et réessayez.");
      setStatus("error");
      source.close();
    };
  }, []);

  return { status, progress, result, error, analyze, reset };
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npx tsc --noEmit
```

Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add app/analytics/hooks/useSalesAnalysis.ts
git commit -m "feat: add useSalesAnalysis hook for SSE-based order analysis"
```

---

## Task 6 : Composant `SalesDatePicker`

**Files:**
- Create: `app/analytics/components/SalesDatePicker.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
// app/analytics/components/SalesDatePicker.tsx
"use client";
import { useState } from "react";

interface Props {
  onAnalyze: (from: string, to: string) => void;
  disabled?: boolean;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function presetRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: formatDate(from), to: formatDate(to) };
}

const PRESETS = [
  { label: "7 jours", days: 7 },
  { label: "30 jours", days: 30 },
  { label: "3 mois", days: 90 },
];

export function SalesDatePicker({ onAnalyze, disabled }: Props) {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [selectedDays, setSelectedDays] = useState(30);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState(formatDate(new Date()));

  const handleAnalyze = () => {
    if (mode === "preset") {
      const { from, to } = presetRange(selectedDays);
      onAnalyze(from, to);
    } else {
      if (!customFrom || !customTo) return;
      onAnalyze(customFrom, customTo);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: "0.375rem" }}>
        {PRESETS.map((p) => (
          <button
            key={p.days}
            onClick={() => { setMode("preset"); setSelectedDays(p.days); }}
            className={`btn btn-sm ${mode === "preset" && selectedDays === p.days ? "btn-primary" : "btn-secondary"}`}
            disabled={disabled}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setMode("custom")}
          className={`btn btn-sm ${mode === "custom" ? "btn-primary" : "btn-secondary"}`}
          disabled={disabled}
        >
          Personnalisé
        </button>
      </div>

      {mode === "custom" && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="form-input"
            style={{ fontSize: "0.8125rem", padding: "0.35rem 0.625rem" }}
            disabled={disabled}
          />
          <span style={{ color: "#94a3b8", fontSize: "0.8125rem" }}>→</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="form-input"
            style={{ fontSize: "0.8125rem", padding: "0.35rem 0.625rem" }}
            disabled={disabled}
          />
        </div>
      )}

      <button
        onClick={handleAnalyze}
        className="btn btn-primary btn-sm"
        disabled={disabled || (mode === "custom" && (!customFrom || !customTo))}
      >
        Analyser
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npx tsc --noEmit
```

Expected: aucune erreur.

---

## Task 7 : Composant `SalesProgress`

**Files:**
- Create: `app/analytics/components/SalesProgress.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
// app/analytics/components/SalesProgress.tsx
interface Props {
  done: number;
  total: number;
  errors: number;
}

export function SalesProgress({ done, total, errors }: Props) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "0.75rem" }}>
        Analyse en cours…{" "}
        <span style={{ color: "#6366f1" }}>{done}</span>
        <span style={{ color: "#94a3b8" }}> / {total} commandes</span>
      </p>
      <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            height: 8,
            background: "linear-gradient(90deg, #6366f1, #818cf8)",
            borderRadius: 4,
            width: `${pct}%`,
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{pct} %</span>
        {errors > 0 && (
          <span style={{ fontSize: "0.75rem", color: "#d97706" }}>
            {errors} commande{errors > 1 ? "s" : ""} ignorée{errors > 1 ? "s" : ""} (timeout)
          </span>
        )}
      </div>
    </div>
  );
}
```

---

## Task 8 : Composant `SalesSummaryCards`

**Files:**
- Create: `app/analytics/components/SalesSummaryCards.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
// app/analytics/components/SalesSummaryCards.tsx
import type { SalesAnalysis } from "@/lib/oxatis-orders";

interface Props {
  summary: SalesAnalysis["summary"];
}

function formatEuro(n: number): string {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

export function SalesSummaryCards({ summary }: Props) {
  const promoPct =
    summary.totalOrders > 0
      ? Math.round((summary.ordersWithPromo / summary.totalOrders) * 100)
      : 0;

  const cards = [
    { label: "Total commandes", value: summary.totalOrders.toString(), color: "#6366f1", bg: "#eef2ff" },
    { label: "CA net", value: formatEuro(summary.totalRevenue), color: "#16a34a", bg: "#f0fdf4" },
    { label: "Panier moyen", value: formatEuro(summary.avgOrderValue), color: "#0891b2", bg: "#ecfeff" },
    {
      label: "Avec code promo",
      value: `${summary.ordersWithPromo}`,
      sub: `${promoPct} % des commandes`,
      color: "#7c3aed",
      bg: "#faf5ff",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
      {cards.map((card) => (
        <div key={card.label} className="card" style={{ padding: "1.25rem" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 800, color: card.color }}>{card.value}</span>
          </div>
          <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>{card.label}</p>
          {card.sub && <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.2rem 0 0" }}>{card.sub}</p>}
        </div>
      ))}
    </div>
  );
}
```

---

## Task 9 : Composant `TopProductsChart`

**Files:**
- Create: `app/analytics/components/TopProductsChart.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
// app/analytics/components/TopProductsChart.tsx
"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { SalesAnalysis } from "@/lib/oxatis-orders";

interface Props {
  products: SalesAnalysis["topProducts"];
}

export function TopProductsChart({ products }: Props) {
  if (products.length === 0) {
    return (
      <div className="card" style={{ padding: "1.5rem" }}>
        <p style={{ color: "#94a3b8", fontSize: "0.875rem", textAlign: "center" }}>Aucun article vendu sur cette période.</p>
      </div>
    );
  }

  const data = products.map((p) => ({
    name: p.name.length > 30 ? p.name.slice(0, 30) + "…" : p.name,
    sku: p.sku,
    quantité: p.quantity,
    revenue: p.revenue,
  }));

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "1.25rem" }}>
        Top {products.length} articles vendus
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === "quantité" ? [`${value} unités`, "Qté vendue"] : [`${value.toFixed(2)} €`, "CA net"]
            }
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="quantité" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? "#6366f1" : i < 3 ? "#818cf8" : "#c7d2fe"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## Task 10 : Composant `RevenueChart`

**Files:**
- Create: `app/analytics/components/RevenueChart.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
// app/analytics/components/RevenueChart.tsx
"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { SalesAnalysis } from "@/lib/oxatis-orders";

interface Props {
  revenueByDay: SalesAnalysis["revenueByDay"];
}

export function RevenueChart({ revenueByDay }: Props) {
  if (revenueByDay.length === 0) {
    return (
      <div className="card" style={{ padding: "1.5rem" }}>
        <p style={{ color: "#94a3b8", fontSize: "0.875rem", textAlign: "center" }}>Aucune donnée disponible.</p>
      </div>
    );
  }

  const data = revenueByDay.map((d) => ({
    date: d.date.slice(5),       // MM-DD
    "CA net (€)": Math.round(d.revenue * 100) / 100,
    commandes: d.orders,
  }));

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "1.25rem" }}>
        Chiffre d&apos;affaires par jour
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v} €`} />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === "CA net (€)" ? [`${value.toFixed(2)} €`, "CA net"] : [value, "Commandes"]
            }
            contentStyle={{ fontSize: 12 }}
          />
          <Line type="monotone" dataKey="CA net (€)" stroke="#6366f1" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## Task 11 : Composant `PromoCodeTable`

**Files:**
- Create: `app/analytics/components/PromoCodeTable.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
// app/analytics/components/PromoCodeTable.tsx
import type { SalesAnalysis } from "@/lib/oxatis-orders";

interface Props {
  promoCodes: SalesAnalysis["promoCodes"];
}

export function PromoCodeTable({ promoCodes }: Props) {
  if (promoCodes.length === 0) {
    return (
      <div className="card" style={{ padding: "1.5rem" }}>
        <p style={{ color: "#94a3b8", fontSize: "0.875rem", textAlign: "center" }}>Aucun code promo utilisé sur cette période.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "1rem" }}>
        Codes promo utilisés
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              {["Code", "Utilisations", "Remise totale accordée"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "0.5rem 0.75rem", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {promoCodes.map((p) => (
              <tr key={p.code} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "0.625rem 0.75rem", fontFamily: "monospace", fontWeight: 700, color: "#6366f1" }}>
                  {p.code}
                </td>
                <td style={{ padding: "0.625rem 0.75rem", fontWeight: 600, color: "#374151" }}>
                  {p.usageCount} commande{p.usageCount > 1 ? "s" : ""}
                </td>
                <td style={{ padding: "0.625rem 0.75rem", color: "#d97706", fontWeight: 600 }}>
                  −{p.totalDiscount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit tous les composants**

```bash
git add app/analytics/components/ app/analytics/hooks/
git commit -m "feat: add sales analytics components (DatePicker, Progress, Cards, Charts, Table)"
```

---

## Task 12 : Intégrer dans `app/analytics/page.tsx`

**Files:**
- Modify: `app/analytics/page.tsx`

- [ ] **Step 1: Ajouter les imports en haut du fichier**

En haut de `app/analytics/page.tsx`, après les imports existants, ajouter :

```typescript
import { useSalesAnalysis } from "./hooks/useSalesAnalysis";
import { SalesDatePicker } from "./components/SalesDatePicker";
import { SalesProgress } from "./components/SalesProgress";
import { SalesSummaryCards } from "./components/SalesSummaryCards";
import { TopProductsChart } from "./components/TopProductsChart";
import { RevenueChart } from "./components/RevenueChart";
import { PromoCodeTable } from "./components/PromoCodeTable";
```

- [ ] **Step 2: Ajouter le state de l'onglet actif dans `AnalyticsPage`**

Dans la fonction `AnalyticsPage`, après les useState existants, ajouter :

```typescript
const [activeTab, setActiveTab] = useState<"catalogue" | "ventes">("catalogue");
const { status, progress, result, error: salesError, analyze } = useSalesAnalysis();
```

- [ ] **Step 3: Ajouter les onglets sous le hero**

Dans le JSX de `AnalyticsPage`, immédiatement après la fermeture de la div hero (`</div>` du gradient), avant `<div style={{ maxWidth: 1000 ... }}>`, ajouter :

```tsx
{/* Onglets */}
<div style={{ borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
  <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 2rem", display: "flex", gap: "0" }}>
    {[
      { id: "catalogue" as const, label: "Catalogue" },
      { id: "ventes" as const, label: "Ventes" },
    ].map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        style={{
          padding: "0.875rem 1.25rem",
          fontSize: "0.875rem",
          fontWeight: 600,
          color: activeTab === tab.id ? "#6366f1" : "#64748b",
          background: "none",
          border: "none",
          borderBottom: activeTab === tab.id ? "2px solid #6366f1" : "2px solid transparent",
          cursor: "pointer",
          transition: "color 0.15s",
        }}
      >
        {tab.label}
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 4: Conditionner le contenu existant sur l'onglet "catalogue"**

Envelopper le contenu JSX existant (stat cards, prix, catégories, marques) avec :

```tsx
{activeTab === "catalogue" && (
  <>
    {/* ... contenu catalogue existant ... */}
  </>
)}
```

- [ ] **Step 5: Ajouter le contenu de l'onglet "ventes" après**

Après la fermeture du bloc catalogue, ajouter :

```tsx
{activeTab === "ventes" && (
  <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem" }}>
    {/* Sélecteur de période */}
    <div style={{ marginBottom: "1.5rem" }}>
      <SalesDatePicker onAnalyze={analyze} disabled={status === "loading"} />
    </div>

    {/* Erreur credentials */}
    {salesError && (
      <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
        {salesError}
      </div>
    )}

    {/* Progression */}
    {status === "loading" && (
      <div style={{ marginBottom: "1.5rem" }}>
        <SalesProgress done={progress.done} total={progress.total} errors={progress.errors} />
      </div>
    )}

    {/* Résultats */}
    {status === "done" && result && (
      <>
        <SalesSummaryCards summary={result.summary} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <RevenueChart revenueByDay={result.revenueByDay} />
          <PromoCodeTable promoCodes={result.promoCodes} />
        </div>
        <TopProductsChart products={result.topProducts} />
        {result.summary.totalOrders === 0 && (
          <div className="card p-10 text-center" style={{ color: "#94a3b8", marginTop: "1.5rem" }}>
            <p style={{ fontSize: "1rem", fontWeight: 500 }}>Aucune commande sur cette période.</p>
          </div>
        )}
      </>
    )}

    {/* État initial */}
    {status === "idle" && (
      <div className="card" style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
        <p style={{ fontSize: "1rem", fontWeight: 500 }}>Sélectionnez une période et cliquez sur &quot;Analyser&quot;.</p>
        <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Les commandes sont récupérées en temps réel depuis Oxatis.</p>
      </div>
    )}
  </div>
)}
```

- [ ] **Step 6: Vérifier la compilation**

```bash
npx tsc --noEmit
```

Expected: aucune erreur.

- [ ] **Step 7: Lancer tous les tests**

```bash
npm run test
```

Expected: tous les tests existants passent.

- [ ] **Step 8: Corriger le texte obsolète sur la home page**

Dans `app/page.tsx`, ligne ~210, remplacer :

```
Les credentials API Oxatis sont sauvegardés localement dans votre navigateur.
```

par :

```
Les credentials API Oxatis sont stockés dans une session sécurisée (cookie httpOnly).
```

- [ ] **Step 9: Commit final**

```bash
git add app/analytics/page.tsx app/page.tsx
git commit -m "feat: integrate sales analytics tab into analytics page"
```

---

## Récapitulatif des commits

1. `chore: add recharts dependency`
2. `feat: add oxatis-orders lib with parsing and aggregation (15 tests)`
3. `feat: add SSE endpoint for order analysis with real-time progress`
4. `feat: add useSalesAnalysis hook for SSE-based order analysis`
5. `feat: add sales analytics components (DatePicker, Progress, Cards, Charts, Table)`
6. `feat: integrate sales analytics tab into analytics page`
