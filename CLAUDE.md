# Ça Roule — notes pour Claude Code

Jeu mobile de puzzle de parking, en français. Prototype web mono-fichier (HTML/CSS/JS sans framework) qui doit devenir une vraie appli mobile monétisée par la pub.
Le propriétaire parle français : répondre et commenter en français, textes du jeu en français.

## Commandes
- `npm run build` : assemble `dist/index.html` (template + moteur + énigmes) et vérifie la syntaxe des scripts embarqués. **Toujours relancer après une modif de `src/` ou `data/`.**
- `npm run verify` : vérifie les 1000 niveaux du mode Course (solvabilité, déterminisme, unicité) par une simulation indépendante du moteur.
- `npm install && npx playwright install chromium && npm run test:e2e` : tests de bout en bout (appuis tactiles, glisser des voitures, fenêtre des niveaux).
- `npm run screenshot` : capture d'écran du mode Casse-tête (écrit dans /tmp).

## Architecture
- `src/engine.js` : moteur pur (UMD, sans DOM). `generate(n)` produit le niveau n du mode Course de façon déterministe (graine `n*7919+13`) ; `pzSolve` résout les énigmes par parcours en largeur (coups minimum, nombre de solutions, un chemin optimal).
- `src/template.html` : toute l'interface (CSS + HTML + script principal). Marqueurs `/*ENGINE*/` et `/*PUZZLES*/[]` remplacés au build. Ne pas les supprimer.
- `data/puzzles.json` : 50 énigmes `{opt, ways, cars:[[horizontale, ligne/colonne, case, longueur]]}` ; la voiture 0 est la rouge (ligne 2, sort à droite). `ways===1` = solution optimale unique.
- `data/candidates/` : ~42 000 grilles candidates trouvées par recherche (`tools/gen_puzzles.js`, escalade de colline) ; `tools/select_pz.js` en tire les 50 énigmes (échelle de difficulté, re-vérifiées par `pzSolve`).
- `dist/index.html` : fichier généré, jamais édité à la main.
- `docs/` : expériences de faisabilité du mode Casse-tête.

## Règles du jeu
**Course** (1000 niveaux) : chaque voiture sort par l'avant ; si une autre voiture ou un plot est devant, elle « bumpe » et on perd un cœur (3 cœurs). Chrono dès le niveau 8. Pièges : plots (≥12), voitures bâchées au sens caché (≥20), voitures à deux touches (≥30). Un toucher fait sortir la voiture.
**Casse-tête** (50 énigmes, grille 6x6) : voitures qui glissent dans les deux sens (glisser-déposer), sortir la rouge, sans chrono ni cœurs, compteur de coups, Annuler, Indice (vidéo récompensée, calculé par `pzSolve`). Étoiles : 3 si coups ≤ optimum, 2 si ≤ ceil(opt×1.4), 1 sinon.

## Points d'attention
- Pubs **simulées** (`runAd`, `ADS`) : à remplacer par un vrai SDK (AdMob/AppLovin) ; bannière = div « PUB ».
- Sauvegarde : `localStorage` clé `caroule.v1` = `{level,max,test,seen,mode,pz:{level,max,stars}}`. Garder la compatibilité ascendante.
- Un seul thème sombre voulu ; accent jaune panneau routier (`--sign`), bleu panneau (`--psign`) pour le Casse-tête.
- Pas de dépendance externe à part les polices Google Fonts (Overpass).
- Le fichier de vérification n'a jamais détecté de niveau insoluble : tout changement du générateur change les niveaux existants (déterministe par numéro) — le signaler avant de modifier `params`/`build`.
- Bug déjà rencontré : la fenêtre « Niveaux » (`.sheet-card`) sortait de l'écran à cause de la grille de 1000 boutons ; corrigé avec `max-height: min(82vh, 680px)` et `min-height: 0` sur `.level-grid`. Garder ça en tête en touchant au CSS.
- Mascotte (cône de chantier) : états idle/cheer/ouch/sad, pupilles qui suivent le doigt.

## Pistes (voir docs/ROADMAP.md)
