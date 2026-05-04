import { createProduct, updateProductCategoriesBySKU, updateProductCharacteristics } from "@/lib/oxatis-api";
import type { ProductCreateData, CategoryAssignment, ProductFeature } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { parseOxatisError, extractXml } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      product: ProductCreateData & { categories?: CategoryAssignment[]; features?: ProductFeature[] };
    };
    const { appId, token } = getCredentials(request);
    const { product } = body;

    if (!appId || !token || !product?.itemSKU || !product?.name) {
      return Response.json(
        { error: "Paramètres manquants (appId, token, product.itemSKU, product.name)" },
        { status: 400 }
      );
    }

    const xmlResponse = await createProduct(appId, token, product);
    const createError = parseOxatisError(xmlResponse);
    if (createError) return Response.json({ error: createError, raw: xmlResponse }, { status: 500 });

    const oxatisId = extractXml(xmlResponse, "OxID");

    let categoriesResult: { success?: boolean; error?: string } | null = null;
    if (product.categories && product.categories.length > 0) {
      const catResponse = await updateProductCategoriesBySKU(appId, token, product.itemSKU, product.categories);
      const catError = parseOxatisError(catResponse);
      categoriesResult = catError ? { error: catError } : { success: true };
    }

    let featuresResult: { success?: boolean; count?: number; error?: string } | null = null;
    if (product.features && product.features.length > 0) {
      const featResponse = await updateProductCharacteristics(appId, token, product.itemSKU, product.features);
      const featError = parseOxatisError(featResponse);
      featuresResult = featError
        ? { error: featError }
        : { success: true, count: product.features.length };
    }

    return Response.json({ success: true, oxatisId: oxatisId || undefined, categoriesResult, featuresResult });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
