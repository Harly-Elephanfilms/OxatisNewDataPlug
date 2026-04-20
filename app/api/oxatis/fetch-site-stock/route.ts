import { parseSiteStockCSV } from "./utils";

const SITE_STOCK_URL =
  process.env.OXATIS_SITE_STOCK_URL ||
  "http://www.elephantfilms.com/Data/DataPlug/All/Oxatis-All-elysee-47129.csv";

export async function GET() {
  try {
    const response = await fetch(SITE_STOCK_URL, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return Response.json(
        { error: `Erreur HTTP ${response.status} lors du téléchargement du CSV` },
        { status: 500 }
      );
    }

    const buffer = await response.arrayBuffer();
    const csvText = new TextDecoder("iso-8859-1").decode(buffer);

    if (!csvText.includes("OxatisId") && !csvText.includes("ItemSKU")) {
      return Response.json(
        { error: "Le fichier téléchargé ne semble pas être un CSV Oxatis valide" },
        { status: 500 }
      );
    }

    const items = parseSiteStockCSV(csvText);

    return Response.json({
      total: items.length,
      items,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return Response.json({ error: message }, { status: 500 });
  }
}
