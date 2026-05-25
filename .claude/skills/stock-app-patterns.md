---
name: stock-app-patterns
description: Coding patterns extracted from the stock-app Oxatis integration project
version: 1.0.0
source: local-git-analysis
analyzed_commits: 16
---

# Stock-App Patterns

Application Next.js (App Router, TypeScript) qui synchronise un catalogue produit avec l'API Oxatis (OWS).

## Commit Conventions

Conventional commits stricts :

```
feat:     nouvelle fonctionnalité
fix:      correction de bug
refactor: restructuration sans changement de comportement
test:     ajout/modification de tests
docs:     documentation uniquement
chore:    maintenance (deps, config)
perf:     optimisation
ci:       pipeline CI/CD
```

## Architecture

```
app/
├── api/oxatis/          # Un dossier = une opération Oxatis
│   ├── create-product/route.ts
│   ├── update-stock/route.ts
│   ├── fetch-articles/
│   │   ├── route.ts     # Handler HTTP léger
│   │   └── utils.ts     # Logique pure testable
│   └── ...
├── articles/
│   ├── hooks/           # Hooks extraits de la page
│   │   ├── useArticleFilters.ts
│   │   ├── useArticleModal.ts
│   │   └── useBulkActions.ts
│   ├── utils/
│   │   └── articleFilters.ts   # Fonctions pures
│   └── page.tsx         # Thin wiring layer
├── matrice/
│   ├── hooks/
│   │   ├── useConflictDetection.ts
│   │   ├── useMatriceFile.ts
│   │   └── useMatriceOperations.ts
│   ├── types.ts
│   └── page.tsx
├── components/
│   ├── ui/              # Badge, Modal, ConfirmModal, Spinner, ProgressModal
│   └── features/        # CsvImportMode, ProductForm, StockComparisonTable, StockImport
├── contexts/
│   ├── CategoriesContext.tsx
│   └── CredentialsContext.tsx
└── hooks/
    └── useArticles.ts

lib/
├── oxatis-api.ts        # Client Oxatis (toutes les méthodes API)
├── api-helpers.ts       # extractXml, parseOxatisError, sleep
├── server-credentials.ts
└── types.ts

__tests__/               # Miroir de la structure src
├── lib/
├── api/
└── hooks/
```

## Workflows

### Ajouter une nouvelle opération Oxatis

1. Ajouter la fonction dans `lib/oxatis-api.ts` :

```typescript
export async function updateProductXxx(
  appId: string,
  token: string,
  itemSKU: string,
  value: string
): Promise<string> {
  const data = `<?xml version="1.0" encoding="utf-8"?><Product ${XML_NS}><ItemSKU>${escapeXml(itemSKU)}</ItemSKU><Field>${escapeXml(value)}</Field><Language>fr</Language></Product>`;
  return callOxatis({ appId, token, method: "ProductUpdate", data });
}
```

2. Créer `app/api/oxatis/update-xxx/route.ts` :

```typescript
import { updateProductXxx } from "@/lib/oxatis-api";
import { getCredentials } from "@/lib/server-credentials";
import { parseOxatisError } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { itemSKU: string; xxx: string };
    const { appId, token } = getCredentials(request);
    const { itemSKU, xxx } = body;

    if (!appId || !token || !itemSKU || !xxx) {
      return Response.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    const xml = await updateProductXxx(appId, token, itemSKU, xxx);
    const error = parseOxatisError(xml);
    if (error) return Response.json({ error, raw: xml }, { status: 500 });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
```

### Refactoriser une page avec trop de logique

Pattern appliqué sur `articles/page.tsx` et `matrice/page.tsx` :

1. Identifier les blocs de logique (filtres, actions en masse, modal, fichier…)
2. Extraire chaque bloc dans `domain/hooks/useXxx.ts`
3. Extraire les fonctions pures dans `domain/utils/xxxUtils.ts`
4. Ajouter des tests unitaires pour les utils/hooks dans `__tests__/`
5. Réécrire la page comme thin wiring layer (uniquement du JSX + appels de hooks)

### Ajouter un service Oxatis différent (URL distincte)

Chaque service Oxatis a son propre endpoint :

```typescript
const CHARACTERISTICS_SERVICES_URL =
  "https://webservices.oxatis.com/webservices/httpservices/ProductCharacteristicsServices.aspx";

// Passer url: dans callOxatis
return callOxatis({ appId, token, method: "ProductCharacteristicsUpdate", data, url: CHARACTERISTICS_SERVICES_URL });
```

URLs connues :
- `ProductServices.aspx` — produits (CRUD, stock, prix, description…)
- `CategoryServices.aspx` — catégories
- `ProductCharacteristicsServices.aspx` — caractéristiques
- `ProductAttributesServices.aspx` — attributs
- `ProductBundleServices.aspx` — bundles
- `ImageGalleryServices.aspx` — images

## Testing Patterns

- Framework : **Vitest** (node environment)
- Tests dans `__tests__/` qui miroir la structure source
- Import alias `@/` disponible

```typescript
// __tests__/lib/my-util.test.ts
import { describe, it, expect } from "vitest";
import { myFunction } from "@/lib/my-util";

describe("myFunction", () => {
  it("cas nominal", () => {
    expect(myFunction("input")).toBe("expected");
  });

  it("cas erreur", () => {
    expect(myFunction("")).toBeNull();
  });
});
```

Lancer les tests :

```bash
npx vitest run
npx vitest run --coverage
```

Fichiers couverts dans `vitest.config.ts` → ajouter les nouveaux utils dans `coverage.include`.

## Patterns Oxatis spécifiques

### Gestion d'erreur XML

```typescript
const xml = await someOxatisCall(...);
const error = parseOxatisError(xml);
if (error) return Response.json({ error, raw: xml }, { status: 500 });
```

`parseOxatisError` retourne `null` si OK, sinon le message d'erreur.

### Caractéristiques (ProductCharacteristicsUpdate)

Les caractéristiques ne peuvent PAS être envoyées dans `ProductV2Add`. Appel séparé obligatoire APRÈS la création :

```typescript
// Format CSV : "Couleur=Rouge|Matière=Coton"
// → [{name:"Couleur", value:"Rouge"}, {name:"Matière", value:"Coton"}]
await updateProductCharacteristics(appId, token, itemSKU, features);
```

### Catégories lors de la création

Utiliser `updateProductCategoriesBySKU` (pas `updateProductCategories` par OxID) car le produit vient d'être créé :

```typescript
await updateProductCategoriesBySKU(appId, token, itemSKU, categories);
```

### Credentials

Toujours utiliser `getCredentials(request: NextRequest)` dans les routes — jamais extraire `appId`/`token` du body manuellement.
