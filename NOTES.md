# Ça Roule — notes

Jeu mobile de casse-tête de parking, en français : une Course à sorties limitées, un Casse-tête et un défi du jour.

- **Version de test en ligne** : https://smob-fr.github.io/ca-roule/. Elle est republiée automatiquement à chaque envoi sur `main`.
- Notes détaillées pour reprendre le développement avec Claude Code : `CLAUDE.md`. Pistes : `docs/ROADMAP.md`. Maquettes de conception : `docs/maquettes/`.

## Technique

- **HTML, CSS et JavaScript sans framework**, aucune dépendance à l'exécution à part les polices Google Fonts (Fredoka et Nunito).
- `src/template.html` contient toute l'interface : styles, écrans, logique de jeu, sons, statistiques. `src/engine.js` est le moteur pur, sans DOM, utilisable aussi sous Node : règles de la Course (`crSlide`, `crApply`, `crAnalyse`, `crBest`) et solveur du Casse-tête (`pzSolve`).
- Les niveaux sont des données JSON précalculées et vérifiées par des solveurs :
  - `data/course.json` : les 75 niveaux de la Course ;
  - `data/puzzles.json` : les 50 énigmes ;
  - `data/daily.json` : les 207 défis du jour.
- Les générateurs sont dans `tools/`, et leurs recherches brutes dans `data/course/`, `data/daily/` et `data/candidates/`.
- `tools/build.js` assemble **un seul fichier HTML** (`dist/index.html`, versionné) et **une version web installable** (`site/` : page avec viewport mobile, manifeste, icônes, service worker hors ligne ; non versionnée, construite par la publication).
- Tous les graphismes sont dessinés par le code : les voitures en SVG, les cartes des villes sur canvas en vue de trois quarts, la mascotte. Les seules images sont les icônes de l'appli, dans `assets/icons/`, générées par `tools/make_icons.js`.
- Tous les sons et la musique sont synthétisés en Web Audio : aucun fichier audio.
- Les statistiques anonymes passent par PostHog, hébergement européen. La clé publique du projet est dans `stats.config.json`.
- **Publication** : `.github/workflows/pages.yml` revérifie tous les niveaux, construit le jeu et le publie sur GitHub Pages.
- Les tests de bout en bout tournent avec Playwright (Chromium).

## Compiler et tester

Il faut Node.js, en version 20 ou plus récente.

```
node tools/build.js          # ou npm run build : produit dist/index.html et site/
open dist/index.html         # jouer en local (ou servir site/ : npx serve site)

npm run verify:course        # re-résout les 75 niveaux de la Course
npm run verify:daily         # re-résout les 207 défis du jour
npm run verify               # ancienne Course (1000 niveaux), gardée pour l'historique

npm install && npx playwright install chromium
npm run test:e2e             # tests tactiles et souris de bout en bout
```

Pour régénérer des niveaux :
- Course : `npm run course:gen` ;
- défis du jour : `npm run daily:search` puis `npm run daily:select` ;
- énigmes : `npm run puzzles:search` puis `npm run puzzles:select`.

Attention, régénérer change les niveaux existants, et donc la progression des joueurs et le défi de chaque jour.

## Fonctionnalités

**Modes de jeu**
- **Course « sorties limitées »**, 75 niveaux répartis en 3 villes de 25 :
  - on touche une voiture : elle avance jusqu'au premier obstacle, et ne sort que face à une porte de sa couleur ou à une porte rayée « toutes couleurs » ;
  - Centre-ville : portes simples ; Le port : portes de couleur ; La gare : barrières qui se lèvent quand une voiture s'arrête sur un bouton ;
  - chaque niveau a un objectif en coups (le minimum calculé), une réserve de coups, des étoiles, la détection d'impasse, Annuler, des niveaux Difficile et un niveau géant en fin de ville.
- **Casse-tête** : 50 énigmes de 6 × 6 où l'on fait glisser les voitures pour sortir la rouge, avec un objectif en coups optimal vérifié.
- **Défi du jour** : un casse-tête expert de 30 à 50 coups, identique pour tous, avec une série de jours consécutifs.

**Progression et récompenses**
- Carte illustrée des villes, avec la route des niveaux, la progression dorée et la ville suivante verrouillée.
- Étoiles, garage de 10 styles de voitures (7 gagnés avec les étoiles, 3 exclusifs avec des vidéos récompensées).
- Coups de pouce 👍 : monnaie d'aide gagnée en jouant bien.
- Aides :
  - Casse-tête : Premier coup, 3 coups d'avance, Pilote ;
  - Course : +3 coups, Marche arrière, Meilleur coup.
- Coffre toutes les 20 étoiles de Course, 3 missions par jour.

**Confort**
- Accueil illustré, menu Pause, tutoriel avec une main animée sur les premiers niveaux.
- Mascotte (un cône de chantier), musique et bruitages réglables.
- Rappels du défi du jour : notifications locales dans l'appli, API Notification sur le web.
- Statistiques anonymes que le joueur peut désactiver.
- Version web installable sur l'écran d'accueil, qui marche hors ligne.

**Publicités** : bannière, pub entre les niveaux et vidéos récompensées, toutes **simulées** pour l'instant.

## État d'avancement

- Prototype web complet et jouable, en test auprès d'utilisateurs via GitHub Pages.
- Tous les niveaux sont vérifiés automatiquement : 75 niveaux de Course, 50 énigmes, 207 défis. La publication refuse de mettre en ligne un niveau insoluble.
- Les statistiques arrivent bien dans PostHog.
- La nouvelle Course vient d'être livrée (75 niveaux, carte, coffres, missions). Elle attend les retours des testeurs, surtout sur la difficulté.
- `docs/maquettes/` contient trois maquettes HTML autonomes : les quatre pistes étudiées pour la Course, le niveau test jouable et les écrans de progression. `docs/exp_sorties_*.js` contient le premier prototype de la règle, remplacé depuis par `src/engine.js` et `tools/gen_course.js`.

## Ce qui reste à faire

1. **Emballer en vraie appli** avec Capacitor, Android d'abord, puis iOS. Il faut un compte Google Play (25 $) et, pour iOS, un compte Apple Developer (99 $ par an) et un Mac.
2. **Vraies notifications** dans l'appli (plugin `@capacitor/local-notifications`), à vérifier sur un vrai téléphone.
3. **Monétisation réelle** :
   - remplacer les pubs simulées par AdMob (`runAd`, bannière) ;
   - afficher le consentement RGPD ;
   - proposer un achat « sans pub » ;
   - publier une politique de confidentialité.
4. **Contenu de la Course** :
   - villes 4 à 6 : aéroport et plaques tournantes, montagne et voitures bâchées, plage et feux ;
   - aides Peinture et Dépanneuse ;
   - collections de plaques d'immatriculation et « permis » de ville ;
   - calendrier de la semaine, rallye du week-end.
5. **Défis du jour** : passer de 207 à au moins 365, avant la sortie, car changer la liste change le défi de chaque jour.
6. **Équilibrage** grâce aux statistiques : 15 niveaux de Course ont une manœuvre de moins que prévu, la place de l'énigme 38 est à revoir.
7. **Musique** : remplacer éventuellement la musique synthétisée par un morceau dont on a les droits.
8. **Fiche des stores** : textes, captures d'écran, classification d'âge.
