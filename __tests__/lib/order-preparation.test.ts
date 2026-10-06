import { afterEach, describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";
import { assertOrderSuccess, getPreparationSummaries, parsePreparationOrder, parsePreparationSummaries, parseProgressStates, validatePreparationQuery, xmlValue } from "@/lib/order-preparation";
import { buildOrderExportRows, filterPreparationOrders, parisDate, shippingCode } from "@/lib/order-export";

function orderXml(id = "123") {
  return `<DataResultService><StatusCode>200</StatusCode><Data><Order>
    <OxID>${id}</OxID><Date>2026-10-01T12:00:00</Date><PaymentStatusCode>40</PaymentStatusCode>
    <ProgressStateID>72803</ProgressStateID><InvoiceID>FA123</InvoiceID>
    <ShippingTitle>M.</ShippingTitle><ShippingFirstName>Jean</ShippingFirstName><ShippingLastName>Test</ShippingLastName>
    <ShippingAddressL1>À ne pas utiliser comme adresse complète</ShippingAddressL1>
    <ShippingAddress>12 rue Test &amp; Cie</ShippingAddress><ShippingZipCode>01230</ShippingZipCode><ShippingCity>Testville</ShippingCity>
    <ShippingCountryName>France métropolitaine</ShippingCountryName><ShippingPhone>0612345678</ShippingPhone><UserEmail>test@example.com</UserEmail>
    <NetAmountDue>150</NetAmountDue><OrderItems><Item>
      <ItemSKUOriginal>MAUVAISE-REF</ItemSKUOriginal><ItemSKU>655639</ItemSKU><ItemName>Pack &amp; films</ItemName><Quantity>2</Quantity>
      <BundledItems><BundledItem><ItemSKU>00123</ItemSKU><ItemName><![CDATA[Film <A>]]></ItemName><Quantity>4</Quantity></BundledItem></BundledItems>
    </Item><Item><ItemSKU>SKU-B</ItemSKU><ItemName>Film B</ItemName><Quantity>1</Quantity></Item></OrderItems>
  </Order></Data></DataResultService>`;
}

afterEach(() => vi.unstubAllGlobals());

describe("préparation des commandes", () => {
  it("lit les champs exacts, l’adresse complète et les articles de pack", () => {
    const order = parsePreparationOrder(orderXml(), "123");
    expect(order.address).toBe("12 rue Test & Cie");
    expect(order.country).toBe("France");
    expect(order.progressStateId).toBe("72803");
    expect(order.items).toEqual([
      { sku: "655639", name: "Pack & films", quantity: 2, bundled: false },
      { sku: "00123", name: "Film <A>", quantity: 4, bundled: true },
      { sku: "SKU-B", name: "Film B", quantity: 1, bundled: false },
    ]);
  });

  it("décode les entités XML une seule fois et conserve le contenu CDATA", () => {
    expect(xmlValue("<Name>A &#233; &amp;lt;</Name>", "Name")).toBe("A é &lt;");
    expect(xmlValue("<Name><![CDATA[A &amp; B]]></Name>", "Name")).toBe("A &amp; B");
  });

  it("refuse les réponses invalides, les mauvaises identités et les quantités incohérentes", () => {
    expect(() => assertOrderSuccess("<Response><StatusCode")).toThrow();
    expect(() => assertOrderSuccess("<StatusCode>503</StatusCode><ErrorDetails>Unauthorized</ErrorDetails>")).toThrow("Unauthorized");
    expect(() => parsePreparationOrder(orderXml(), "999")).toThrow("identifiant incohérent");
    expect(() => parsePreparationOrder(orderXml().replace("<Quantity>2</Quantity>", "<Quantity>-2</Quantity>"), "123")).toThrow("Quantité");
    expect(() => parsePreparationOrder("<StatusCode>200</StatusCode><Order><OxID>123</OxID></Order>", "123")).toThrow("sans ligne");
  });

  it("lit les états configurés depuis la liste Oxatis", () => {
    expect(parseProgressStates('<StatusCode>200</StatusCode><ProgressStateList><ProgressStateList><ProgressState><OxID>72803</OxID><Code>PRECOMMANDE</Code><NameFR>Précommande</NameFR></ProgressState></ProgressStateList></ProgressStateList>'))
      .toEqual([{ id: "72803", code: "PRECOMMANDE", name: "Précommande" }]);
  });

  it("distingue état actuel et expédition dans les résumés paginés", () => {
    const result = parsePreparationSummaries('<StatusCode>200</StatusCode><OrderSummaryList><PageInformation><TotalItems>2</TotalItems><TotalPages>1</TotalPages></PageInformation><OrderSummaries><OrderSummary><OxID>123</OxID><ProgressStateID>72803</ProgressStateID><Shipped>false</Shipped></OrderSummary><OrderSummary><OxID>124</OxID><ProgressStateID>71648</ProgressStateID><Shipped>true</Shipped></OrderSummary></OrderSummaries></OrderSummaryList>');
    expect(result.summaries).toEqual([{ oxId: "123", progressStateId: "72803", shipped: false }, { oxId: "124", progressStateId: "71648", shipped: true }]);
    expect(result.totalItems).toBe(2);
    expect(() => parsePreparationSummaries("<StatusCode>200</StatusCode>")).toThrow();
  });

  it("valide dates réelles, ordre des dates, mode, page et état avant appel API", () => {
    const params = new URLSearchParams({ from: "2024-12-01", to: "2026-10-06", mode: "preorders", stateId: "72803" });
    expect(validatePreparationQuery(params)).toMatchObject({ mode: "preorders", stateId: "72803", page: 1 });
    for (const [key, value] of [["from", "2026-02-30"], ["from", "2027-01-01"], ["stateId", "<xml>"], ["mode", "all"], ["page", "1.5"], ["from", "2009-01-01"]]) {
      const invalid = new URLSearchParams(params);
      invalid.set(key, value);
      expect(() => validatePreparationQuery(invalid)).toThrow();
    }
  });

  it("envoie paiement confirmé et état de facturation sans inventer de filtre ProgressStateID", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('<StatusCode>200</StatusCode><OrderSummaryList><TotalItems>0</TotalItems><TotalPages>0</TotalPages></OrderSummaryList>'));
    vi.stubGlobal("fetch", fetchMock);
    const query = validatePreparationQuery(new URLSearchParams({ from: "2024-12-01", to: "2026-10-06", mode: "preorders", stateId: "72803", page: "2" }));
    await getPreparationSummaries("app", "token", query);
    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(body.get("Method")).toBe("OrderGetSummaryList");
    expect(body.get("Data")).toContain("<PaymentStatusCode>40</PaymentStatusCode><OrderStatus>1</OrderStatus>");
    expect(body.get("Data")).toContain("<PageNumber>2</PageNumber>");
    expect(body.get("Data")).not.toContain("<ProgressStateID>");
  });
});

describe("export logistique identique au script", () => {
  it.each([["France", 40, "LTS"], ["France", 40.01, "ACC2"], ["France", 150, "ACC2"], ["France", 150.01, "EXP2"], ["France métropolitaine", 151, "EXP2"], ["Belgique", 200, "EXI2"]])("code expédition %s / %s", (country, amount, expected) => {
    expect(shippingCode(String(country), Number(amount))).toBe(expected);
  });

  it("écrit A–Y sans en-tête, conserve téléphones, codes postaux et références, y compris les packs", () => {
    const rows = buildOrderExportRows([parsePreparationOrder(orderXml(), "123")], "2026-10-06");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveLength(25);
    expect(rows[0]).toEqual(["OL1", "ELYSEES_EDITIONS", 123, "06/10/2026", "06/10/2026", "", "", "ACC2", "", "M. Jean Test", "M. Jean Test", "12 rue Test & Cie", "", "01230", "Testville", "France", 2, "test@example.com", "0612345678", "", 655639, 2, "Pack & films", "", ""]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Sheet1");
    const read = XLSX.read(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }), { type: "buffer" });
    const sheet = read.Sheets.Sheet1;
    expect(sheet.A1.v).toBe("OL1");
    expect(sheet.N1).toMatchObject({ t: "s", v: "01230" });
    expect(sheet.U2).toMatchObject({ t: "s", v: "00123" });
    expect(sheet.U3).toMatchObject({ t: "s", v: "SKU-B" });
    expect(sheet.V2.v).toBe(4);
    expect(sheet["!ref"]).toBe("A1:Y3");
  });

  it("filtre par référence exacte, même à l’intérieur d’un pack, et garde la commande complète", () => {
    const first = parsePreparationOrder(orderXml(), "123");
    const second = { ...first, oxId: "124", items: [{ sku: "OTHER", name: "Autre", quantity: 1, bundled: false }] };
    expect(filterPreparationOrders([first, second], "00123", "")).toEqual([first]);
    expect(filterPreparationOrders([first, second], "123", "")).toEqual([]);
    expect(filterPreparationOrders([first, second], "OTHER; 655639", "")).toHaveLength(2);
    expect(buildOrderExportRows(filterPreparationOrders([first, second], "00123", ""), "2026-10-06")).toHaveLength(3);
  });

  it("utilise la date de Paris à la frontière du jour UTC", () => {
    expect(parisDate(new Date("2026-10-05T22:30:00Z"))).toBe("2026-10-06");
  });
});
