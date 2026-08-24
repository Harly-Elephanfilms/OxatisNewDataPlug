const PRODUCT_SERVICES_URL =
  "https://webservices.oxatis.com/webservices/httpservices/ProductServices.aspx";

const CATEGORY_SERVICES_URL =
  "https://webservices.oxatis.com/webservices/httpservices/CategoryServices.aspx";

const CHARACTERISTICS_SERVICES_URL =
  "https://webservices.oxatis.com/webservices/httpservices/ProductCharacteristicsServices.aspx";

const XML_NS = 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"';

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Un numéro de slot Oxatis est un entier 1–10 interpolé dans un NOM de balise
 * (`<Category{slot}>`), donc non échappable : il doit être validé strictement
 * pour éviter toute injection de balise XML.
 */
function isValidSlot(slot: unknown): slot is number {
  return typeof slot === "number" && Number.isInteger(slot) && slot >= 1 && slot <= 10;
}

interface OxatisParams {
  appId: string;
  token: string;
  method: string;
  data: string;
  url?: string;
}

async function callOxatis({ appId, token, method, data, url }: OxatisParams): Promise<string> {
  const body = `AppId=${encodeURIComponent(appId)}&Token=${encodeURIComponent(token)}&Method=${encodeURIComponent(method)}&Data=${encodeURIComponent(data)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let response: Response;
  try {
    response = await fetch(url || PRODUCT_SERVICES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    throw new Error(isTimeout ? `Timeout (30s) — méthode : ${method}` : `Erreur réseau — méthode : ${method}`);
  } finally {
    clearTimeout(timeout);
  }

  // Les erreurs HTTP (4xx/5xx) renvoient souvent une page HTML, pas du XML
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} — méthode : ${method}`);
  }

  return response.text();
}

// Get full product details (includes QuantityInStock) by OxID or ItemSKU
export async function getProductByOxId(
  appId: string,
  token: string,
  oxatisId: string
): Promise<string> {
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><OxID>${escapeXml(oxatisId)}</OxID></Product>`;
  return callOxatis({ appId, token, method: "ProductGet", data });
}

export async function getProductBySKU(
  appId: string,
  token: string,
  itemSKU: string
): Promise<string> {
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><ItemSKU>${escapeXml(itemSKU)}</ItemSKU></Product>`;
  return callOxatis({ appId, token, method: "ProductGet", data });
}

// Get stock quantity only by OxID
export async function getStockByOxId(
  appId: string,
  token: string,
  oxatisId: string
): Promise<string> {
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><OxID>${escapeXml(oxatisId)}</OxID></Product>`;
  return callOxatis({ appId, token, method: "ProductGetQuantityInStock", data });
}

// Get stock quantity by ItemSKU
export async function getStockBySKU(
  appId: string,
  token: string,
  itemSKU: string
): Promise<string> {
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><ItemSKU>${escapeXml(itemSKU)}</ItemSKU></Product>`;
  return callOxatis({ appId, token, method: "ProductGetQuantityInStock", data });
}

// Update stock quantity by OxID
export async function updateStockByOxId(
  appId: string,
  token: string,
  oxatisId: string,
  quantity: number,
  append: boolean = false
): Promise<string> {
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><OxID>${escapeXml(oxatisId)}</OxID><QuantityInStock><Value>${quantity}</Value><Append>${append}</Append></QuantityInStock></Product>`;
  return callOxatis({ appId, token, method: "ProductUpdateQuantityInStock", data });
}

// Update stock quantity by ItemSKU
export async function updateStockBySKU(
  appId: string,
  token: string,
  itemSKU: string,
  quantity: number,
  append: boolean = false
): Promise<string> {
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><ItemSKU>${escapeXml(itemSKU)}</ItemSKU><QuantityInStock><Value>${quantity}</Value><Append>${append}</Append></QuantityInStock></Product>`;
  return callOxatis({ appId, token, method: "ProductUpdateQuantityInStock", data });
}

// --- Category methods ---

// Get full category tree from CategoryServices
export async function getCategoryTree(
  appId: string,
  token: string
): Promise<string> {
  const data = `<?xml version="1.0" encoding="utf-8"?><RootCategory ${XML_NS}><Name></Name><Language>fr</Language></RootCategory>`;
  return callOxatis({ appId, token, method: "ProductCategoryGetTreeCollection", data, url: CATEGORY_SERVICES_URL });
}

// Get categories assigned to a product by ItemSKU (g:id in Google Shopping XML)
export async function getProductCategories(
  appId: string,
  token: string,
  oxId: string
): Promise<string> {
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><OxID>${escapeXml(oxId)}</OxID></Product>`;
  return callOxatis({ appId, token, method: "ProductGetCategories", data });
}

// Update categories assigned to a product
export interface CategoryAssignment {
  oxId: string;
  name: string;
  parentOxId: string;
  slot: number; // real Oxatis slot number (1–10)
}

// Step 1: clear all category slots by sending the product with no Category tags at all.
// Oxatis may interpret this as "set 0 categories" and wipe all existing slots.
export async function clearProductCategories(
  appId: string,
  token: string,
  oxId: string
): Promise<string> {
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><OxID>${escapeXml(oxId)}</OxID></Product>`;
  return callOxatis({ appId, token, method: "ProductUpdateCategories", data });
}

export async function updateProductCategories(
  appId: string,
  token: string,
  oxId: string,
  categories: CategoryAssignment[]
): Promise<string> {
  const slotMap = new Map<number, CategoryAssignment>();
  categories.forEach((cat) => slotMap.set(cat.slot, cat));

  let catXml = "";
  for (let i = 1; i <= 10; i++) {
    if (slotMap.has(i)) {
      const cat = slotMap.get(i)!;
      catXml += `<Category${i}><OxID>${escapeXml(cat.oxId)}</OxID></Category${i}>`;
    } else {
      catXml += `<Category${i}><OxID>0</OxID><Name>#null#</Name><Language>fr</Language><ParentOxId>0</ParentOxId></Category${i}>`;
    }
  }
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><OxID>${escapeXml(oxId)}</OxID>${catXml}</Product>`;
  return callOxatis({ appId, token, method: "ProductUpdateCategories", data });
}

// Variante de updateProductCategories utilisant <ItemSKU> — pour les articles fraîchement créés.
// N'envoie QUE les slots à assigner (pas de #null# pour les slots vides) car Oxatis lève une
// exception si on tente de vider des slots inexistants sur un nouvel article.
export async function updateProductCategoriesBySKU(
  appId: string,
  token: string,
  itemSKU: string,
  categories: CategoryAssignment[]
): Promise<string> {
  const catXml = categories
    .filter((cat) => isValidSlot(cat.slot))
    .map((cat) => `<Category${cat.slot}><OxID>${escapeXml(cat.oxId)}</OxID></Category${cat.slot}>`)
    .join("");
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><ItemSKU>${escapeXml(itemSKU)}</ItemSKU>${catXml}</Product>`;
  return callOxatis({ appId, token, method: "ProductUpdateCategories", data });
}

// Update or clear a single category slot without affecting other slots
export async function updateSingleSlot(
  appId: string,
  token: string,
  oxId: string,
  slot: number,
  category: CategoryAssignment | null
): Promise<string> {
  if (!isValidSlot(slot)) {
    throw new Error(`Slot invalide : ${slot} (attendu : entier 1–10)`);
  }
  let slotXml: string;
  if (category) {
    slotXml = `<Category${slot}><OxID>${escapeXml(category.oxId)}</OxID></Category${slot}>`;
  } else {
    slotXml = `<Category${slot}><OxID>0</OxID><Name>#null#</Name><Language>fr</Language><ParentOxId>0</ParentOxId></Category${slot}>`;
  }
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><OxID>${escapeXml(oxId)}</OxID>${slotXml}</Product>`;
  return callOxatis({ appId, token, method: "ProductUpdateCategories", data });
}

// --- Description longue d'un produit ---

// Récupère le détail complet d'un produit par ItemSKU (inclut DescriptionLong)
export async function getProductDetailBySKU(
  appId: string,
  token: string,
  itemSKU: string
): Promise<string> {
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><ItemSKU>${escapeXml(itemSKU)}</ItemSKU></Product>`;
  return callOxatis({ appId, token, method: "ProductGet", data });
}

// Oxatis marque les descriptions longues éditées en HTML par ce commentaire de tête ;
// sans lui le contenu peut être rendu comme du texte brut. Ajout idempotent.
const WYSIWYG_MARKER = "<!--#WYSIWYG#-->";
function withWysiwygMarker(html: string): string {
  // Une description vide doit rester vide : elle sert à effacer le champ.
  if (!html.trim()) return html;
  return html.startsWith(WYSIWYG_MARKER) ? html : WYSIWYG_MARKER + html;
}

// Met à jour la description longue d'un produit
export async function updateProductDescription(
  appId: string,
  token: string,
  itemSKU: string,
  descriptionLong: string
): Promise<string> {
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><ItemSKU>${escapeXml(itemSKU)}</ItemSKU><LongDescription>${escapeXml(withWysiwygMarker(descriptionLong))}</LongDescription><Language>fr</Language></Product>`;
  return callOxatis({ appId, token, method: "ProductUpdate", data });
}

// Met à jour la visibilité d'un produit (true = visible sur le site, false = masqué)
export async function updateProductVisible(
  appId: string,
  token: string,
  itemSKU: string,
  visible: boolean
): Promise<string> {
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><ItemSKU>${escapeXml(itemSKU)}</ItemSKU><Visible>${visible}</Visible><Language>fr</Language></Product>`;
  return callOxatis({ appId, token, method: "ProductUpdate", data });
}

// Met à jour le comportement hors stock d'un produit
export async function updateProductOutOfStock(
  appId: string,
  token: string,
  itemSKU: string,
  showIfOutOfStock: boolean,
  saleIfOutOfStock: boolean,
  saleIfOutOfStockScenario: number
): Promise<string> {
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><ItemSKU>${escapeXml(itemSKU)}</ItemSKU><ShowIfOutOfStock>${showIfOutOfStock}</ShowIfOutOfStock><SaleIfOutOfStock>${saleIfOutOfStock}</SaleIfOutOfStock><SaleIfOutOfStockScenario>${saleIfOutOfStockScenario}</SaleIfOutOfStockScenario><Language>fr</Language></Product>`;
  return callOxatis({ appId, token, method: "ProductUpdate", data });
}

// Met à jour la date de disponibilité d'un produit (format YYYY-MM-DD ou vide pour effacer)
export async function updateProductAvailability(
  appId: string,
  token: string,
  itemSKU: string,
  dateOfAvailability: string // YYYY-MM-DD ou "" pour effacer
): Promise<string> {
  // On n'accepte qu'un format strict YYYY-MM-DD ; toute autre valeur efface la date.
  const dateXml = /^\d{4}-\d{2}-\d{2}$/.test(dateOfAvailability)
    ? `<DateOfAvailability>${dateOfAvailability}T00:00:00</DateOfAvailability>`
    : `<DateOfAvailability xsi:nil="true" />`;
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><ItemSKU>${escapeXml(itemSKU)}</ItemSKU>${dateXml}<Language>fr</Language></Product>`;
  return callOxatis({ appId, token, method: "ProductUpdate", data });
}

// Met à jour le nom d'un produit
export async function updateProductName(
  appId: string,
  token: string,
  itemSKU: string,
  name: string
): Promise<string> {
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><ItemSKU>${escapeXml(itemSKU)}</ItemSKU><Name>${escapeXml(name)}</Name><Language>fr</Language></Product>`;
  return callOxatis({ appId, token, method: "ProductUpdate", data });
}

// Met à jour le prix HT et le taux de TVA d'un produit
export async function updateProductPriceHT(
  appId: string,
  token: string,
  itemSKU: string,
  priceHT: number,
  tva: number
): Promise<string> {
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><ItemSKU>${escapeXml(itemSKU)}</ItemSKU><Price><Value>${priceHT.toFixed(2)}</Value><VATIncluded>false</VATIncluded></Price><TaxRate>${tva}</TaxRate><Language>fr</Language></Product>`;
  return callOxatis({ appId, token, method: "ProductUpdate", data });
}

// --- Création de produit ---

export interface ProductFeature {
  name: string;
  value: string;
}

export interface ProductCreateData {
  itemSKU: string;      // Référence unique (obligatoire)
  name: string;         // Titre du produit (obligatoire)
  priceHT?: number;     // Prix hors taxe
  tva?: number;         // Taux TVA en % (ex: 20 pour 20%)
  stock?: number;       // Quantité initiale en stock
  description?: string; // Description courte (4 ko max)
  descriptionLong?: string; // Description détaillée / longue (16 ko max)
  brand?: string;       // Marque / éditeur
  ean?: string;         // Code-barres EAN
  weight?: number;      // Poids en kg
  features?: ProductFeature[]; // Caractéristiques — incluses dans ProductV2Add
  // Note: les images ne peuvent pas être assignées lors de la création via ProductV2Add.
  // Elles doivent être gérées séparément (galerie Oxatis).
  // Note: les catégories sont assignées séparément via updateProductCategories
}

// --- Suppression de produit ---

/**
 * Supprime un produit sur Oxatis par OxID (identifiant numérique interne).
 * Méthode API: ProductDelete sur ProductServices.
 * Note: oxatisId = colonne "OxatisId" du CSV export = OxID numérique (≠ ItemSKU).
 */
export async function deleteProduct(
  appId: string,
  token: string,
  oxatisId: string
): Promise<string> {
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><OxID>${escapeXml(oxatisId)}</OxID></Product>`;
  return callOxatis({ appId, token, method: "ProductDelete", data });
}

/**
 * Met à jour les caractéristiques d'un produit sur Oxatis.
 * Méthode API: ProductCharacteristicsUpdate sur ProductCharacteristicsServices.
 * Chaque caractéristique peut avoir plusieurs valeurs.
 * Exemple CSV : "Couleur=Rouge|Matière=Coton" → [{name:"Couleur", value:"Rouge"}, ...]
 */
export async function updateProductCharacteristics(
  appId: string,
  token: string,
  itemSKU: string,
  features: ProductFeature[]
): Promise<string> {
  const characteristicsXml = features
    .map(
      (f) =>
        `<Characteristic><Name>${escapeXml(f.name)}</Name><SysName>${escapeXml(f.name)}</SysName><Values><string>${escapeXml(f.value)}</string></Values></Characteristic>`
    )
    .join("");
  const data = `<?xml version="1.0" encoding="utf-8"?><Characteristics ${XML_NS}><ItemSKU>${escapeXml(itemSKU)}</ItemSKU>${characteristicsXml}</Characteristics>`;
  return callOxatis({ appId, token, method: "ProductCharacteristicsUpdate", data, url: CHARACTERISTICS_SERVICES_URL });
}

/**
 * Crée un nouveau produit sur Oxatis.
 * Méthode API: ProductV2Add sur ProductServices.
 *
 * Champs XML validés contre la doc officielle Oxatis (OWS API User Guide v11.30).
 */
export async function createProduct(
  appId: string,
  token: string,
  product: ProductCreateData
): Promise<string> {
  // Les éléments suivent l'ordre de la séquence <Product> du schéma OWS
  // (ItemSKU, ProductLanguage, Name, Description, Price, TaxRate, LongDescription,
  //  Brand, QuantityInStock, Weight, EANCode).
  let xml = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}>`;
  xml += `<ItemSKU>${escapeXml(product.itemSKU)}</ItemSKU>`;
  xml += `<ProductLanguage>fr</ProductLanguage>`;
  xml += `<Name>${escapeXml(product.name)}</Name>`;
  if (product.description?.trim()) {
    xml += `<Description>${escapeXml(product.description)}</Description>`;
  }
  if (product.priceHT !== undefined) {
    // Price est un type complexe : <Value> (float) + <VATIncluded> (bool, false = HT)
    xml += `<Price><Value>${product.priceHT.toFixed(2)}</Value><VATIncluded>false</VATIncluded></Price>`;
  }
  if (product.tva !== undefined) {
    // Le champ s'appelle TaxRate (pas TVARate)
    xml += `<TaxRate>${product.tva}</TaxRate>`;
  }
  if (product.descriptionLong?.trim()) {
    // Champ distinct de <Description> : c'est la description détaillée (HTML) de la fiche
    xml += `<LongDescription>${escapeXml(withWysiwygMarker(product.descriptionLong))}</LongDescription>`;
  }
  if (product.brand?.trim()) {
    // Brand est un type complexe : OxID=0 + Name crée ou trouve la marque automatiquement
    xml += `<Brand><OxID>0</OxID><Name>${escapeXml(product.brand)}</Name></Brand>`;
  }
  if (product.stock !== undefined) {
    xml += `<QuantityInStock><Value>${product.stock}</Value><Append>false</Append></QuantityInStock>`;
  }
  if (product.weight && product.weight > 0) {
    xml += `<Weight>${product.weight}</Weight>`;
  }
  if (product.ean?.trim()) {
    // Le champ s'appelle EANCode (pas EAN)
    xml += `<EANCode>${escapeXml(product.ean)}</EANCode>`;
  }
  xml += `</Product>`;

  return callOxatis({ appId, token, method: "ProductV2Add", data: xml });
}
