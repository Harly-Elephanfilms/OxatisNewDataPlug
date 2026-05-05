/**
 * Extrait la valeur d'un tag XML (premier match, insensible à la casse).
 * Supporte les attributs dans le tag ouvrant et décode les entités HTML.
 */
export function extractXml(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) return "";
  return match[1].trim()
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Vérifie la réponse XML d'Oxatis et retourne une Response JSON.
 * - StatusCode 200 → { success: true }
 * - Autre StatusCode → { error, raw } avec status 500
 * - Réponse vide ou HTML → { error, raw } avec status 500
 */
export function oxatisResponse(xml: string, _fallbackError?: string): Response {
  const error = parseOxatisError(xml);
  if (error) return Response.json({ error, raw: xml }, { status: 500 });
  return Response.json({ success: true });
}

/**
 * Retourne le message d'erreur Oxatis si la réponse n'est pas un succès, ou null si OK.
 *
 * Cas d'erreur détectés :
 *  - Réponse vide (timeout absorbé ou connexion coupée)
 *  - Page HTML (erreur IIS/serveur, mauvaise URL)
 *  - StatusCode présent mais ≠ 200
 */
export function parseOxatisError(xml: string): string | null {
  const t = xml?.trim() ?? "";

  if (!t) return "Réponse vide du serveur Oxatis";

  // Page d'erreur HTML renvoyée à la place du XML (ex : IIS 500, Bad Gateway)
  if (t.startsWith("<html") || t.startsWith("<!DOCTYPE") || t.startsWith("<!doctype")) {
    return "Erreur serveur Oxatis (réponse HTML inattendue)";
  }

  if (t.includes("<StatusCode>") && !t.includes("<StatusCode>200</StatusCode>")) {
    const errorMatch = t.match(/<ErrorDetails>([^<]*)<\/ErrorDetails>/);
    return errorMatch?.[1] || "Erreur API Oxatis";
  }

  return null;
}

/**
 * Délai non bloquant — utilisé entre les appels en masse pour éviter
 * de saturer l'API Oxatis (pas de rate-limit documenté, mais bonne pratique).
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
