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
- Sauvegarde : `localStorage` clé `caroule.v1` = `{level,max,test,seen,mode,pz:{level,max,stars},sfx,music}`. Garder la compatibilité ascendante.
- Un seul thème sombre voulu (nuit violette en Course, nuit bleue en Casse-tête) ; accent jaune panneau (`--sign`, `--sign-hi`, `--sign-deep`), bleu (`--psign…`) pour le Casse-tête.
- Style visuel « jeu mobile moderne » : dégradés doux, verre dépoli, relief léger, polices arrondies. Éviter les contours épais, les ombres dures décalées et les polices monospace (look rétro).
- Pas de dépendance externe à part les polices Google Fonts (Fredoka pour les titres et chiffres, Nunito pour le texte).
- Voitures dessinées en SVG (`carSVG`, `pcarSVG`, `tarpSVG`) : chaque SVG a ses propres id de dégradés (`gidSeq`), car une voiture sortie est retirée du DOM. Éclairage symétrique sur la largeur pour rester juste après rotation. Dégradés partagés des cœurs et étoiles dans le `<svg class="defs">` en haut de page (`#g-heart`, `#g-star`).
- Accueil (`#home`, `openHome`/`leaveHome`) : affiché au lancement, le niveau en cours est chargé derrière ; retour via le bouton maison de la fenêtre « Niveaux ». Vignettes animées des deux modes construites en JS (`buildHome`, `miniBoard`, `miniCar`). Les tests e2e touchent d'abord `#home-run` ou `#home-pz`.
- Tutoriel (`tutoRun`, `tutoPz`, `TUTO_LEVELS = 2`) : une main (`HAND`) montre le geste sur les niveaux 1-2 de chaque mode. Course : elle tapote la voiture choisie par `pickHint`. Casse-tête : elle fait glisser la voiture du prochain coup optimal (`pzSolve`) vers un cadre pointillé. Suivre la main donne toujours 3 étoiles.
- Son (`Snd`) : tout est synthétisé en Web Audio, aucun fichier audio. Bruitages (`click`, `vroom`, `bump`, `sputter`, `whoosh`, `slide`, `tick`, `clock`, `chime`, `win`, `lose`) et musique générée en direct : style `run` (groove 112 BPM, Course et accueil) et `calm` (84 BPM, Casse-tête). L'audio démarre au premier geste, se coupe quand l'onglet est caché et baisse pendant les pubs (`Snd.duck`). Boutons musique/bruitages sur l'accueil et dans « Niveaux » ; réglages `sfx` et `music` dans la sauvegarde.
- Effets : `puff` (poussière à la sortie), `spark` (choc), `celebrate` (confettis à la victoire) ; tous coupés si `prefers-reduced-motion`.
- Le fichier de vérification n'a jamais détecté de niveau insoluble : tout changement du générateur change les niveaux existants (déterministe par numéro) — le signaler avant de modifier `params`/`build`.
- Bug déjà rencontré : la fenêtre « Niveaux » (`.sheet-card`) sortait de l'écran à cause de la grille de 1000 boutons ; corrigé avec `max-height: min(82vh, 680px)` et `min-height: 0` sur `.level-grid`. Garder ça en tête en touchant au CSS.
- Mascotte (cône de chantier) : états idle/cheer/ouch/sad, pupilles qui suivent le doigt.

## Pistes (voir docs/ROADMAP.md)
