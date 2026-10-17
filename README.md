# Atelier Kamas

Outil perso pour **Dofus 3 (serveur Dakal)** : monter ses métiers de 1 à 200 au meilleur prix, gérer sa liste de courses et ses crafts, et choisir la nourriture de familier la plus rentable.

C'est une **appli de bureau pour Windows, macOS et Linux** : une petite fenêtre « compagnon » sans bordure, qui reste au premier plan par-dessus le jeu.

## Télécharger

Toutes les versions sont dans l'onglet **[Releases](../../releases)** :

| Système | Fichier | Remarque |
|---|---|---|
| Windows | `AtelierKamas-X-Windows-Installation.exe` | installation en un clic : l'appli s'installe dans ton profil, crée les raccourcis Bureau et menu Démarrer, puis se lance |
| Windows | `AtelierKamas-X-Windows-Portable.exe` | sans installation |
| macOS (Intel et Apple Silicon) | `AtelierKamas-X-macOS.dmg` | appli non signée : la première fois, clic droit sur l'appli → **Ouvrir** |
| Linux | `AtelierKamas-X-Linux.AppImage` ou `.deb` | AppImage : `chmod +x` puis lancer |

Windows peut afficher « Windows a protégé votre ordinateur » : clique « Informations complémentaires », puis « Exécuter quand même ». L'appli n'est pas signée par un éditeur.

## En cas de souci (Windows)

**La fenêtre ne s'affiche pas :**
0. **La fenêtre apparaît en capture d'écran mais pas sur le moniteur** : c'est l'opacité. Une fenêtre semi-transparente n'est pas affichée par certaines cartes graphiques. Fais un clic droit sur l'icône K, puis **Fenêtre opaque**, et laisse l'opacité à 100 % dans les Paramètres. C'est le réglage par défaut depuis la 2.1.5.
1. **Icône près de l'horloge** : cherche l'icône dorée « K » à côté de l'horloge (elle est peut-être dans les icônes cachées ^). Clic droit dessus, puis **Recentrer la fenêtre**.
2. **Pilote graphique** : depuis la 2.1.4, l'appli dessine en mode logiciel sous Windows, ce qui évite les fenêtres qui restent invisibles avec certains pilotes. Pour réactiver l'accélération graphique, coche **Accélération graphique** dans le même menu. Si la fenêtre ne s'affiche plus ensuite, décoche-la.
3. **Windows 11** : vérifie que **Contrôle intelligent des applications** (Sécurité Windows → Contrôle des applications et du navigateur) ne bloque pas l'appli. Ce contrôle refuse les applis non signées, parfois sans message clair. Il faut alors le mettre sur « Désactivé ».
4. **Antivirus tiers** (Avast, Norton, Kaspersky…) : ajoute l'appli en exception.
5. **Journal de diagnostic** : clic droit sur l'icône, puis **Ouvrir le journal**. Le fichier est `%APPDATA%\Atelier Kamas\journal.txt`. Envoie-le avec ta remarque.

**Relancer l'appli alors qu'elle tourne déjà** la ramène à l'écran, recentrée si elle était hors de vue.

## L'interface

- **Accueil** : logo de la guilde (`web/img/guilde.png`), « Atelier Kamas par Yenadiel · Ascent », l'Almanax du jour et des tuiles vers chaque section. Le pseudo, le nom et le logo se règlent dans `web/guilde.json`.
- **Almanax** : bonus du jour, offrande avec son prix HDV estimé et les 7 jours suivants (source : API publique DofusDB).

- **Une seule petite fenêtre** (380 × 640 par défaut, redimensionnable), sans bordure et toujours au premier plan. Elle repasse devant Dofus dès que tu cliques dans le jeu.
- **Barre de titre** :
  - à gauche, le menu **☰** : En cours, Plan de métier, Liste de courses, Recettes, Familier, Prix HDV, Paramètres ;
  - au centre, le nom de la page ;
  - à droite, 📌 premier plan, ⚙ paramètres, réduire et fermer.
- **Barre de page** sous la barre de titre : nom de la page et contexte (métier, plage de niveaux…).
- **Page « En cours »** : l'étape du plan à faire maintenant (objet, nombre de crafts, XP par craft, ressources avec leur « j'ai »), avec en bas une barre d'étapes :
  - **‹** et **›** pour reculer ou avancer d'une étape ;
  - une barre de progression `8 / 15` sur laquelle on clique ou glisse pour sauter à une étape (la molette marche aussi) ;
  - **Terminée** pour valider l'étape.
- **Paramètres** :
  - 10 thèmes sombres ;
  - opacité de la fenêtre ;
  - taille du texte ;
  - premier plan ;
  - raccourcis clavier globaux ;
  - export et import des données.
- **Raccourcis globaux par défaut** (actifs même quand Dofus a le focus, modifiables dans les Paramètres) :

| Raccourci | Action |
|---|---|
| Ctrl + Maj + K | afficher / masquer l'appli |
| Ctrl + Maj + ← / → | étape précédente / suivante |
| Ctrl + Maj + Entrée | valider l'étape |

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
- **Prix partagés** : les prix relevés par les contributeurs arrivent dans toutes les applis à chaque lancement (voir plus bas).
- **Exporter / Importer** : sauvegarde de toutes les données dans un fichier JSON.

## Prix partagés (contributeurs)

Les prix bougent. Chaque contributeur peut mettre à jour les prix de tout le monde depuis l'appli, sans toucher au code.

1. **Devenir contributeur** : le propriétaire du dépôt t'ajoute dans *Settings → Collaborators*. Il te faut un compte GitHub.
2. **Relever les prix** : dans l'appli, tape tes prix HDV à côté des ressources, dans n'importe quel onglet. Ils sont datés automatiquement.
3. **Envoyer** : *Paramètres → Prix partagés → Partager mes prix*. Une page GitHub s'ouvre, déjà remplie (une « issue » titrée `[Prix] Dakal · N prix · date`). Clique **Submit new issue**.
4. **Intégration automatique** : un robot GitHub Actions (`.github/workflows/prices.yml`) fait le reste.
   - Il vérifie que l'auteur est contributeur du dépôt.
   - Il ajoute les prix dans [`prices/dakal.json`](prices/dakal.json). Pour un même objet, le relevé le plus récent gagne.
   - Il répond avec un résumé (prix ajoutés, prix ignorés, écarts suspects de plus de 10× la moyenne), puis ferme l'issue.
5. **Diffusion** : au lancement, chaque appli télécharge `prices/dakal.json` et l'utilise à la place des moyennes du 10/10/2026. Le fichier reste aussi en cache pour le hors-ligne. Les prix saisis par chacun sur sa propre appli passent toujours en premier.

Un contributeur peut aussi modifier `prices/dakal.json` à la main, dans un commit. Le script de fusion est `tools/merge_prices.py`.

## Structure

```
web/                    l'interface et les calculs (chargés tels quels par l'appli)
  index.html            outil complet (plan, liste de courses, recettes, familier, prix)
  gm.css, gm.js         habillage compagnon : barres, menu, page « En cours », paramètres
  fonts/                police Lexend (licence SIL OFL)
  data.json             recettes, objets, prix de référence, XP familier, listes vie/énergie et quête
  ico/                  planches d'icônes (48 px, 32 colonnes, 1024 par planche)
app/                    appli Electron
  main.js               fenêtre unique sans bordure, protocole atelier://, premier plan, raccourcis globaux
  preload.js            pont window.atelier (fenêtre, opacité, zoom, raccourcis)
  package.json          configuration electron-builder (Windows NSIS et portable, macOS dmg universel, Linux AppImage et deb)
  build/                icônes de l'appli
prices/dakal.json       prix partagés par les contributeurs (mis à jour par le robot)
.github/workflows/
  release.yml           construit les 3 systèmes et publie la release
  prices.yml            intègre les prix envoyés depuis l'appli
tools/
  build.py, match.py, km.py     reconstruisent data.json à partir des données du jeu et des relevés HDV
  flags.py                      ajoute les listes « vie / énergie » et « quête » à data.json
  merge_prices.py               fusionne un envoi de prix dans prices/dakal.json
  sim.py                        vérification de la formule d'XP
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

## Développer

**Lancer l'appli** (Node.js 20 ou plus récent) :

```bash
cd app
npm install
npm start          # lit directement ../web : modifie web/ et recharge avec Ctrl+R
```

**Aperçu rapide dans un navigateur**, sans Electron (pratique pour retoucher l'interface). La page doit être servie en http :

```bash
cd web && python -m http.server 8000
# puis ouvrir http://localhost:8000/?app
```

**Construire les paquets à la main** (chaque système se construit sur son propre OS) :

```bash
cd app
npm run dist:win     # sur Windows
npm run dist:mac     # sur macOS
npm run dist:linux   # sur Linux
```

**Publier une version** : il n'y a rien à faire. Chaque commit poussé sur `main` qui touche `app/` ou `web/` lance le workflow *Release* :
- il construit les 3 systèmes en version `2.2.<numéro de build>` et publie la release ;
- au lancement suivant, **chaque appli installée affiche un écran « Mise à jour obligatoire »**. L'installateur Windows et l'AppImage se mettent à jour et redémarrent tout seuls. Le portable, le Mac et le .deb proposent un bouton vers la page de téléchargement ;
- pour changer de série (passer en 2.3, 3.0…), modifie les deux premiers chiffres de `version` dans `app/package.json`.

Les envois de prix (`prices/`) et les modifications de la documentation ne déclenchent pas de nouvelle version.

Les données de l'appli restent sur l'ordinateur, dans le stockage local de la page sous l'origine `atelier://app`. Elles sont conservées d'une mise à jour à l'autre.

## Données et calculs

### Prix

Ordre de priorité des prix :

1. le prix saisi par l'utilisateur dans son appli ;
2. le meilleur prix unitaire par lot (×1, ×10, ×100, ×1000) ;
3. `ref[id] = [prix, source]` :
   - source 3 : prix partagé par un contributeur (`prices/dakal.json`, téléchargé au lancement) ;
   - source 2 : moyenne HDV Dakal du relevé du 10/10/2026 ;
   - source 1 : KamaMaster, en dernier recours.

Le coût réel d'une quantité donnée combine les lots par programmation dynamique (`lotCost`).

### Origine des données (relevé du 10/10/2026)

Tout ce qui a servi à construire les prix et l'XP familier est dans `data/sources/`, pour pouvoir vérifier ou refaire le travail :

| Étape | Fichiers | Contenu |
|---|---|---|
| 1. Captures | `captures/*.png` (309 images) | captures de l'HDV Dakal, catégorie par catégorie, avec le **prix moyen** de chaque ressource. Le dossier contient aussi les retours d'écran envoyés pendant le développement |
| 2. Transcription | `hdv/p1.txt` … `p5.txt` | ces captures recopiées en texte, une ligne par ressource `Nom\|niveau\|prix`, avec un titre `#Catégorie` par section. 2074 prix au total |
| 3. Association | `hdv_matched.json` | chaque nom relié à son identifiant d'objet du jeu (`tools/match.py`) |
| 4. Complément | `km_A.txt`, `km_B.txt`, `kamamaster-export-*.txt` | exports KamaMaster Dakal, utilisés seulement pour les ressources absentes des captures (`tools/km.py`) |
| 5. Familier | `familier-tableur-xp.tsv`, `dofustool-familier.txt` | XP familier par ressource : d'abord le tableur, mesuré par lots de 1000, puis DofusTool en complément |
| 6. Assemblage | `web/data.json` | `tools/build.py` regroupe le tout (objets, recettes, `ref`, catégories, lots, icônes, XP familier), puis `tools/flags.py` ajoute les listes vie / énergie et quête |

Quelques choix faits pendant le relevé :
- **Lots** : la Quisnoa et la Pépite ont des prix par lot (×1, ×10, ×100, ×1000), saisis à la main dans `build.py`.
- **Ressources rares de drop** : elles restent à leur prix réel, même très élevé. C'est le cas de la Fleur de Korriandre et de la Sève de Tremble.
- **Intermédiaires** : règle « tout crafter ». Par défaut, un intermédiaire est fabriqué plutôt qu'acheté (réglable dans l'appli).

**Pour un nouveau relevé complet** (tous les 2 à 3 mois), deux possibilités :
- refaire les étapes 1 à 3 avec de nouvelles captures, puis relancer `build.py` ;
- plus simple au quotidien, passer par les **prix partagés** : chaque prix envoyé remplace la moyenne du 10/10 dans toutes les applis.

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

- **Où** : dans le stockage local de l'appli (`localStorage`, origine `atelier://app`), sur l'ordinateur. Rien n'est envoyé ailleurs, sauf les prix que tu choisis de partager.
- **Clés** : `atelier-plan`, `atelier-prices` et `atelier-pet` pour tes données, `atelier-ui` pour l'apparence et les raccourcis, `atelier-shared` pour le cache des prix partagés.

## Pistes / à faire

- Peaufiner l'interface compagnon (animations, vue « En cours » plus riche, notes par étape).
- Onglet « Revente » :
  - coût du craft comparé au premier prix HDV de l'objet non forgemagé, marge après taxe ;
  - prix saisis à la main avec historique daté, médiane et badge de fraîcheur ;
  - champ « prix exo » facultatif.
- Vérifier la table d'XP par niveau en jeu. Si la correction calibrée varie selon le niveau, c'est la table qui est fausse, pas la formule.
- Pêcheur : le plan alterne parfois entre deux recettes basses (Goujon / Beignet).
- Rafraîchir les prix HDV tous les 2 à 3 mois (prochain relevé prévu mi-décembre).

L'appli ne lit pas le client Dofus et n'agit pas dessus. C'est une simple fenêtre à côté du jeu.
