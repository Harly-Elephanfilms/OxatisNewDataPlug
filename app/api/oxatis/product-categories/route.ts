import { getProductCategories, updateProductCategories } from "@/lib/oxatis-api";
import type { CategoryAssignment } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { oxatisResponse, extractXml, parseOxatisError } from "@/lib/api-helpers";

function parseProductCategories(xml: string): CategoryAssignment[] {
  const categories: CategoryAssignment[] = [];
  // Categories are named Category1, Category2, ... up to Category10
  for (let i = 1; i <= 10; i++) {
    const catRegex = new RegExp(`<Category${i}>([\\s\\S]*?)</Category${i}>`, "i");
    const match = xml.match(catRegex);
    if (match) {
      const block = match[1];
      const oxId = extractXml(block, "OxID");
      const name = extractXml(block, "Name").trim();
      const parentOxId = extractXml(block, "ParentOxId") || "0";
      // Ignorer les catégories vides (OxID=0 ou nom vide)
      if (oxId && oxId !== "0" && name) {
        categories.push({ oxId, name, parentOxId, slot: i });
      }
    }
  }
  return categories;
}

// GET: fetch categories for a product
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { appId, token } = getCredentials(searchParams.get("appId"), searchParams.get("token"));
  const oxatisId = searchParams.get("oxatisId");

  if (!appId || !token || !oxatisId) {
    return Response.json({ error: "Paramètres manquants (appId, token, oxatisId)" }, { status: 400 });
  }

  try {
    const xmlResponse = await getProductCategories(appId, token, oxatisId);

    const catGetError = parseOxatisError(xmlResponse);
    if (catGetError) return Response.json({ error: catGetError, raw: xmlResponse }, { status: 500 });

    const categories = parseProductCategories(xmlResponse);
    return Response.json({ categories });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

// POST: update categories for a product
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { oxatisId, categories } = body as {
      appId?: string;
      token?: string;
      oxatisId: string;
      categories: CategoryAssignment[];
    };
    const { appId, token } = getCredentials(body.appId, body.token);

    if (!appId || !token || !oxatisId || !categories) {
      return Response.json({ error: "Paramètres manquants", detail: { appId: !!appId, token: !!token, oxatisId, categories } }, { status: 400 });
    }

    const xmlResponse = await updateProductCategories(appId, token, oxatisId, categories);
    return oxatisResponse(xmlResponse, "Erreur mise à jour catégories");
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
