import { callOrderApi } from "@/lib/oxatis-orders";
import { normalizeCountry } from "@/lib/order-export";
import type { PreparationItem, PreparationMode, PreparationOrder, ProgressStateOption } from "@/lib/order-export";

const XML_NS = 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"';
const PROGRESS_URL = "https://webservices.oxatis.com/webservices/httpservices/ProgressStateServices.aspx";
export const PREPARATION_PAGE_SIZE = 50;

// Les réponses HTTP OWS ne sont pas préfixées. Une frontière de nom évite de
// confondre ShippingAddress avec ShippingAddressL1 ou ItemSKU avec ItemSKUOriginal.
export function xmlBlocks(xml: string, tag: string): string[] {
  return Array.from(xml.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}\\s*>`, "gi")), (m) => m[1]);
}

export function xmlValue(xml: string, tag: string): string {
  const block = xmlBlocks(xml, tag)[0] ?? "";
  if (block.trim().startsWith("<![CDATA[") && block.trim().endsWith("]]>")) return block.trim().slice(9, -3);
  return block.trim().replace(/&#(x[0-9a-f]+|\d+);|&(lt|gt|amp|quot|apos);/gi, (entity, numeric: string | undefined, named: string | undefined) => {
    if (numeric) {
      const n = numeric[0].toLowerCase() === "x" ? parseInt(numeric.slice(1), 16) : Number(numeric);
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : entity;
    }
    return ({ lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" } as Record<string, string>)[named!.toLowerCase()];
  });
}

export function assertOrderSuccess(xml: string): void {
  if (xmlValue(xml, "StatusCode") !== "200") {
    throw new Error(xmlValue(xml, "ErrorDetails") || "Réponse Oxatis invalide ou opération refusée");
  }
}

export function validatePreparationQuery(params: URLSearchParams): {
  from: string; to: string; mode: PreparationMode; stateId: string; page: number; includeShipped: boolean;
} {
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!validDate(from) || !validDate(to) || from < "2010-01-15" || from > to) {
    throw new Error("Choisissez une période valide à partir du 15/01/2010 (début avant fin).");
  }
  const mode = params.get("mode");
  if (mode !== "unbilled" && mode !== "preorders") throw new Error("Type de commandes invalide.");
  const stateId = params.get("stateId") ?? "";
  if (mode === "preorders" && !/^[1-9]\d{0,9}$/.test(stateId)) throw new Error("Choisissez un état d’avancement.");
  const pageRaw = params.get("page") ?? "1";
  if (!/^[1-9]\d{0,4}$/.test(pageRaw) || Number(pageRaw) > 10000) throw new Error("Page invalide.");
  const includeShipped = params.get("includeShipped") ?? "false";
  if (includeShipped !== "true" && includeShipped !== "false") throw new Error("Filtre d’expédition invalide.");
  return { from, to, mode, stateId, page: Number(pageRaw), includeShipped: includeShipped === "true" };
}

export function parseProgressStates(xml: string): ProgressStateOption[] {
  assertOrderSuccess(xml);
  if (!/<ProgressStateList(?:\s|>|\/)/i.test(xml)) throw new Error("Liste des états absente de la réponse Oxatis.");
  return xmlBlocks(xml, "ProgressState").map((block) => ({
    id: xmlValue(block, "OxID"), code: xmlValue(block, "Code"),
    name: xmlValue(block, "NameFR") || xmlValue(block, "Code"),
  })).filter((state) => /^\d+$/.test(state.id) && !!state.name);
}

export async function getPreparationStates(appId: string, token: string, signal?: AbortSignal): Promise<ProgressStateOption[]> {
  return parseProgressStates(await callOrderApi(appId, token, "ProgressStateGetList", `<ProgressStateList ${XML_NS} />`, { url: PROGRESS_URL, signal }));
}

export interface OrderSummary {
  oxId: string;
  progressStateId: string;
  shipped: boolean;
}

export function parsePreparationSummaries(xml: string): { summaries: OrderSummary[]; totalItems: number; totalPages: number } {
  assertOrderSuccess(xml);
  if (!/<OrderSummaryList(?:\s|>)/i.test(xml)) throw new Error("Liste des commandes absente de la réponse Oxatis.");
  const totalRaw = xmlValue(xml, "TotalItems");
  const pagesRaw = xmlValue(xml, "TotalPages");
  if (!/^\d+$/.test(totalRaw) || !/^\d+$/.test(pagesRaw)) throw new Error("Pagination Oxatis invalide.");
  const totalPages = Math.max(1, Number(pagesRaw));
  if (totalPages > 10000) throw new Error("Trop de commandes : réduisez la période.");
  const summaries = xmlBlocks(xml, "OrderSummary").map((block) => ({
    oxId: xmlValue(block, "OxID"), progressStateId: xmlValue(block, "ProgressStateID"),
    shipped: /^(true|1)$/i.test(xmlValue(block, "Shipped")),
  }));
  if (summaries.some((s) => !/^\d+$/.test(s.oxId))) throw new Error("Identifiant de commande invalide dans la liste Oxatis.");
  return { summaries, totalItems: Number(totalRaw), totalPages };
}

export async function getPreparationSummaries(
  appId: string, token: string, query: ReturnType<typeof validatePreparationQuery>, signal?: AbortSignal,
): Promise<ReturnType<typeof parsePreparationSummaries>> {
  // Ordre de la séquence vérifié dans le WSDL OWS actuel : champs hérités,
  // puis PageInformation. L'état personnalisé se filtre sur les résumés reçus.
  const data = `<OrderSummaryList ${XML_NS}><SetOrderDesc>true</SetOrderDesc><OrderDateStart>${query.from}T00:00:00</OrderDateStart><OrderDateEnd>${query.to}T23:59:59</OrderDateEnd><PaymentStatusCode>40</PaymentStatusCode><OrderStatus>${query.mode === "unbilled" ? 0 : 1}</OrderStatus><PageInformation><PageNumber>${query.page}</PageNumber><PageSize>${PREPARATION_PAGE_SIZE}</PageSize></PageInformation></OrderSummaryList>`;
  return parsePreparationSummaries(await callOrderApi(appId, token, "OrderGetSummaryList", data, { signal }));
}

function quantity(block: string): number {
  const raw = xmlValue(block, "Quantity");
  const n = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(n) || n <= 0) throw new Error("Quantité d’article invalide.");
  return n;
}

export function parsePreparationOrder(xml: string, orderId: string): PreparationOrder {
  assertOrderSuccess(xml);
  const block = xmlBlocks(xml, "Order")[0];
  if (!block || xmlValue(block, "OxID") !== orderId) throw new Error("Détails de commande absents ou identifiant incohérent.");
  const itemsBlock = xmlBlocks(block, "OrderItems")[0] ?? "";
  const items: PreparationItem[] = [];
  for (const item of xmlBlocks(itemsBlock, "Item")) {
    const ownFields = item.replace(/<BundledItems(?:\s[^>]*)?>[\s\S]*?<\/BundledItems>/gi, "");
    const sku = xmlValue(ownFields, "ItemSKU");
    if (!sku) throw new Error("Une ligne de commande n’a pas de référence article.");
    items.push({ sku, name: xmlValue(ownFields, "ItemName"), quantity: quantity(ownFields), bundled: false });
    for (const child of xmlBlocks(item, "BundledItem")) {
      const childSku = xmlValue(child, "ItemSKU");
      if (!childSku) throw new Error("Un article de pack n’a pas de référence.");
      // Comme le script, exporte les quantités de BundledItems telles que reçues.
      items.push({ sku: childSku, name: xmlValue(child, "ItemName"), quantity: quantity(child), bundled: true });
    }
  }
  if (!items.length) throw new Error("Commande sans ligne article exportable.");
  const amount = Number(xmlValue(block, "NetAmountDue"));
  if (!xmlValue(block, "NetAmountDue") || !Number.isFinite(amount)) throw new Error("Montant de commande invalide.");
  return {
    oxId: orderId, date: xmlValue(block, "Date").split("T")[0],
    email: xmlValue(block, "UserEmail"),
    customer: ["ShippingTitle", "ShippingFirstName", "ShippingLastName"].map((tag) => xmlValue(block, tag)).filter(Boolean).join(" "),
    address: xmlValue(block, "ShippingAddress") || ["ShippingAddressStreet", "ShippingAddressOtherInfo"].map((tag) => xmlValue(block, tag)).filter(Boolean).join(" "),
    zipCode: xmlValue(block, "ShippingZipCode"), city: xmlValue(block, "ShippingCity"),
    country: normalizeCountry(xmlValue(block, "ShippingCountryName")), phone: xmlValue(block, "ShippingPhone"),
    netAmount: amount, invoiceId: xmlValue(block, "InvoiceID"), progressStateId: xmlValue(block, "ProgressStateID"),
    shipped: /^(true|1)$/i.test(xmlValue(block, "Shipped")), items,
  };
}

export async function getPreparationOrder(appId: string, token: string, orderId: string, signal?: AbortSignal): Promise<PreparationOrder> {
  if (!/^\d+$/.test(orderId)) throw new Error("Identifiant de commande invalide.");
  const data = `<OrderId ${XML_NS}><OxID>${orderId}</OxID></OrderId>`;
  return parsePreparationOrder(await callOrderApi(appId, token, "OrderGetDetails", data, { signal }), orderId);
}
