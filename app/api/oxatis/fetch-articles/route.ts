import { parseCSVRows } from "./utils";

const ARTICLES_CSV_URL =
  process.env.OXATIS_ARTICLES_CSV_URL ||
  "http://www.elephantfilms.com/Data/DataPlug/All/Oxatis-All-elysee-40682.csv";

export async function GET() {
  try {
    const response = await fetch(ARTICLES_CSV_URL, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return Response.json(
        { error: `Erreur HTTP ${response.status} lors du téléchargement du CSV` },
        { status: 500 }
      );
    }

    const buffer = await response.arrayBuffer();
    const csvText = new TextDecoder("windows-1252").decode(buffer);

    if (csvText.includes("<!DOCTYPE html") || csvText.includes("<html")) {
      return Response.json(
        { error: "Le serveur a retourné du HTML au lieu du CSV (Cloudflare)" },
        { status: 502 }
      );
    }

    const items = parseCSVRows(csvText);

    return Response.json({
      count: items.length,
      items,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
