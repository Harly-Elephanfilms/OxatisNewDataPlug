# Sales Analytics — Design Spec
**Date:** 2026-05-05  
**Statut:** Approuvé  

---

## Objectif

Ajouter un module d'analyse des ventes réelles à la page Analytics existante. L'utilisateur peut sélectionner une période, lancer une analyse qui interroge l'API Oxatis en temps réel, et visualiser : les meilleurs articles vendus, le chiffre d'affaires par jour, et l'utilisation des codes promo.

---

## Architecture

### Nouvel onglet "Ventes" dans `/analytics`

La page Analytics existante (stats catalogue) conserve son onglet actuel. Un second onglet **"Ventes"** accueille le module.

### Flux de données

```
Client                          Serveur                        Oxatis API
  |                               |                               |
  |-- GET /api/oxatis/orders/stream?from=&to= -->                 |
  |                               |-- OrderCount(from, to) -----> |
  |                               |<-- totalOrders --------------- |
  |<-- SSE: {type:"total", n:210} |                               |
  |                               |-- OrderGetList (paginé) -----> |
  |                               |<-- [id1, id2, ...] ----------- |
  |                               |                               |
  |                               | pour chaque ID :              |
  |                               |-- OrderGetDetails(id) ------> |
  |                               |<-- order data ---------------- |
  |<-- SSE: {type:"progress",...} |                               |
  |                               |                               |
  |<-- SSE: {type:"result", data} |                               |
```

### Nouveaux fichiers

```
app/analytics/
├── page.tsx                        (ajouter onglet "Ventes")
├── components/
│   ├── SalesDatePicker.tsx         (sélecteur période)
│   ├── SalesProgress.tsx           (barre de progression SSE)
│   ├── SalesSummaryCards.tsx       (4 cartes résumé)
│   ├── TopProductsChart.tsx        (bar chart horizontal)
│   ├── RevenueChart.tsx            (line chart CA par jour)
│   └── PromoCodeTable.tsx          (tableau codes promo)
app/api/oxatis/orders/
└── stream/route.ts                 (SSE endpoint)
lib/
└── oxatis-orders.ts                (fonctions fetch Oxatis: OrderCount, OrderGetList, OrderGetDetails)
```

---

## Composants

### SalesDatePicker
Boutons prédéfinis : **7 jours · 30 jours · 3 mois** + champ date personnalisé (from/to).  
Émet les dates sélectionnées au parent via callback.

### SalesProgress
S'affiche pendant l'analyse. Reçoit `{ done, total }` via SSE.  
Affiche : barre de progression + texte "120 / 350 commandes analysées".  
Se masque automatiquement à la fin.

### SalesSummaryCards
4 cartes :
| Carte | Valeur |
|-------|--------|
| Total commandes | N |
| CA net | X € |
| Panier moyen | X € |
| Commandes avec promo | N (X %) |

### TopProductsChart
Bar chart horizontal (Recharts `BarChart`).  
Axes : SKU / nom article (Y) · quantité vendue (X).  
Top 10 articles par quantité. Survol = tooltip avec CA de la ligne.

### RevenueChart
Line chart (Recharts `LineChart`).  
Axe X = dates de la période, axe Y = CA net.  
Survol = tooltip avec nb commandes + CA du jour.

### PromoCodeTable
Tableau trié par nb d'utilisations décroissant.

| Code promo | Utilisations | Remise totale |
|-----------|-------------|--------------|
| SUMMER20 | 14 | 280,00 € |

---

## Données agrégées

Structure retournée par l'endpoint SSE à la fin :

```typescript
interface SalesAnalysis {
  period: { from: string; to: string }
  summary: {
    totalOrders: number
    totalRevenue: number       // somme NetAmountDue
    avgOrderValue: number
    ordersWithPromo: number    // commandes avec CartCoupon non vide
  }
  topProducts: Array<{
    sku: string
    name: string
    quantity: number
    revenue: number
  }>
  revenueByDay: Array<{
    date: string               // YYYY-MM-DD
    revenue: number
    orders: number
  }>
  promoCodes: Array<{
    code: string
    usageCount: number
    totalDiscount: number      // somme GlobalDiscountAmount
  }>
}
```

### Champs Oxatis utilisés

| Champ Oxatis | Usage |
|-------------|-------|
| `Date` | Filtrage période + revenueByDay |
| `NetAmountDue` | CA net de la commande |
| `CartCoupon` | Code promo global de la commande |
| `GlobalDiscountAmount` | Montant remise globale |
| `OrderItems[].ItemSKU` | Identifiant article |
| `OrderItems[].ItemName` | Nom article |
| `OrderItems[].Quantity` | Quantité vendue |
| `OrderItems[].LineNetAmount` | CA par ligne article |

---

## Gestion des erreurs

| Situation | Comportement |
|-----------|-------------|
| Période sans commandes | Message "Aucune commande sur cette période" |
| Timeout sur une commande | Ignorée, compteur "X erreurs ignorées" affiché |
| Connexion SSE coupée | Bouton "Réessayer" visible, état propre |
| >1000 commandes | Avertissement préventif avant de lancer |
| Credentials expirés | Message explicatif + lien vers connexion |

---

## Performance

- Appels Oxatis séquentiels (1 `OrderGetDetails` à la fois) pour respecter les limites API
- `OrderGetList` paginé : on récupère tous les IDs d'abord, puis les détails un par un
- Estimation : ~1 appel/seconde → 200 commandes ≈ 3 min max
- La barre de progression SSE rend cette attente acceptable

---

## Dépendances

- **Recharts** — à installer (`npm install recharts`)
- Aucune autre dépendance nouvelle

---

## Hors scope

- Cache des résultats (pas de BDD, pas de Redis)
- Export CSV des résultats
- Comparaison entre deux périodes
- Données en temps réel (push automatique)
