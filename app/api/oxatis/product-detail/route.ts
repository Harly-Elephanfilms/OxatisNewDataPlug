import { getProductDetailBySKU } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { extractXml, parseOxatisError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemSKU = searchParams.get("itemSKU") ?? "";
    const appIdParam = searchParams.get("appId") ?? undefined;
    const tokenParam = searchParams.get("token") ?? undefined;
    const { appId, token } = getCredentials(appIdParam, tokenParam);

    if (!appId || !token || !itemSKU) {
      return Response.json(
        { error: "Paramètres manquants (appId, token, itemSKU)" },
        { status: 400 }
      );
    }

    const xml = await getProductDetailBySKU(appId, token, itemSKU);

    const detailError = parseOxatisError(xml);
    if (detailError) return Response.json({ error: detailError, raw: xml }, { status: 500 });

    const name = extractXml(xml, "Name");
    const oxatisId = extractXml(xml, "OxID");
    const descriptionLong = extractXml(xml, "LongDescription");
    const description = extractXml(xml, "Description");
    const rawDate = extractXml(xml, "DateOfAvailability");
    // Retourner uniquement la partie date (YYYY-MM-DD) pour l'input type=date
    const dateOfAvailability = rawDate ? rawDate.split("T")[0] : "";

    // Comportement hors stock
    const showIfOutOfStock = extractXml(xml, "ShowIfOutOfStock").toLowerCase() === "true";
    const saleIfOutOfStock = extractXml(xml, "SaleIfOutOfStock").toLowerCase() === "true";
    const saleIfOutOfStockScenario = parseInt(extractXml(xml, "SaleIfOutOfStockScenario") || "0", 10);

    return Response.json({ name, oxatisId, descriptionLong, description, dateOfAvailability, showIfOutOfStock, saleIfOutOfStock, saleIfOutOfStockScenario });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
