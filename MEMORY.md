# Oxatis Stock Service — MEMORY.md

Historique des decisions techniques et fonctionnalites implementees.

---

## Architecture

- **Framework** : Next.js 16+ App Router (v16.2.1), React 19, Tailwind CSS v4, TypeScript 5
- **Dependance notable** : `papaparse` pour le parsing CSV
- **Pages** :
  - `/` (accueil — dashboard 5 outils)
  - `/stock` (gestion stock)
  - `/articles` (gestion articles/categories/suppression)
  - `/create` (creation article)
  - `/matrice` (import Excel MatriceOxatis — création + mise à jour en masse)
- **API routes** dans `app/api/oxatis/` : voir liste complète ci-dessous
- **Sidebar** navigation globale dans `app/components/Sidebar.tsx`

### Structure du projet

```
app/
  page.tsx                          -> Dashboard d'accueil (4 outils)
  stock/page.tsx                    -> Outil Stock Manager
  articles/page.tsx                 -> Outil Gestion des articles
  create/page.tsx                   -> Outil Creation d'articles
  api/oxatis/
    config/route.ts                 -> GET : retourne { hasCredentials: bool } (env vars dispo ?)
    fetch-articles/route.ts         -> Recupere le flux XML Google Shopping
    fetch-site-stock/route.ts       -> Recupere le stock site
    categories/route.ts             -> Arbre des categories Oxatis
    product-categories/route.ts     -> GET/POST categories d'un article
    product-detail/route.ts         -> Detail complet d'un produit (ProductGet)
    update-slot/route.ts            -> Met a jour un seul slot de categorie (bulk)
    update-stock/route.ts           -> Met a jour le stock d'un produit (batches de 10)
    update-description/route.ts     -> Met a jour la description longue (ProductUpdate)
    update-visibility/route.ts      -> Met a jour la visibilite (ProductUpdate)
    update-availability/route.ts    -> Met a jour la DATE de disponibilite (ProductUpdate)
    update-out-of-stock/route.ts    -> Met a jour le comportement hors stock (ProductUpdate)
    update-name/route.ts            -> Met a jour le nom/titre (ProductUpdate)
    update-price/route.ts           -> Met a jour le prix HT + TVA (ProductUpdate, type complexe Price)
    stock/route.ts                  -> Lecture stock
    create-product/route.ts         -> Creation de produit
    test-credentials/route.ts       -> GET : teste AppId+Token avec un appel leger (503 = invalide)
lib/
  oxatis-api.ts                     -> Toutes les fonctions d'appel a l'API Oxatis
  types.ts                          -> Types TypeScript partages (Article, CategoryNode, StockItem, etc.)
  server-credentials.ts             -> Gestion credentials cote serveur (env vars + fallback client)
  api-helpers.ts                    -> Helpers routes API : oxatisResponse(), parseOxatisError(), extractXml(tag)
```

---

## Types principaux (`lib/types.ts`)

- `StockItem` : produit Oxatis (oxatisId, itemSKU, name, qtyInStock, dateOfAvailability)
- `CsvStockItem` : ligne CSV fournisseur (ref, ean, title, type, regr, stock, autresStocks)
- `ComparisonItem` : resultat de comparaison stock CSV vs Oxatis (status: unchanged | increased | decreased | new | missing | preorder)
- `OxatisCredentials` : appId + token

**Note** : L'interface `Article` de `app/articles/page.tsx` est definie localement (pas dans `lib/types.ts`) et inclut des champs supplementaires : `visible`, `metaTitle`, `metaDescription`, `cost`, `shippingWeight`, `productType`, `brand`, `condition`, `categories` (string[]).

---

## Systeme de credentials

### Cote client

- Stockees en `localStorage` sous la cle `"oxatis_credentials"` (JSON `{ appId, token }`)
- Chargees via `useEffect` uniquement (pas dans `useState` initial -> evite l'erreur SSR)

### Cote serveur (`lib/server-credentials.ts`)

- `getCredentials(clientAppId?, clientToken?)` : prend le client en priorite, sinon utilise `OXATIS_APP_ID` et `OXATIS_TOKEN` depuis les variables d'environnement
- `hasEnvCredentials()` : retourne `true` si les deux vars env sont definies
- Route `GET /api/oxatis/config` expose `{ hasCredentials: bool }` au client pour adapter l'UI

**Pattern a suivre** : toutes les routes API appellent `getCredentials(body.appId, body.token)` — les credentials client sont optionnelles si les env vars sont configurees.

---

## API Oxatis — Patterns critiques

### Endpoints

- **ProductServices** : `https://webservices.oxatis.com/webservices/httpservices/ProductServices.aspx`
- **CategoryServices** : `https://webservices.oxatis.com/webservices/httpservices/CategoryServices.aspx`

### Identifiants produit

- La source de données articles est un **CSV** : `http://www.elephantfilms.com/Data/DataPlug/All/Oxatis-All-elysee-40682.csv`
- Dans ce CSV : colonne `OxatisId` = **OxID numérique** (identifiant interne Oxatis), colonne `ItemSKU` = texte SKU
- **TOUJOURS utiliser `<OxID>` pour toutes les opérations catégories** (`ProductGetCategories`, `ProductUpdateCategories`) et pour `ProductDelete`
- Ne jamais passer `oxatisId` (numérique) comme `<ItemSKU>` — l'API Oxatis ne trouve pas le produit et répond sans erreur (faux succès silencieux)

### Methodes utilisees

| Methode | Endpoint | Description |
|---|---|---|
| `ProductGet` | ProductServices | Detail complet d'un produit |
| `ProductGetQuantityInStock` | ProductServices | Stock d'un produit |
| `ProductUpdateQuantityInStock` | ProductServices | Mise a jour du stock |
| `ProductCategoryGetTreeCollection` | **CategoryServices** | Arbre complet des categories |
| `ProductGetCategories` | ProductServices | Categories assignees a un produit (slots 1-10) |
| `ProductUpdateCategories` | ProductServices | Mise a jour des categories d'un produit |
| `ProductCreate` | ProductServices | Creation d'un nouveau produit |
| `ProductUpdate` | ProductServices | Mise a jour des champs d'un produit existant |

### Methode `ProductUpdate` — champs supportes

- `<LongDescription>` : description longue (escapeXml obligatoire)
- `<Visible>true/false</Visible>` : visibilite sur le site
- `<ShowIfOutOfStock>`, `<SaleIfOutOfStock>`, `<SaleIfOutOfStockScenario>` : comportement hors stock
- `<DateOfAvailability>YYYY-MM-DDTHH:MM:SS</DateOfAvailability>` : date de disponibilite
- `<DateOfAvailability xsi:nil="true" />` : effacer la date de disponibilite
- Tous les appels `ProductUpdate` incluent `<Language>fr</Language>`

### Authentification

- AppId + Token envoyes en POST form-urlencoded
- Credentials stockees en `localStorage` cote client (cle `"oxatis_credentials"`)

---

## Categories — Comportement Oxatis

### Slots

- Un produit peut avoir jusqu'a **10 categories** (Category1 a Category10)
- `ProductGetCategories` retourne les 10 slots, les vides ont `OxID=0`
- **Filtrer les slots vides** : ignorer ceux ou `OxID === "0"` ou `name === ""`

### ProductUpdateCategories — Regles importantes

- Envoie **seulement les slots mentionnes** -> les autres restent inchanges
- **Categorie existante** : envoyer UNIQUEMENT `<OxID>` (pas de Name ni ParentOxId) sinon Oxatis CREE une nouvelle categorie
- `OxID=0` + `Name` renseigne -> Oxatis essaie de **creer** une nouvelle categorie
- `OxID=0` + `Name="#null#"` -> **vide le slot**
- `OxID=0` sans `Name` -> ignore silencieusement (no-op)

### XML correct pour assigner une categorie existante

```xml
<Category1><OxID>12345</OxID></Category1>
```

### XML correct pour vider un slot

```xml
<Category3><OxID>0</OxID><Name>#null#</Name><Language>fr</Language><ParentOxId>0</ParentOxId></Category3>
```

### XML correct pour mettre a jour un seul slot (sans toucher les autres)

Envoyer uniquement le slot concerne — utiliser `<OxID>` (PAS `<ItemSKU>`) :

```xml
<Product ...><OxID>12345</OxID><Category5><OxID>99999</OxID></Category5></Product>
```

### Echappement XML obligatoire

Les apostrophes dans les noms de categories (ex: "Les Films D'Horreur") doivent etre echappees :
- `'` -> `&apos;`
- La fonction `escapeXml()` dans `lib/oxatis-api.ts` gere ca

### parentOxId

- Les categories racine ont `parentOxId=""` dans la reponse Oxatis
- Toujours utiliser `"0"` comme valeur par defaut pour eviter les erreurs XML

---

## Fonctions API (`lib/oxatis-api.ts`)

- `getProductByOxId` / `getProductBySKU` — ProductGet
- `getProductDetailBySKU` — alias de getProductBySKU (meme methode ProductGet)
- `getStockByOxId` / `getStockBySKU` — ProductGetQuantityInStock
- `updateStockByOxId` / `updateStockBySKU` — ProductUpdateQuantityInStock (supporte `Append`)
- `getCategoryTree` — ProductCategoryGetTreeCollection (via CategoryServices)
- `getProductCategories` — ProductGetCategories
- `clearProductCategories` — ProductUpdateCategories (sans tags Category)
- `updateProductCategories` — envoie les 10 slots (assignes ou #null#)
- `updateSingleSlot` — met a jour un seul slot sans toucher aux autres
- `updateProductDescription` — ProductUpdate avec `<LongDescription>`
- `updateProductVisible` — ProductUpdate avec `<Visible>`
- `updateProductAvailability` — ProductUpdate avec `<DateOfAvailability>` (date ISO ou xsi:nil)
- `updateProductOutOfStock` — ProductUpdate avec `ShowIfOutOfStock/SaleIfOutOfStock/SaleIfOutOfStockScenario`
- `createProduct` — ProductCreate (SKU, nom, prix HT, TVA, stock, description, marque, EAN, poids, images)

### Interface CategoryAssignment

```typescript
interface CategoryAssignment {
  oxId: string;
  name: string;
  parentOxId: string;
  slot: number; // vrai numero de slot Oxatis (1-10)
}
```

### ⚠️ Typo dans le code : "Avaibility" vs "Availability"

Deux fonctions/routes avec des noms similaires pour des fonctionnalites DIFFERENTES :
- `updateProductAvailability` / `update-availability` -> met a jour la **date** de disponibilite
- `updateProductAvaibility` / `update-avaibility` -> met a jour le **comportement hors stock** (ShowIfOutOfStock, SaleIfOutOfStock, Scenario)

Ne pas confondre les deux. La typo "Avaibility" est dans le code — ne pas la corriger sans verifier tous les imports.

---

## Source de données articles

- URL CSV : `http://www.elephantfilms.com/Data/DataPlug/All/Oxatis-All-elysee-40682.csv`
- Colonnes clés : `OxatisId` (OxID numérique), `ItemSKU` (texte), `Title`, `Price`, `SalePrice`, `EAN`, `Quantity`, `Availability`, `ImageUrl`, `ProductType`, `Brand`, `Visible`, `MetaTitle`, `MetaDescription`, `Cost`, `ShippingWeight`
- **Doublons possibles** : dédupliquer par `oxatisId`

---

## Stock Manager (`app/stock/page.tsx`)

### Logique de calcul du nouveau stock

```typescript
function adjustNewStock(stock: number): number {
  const adjusted = stock - 5; // marge de securite -5
  if (adjusted <= -5) return 0;
  if (adjusted <= 0) return 1;
  return adjusted;
}
```

### Regles de filtrage

- Stock site < 0 ET pas de date de dispo -> **ignorer** (rupture/supprime)
- Date de dispo dans le futur -> **precommande**, forcer stock = `-9999`
- Stock site = 0 ET nouveau stock = 0 -> **ignorer** (pas de changement utile)

### Mise a jour en masse

- Route `POST /api/oxatis/update-stock` traite les items en **batches paralleles de 10**
- Retourne `{ updated, errors[], total }`

---

## Gestion des articles (`app/articles/page.tsx`)

### Fonctionnalites

1. **Tableau** avec tri, filtres (disponibilite, visibilite, categorie, marque, recherche), stats
2. **Modal article** avec 3 onglets : `infos`, `categories`, `seo`
   - Onglet `seo` : edition de `metaTitle` et `metaDescription`
3. **Modification en lot** : selection multiple + modal bulk edit

### Champs de l'interface Article

Outre les champs standard (oxatisId, itemSKU, title, price, etc.) :
- `visible` : bool — visibilite sur le site
- `metaTitle`, `metaDescription` : SEO
- `cost` : prix de revient
- `shippingWeight` : poids expedition
- `productType` : type produit (issu du flux Google Shopping)
- `categories` : string[] — noms des categories Google Shopping (≠ CategoryAssignment Oxatis)

### Copier/coller de categories

- Cle `localStorage` : `"oxatis_copied_categories"` (JSON d'un tableau `CategoryAssignment[]`)
- Permet de copier les categories d'un article et de les coller sur un autre

### Gestion des categories par article

- Affichage des slots avec **vrai numero** (Categorie 1, 2, ... 10)
- **Select** par slot pour reorganiser (swap automatique si slot deja pris)
- Bouton **"Tout vider"** -> vide la liste locale
- Bouton **"Mettre a jour sur le site"** avec **confirmation obligatoire** (bandeau orange)
- Le `slot` est stocke dans `CategoryAssignment` et preserve lors de la sauvegarde

### Modification en lot

- **Checkboxes** sur chaque ligne + case "tout selectionner" (avec etat indetermine)
- **Barre flottante** en bas des qu'un article est selectionne
- **Modal bulk edit** avec 5 modes :
  - `"Assigner un slot"` : choisir slot (1-10) + categorie dans l'arbre -> met a jour ce slot uniquement sur tous les articles selectionnes
  - `"Vider un slot"` : choisir slot -> envoie `#null#` sur ce slot pour tous les articles
  - `"Rendre visible"` : set `visible=true` sur tous les articles selectionnes (route `update-visibility`)
  - `"Masquer"` : set `visible=false` sur tous les articles selectionnes (route `update-visibility`)
  - `"Disponibilite"` : set une date (YYYY-MM-DD) ou vide pour effacer (route `update-availability`)
- **Confirmation** avant execution
- **Barre de progression** en temps reel + liste des erreurs
- Utilise `updateSingleSlot` -> ne touche qu'un seul slot, les autres restent intacts

---

## Creation d'articles (`app/create/page.tsx`)

### Fonctionnalites

1. **Formulaire unique** — creation article par article avec :
   - Identification : SKU*, Titre*, Marque, EAN
   - Prix : HT*, TVA (select), TTC calcule automatiquement
   - Stock initial + Poids
   - Categories (1-10 slots, meme tree picker que la page articles)
   - Description (textarea)
   - Images : message informatif (UI-only, pas de champ URL — voir note API ci-dessous)
   - Confirmation obligatoire avant envoi
2. **Import CSV** — import en masse avec :
   - Detection automatique du separateur (`;` ou `,`) et de l'encodage (UTF-8, ISO-8859-1)
   - Detection flexible des colonnes par nom (ref/sku, titre/name, prix/price_ht, etc.)
   - Apercu des 25 premieres lignes + validation ligne par ligne
   - Barre de progression en temps reel + liste des erreurs
   - Bouton de telechargement du template CSV
   - Colonnes template : `ref;titre;prix_ht;tva;ean;marque;stock;description`

### API route

- `POST /api/oxatis/create-product` — cree le produit, puis assigne les categories si fournies

### Methode Oxatis

- **Methode : `ProductV2Add`** (validee contre doc officielle OWS API v11.30 — PAS `ProductCreate`)
- Champs XML valides :
  - `<ItemSKU>` — obligatoire
  - `<Name>` — obligatoire
  - `<ProductLanguage>fr</ProductLanguage>` — (PAS `<Language>`)
  - `<Price><Value>X.XX</Value><VATIncluded>false</VATIncluded></Price>` — type complexe, VATIncluded=false = prix HT
  - `<TaxRate>X</TaxRate>` — (PAS `<TVARate>`)
  - `<QuantityInStock><Value>X</Value><Append>false</Append></QuantityInStock>`
  - `<Description>` — description courte
  - `<LongDescription>` — description longue (HTML, prefixer avec `<!--#WYSIWYG#-->`)
  - `<Brand><OxID>0</OxID><Name>texte</Name></Brand>` — type complexe, OxID=0 cree/trouve la marque auto
  - `<EANCode>` — (PAS `<EAN>`)
  - `<Weight>` — correct
- **Images** : `<ImageUrl1-5>` N'EXISTE PAS dans l'API. L'UI /create affiche un message informatif — images a gerer via la galerie Oxatis.
- La reponse `ProductV2Add` retourne `<OxID>` du produit cree — la route le retourne dans `{ oxatisId }`, affiche dans le message de succes.

---

## Decisions techniques

- `#null#` comme sentinel pour vider un slot categorie (decouvert par experimentation)
- UTF-8 BOM requis pour export CSV compatible Excel
- `isPreorder` : date de disponibilite future -> stock force a -9999
- Stock negatif sans date = rupture/supprime -> ignore
- XML encoding via `escapeXml()` pour les valeurs utilisateur (SKU, noms, etc.)
- Langue forcee a `fr` pour toutes les requetes categories
- Credentials chargees via `useEffect` (pas dans `useState` initial -> evite l'erreur SSR)
- `update-stock` traite les items en batches paralleles de 10 pour eviter le timeout
- `isFutureDate` dans stock/page.tsx supporte les formats `DD/MM/YYYY` et `YYYY-MM-DD`

## Design System (globals.css)

- Classes utilitaires : `.btn`, `.card`, `.badge`, `.input`, `.label`, `.data-table`, `.alert`, `.spinner`
- Palette : primaire indigo (#6366f1), sidebar indigo sombre (#1e1b4b)
- Layout : sidebar fixe 240px + `.app-shell` / `.app-main`

---

## Dashboard (`app/page.tsx`)

4 outils :
- **Stock Manager** (`/stock`) — disponible
- **Gestion des articles** (`/articles`) — disponible
- **Creation d'articles** (`/create`) — disponible
- **Data Analyse** (`/analytics`) — disponible

---

## Erreurs connues et solutions

| Erreur | Cause | Solution |
|---|---|---|
| Catégorie non mise à jour, succès silencieux | OxID numérique passé comme `<ItemSKU>` | Utiliser `<OxID>` pour toutes les opérations catégories et delete |
| `"Invalid XML (1, 201)"` | Apostrophe dans un nom de categorie | `escapeXml()` sur tous les noms |
| `"La categorie produit ' ' ne peut etre ajoutee"` | `OxID=0` + `Name=" "` -> Oxatis tente de creer | Utiliser `Name="#null#"` |
| `"Invalid XML (1, 624)"` | `parentOxId=""` pour categories racine | Defaut a `"0"` |
| `loadCredentials is not defined` | `useState(fn)` execute cote serveur | Charger via `useEffect` uniquement |
| Categorie dupliquee creee | Envoi de `<Name>` avec `<OxID>` existant | Envoyer uniquement `<OxID>` sans Name |

---

## Robustesse des appels API (`lib/oxatis-api.ts` + `lib/api-helpers.ts`)

- **Timeout** : `callOxatis` coupe après 30s via `AbortController` et lève une erreur explicite
- **HTTP non-2xx** : `callOxatis` lève une erreur si le status HTTP n'est pas ok (évite de parser une page HTML IIS 500 comme du XML)
- **`parseOxatisError`** : détecte les réponses vides et les pages HTML en plus des StatusCode Oxatis
- **Rate limiting** : `sleep(200)` entre chaque article dans les boucles de traitement en masse (matrice `executeCreate`/`executeUpdate`, articles `executeBulkUpdate`)
- **`sleep` utilitaire** : disponible dans `lib/api-helpers.ts` (export) et défini localement dans les pages client

### Credentials localStorage

Intentionnellement en `localStorage` (outil interne, mono-utilisateur). Pas de donnée sensible client au-delà de l'AppId/Token Oxatis. Ne pas migrer vers `sessionStorage` sauf si demande explicite.

---

## Bugs / dettes corriges

- ~~`parseProductCategories` ne retourne pas le slot~~ → **CORRIGE**
- ~~`ProductCreate` avec mauvais noms de champs~~ → **CORRIGE** (`ProductV2Add`, `TaxRate`, `EANCode`, `Brand` complexe, `Price` complexe)
- ~~`updateProductAvaibility` typo~~ → **CORRIGE** (`updateProductOutOfStock`, route `update-out-of-stock`)
- ~~`console.log` de debug en production~~ → **CORRIGES** (tous supprimes)
- ~~Interfaces `Article`/`CategoryNode` dupliquees~~ → **CORRIGE** (centralise dans `lib/types.ts`)
- ~~Pattern routes API duplique~~ → **CORRIGE** (`lib/api-helpers.ts`)
- ~~`parseOxatisError` faux succès silencieux~~ → **CORRIGE** (réponse vide / HTML / timeout détectés)
- ~~`callOxatis` sans timeout ni vérification HTTP~~ → **CORRIGE** (30s timeout, erreur si non-2xx)
- ~~Pas de rate limiting en masse~~ → **CORRIGE** (sleep 200ms entre articles)

---

## TODO

Rien en cours — toutes les taches identifiees sont terminees.

## Historique des taches completees

- ✅ Valider les noms de champs XML de ProductCreate (methode = `ProductV2Add`)
- ✅ Supprimer tous les `console.log` de debug (routes API + lib/oxatis-api.ts)
- ✅ Renommer typo `Avaibility` → route `update-out-of-stock`, fonction `updateProductOutOfStock`
- ✅ Centraliser `Article` et `CategoryNode` dans `lib/types.ts`, supprimer les doublons locaux
- ✅ Helper `oxatisResponse` et `parseOxatisError` dans `lib/api-helpers.ts`, applique sur toutes les routes
- ✅ `ArticleItem` de `fetch-articles/route.ts` remplacee par `Article` de `lib/types`
- ✅ `CategoryNode` de `categories/route.ts` remplacee par import de `lib/types`
- ✅ Rechargement local stock apres `handleUpdateStock` (met a jour `siteStock` pour les SKUs sans erreur)
- ✅ Bouton "Tester la connexion" dans stock/page.tsx (route `GET /api/oxatis/test-credentials`)
- ✅ Page Data Analyse (`/analytics`) creee avec stats catalogue, prix, categories, marques
- ✅ `extractXml()` centralise dans `lib/api-helpers.ts` — remplace les 3 fonctions locales dans `product-categories`, `product-detail`, `stock` et `categories` routes
- ✅ `parseOxatisError` applique sur toutes les routes GET (categories, product-detail, product-categories)
- ✅ Lien rapide `/analytics` ajoute dans le dashboard (quickLinks)
- ✅ OxID affiche apres creation d'article (route retourne `oxatisId`, page l'affiche dans le message succes)
- ✅ Export CSV deja existant sur page articles (UTF-8 BOM, separateur `;`)
- ✅ Page Analytics amelioree : filtre + tri marques, drill-down par marque (mini-stats, categories, table articles)
- ✅ Bulk edit articles : 5 modes (assigner slot, vider slot, visible, masquer, disponibilite)
- ✅ Clarifier UI images dans /create : supprime les 5 inputs URL + alertbox informative "galerie Oxatis"
- ✅ Retirer `stack` trace des erreurs retournees au client (routes API)
