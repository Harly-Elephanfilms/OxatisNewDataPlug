# Préparation et export des commandes

La page `/orders` est accessible depuis l’accueil et le menu **Commandes**.
Elle utilise les identifiants Oxatis configurés dans **Stock Manager → CONFIG API**
(cookie HTTP-only ou variables serveur `OXATIS_APP_ID` / `OXATIS_TOKEN`).

## Utilisation

1. Choisir **Payées, non facturées**, ou **Payées, facturées — état personnalisé**.
2. Pour les précommandes, choisir l’état **Précommande (PRECOMMANDE)**. Il est
   sélectionné par défaut lorsqu’il existe dans le compte. La liste des états et
   leurs identifiants est lue depuis Oxatis, sans identifiant fixe dans le code.
3. Choisir une période assez large et lancer **Récupérer les commandes**.
   Les dates filtrent la dernière modification des commandes, selon la
   documentation OWS, et non nécessairement leur date de création.
4. Lors d’une réception de stock, renseigner les références concernées, séparées
   par virgule, point-virgule ou espace. Une référence correspond exactement au
   SKU d’un article ou d’un article de pack. Plusieurs références fonctionnent
   comme un « ou ».
5. Vérifier les commandes et décocher celles qui ne peuvent pas être expédiées
   entièrement. Une référence retenue conserve **tous les articles de la commande**.
6. Télécharger l’Excel. L’export ne comprend que les commandes sélectionnées
   dans le filtre actuel. Les filtres de recherche et de références se cumulent.

La récupération parcourt toutes les pages Oxatis, avec progression et annulation.
Les résumés permettent d’écarter les commandes déjà expédiées ou ayant un autre
état avant de demander leurs détails. Pour les commandes facturées, l’état actuel
est relu dans les détails avant l’export : un ancien état PRECOMMANDE dans le
journal n’est pas suffisant.

Les commandes marquées **expédiées** peuvent conserver l’état PRECOMMANDE.
Elles sont exclues par défaut, avec leur nombre et leurs numéros affichés pour
expliquer l’écart avec le compteur Oxatis. L’option **Inclure les commandes
marquées expédiées dans Oxatis**, suivie d’une nouvelle récupération, permet
de les retrouver aussi. Vérifier leur expédition réelle avant de les exporter
pour éviter un second envoi.

Lorsqu’elles sont incluses, les commandes marquées expédiées apparaissent dans
un tableau distinct des **Commandes à préparer**. Chaque groupe affiche son
nombre de commandes et dispose de boutons de sélection et de désélection qui
n’affectent pas l’autre groupe. Les filtres par référence et recherche
s’appliquent aux deux tableaux ; l’export reprend les commandes sélectionnées.

Une récupération annulée ou interrompue bloque l’export. Les commandes dont les
détails échouent sont listées explicitement et exclues ; le reste du lot peut être
exporté lorsque la récupération s’est terminée.

## Format Excel

Le fichier `Oxatis_YYYY-MM-DD.xlsx` reprend le script
`oxatis_create_cmd_folder_files_mac.py` : feuille `Sheet1`, 25 colonnes A–Y,
sans en-tête, une ligne par article et par article de pack.

| Colonnes | Contenu |
| --- | --- |
| A, B | `OL1`, `ELYSEES_EDITIONS` |
| C | Identifiant Oxatis de la commande |
| D, E | Date d’export à Paris, `JJ/MM/AAAA` |
| H | Code d’expédition calculé sur le montant total de la commande |
| J, K | Civilité, prénom et nom de livraison |
| L | Adresse de livraison |
| N, O, P | Code postal, ville, pays |
| Q | `2` |
| R, S | E-mail, téléphone |
| U, V, W | Référence article, quantité, désignation |
| Autres | Cellules vides |

`France métropolitaine` est normalisé en `France`. Pour la France : `LTS`
jusqu’à 40 € inclus, `ACC2` au-delà de 40 € et jusqu’à 150 € inclus, `EXP2`
au-delà de 150 €. Pour les autres pays : `EXI2`.

Les quantités des articles de pack sont exportées telles que renvoyées par
Oxatis, comme dans le script. Les références alphanumériques et celles avec
des zéros initiaux sont conservées au lieu d’être transformées en zéro.

Le navigateur télécharge le fichier ; il ne crée pas les dossiers locaux
`OXA_CMD` et `OXA_SUIVI` du script macOS. Le navigateur gère les éventuels noms
de fichiers déjà existants dans le dossier de téléchargement.

Cet outil lit les commandes et exporte un fichier. Il ne facture pas, ne modifie
pas les états d’avancement et ne déclare pas les colis expédiés. Les commandes
restent récupérables lors d’un prochain passage tant que leur état Oxatis n’a
pas changé ; un nouvel export peut donc contenir un lot déjà téléchargé.

## Références API

- [Guide OWS v11.30](https://webservices.oxatis.com/webservices/Doc/OxatisWebServices.pdf),
  sections L (commandes) et P (états d’avancement).
- [Schéma actuel OrderServices](https://webservices.oxatis.com/webservices/HttpServices/SOAP/OrderServices.asmx?WSDL) :
  `OrderSummaryEntity.ProgressStateID`, `OrderGetSummaryList`, `OrderGetDetails`.
- [Schéma actuel ProgressStateServices](https://webservices.oxatis.com/webservices/HttpServices/SOAP/ProgressStateServices.asmx?WSDL) :
  `ProgressStateGetList`.

Les endpoints applicatifs sont `/api/oxatis/orders/progress-states` et
`/api/oxatis/orders/preparation`. Aucune clé du script n’est copiée dans le dépôt.
