# Design : Refactoring pages + Tests unitaires

**Date :** 2026-04-20
**Scope :** Découpage complet de `articles/page.tsx` (2053 lignes) et `matrice/page.tsx` (1120 lignes) en composants/hooks séparés + mise en place des tests unitaires Vitest.

---

## 1. Refactoring `articles/page.tsx`

### Objectif
Chaque fichier ≤ 400 lignes. `page.tsx` se limite au wiring hooks ↔ composants.

### Structure cible

```
app/articles/
├── page.tsx                     (~80 lignes)
├── hooks/
│   ├── useArticles.ts           fetch liste + état (loading, error, articles)
│   ├── useArticleFilters.ts     search / tri / filtres — logique pure, pas de DOM
│   ├── useArticleModal.ts       état modal + appels API (détail, édition, catégories)
│   └── useBulkActions.ts        sélection multi + actions en masse + état progress
└── components/
    ├── ArticleFilters.tsx        barre de filtres (search, dropdowns)
    ├── ArticleTable.tsx          tableau + cases à cocher sélection
    ├── ArticleModal/
    │   ├── index.tsx             wrapper modal + navigation onglets
    │   ├── InfosTab.tsx          nom, prix, visibilité, dispo, hors-stock
    │   ├── CategoriesTab.tsx     arbre catégories + slots 1-10
    │   └── SeoTab.tsx            meta title / meta description
    └── BulkActionsModal.tsx      modal actions en masse (catégories, visibilité, dispo, delete)
```

### Responsabilités des hooks

| Hook | État géré | Appels API |
|---|---|---|
| `useArticles` | `articles[]`, `loading`, `error` | `GET /fetch-articles` |
| `useArticleFilters` | `searchTerm`, `sortField`, `sortDir`, filtres, `filteredArticles` dérivé | aucun |
| `useArticleModal` | `selectedArticle`, `modalTab`, états d'édition par champ | `product-detail`, `update-*`, `product-categories`, `update-slot` |
| `useBulkActions` | `selectedIds`, `bulkProgress`, `bulkModalOpen` | `update-visibility`, `update-availability`, `delete-product`, `update-slot` |

### Invariants
- `useArticleFilters` reçoit `articles[]` en paramètre et retourne `filteredArticles` — pas d'effet de bord, testable sans mock.
- `useArticleModal` encapsule tous les états éditables du modal ; `InfosTab`, `CategoriesTab`, `SeoTab` reçoivent uniquement des props + callbacks.
- Les composants UI ne font aucun appel fetch directement.

---

## 2. Refactoring `matrice/page.tsx`

### Structure cible

```
app/matrice/
├── page.tsx                      (~80 lignes)
├── hooks/
│   ├── useMatriceFile.ts         parsing .xlsx → MatriceArticle[] + état (parsing, error)
│   ├── useConflictDetection.ts   vérifie existence sur Oxatis via product-detail
│   └── useMatriceOperations.ts   logique create/update séquentielle + progress
└── components/
    ├── FileDropZone.tsx           drag & drop + input file
    ├── MatricePreview.tsx         tableau preview + sélection des articles à traiter
    ├── ConflictModal.tsx          résolution conflits (ignorer / écraser)
    └── OperationProgress.tsx      progress bar + liste d'erreurs
```

### Responsabilités des hooks

| Hook | Responsabilité |
|---|---|
| `useMatriceFile` | Parse le fichier .xlsx via la lib `xlsx`, transforme en `MatriceArticle[]` |
| `useConflictDetection` | Itère sur les articles "nouveaux" et appelle `product-detail` pour détecter les conflits |
| `useMatriceOperations` | Exécute les opérations create/update séquentiellement avec progress + sleep(200) |

---

## 3. Tests unitaires (Vitest)

### Setup

- **Framework :** Vitest
- **Environnement :** `node` uniquement — toutes les fonctions testées sont pures, pas de DOM
- **Pas de mock réseau** : les fonctions testées n'appellent pas fetch

### Extraction préalable requise

Avant d'écrire les tests, extraire les fonctions locales des routes vers des fichiers utilitaires :
- `app/api/oxatis/fetch-articles/utils.ts` — exporte `parseCSVRows`, `buildCategories`, `formatPrice`
- `app/api/oxatis/fetch-site-stock/utils.ts` — exporte la fonction de parsing CSV
- `app/articles/hooks/articleFilters.ts` — exporte `filterArticles(articles, filters)` (fonction pure) ; `useArticleFilters` importe et wrap cette fonction

### Fichiers de tests

```
__tests__/
├── lib/
│   ├── api-helpers.test.ts
│   │   ├── extractXml — tag simple, tag avec attributs, tag absent, entités HTML
│   │   ├── parseOxatisError — réponse vide, HTML, StatusCode 503, StatusCode 200
│   │   └── oxatisResponse — retourne success:true / error selon StatusCode
│   └── oxatis-api.test.ts
│       └── escapeXml — &, <, >, ", ' correctement échappés
├── api/
│   ├── fetch-articles.test.ts
│   │   ├── buildCategories — filtre les slots vides, formate les backslash
│   │   ├── formatPrice — calcul TTC, NaN géré, taux 0
│   │   └── parseCSVRows — déduplication OxatisId, champs manquants
│   └── fetch-site-stock.test.ts
│       └── parsing CSV — ligne normale, champ vide, qtyInStock NaN → 0
└── hooks/
    ├── articleFilters.test.ts       (teste filterArticles() — fonction pure, pas le hook)
    │   ├── searchTerm filtre sur title + itemSKU
    │   ├── tri ascendant / descendant par chaque SortField
    │   └── filtres combinés (availability + visibility + category)
    └── useMatriceFile.test.ts
        ├── transformation ligne Excel → MatriceArticle
        ├── détection isNew (oxatisId absent)
        └── calcul priceHT depuis prixTTC + tva
```

### Cibles de couverture
- `lib/api-helpers.ts` : 100%
- `lib/oxatis-api.ts` (fonctions pures) : ≥ 80%
- Parsers CSV/hooks extraits : ≥ 80%

---

## 4. Ordre d'implémentation

1. Setup Vitest + écrire les tests `lib/` (RED)
2. Valider que les tests passent sur le code existant (GREEN)
3. Extraire les hooks `articles/` + leurs tests
4. Extraire les composants `articles/`
5. Extraire les hooks `matrice/` + leurs tests
6. Extraire les composants `matrice/`
7. Vérifier couverture finale

---

## 5. Contraintes

- Aucune régression fonctionnelle : comportement identique avant/après
- Pas de nouvelle dépendance UI — réutiliser les composants `app/components/ui/` existants
- Les composants extraits suivent le pattern existant : styles inline, pas de CSS modules
