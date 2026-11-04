# Ça Roule

Puzzle de parking pour mobile : faites sortir les voitures du parking.
- **Course** : 1000 niveaux générés, cœurs, chrono, pièges.
- **Casse-tête** : 50 énigmes à solution optimale vérifiée.
- **Défi du jour** : un casse-tête expert (30 à 50 coups) par jour, avec série de jours et rappels.
- Garage de skins (étoiles ou vidéos), sons et musique synthétisés, tutoriel animé.

## Version de test pour téléphones
Le site est publié automatiquement sur GitHub Pages à chaque envoi sur `main`
(workflow `.github/workflows/pages.yml` : vérifie les niveaux et les défis, construit `site/`, publie).
Sur le téléphone : ouvrir le lien, puis « Ajouter à l'écran d'accueil » pour l'avoir comme une appli (plein écran, hors ligne).

## Démarrage
```
npm install
npm run build        # génère dist/index.html (fichier unique) et site/ (version web installable)
open dist/index.html # ou : npx serve dist
npm run verify       # contrôle des 1000 niveaux
```
Pour reprendre le développement avec Claude Code : ouvrir ce dossier, lancer `claude`, il lira `CLAUDE.md`.

Version en ligne (prototype) : https://claude.ai/artifact/ReqeEBtr3sy8zHt2ZAVLX8
