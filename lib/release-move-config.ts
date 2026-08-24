import type { CategoryAssignment } from "@/lib/oxatis-api";

/**
 * Choix « catégorie de départ → catégorie de destination » du panneau Sorties.
 * Conservé dans localStorage : c'est un réglage de poste, pas une donnée Oxatis.
 * Exposé en store externe pour que React l'hydrate sans décalage serveur/client.
 */

export interface ReleaseMoveConfig {
  source: string;
  target: Omit<CategoryAssignment, "slot"> | null;
}

const STORE_KEY = "oxatis.releaseCategoryMove";
export const DEFAULT_SOURCE = "Prochainement";
const DEFAULT_CONFIG: ReleaseMoveConfig = { source: DEFAULT_SOURCE, target: null };

const listeners = new Set<() => void>();
// getSnapshot doit rendre la même référence tant que rien n'a changé, sinon
// React reboucle indéfiniment : on mémorise le brut lu et l'objet dérivé.
let cachedRaw: string | null = null;
let cachedConfig: ReleaseMoveConfig = DEFAULT_CONFIG;

function parse(raw: string | null): ReleaseMoveConfig {
  if (!raw) return DEFAULT_CONFIG;
  try {
    const parsed = JSON.parse(raw) as Partial<ReleaseMoveConfig>;
    return {
      source: typeof parsed.source === "string" && parsed.source ? parsed.source : DEFAULT_SOURCE,
      target: parsed.target?.oxId ? parsed.target : null,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function getSnapshot(): ReleaseMoveConfig {
  const raw = window.localStorage.getItem(STORE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedConfig = parse(raw);
  }
  return cachedConfig;
}

export function getServerSnapshot(): ReleaseMoveConfig {
  return DEFAULT_CONFIG;
}

export function saveConfig(patch: Partial<ReleaseMoveConfig>): void {
  const next = { ...getSnapshot(), ...patch };
  cachedRaw = JSON.stringify(next);
  cachedConfig = next;
  window.localStorage.setItem(STORE_KEY, cachedRaw);
  for (const listener of listeners) listener();
}
