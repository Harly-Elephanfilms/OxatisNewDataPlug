export interface MatriceArticle {
  ean: string;
  itemSKU: string;
  langue: string;
  nom: string;
  prixTTC: number;
  tva: number;
  categories: string[];
  description: string;
  descriptionLongue: string;
  metaTitle: string;
  metaDescription: string;
  urlCanonique: string;
  afficherStock: string;
  montrerSiIndispo: string;
  causeIndispo: string;
  imageZoom1: string;
  imageMain: string;
  imageVignette: string;
  dateDispo: string;
  afficherDelai: string;
  isNew: boolean;
  oxatisId: string | null;
}

export interface ProgressState {
  current: number;
  total: number;
  errors: string[];
  label: string;
}

export interface ConflictItem {
  matrice: MatriceArticle;
  oxatis: {
    name: string;
    description: string;
    descriptionLong: string;
    dateOfAvailability: string;
    oxatisId: string;
  };
}

export type DefaultCategory = { oxId: string; name: string; parentOxId: string };
export type UpdateFields = { description: boolean; dateDispo: boolean; nom: boolean; prix: boolean };

export const DEFAULT_CAT_KEY = "oxatis_matrice_default_cat";
export const UPDATE_FIELDS_KEY = "oxatis_matrice_update_fields";

export function loadDefaultCategory(): DefaultCategory | null {
  try {
    const s = localStorage.getItem(DEFAULT_CAT_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export function loadUpdateFields(): UpdateFields {
  try {
    const s = localStorage.getItem(UPDATE_FIELDS_KEY);
    return s ? JSON.parse(s) : { description: true, dateDispo: true, nom: false, prix: false };
  } catch { return { description: true, dateDispo: true, nom: false, prix: false }; }
}

export function str(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
