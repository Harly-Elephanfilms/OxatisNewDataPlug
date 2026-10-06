export interface PreparationItem {
  sku: string;
  name: string;
  quantity: number;
  bundled: boolean;
}

export interface PreparationOrder {
  oxId: string;
  date: string;
  email: string;
  customer: string;
  address: string;
  zipCode: string;
  city: string;
  country: string;
  phone: string;
  netAmount: number;
  invoiceId: string;
  progressStateId: string;
  shipped: boolean;
  items: PreparationItem[];
}

export interface ProgressStateOption {
  id: string;
  code: string;
  name: string;
}

export type PreparationMode = "unbilled" | "preorders";

export interface PreparationPage {
  orders: PreparationOrder[];
  errors: { orderId: string; message: string }[];
  page: number;
  totalPages: number;
  totalItems: number;
  scanned: number;
  excludedShipped: string[];
}

export function parisDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

export function normalizeCountry(country: string): string {
  return country === "France métropolitaine" ? "France" : country;
}

export function shippingCode(country: string, amount: number): string {
  if (normalizeCountry(country) !== "France") return "EXI2";
  if (amount > 150) return "EXP2";
  if (amount > 40) return "ACC2";
  return "LTS";
}

// Conserve les références alphanumériques et les zéros initiaux. Les références
// numériques usuelles restent des cellules numériques, comme dans le script.
function referenceCell(value: string): string | number {
  if (/^(0|[1-9]\d*)$/.test(value) && Number.isSafeInteger(Number(value))) return Number(value);
  return value;
}

/** Format logistique du script : 25 colonnes A–Y, sans ligne d'en-tête. */
export function buildOrderExportRows(orders: PreparationOrder[], date: string): (string | number)[][] {
  const [year, month, day] = date.split("-");
  const dateStr = `${day}/${month}/${year}`;
  return orders.flatMap((order) => order.items.map((item) => {
    const row: (string | number)[] = Array.from({ length: 25 }, () => "");
    row[0] = "OL1";
    row[1] = "ELYSEES_EDITIONS";
    row[2] = referenceCell(order.oxId);
    row[3] = dateStr;
    row[4] = dateStr;
    row[7] = shippingCode(order.country, order.netAmount);
    row[9] = order.customer;
    row[10] = order.customer;
    row[11] = order.address;
    row[13] = order.zipCode;
    row[14] = order.city;
    row[15] = normalizeCountry(order.country);
    row[16] = 2;
    row[17] = order.email;
    row[18] = order.phone;
    row[20] = referenceCell(item.sku);
    row[21] = item.quantity;
    row[22] = item.name;
    return row;
  }));
}

/** Une référence de pack sélectionne aussi les commandes qui la contiennent. */
export function filterPreparationOrders(orders: PreparationOrder[], references: string, search: string): PreparationOrder[] {
  const skus = new Set(references.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean));
  const term = search.trim().toLowerCase();
  return orders.filter((order) => {
    if (skus.size && !order.items.some((item) => skus.has(item.sku.toLowerCase()))) return false;
    return !term || [order.oxId, order.customer, order.email, ...order.items.flatMap((i) => [i.sku, i.name])]
      .some((value) => value.toLowerCase().includes(term));
  });
}
