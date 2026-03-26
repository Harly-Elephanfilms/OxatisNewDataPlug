import { getCategoryTree } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { extractXml, parseOxatisError } from "@/lib/api-helpers";
import type { CategoryNode } from "@/lib/types";

function parseCategoryNodes(xml: string, tagName: string): CategoryNode[] {
  const nodes: CategoryNode[] = [];
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "gi");
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const block = match[1];
    const oxId = extractXml(block, "OxID");
    const name = extractXml(block, "Name");
    const parentOxId = extractXml(block, "ParentOxId") || "0";

    if (!oxId || !name) continue;

    // Parse children recursively
    const children = parseCategoryNodes(block, "ChildCategory");

    nodes.push({ oxId, name, parentOxId, children });
  }

  return nodes;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { appId, token } = getCredentials(searchParams.get("appId"), searchParams.get("token"));

  if (!appId || !token) {
    return Response.json({ error: "Identifiants API requis" }, { status: 400 });
  }

  try {
    const xmlResponse = await getCategoryTree(appId, token);

    const catError = parseOxatisError(xmlResponse);
    if (catError) return Response.json({ error: catError, raw: xmlResponse }, { status: 500 });

    const tree = parseCategoryNodes(xmlResponse, "ProductCategoryTree");

    return Response.json({ tree });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
