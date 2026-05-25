import { getProductDetailBySKU } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { extractXml, parseOxatisError } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemSKU = searchParams.get("itemSKU") ?? "";
    const { appId, token } = getCredentials(request);

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
    const dateOfAvailability = rawDate ? rawDate.split("T")[0] : "";

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
