import { getProductCategories, updateProductCategories } from "@/lib/oxatis-api";
import type { CategoryAssignment } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { oxatisResponse, extractXml, parseOxatisError } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

function parseProductCategories(xml: string): CategoryAssignment[] {
  const categories: CategoryAssignment[] = [];
  for (let i = 1; i <= 10; i++) {
    const catRegex = new RegExp(`<Category${i}>([\\s\\S]*?)</Category${i}>`, "i");
    const match = xml.match(catRegex);
    if (match) {
      const block = match[1];
      const oxId = extractXml(block, "OxID");
      const name = extractXml(block, "Name").trim();
      const parentOxId = extractXml(block, "ParentOxId") || "0";
      if (oxId && oxId !== "0" && name) {
        categories.push({ oxId, name, parentOxId, slot: i });
      }
    }
  }
  return categories;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const { appId, token } = getCredentials(request);
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      oxatisId: string;
      categories: CategoryAssignment[];
    };
    const { appId, token } = getCredentials(request);
    const { oxatisId, categories } = body;

    if (!appId || !token || !oxatisId || !categories) {
      return Response.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const xmlResponse = await updateProductCategories(appId, token, oxatisId, categories);
    return oxatisResponse(xmlResponse);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
