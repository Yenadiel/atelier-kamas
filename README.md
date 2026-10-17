# Atelier Kamas

Outil perso pour **Dofus 3 (serveur Dakal)** : monter ses métiers de 1 à 200 au meilleur prix, gérer sa liste de courses et ses crafts, et choisir la nourriture de familier la plus rentable.

Il existe en deux versions qui partagent le même code :

- **le site** : une page HTML unique (`web/`) ;
- **l'appli Windows** : Electron (`app/`), avec une fenêtre compacte qui reste par-dessus le jeu (Ctrl + Maj + K).

## Fonctionnalités

- **Plan de métier**
  - Deux modes : « le moins cher » (programmation dynamique sur les niveaux, au kamas près) ou « le moins de crafts ».
  - Écart max de recette réglable.
  - Correction d'XP calibrable depuis une étape.
  - Recettes de quête exclues. Les métiers de récolte se limitent aux consommables qui rendent vie ou énergie.
- **Liste de courses**
  - Onglets « À acheter » (par objet ou par ressource), « À crafter » et « Acquis ».
  - Jauges, saisie « j'ai » (nombre, `+5` ou `-3`), crafts validés, intermédiaires liés entre eux.
  - Bouton « Ressource chère / indisponible » : remplacement avec aperçu de l'impact, en utilisant d'abord le stock.
- **Toutes les recettes** : coût, XP, kamas/XP et marge pour chaque recette.
- **Familier** : classement des ressources par kamas par point d'XP.
- **Prix HDV** : moyennes Dakal relevées le 10/10/2026. Tes prix passent toujours avant, et les prix par lot (×1, ×10, ×100, ×1000) sont gérés.
- **Exporter / Importer** : sauvegarde de toutes les données dans un fichier JSON.

## Structure

```
web/                    le site (aussi chargé par l'appli)
  index.html            version autonome (à ouvrir via un petit serveur local)
  index.artifact.html   même page sans en-tête HTML : version publiée sur claude.ai
  data.json             recettes, objets, prix de référence, XP familier, listes vie/énergie et quête
  ico/                  planches d'icônes (48 px, 32 colonnes, 1024 par planche)
app/                    appli Electron (Windows)
  main.js               fenêtres, protocole atelier://, fenêtre compacte toujours au premier plan, Ctrl+Maj+K
  preload.js            pont window.atelier (toggleCompact, showMain, setOpacity)
installer/              installateur Windows (télécharge Electron 33.2.1 et vérifie son SHA256)
tools/
  build-installer.sh    construit dist/AtelierKamas-Installation.zip
  build.py, match.py, km.py   reconstruisent data.json à partir des données du jeu et des relevés HDV
  flags.py              ajoute les listes « vie / énergie » et « quête » à data.json
  sim.py                vérification de la formule d'XP
data/
  sources/hdv/p1..p5.txt        relevés HDV Dakal (Nom|niveau|prix, sections #Catégorie), 2074 prix moyens
  sources/hdv_matched.json      ces relevés associés aux identifiants d'objets
  sources/km_*.txt, kamamaster-export-*.txt   exports KamaMaster
  sources/familier-tableur-xp.tsv              tableur d'XP familier (prioritaire)
  sources/dofustool-familier.txt               XP familier DofusTool (complément)
  sources/captures/             captures d'écran HDV et retours fournis pendant le développement
  game/                         petites tables du jeu (recettes, métiers, types)
```

Trois fichiers bruts du client Dofus 3 ne sont pas versionnés (`items.json`, `fr.json` et `monsters.json`, environ 140 Mo). On n'en a besoin que pour régénérer `data.json`. Les scripts de `tools/` contiennent encore des chemins absolus de l'environnement d'origine : il faut les adapter avant de les relancer.

## Lancer

**Le site, en local** (il doit être servi en http pour que `fetch("data.json")` fonctionne) :

```bash
cd web && python -m http.server 8000
# puis ouvrir http://localhost:8000/
```

**L'appli, en développement :**

```bash
cd app && npm install && npm start
```

**L'installateur Windows** (léger, environ 8 Mo, car Electron est téléchargé chez l'utilisateur) :

```bash
./tools/build-installer.sh
```

## Données et calculs

### Prix

Ordre de priorité des prix :

1. le prix saisi par l'utilisateur ;
2. le meilleur prix unitaire par lot ;
3. `ref[id] = [prix, source]`, où la source vaut 2 pour la moyenne HDV Dakal et 1 pour KamaMaster.

Le coût réel d'une quantité donnée combine les lots par programmation dynamique (`lotCost`).

### XP de craft

```
xp = floor(20 × niveauRecette × coef / 100 / (écart^1.1 / 10 + 1) × (1 + correction / 100))
```

- **Écart** : niveau du métier moins niveau de la recette.
- **XP par niveau** : on suppose qu'un niveau demande 20 × niveau XP.
- **Correction** : −6 % par défaut. Les tests en jeu montraient 500 à 1500 XP manquantes en fin d'étape. On peut la régler finement en saisissant l'« XP réelle du 1ᵉʳ craft » sur une étape.

### Recettes exclues

- **Recettes de quête** : objets dont un critère de craft contient `Qa`, `Qo` ou `Qf`, ou dont le type est une catégorie de quête (`D.quest`).
- **Métiers de récolte** : Paysan, Alchimiste, Pêcheur et Chasseur n'utilisent que les crafts qui rendent des PV (effet 110) ou de l'énergie (effet 139), listés dans `D.vit`.

### Stockage

- **Clés** : `atelier-plan`, `atelier-prices` et `atelier-pet`.
- **Appli et site en local** : `localStorage`. Les fenêtres se synchronisent entre elles via l'événement `storage`.
- **Version claude.ai** : stockage privé par utilisateur, via les capacités `db` et `user`.

## Pistes / à faire

- Refonte visuelle et animations : transitions des jauges, cartes à 100 %, ambiance Dofus.
- Onglet « Revente » :
  - coût du craft comparé au premier prix HDV de l'objet non forgemagé, marge après taxe ;
  - prix saisis à la main avec historique daté, médiane et badge de fraîcheur ;
  - champ « prix exo » facultatif.
- Vérifier la table d'XP par niveau en jeu. Si la correction calibrée varie selon le niveau, c'est la table qui est fausse, pas la formule.
- Pêcheur : le plan alterne parfois entre deux recettes basses (Goujon / Beignet).
- Rafraîchir les prix HDV tous les 2 à 3 mois (prochain relevé prévu mi-décembre).

L'appli ne lit pas le client Dofus et n'agit pas dessus. C'est une simple fenêtre à côté du jeu.
