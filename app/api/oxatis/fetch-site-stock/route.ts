const SITE_STOCK_URL =
  "http://www.elephantfilms.com/Data/DataPlug/All/Oxatis-All-elysee-47129.csv";

export async function GET() {
  try {
    const response = await fetch(SITE_STOCK_URL, {
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

    // Le CSV du site est encodé en ISO-8859-1 (Latin-1), pas en UTF-8
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder("iso-8859-1");
    const csvText = decoder.decode(buffer);

    // Quick validation: check it starts with expected header
    if (!csvText.includes("OxatisId") && !csvText.includes("ItemSKU")) {
      return Response.json(
        { error: "Le fichier téléchargé ne semble pas être un CSV Oxatis valide" },
        { status: 500 }
      );
    }

    // Parse CSV server-side for efficiency
    const lines = csvText.split("\n").filter((l) => l.trim().length > 0);
    // Colonnes: OxatisId;ItemSKU;Name;QtyInStock;DaysToShip;QtyReorder;...;DateOfAvailability (col 12)
    const items: { oxatisId: string; itemSKU: string; name: string; qtyInStock: number; dateOfAvailability: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(";").map((c) => c.replace(/"/g, "").trim());
      if (cols[1]) {
        items.push({
          oxatisId: cols[0],
          itemSKU: cols[1],
          name: cols[2] || "",
          qtyInStock: parseInt(cols[3], 10) || 0,
          dateOfAvailability: cols[12] || "",
        });
      }
    }

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
