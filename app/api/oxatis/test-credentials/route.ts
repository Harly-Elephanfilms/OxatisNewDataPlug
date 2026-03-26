import { getStockBySKU } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";

// Appel léger : ProductGetQuantityInStock sur un SKU factice.
// 503 = credentials invalides. Toute autre réponse = credentials OK (même "produit introuvable").
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { appId, token } = getCredentials(
    searchParams.get("appId"),
    searchParams.get("token")
  );

  if (!appId || !token) {
    return Response.json({ error: "Identifiants manquants" }, { status: 400 });
  }

  try {
    const xml = await getStockBySKU(appId, token, "__test__");
    if (xml.includes("<StatusCode>503</StatusCode>")) {
      return Response.json({ error: "Identifiants invalides (503 Unauthorized)" }, { status: 401 });
    }
    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
