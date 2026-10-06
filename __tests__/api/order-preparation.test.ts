import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/oxatis/orders/preparation/route";
import { getCredentials } from "@/lib/server-credentials";

vi.mock("@/lib/server-credentials", () => ({ getCredentials: vi.fn(() => ({ appId: "app", token: "token" })) }));

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); vi.mocked(getCredentials).mockReturnValue({ appId: "app", token: "token" }); });

function request(mode = "preorders") {
  return new NextRequest(`http://localhost/api/oxatis/orders/preparation?from=2024-12-01&to=2026-10-06&mode=${mode}&stateId=72803`);
}

function summary(id: string, state: string, shipped = false) {
  return `<OrderSummary><OxID>${id}</OxID><ProgressStateID>${state}</ProgressStateID><Shipped>${shipped}</Shipped></OrderSummary>`;
}

function details(id: string, state = "72803", invoice = "FA123") {
  return `<StatusCode>200</StatusCode><Order><OxID>${id}</OxID><ProgressStateID>${state}</ProgressStateID><InvoiceID>${invoice}</InvoiceID><NetAmountDue>20</NetAmountDue><OrderItems><Item><ItemSKU>655639</ItemSKU><ItemName>Film</ItemName><Quantity>1</Quantity></Item></OrderItems></Order>`;
}

function mockApi(summaries: string, detailResponses: Record<string, string>) {
  const fetchMock = vi.fn(async (_url: string, options: RequestInit) => {
    const params = new URLSearchParams(String(options.body));
    if (params.get("Method") === "OrderGetSummaryList") return new Response(`<StatusCode>200</StatusCode><OrderSummaryList><TotalItems>4</TotalItems><TotalPages>1</TotalPages><OrderSummaries>${summaries}</OrderSummaries></OrderSummaryList>`);
    const data = params.get("Data")!;
    expect(data).toMatch(/^<OrderId /);
    const id = data.match(/<OxID>(\d+)<\/OxID>/)![1];
    return new Response(detailResponses[id] ?? "<StatusCode>500</StatusCode><ErrorDetails>Commande inaccessible</ErrorDetails>");
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("API préparation commandes", () => {
  it("ne lit que l’état actuel demandé, exclut expédiées et relit l’état avant de proposer l’export", async () => {
    const fetchMock = mockApi(summary("1", "72803") + summary("2", "71648") + summary("3", "72803", true) + summary("4", "72803"), { "1": details("1"), "4": details("4", "71647") });
    const response = await GET(request());
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.orders.map((o: { oxId: string }) => o.oxId)).toEqual(["1"]);
    expect(data.scanned).toBe(4);
    expect(data.excludedShipped).toEqual(["3"]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("inclut les commandes marquées expédiées uniquement si demandé explicitement", async () => {
    mockApi(summary("1", "72803") + summary("2", "72803", true) + summary("3", "71648", true), { "1": details("1"), "2": details("2") });
    const req = new NextRequest(request().url + "&includeShipped=true");
    const data = await (await GET(req)).json();
    expect(data.orders.map((o: { oxId: string }) => o.oxId)).toEqual(["1", "2"]);
    expect(data.orders.map((o: { shipped: boolean }) => o.shipped)).toEqual([false, true]);
    expect(data.excludedShipped).toEqual([]);
  });

  it("signale explicitement les commandes échouées sans les exporter", async () => {
    mockApi(summary("1", "72803") + summary("2", "72803"), { "1": details("1") });
    const data = await (await GET(request())).json();
    expect(data.orders).toHaveLength(1);
    expect(data.errors).toEqual([{ orderId: "2", message: "Commande inaccessible" }]);
  });

  it("exclut une commande non facturée qui a été facturée entre liste et détails", async () => {
    mockApi(summary("1", "") + summary("2", ""), { "1": details("1", "", ""), "2": details("2") });
    const data = await (await GET(request("unbilled"))).json();
    expect(data.orders.map((o: { oxId: string }) => o.oxId)).toEqual(["1"]);
  });

  it("refuse les appels sans identifiants ou avec dates injectées avant tout appel Oxatis", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(getCredentials).mockReturnValueOnce({ appId: "", token: "" });
    expect((await GET(request())).status).toBe(401);
    expect((await GET(new NextRequest("http://localhost/api/oxatis/orders/preparation?from=%3Cxml%3E&to=2026-10-06&mode=unbilled"))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
