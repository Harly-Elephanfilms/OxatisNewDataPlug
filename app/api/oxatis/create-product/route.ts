import { createProduct, updateProductCategoriesBySKU } from "@/lib/oxatis-api";
import type { ProductCreateData, CategoryAssignment } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { parseOxatisError, extractXml } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { product } = body as {
      appId?: string;
      token?: string;
      product: ProductCreateData & { categories?: CategoryAssignment[] };
    };
    const { appId, token } = getCredentials(body.appId, body.token);

    if (!appId || !token || !product?.itemSKU || !product?.name) {
      return Response.json(
        { error: "Paramètres manquants (appId, token, product.itemSKU, product.name)" },
        { status: 400 }
      );
    }

    // Étape 1 : créer le produit
    const xmlResponse = await createProduct(appId, token, product);
    const createError = parseOxatisError(xmlResponse);
    if (createError) return Response.json({ error: createError, raw: xmlResponse }, { status: 500 });

    const oxatisId = extractXml(xmlResponse, "OxID");

    // Étape 2 : assigner les catégories si fournies (via ItemSKU — garantit de fonctionner sur un produit fraîchement créé)
    let categoriesResult: { success?: boolean; error?: string } | null = null;
    if (product.categories && product.categories.length > 0) {
      const catResponse = await updateProductCategoriesBySKU(appId, token, product.itemSKU, product.categories);
      const catError = parseOxatisError(catResponse);
      categoriesResult = catError ? { error: catError } : { success: true };
    }

    return Response.json({ success: true, oxatisId: oxatisId || undefined, categoriesResult });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
