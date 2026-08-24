import type { Article, StockItem } from "@/lib/types";
import type { CategoryAssignment } from "@/lib/oxatis-api";
import { isReleasedDate } from "@/lib/dates";

/**
 * Détection des articles dont la date de sortie est atteinte alors qu'ils sont
 * encore rangés dans la catégorie « à paraître » (« Prochainement » par défaut).
 *
 * Les deux flux DataPlug sont complémentaires : le flux stock porte la date de
 * disponibilité, le flux articles porte les catégories. On les joint par ItemSKU.
 */

export interface ReleaseCandidate {
  itemSKU: string;
  oxatisId: string;
  name: string;
  dateOfAvailability: string;
  categories: string[];
}

/** "Films\Nouveautés" est exporté "Films > Nouveautés" : on compare la feuille. */
function categoryLeaf(category: string): string {
  const parts = category.split(">");
  return parts[parts.length - 1].trim().toLowerCase();
}

export function matchesCategory(category: string, name: string): boolean {
  const target = name.trim().toLowerCase();
  if (!target) return false;
  return category.trim().toLowerCase() === target || categoryLeaf(category) === target;
}

export function detectReleaseCandidates(
  siteStock: StockItem[],
  articles: Article[],
  sourceCategoryName: string
): ReleaseCandidate[] {
  if (!sourceCategoryName.trim()) return [];

  const categoriesBySKU = new Map<string, Article>();
  for (const article of articles) {
    if (article.itemSKU) categoriesBySKU.set(article.itemSKU, article);
  }

  const candidates: ReleaseCandidate[] = [];
  for (const item of siteStock) {
    if (!isReleasedDate(item.dateOfAvailability ?? "")) continue;
    const article = categoriesBySKU.get(item.itemSKU);
    if (!article) continue;
    if (!article.categories.some((c) => matchesCategory(c, sourceCategoryName))) continue;

    candidates.push({
      itemSKU: item.itemSKU,
      oxatisId: item.oxatisId || article.oxatisId,
      name: item.name || article.title,
      dateOfAvailability: item.dateOfAvailability ?? "",
      categories: article.categories,
    });
  }
  return candidates;
}

/**
 * Remplace la catégorie source par la cible dans les affectations existantes.
 * La cible reprend le slot libéré pour ne pas déplacer les autres catégories ;
 * si la source est absente, la cible prend le premier slot libre (1 à 10).
 * Rend null quand il n'y a rien à changer — cible déjà présente, ou aucun slot.
 */
export function planCategoryChange(
  current: CategoryAssignment[],
  sourceCategoryName: string,
  target: Omit<CategoryAssignment, "slot">
): CategoryAssignment[] | null {
  if (current.some((c) => c.oxId === target.oxId)) return null;

  const kept = current.filter((c) => !matchesCategory(c.name, sourceCategoryName));
  const freedSlot = current.find((c) => matchesCategory(c.name, sourceCategoryName))?.slot;
  const usedSlots = new Set(kept.map((c) => c.slot));
  const slot = freedSlot ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].find((s) => !usedSlots.has(s));
  if (slot === undefined) return null;

  return [...kept, { ...target, slot }].sort((a, b) => a.slot - b.slot);
}
