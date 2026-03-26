/**
 * Récupère les identifiants Oxatis depuis les variables d'environnement
 * ou depuis les paramètres fournis par le client (fallback).
 */
export function getCredentials(clientAppId?: string | null, clientToken?: string | null) {
  const appId = clientAppId || process.env.OXATIS_APP_ID || "";
  const token = clientToken || process.env.OXATIS_TOKEN || "";
  return { appId, token };
}

export function hasEnvCredentials(): boolean {
  return !!(process.env.OXATIS_APP_ID && process.env.OXATIS_TOKEN);
}
