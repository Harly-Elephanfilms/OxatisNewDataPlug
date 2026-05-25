import { describe, it, expect, vi } from "vitest";
import {
  parseOrderCount,
  parseOrderIds,
  parseTotalPages,
  parseOrderDetails,
  aggregateOrders,
  getOrderDetails,
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

describe("getOrderDetails — orderId validation", () => {
  it("throws on non-numeric orderId", async () => {
    await expect(getOrderDetails("app", "tok", "<script>")).rejects.toThrow(
      "Invalid orderId: <script>"
    );
  });

  it("throws on orderId with alphanumeric content", async () => {
    await expect(getOrderDetails("app", "tok", "123abc")).rejects.toThrow(
      "Invalid orderId: 123abc"
    );
  });

  it("does not throw on a purely numeric orderId (network call is expected to fail)", async () => {
    // A valid numeric orderId passes the guard; the subsequent fetch will fail
    // in the test environment — we only care that it does NOT throw our guard error.
    await expect(getOrderDetails("app", "tok", "12345")).rejects.not.toThrow(
      "Invalid orderId: 12345"
    );
  });
});

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
